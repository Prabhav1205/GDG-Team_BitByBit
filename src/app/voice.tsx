/**
 * /voice — Audio-First Voice Navigation Interface for Visually Impaired Citizens
 *
 * Implements an autonomous Voice Navigation Finite-State Machine (FSM):
 *   STEP 1 (Welcome / Prompt): Auto-speaks institutional guidance & options via expo-speech.
 *   STEP 2 (Auto-Listen): Automatically starts audio recording when prompt finishes.
 *   STEP 3 (Transcribe): Streams captured audio to Groq Whisper AI (whisper-large-v3-turbo).
 *   STEP 4 (Interpret & Action): Evaluates citizen intent (Schemes/Eligibility, Staff handoff, Directions, Repeat, Exit).
 *   STEP 5 (Respond & Loop): Speaks action outcome aloud, pushes live events to Staff Dashboard, and loops back.
 *   STEP 6 (Audio-First Fallback): Proactively speaks audio retry guidance on silence/unrecognized queries.
 *
 * Completely eyes-free / hands-free: no screen reading or per-turn tapping required.
 * Uses dynamic per-turn AudioRecorder lifecycle to avoid native shared object disposal.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { AccessHeader } from '@/components/access/AccessHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import { speechEngine } from '@/services/speech-engine';
import { useSession, type InstitutionType } from '@/context/SessionContext';
import { useAudioNav } from '@/context/AudioNavContext';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { UI_STRINGS, LANGUAGES, toSafeLangCode, type LangCode } from '@/constants/i18n';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import AudioModule from 'expo-audio/build/AudioModule';
import { transcribeAudio } from '@/services/whisper-service';
import { fetchSchemes, type Scheme } from '@/services/supabase-schemes';

// ── Voice Navigation FSM State Types ────────────────────────────────────────

export type VoiceNavStep =
  | 'INITIAL'             // Initializing session / waiting for first gesture if browser audio locked
  | 'SPEAKING_PROMPT'     // Speaking prompt or welcome message aloud via expo-speech
  | 'LISTENING'           // Actively recording citizen speech (auto-timed hands-free)
  | 'TRANSCRIBING'        // Transcribing captured audio with Whisper AI
  | 'PROCESSING_INTENT'   // Matching spoken words against actions / schemes
  | 'SPEAKING_RESPONSE'   // Speaking response & action outcome aloud
  | 'ERROR_RETRY';        // Speaking audio retry prompt after silence or failure

interface VoiceIntentResult {
  intent:
    | 'ELIGIBILITY_SCHEMES'
    | 'STAFF_HANDOFF'
    | 'DIRECTIONS'
    | 'NAVIGATE_SIGN'
    | 'CHANGE_LANGUAGE'
    | 'REPEAT'
    | 'EXIT'
    | 'GENERAL_QUERY'
    | 'UNKNOWN';
  spokenResponse: string;
  matchedSchemes?: Scheme[];
  actionLog?: string;
  targetLanguage?: LangCode;
  navigateTo?: string;
}

export default function VoicePage() {
  const styles = useStyles();
  const {
    session,
    setLanguage,
    setMode,
    broadcastTranslation,
    requestStaffAssistance,
    broadcastEligibilityMatch,
    clearSession,
  } = useSession();
  const { announce } = useAudioNav();
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;

  const lang = toSafeLangCode(session.language);
  const speechCode = LANGUAGES[lang].speechCode;
  const t = UI_STRINGS[lang];

  // FSM State
  const [voiceStep, setVoiceStep] = useState<VoiceNavStep>('INITIAL');
  const [transcript, setTranscript] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [lastPromptText, setLastPromptText] = useState<string>('');
  const [recognizedIntent, setRecognizedIntent] = useState<string>('');
  const [matchedSchemes, setMatchedSchemes] = useState<Scheme[]>([]);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(true);
  const [hasStartedSession, setHasStartedSession] = useState<boolean>(false);

  // Audio Recorder & Timers
  const recorderRef = useRef<any>(null);
  const autoListenTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isRecordingActiveRef = useRef<boolean>(false);
  const turnCountRef = useRef<number>(0);
  const consecutiveSilenceRef = useRef<number>(0);

  // Visual Animation (Pulse Rings for Sighted Observers / Testers)
  const [pulseAnim1] = useState(() => new Animated.Value(1));
  const [pulseAnim2] = useState(() => new Animated.Value(1));
  const [micScale] = useState(() => new Animated.Value(1));

  // ── Pulsing Audio Indicator for visual feedback ────────────────────────────
  useEffect(() => {
    if (voiceStep !== 'LISTENING') {
      pulseAnim1.setValue(1);
      pulseAnim2.setValue(1);
      return;
    }

    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim1, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim1, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.timing(pulseAnim2, { toValue: 1.35, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim2, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [voiceStep, pulseAnim1, pulseAnim2]);

  // ── Lifecycle & Cleanup (Includes 5-Minute Max Session Protection) ────────
  useEffect(() => {
    isMountedRef.current = true;

    // 5-minute hard session timeout cap to prevent runaway background loops
    sessionTimeoutRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        const timeoutMessage =
          lang === 'hi'
            ? 'वॉइस सत्र का समय समाप्त हो गया है। कृपया मुख्य मेनू से पुनः प्रयास करें।'
            : lang === 'mr'
            ? 'व्हॉइस सत्राची वेळ संपली आहे. कृपया मुख्य मेनूमधून पुन्हा प्रयत्न करा.'
            : 'Ending this session now. Please try again or ask a staff member for help.';
        speechEngine.speak(timeoutMessage, {
          lang: speechCode,
          onEnd: () => {
            clearSession();
            router.replace('/');
          },
        });
      }
    }, 300000);

    return () => {
      isMountedRef.current = false;
      speechEngine.stopSpeaking();
      if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
      if (sessionTimeoutRef.current) clearTimeout(sessionTimeoutRef.current);
      if (recorderRef.current && isRecordingActiveRef.current) {
        recorderRef.current.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Welcome Prompt Builder (Localized per Institution) ────────────────────
  const getWelcomePrompt = useCallback((): string => {
    const inst = session.institution || 'government';
    if (inst === 'bank') {
      if (lang === 'hi') return 'बैंक वॉइस नेविगेशन में आपका स्वागत है। आप कह सकते हैं: "नया खाता खोलें", "पैसे जमा या निकासी", "ऋण योजनाएं", "बैंक अधिकारी सहायता", या "बाहर जाएं"। मैं आपकी क्या सहायता कर सकता हूँ?';
      if (lang === 'mr') return 'बँक व्हॉइस नेव्हिगेशनमध्ये आपले स्वागत आहे. आपण म्हणू शकता: "नवीन खाते", "पैसे भरणे किंवा काढणे", "कर्ज योजना", "बँक अधिकारी मदत", किंवा "बाहेर पडा". मी कशी मदत करू?';
      return 'Welcome to Bank Voice Navigation. You can say "open new account", "deposit or withdrawal", "loan schemes", "talk to bank officer", or "exit". How can I help you today?';
    }
    if (inst === 'hospital') {
      if (lang === 'hi') return 'अस्पताल वॉइस नेविगेशन में आपका स्वागत है। आप कह सकते हैं: "डॉक्टर अपॉइंटमेंट", "ओपीडी काउंटर", "आयुष्मान भारत योजना", "स्टाफ सहायता", या "बाहर जाएं"। मैं आपकी क्या सहायता कर सकता हूँ?';
      if (lang === 'mr') return 'रुग्णालय व्हॉइस नेव्हिगेशनमध्ये आपले स्वागत आहे. आपण म्हणू शकता: "डॉक्टर भेट", "ओपीडी काउंटर", "आयुष्मान भारत योजना", "कर्मचारी मदत", किंवा "बाहेर पडा". मी कशी मदत करू?';
      return 'Welcome to Hospital Voice Navigation. You can say "doctor appointment", "OPD counter", "Ayushman health scheme", "talk to nurse or staff", or "exit". How can I help you today?';
    }
    // Government Office
    if (lang === 'hi') return 'सरकारी कार्यालय वॉइस नेविगेशन में आपका स्वागत है। आप कह सकते हैं: "सरकारी योजनाएं जांचें", "पेंशन फॉर्म", "सहायक उपकरण", "स्टाफ सहायता", या "बाहर जाएं"। मैं आपकी क्या सहायता कर सकता हूँ?';
    if (lang === 'mr') return 'सरकारी कार्यालय व्हॉइस नेव्हिगेशनमध्ये आपले स्वागत आहे. आपण म्हणू शकता: "सरकारी योजना तपासा", "पेन्शन अर्ज", "उपकरण मदत", "कर्मचारी मदत", किंवा "बाहेर पडा". मी कशी मदत करू?';
    return 'Welcome to Government Service Voice Navigation. You can say "check eligibility or schemes", "pension form", "talk to staff", or "exit". How can I help you today?';
  }, [session.institution, lang]);

  // ── Auto-Speak TTS Helper (Advances FSM to Next Step on Completion) ────────
  const speakAndTransition = useCallback((
    text: string,
    nextStep: VoiceNavStep = 'LISTENING'
  ) => {
    if (!isMountedRef.current) return;
    setLastPromptText(text);
    setStatusMessage(text);
    setVoiceStep('SPEAKING_PROMPT');

    speechEngine.speak(text, {
      lang: speechCode,
      rate: 0.95, // Clear and comfortable for accessibility
      onEnd: () => {
        if (!isMountedRef.current) return;
        if (nextStep === 'LISTENING') {
          startAutoListening();
        } else {
          setVoiceStep(nextStep);
        }
      },
      onError: (err) => {
        console.warn('[VoiceNav TTS error]:', err);
        if (isMountedRef.current && nextStep === 'LISTENING') {
          startAutoListening();
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechCode]);

  // ── Auto-Listening Handler (Hands-Free Recording with Auto-Timeout) ───────
  const startAutoListening = useCallback(async () => {
    if (!isMountedRef.current) return;
    if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);

    setVoiceStep('LISTENING');
    setStatusMessage(
      lang === 'hi'
        ? '🎙️ सुन रहा है... कृपया अब बोलें।'
        : lang === 'mr'
        ? '🎙️ ऐकत आहे... कृपया आता बोला.'
        : '🎙️ Listening... Please speak now.'
    );

    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        speakAndTransition(
          lang === 'hi'
            ? 'माइक्रोफ़ोन की अनुमति की आवश्यकता है।'
            : lang === 'mr'
            ? 'मायक्रोफोन परवानगी आवश्यक आहे.'
            : 'Microphone permission is required to continue voice navigation.',
          'ERROR_RETRY'
        );
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      // Instantiate fresh AudioRecorder for this turn to prevent native shared object recycling crashes
      const recorder = new AudioModule.AudioRecorder(RecordingPresets.HIGH_QUALITY);
      recorderRef.current = recorder;

      await recorder.prepareToRecordAsync(RecordingPresets.HIGH_QUALITY);
      recorder.record();
      isRecordingActiveRef.current = true;

      // Auto-stop recording after 5.5 seconds of listening (hands-free turn)
      autoListenTimerRef.current = setTimeout(() => {
        if (isMountedRef.current && isRecordingActiveRef.current) {
          stopAndTranscribe();
        }
      }, 5500);

    } catch (err: any) {
      console.warn('[VoiceNav Record Start Error]:', err);
      isRecordingActiveRef.current = false;
      handleSpeechError(
        lang === 'hi'
          ? 'माइक्रोफ़ोन शुरू नहीं हो सका। कृपया दोबारा प्रयास करें।'
          : lang === 'mr'
          ? 'मायक्रोफोन सुरू होऊ शकला नाही. कृपया पुन्हा प्रयत्न करा.'
          : 'Could not activate microphone. Please try again.'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, speakAndTransition]);

  // ── Stop Recording & Send to Whisper ───────────────────────────────────────
  const stopAndTranscribe = useCallback(async () => {
    if (autoListenTimerRef.current) clearTimeout(autoListenTimerRef.current);
    if (!isRecordingActiveRef.current) return;

    try {
      isRecordingActiveRef.current = false;
      setVoiceStep('TRANSCRIBING');
      setStatusMessage(
        lang === 'hi'
          ? '⏳ आपकी आवाज़ को समझा जा रहा है...'
          : lang === 'mr'
          ? '⏳ आपला आवाज तपासत आहे...'
          : '⏳ Processing your speech with Whisper AI...'
      );

      const recorder = recorderRef.current;
      if (recorder) {
        await recorder.stop();
      }
      const uri = recorder?.uri;

      if (!uri) {
        throw new Error('No audio URI captured.');
      }

      const transcribedText = await transcribeAudio(uri, { language: lang });
      const cleaned = (transcribedText || '').trim().toLowerCase();

      // Check for empty string or common Whisper silence hallucinations
      const isSilenceHallucination =
        !cleaned ||
        cleaned.length === 0 ||
        cleaned === '[music]' ||
        cleaned === '(music)' ||
        cleaned === '[applause]' ||
        cleaned === '(silence)' ||
        cleaned === '[silence]' ||
        cleaned === 'thank you.' ||
        cleaned === 'thank you' ||
        cleaned === 'you' ||
        cleaned === '.' ||
        cleaned === '..' ||
        cleaned === '...';

      if (isSilenceHallucination) {
        consecutiveSilenceRef.current += 1;
        if (consecutiveSilenceRef.current >= 3) {
          const exitMsg =
            lang === 'hi'
              ? 'लंबे समय से कोई आवाज़ न मिलने के कारण सत्र समाप्त किया जा रहा है।'
              : lang === 'mr'
              ? 'दीर्घकाळ आवाज न आल्यामुळे सत्र समाप्त केले जात आहे.'
              : 'Ending this session due to inactivity. Please tap the microphone when you are ready.';
          speechEngine.speak(exitMsg, {
            lang: speechCode,
            onEnd: () => {
              clearSession();
              router.replace('/');
            },
          });
          return;
        }

        handleSpeechError(
          lang === 'hi'
            ? 'मुझे कोई आवाज़ सुनाई नहीं दी। कृपया अपना अनुरोध बताएं, जैसे ' + getShortIntentHint(session.institution, 'hi')
            : lang === 'mr'
            ? 'मला काही ऐकू आले नाही. कृपया आपली विनंती सांगा, जसे ' + getShortIntentHint(session.institution, 'mr')
            : "I didn't hear anything. Please say your request, such as " + getShortIntentHint(session.institution, 'en')
        );
        return;
      }

      // Valid speech detected: reset silence counter
      consecutiveSilenceRef.current = 0;
      setTranscript(transcribedText);
      setVoiceStep('PROCESSING_INTENT');
      handleInterpretIntent(transcribedText);

    } catch (err: any) {
      console.warn('[VoiceNav Transcribe Error]:', err);
      handleSpeechError(
        lang === 'hi'
          ? 'आवाज़ की पहचान नहीं हो सकी। कृपया दोबारा बोलें।'
          : lang === 'mr'
          ? 'आवाज ओळखता आला नाही. कृपया पुन्हा बोला.'
          : 'Sorry, I could not understand that. Please speak again.'
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, session.institution]);

  // ── Intent Interpretation Engine ──────────────────────────────────────────
  const handleInterpretIntent = async (userText: string) => {
    turnCountRef.current += 1;

    // Runaway protection: cap session at 12 exchanges
    if (turnCountRef.current > 12) {
      const maxTurnMsg =
        lang === 'hi'
          ? 'सत्र की सीमा पूरी हो गई है। कृपया आवश्यकता होने पर पुनः प्रयास करें या स्टाफ से सहायता लें।'
          : lang === 'mr'
          ? 'सत्राची मर्यादा पूर्ण झाली आहे. कृपया आवश्यकतेनुसार पुन्हा प्रयत्न करा किंवा कर्मचाऱ्यांची मदत घ्या.'
          : 'Ending this session now. Please try again or ask a staff member for help.';
      speechEngine.speak(maxTurnMsg, {
        lang: speechCode,
        onEnd: () => {
          clearSession();
          router.replace('/');
        },
      });
      return;
    }

    const rawLower = userText.toLowerCase().trim();
    broadcastTranslation(userText, 'Voice Navigation', 0.98);

    const result = await evaluateIntent(rawLower, lang, session.institution);
    setRecognizedIntent(result.intent);

    if (result.matchedSchemes && result.matchedSchemes.length > 0) {
      setMatchedSchemes(result.matchedSchemes);
      // Sync top scheme match to staff dashboard in real time
      const top = result.matchedSchemes[0];
      broadcastEligibilityMatch(
        top.title,
        top.category,
        top.benefitSummary,
        'Voice Navigation citizen requested scheme assistance'
      );
    }

    if (result.intent === 'EXIT') {
      speechEngine.speak(result.spokenResponse, {
        lang: speechCode,
        onEnd: () => {
          clearSession();
          router.replace('/');
        },
      });
      return;
    }

    if (result.intent === 'NAVIGATE_SIGN') {
      speechEngine.speak(result.spokenResponse, {
        lang: speechCode,
        onEnd: () => {
          setMode('sign');
          router.replace('/sign');
        },
      });
      return;
    }

    if (result.intent === 'STAFF_HANDOFF') {
      requestStaffAssistance(
        `Voice Navigation citizen requested in-person staff handoff (Query: "${userText}")`,
        'Voice Navigation'
      );
    }

    if (result.intent === 'CHANGE_LANGUAGE' && result.targetLanguage) {
      setLanguage(result.targetLanguage);
      const targetLang = result.targetLanguage;
      const newSpeechCode = LANGUAGES[targetLang]?.speechCode || speechCode;
      speechEngine.speak(result.spokenResponse, {
        lang: newSpeechCode,
        rate: 0.95,
        onEnd: () => {
          startAutoListening();
        },
      });
      return;
    }

    // Speak outcome and automatically loop back to listen for follow-up!
    speakAndTransition(result.spokenResponse, 'LISTENING');
  };

  // ── Spoken Error / Fallback Retry Prompt ──────────────────────────────────
  const handleSpeechError = (errorPrompt: string) => {
    if (!isMountedRef.current) return;
    setVoiceStep('ERROR_RETRY');
    speakAndTransition(errorPrompt, 'LISTENING');
  };

  // ── Start Audio Session on Screen Mount (or user tap) ─────────────────────
  useEffect(() => {
    // Start welcome speech on screen entry
    const timer = setTimeout(() => {
      if (isMountedRef.current && !hasStartedSession) {
        setHasStartedSession(true);
        speakAndTransition(getWelcomePrompt(), 'LISTENING');
      }
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Manual Interrupt / Tap-to-Talk (Optional fallback) ───────────────────
  function handleManualTap() {
    if (voiceStep === 'LISTENING') {
      stopAndTranscribe();
    } else if (voiceStep === 'SPEAKING_PROMPT' || voiceStep === 'SPEAKING_RESPONSE') {
      speechEngine.stopSpeaking();
      startAutoListening();
    } else if (voiceStep === 'INITIAL' || voiceStep === 'ERROR_RETRY') {
      startAutoListening();
    }
  }

  function handleExit() {
    speechEngine.stopSpeaking();
    if (isRecordingActiveRef.current && recorderRef.current) {
      recorderRef.current.stop().catch(() => {});
    }
    clearSession();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <AccessHeader />

        {/* Top Controls Bar */}
        <View style={[styles.topBar, isNarrow && styles.topBarNarrow]}>
          <Pressable
            onPress={handleExit}
            style={({ pressed }) => [styles.exitBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel={t.backToMain}
          >
            <KioskIcon name="back" size={16} color="#FFFFFF" />
            <Text style={styles.exitBtnText}>{lang === 'hi' ? 'मुख्य मेनू' : lang === 'mr' ? 'मुख्य मेनू' : 'Exit to Menu'}</Text>
          </Pressable>

          <View style={styles.liveIndicatorBadge}>
            <View style={[styles.liveDot, voiceStep === 'LISTENING' ? styles.liveDotActive : styles.liveDotSpeaking]} />
            <Text style={styles.liveBadgeText}>
              {voiceStep === 'LISTENING'
                ? (lang === 'hi' ? '● माइक सक्रिय' : lang === 'mr' ? '● माइक सक्रिय' : '● LISTENING')
                : voiceStep === 'TRANSCRIBING'
                ? (lang === 'hi' ? '⏳ समझ रहा है...' : lang === 'mr' ? '⏳ प्रक्रिया सुरू...' : '⏳ TRANSCRIBING')
                : (lang === 'hi' ? '🔊 बोल रहा है...' : lang === 'mr' ? '🔊 बोलत आहे...' : '🔊 SPEAKING')}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, isNarrow && styles.contentNarrow]}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Visual Centerpiece & Listening Orb */}
          <Pressable
            style={styles.orbSection}
            onPress={handleManualTap}
            accessibilityRole="button"
            accessibilityLabel="Tap orb to interrupt speech or start listening"
          >
            <View style={styles.pulseContainer}>
              {voiceStep === 'LISTENING' && (
                <>
                  <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim1 }] }]} />
                  <Animated.View style={[styles.pulseRing, styles.pulseRingSecondary, { transform: [{ scale: pulseAnim2 }] }]} />
                </>
              )}

              <LinearGradient
                colors={
                  voiceStep === 'LISTENING'
                    ? ['#10B981', '#059669']
                    : voiceStep === 'TRANSCRIBING'
                    ? ['#F59E0B', '#D97706']
                    : ['#00F5D4', '#0EA5E9']
                }
                style={styles.orbCore}
              >
                <KioskIcon
                  name={voiceStep === 'LISTENING' ? 'mic' : voiceStep === 'TRANSCRIBING' ? 'time' : 'voice'}
                  size={isNarrow ? 48 : 64}
                  color="#1A1F2E"
                />
              </LinearGradient>
            </View>

            <Text style={[styles.fsmStateLabel, isNarrow && styles.fsmStateLabelNarrow]}>
              {voiceStep === 'LISTENING'
                ? (lang === 'hi' ? 'अब बोलें (हाथ मुक्त)' : lang === 'mr' ? 'आता बोला (हात मुक्त)' : 'Listening Hands-Free')
                : voiceStep === 'TRANSCRIBING'
                ? (lang === 'hi' ? 'AI ट्रांसक्रिप्शन...' : lang === 'mr' ? 'AI ट्रान्सक्रिप्शन...' : 'Whisper AI Transcribing...')
                : (lang === 'hi' ? 'कियोस्क जवाब दे रहा है' : lang === 'mr' ? 'कियोस्क प्रतिसाद देत आहे' : 'Kiosk Speaking Out Loud')}
            </Text>

            <Text style={styles.fsmSubHint}>
              {lang === 'hi'
                ? 'स्क्रीन देखने की ज़रूरत नहीं है — पूरा नेविगेशन आवाज़ से संचालित होता है।'
                : lang === 'mr'
                ? 'स्क्रीन पाहण्याची गरज नाही — संपूर्ण नेव्हिगेशन आवाजाने चालते.'
                : 'Eyes-free & hands-free. The entire kiosk operates through spoken conversation.'}
            </Text>
          </Pressable>

          {/* Real-time Spoken Transcript Card */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>
                {lang === 'hi' ? '🗣️ आपने क्या कहा (Transcript):' : lang === 'mr' ? '🗣️ आपण काय म्हणालात:' : '🗣️ Citizen Transcript:'}
              </Text>
              {Boolean(recognizedIntent) && (
                <View style={styles.intentBadge}>
                  <Text style={styles.intentBadgeText}>INTENT: {recognizedIntent}</Text>
                </View>
              )}
            </View>
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptText}>
                {transcript ? `"${transcript}"` : (lang === 'hi' ? '(सुनने की प्रतीक्षा में...)' : lang === 'mr' ? '(ऐकण्याची वाट पाहत आहे...)' : '(Waiting for spoken input...)')}
              </Text>
            </View>
          </View>

          {/* Kiosk Audio Prompt / Response Display */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>
                {lang === 'hi' ? '🔊 कियोस्क ऑडियो प्रतिक्रिया:' : lang === 'mr' ? '🔊 कियोस्क ऑडिओ प्रतिसाद:' : '🔊 Kiosk Spoken Response:'}
              </Text>
            </View>
            <View style={styles.responseBox}>
              <Text style={styles.responseText}>{statusMessage || lastPromptText}</Text>
            </View>
          </View>

          {/* Matched Schemes List (if inquiry was about schemes) */}
          {matchedSchemes.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {lang === 'hi' ? '📋 पहचानी गई सरकारी योजनाएं:' : lang === 'mr' ? '📋 ओळखल्या गेलेल्या सरकारी योजना:' : '📋 Matched Eligibility Schemes:'}
              </Text>
              {matchedSchemes.slice(0, 2).map((scheme) => (
                <View key={scheme.id} style={styles.schemeItem}>
                  <Text style={styles.schemeTitle}>{scheme.title}</Text>
                  <Text style={styles.schemeBenefit}>{scheme.benefitSummary}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Voice Prompt Suggestions for Users / Testers (Dynamic per Institution) */}
          <View style={styles.promptHintsContainer}>
            <View style={styles.hintsDivider} />
            <Text style={styles.promptHintsHeading}>
              {lang === 'hi'
                ? `उपलब्ध आवाज़ कमांड (${session.institution === 'bank' ? 'बैंक' : session.institution === 'hospital' ? 'अस्पताल' : 'सरकारी कार्यालय'}):`
                : lang === 'mr'
                ? `उपलब्ध आवाज आज्ञा (${session.institution === 'bank' ? 'बँक' : session.institution === 'hospital' ? 'रुग्णालय' : 'सरकारी कार्यालय'}):`
                : `Suggested Voice Commands (${session.institution === 'bank' ? 'Bank' : session.institution === 'hospital' ? 'Hospital' : 'Government Service'}):`}
            </Text>
            <View style={styles.hintChipsRow}>
              {getSuggestedVoiceCommands(session.institution, lang).map((cmd, idx) => (
                <Text key={idx} style={styles.hintChip}>{cmd}</Text>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Voice Intent Evaluation Logic ──────────────────────────────────────────

async function evaluateIntent(query: string, lang: LangCode, inst: InstitutionType = 'government'): Promise<VoiceIntentResult> {
  const q = query.toLowerCase();

  // 1. EXIT / GO BACK (Robust substring & multi-lingual phrase matching)
  if (
    q.includes('exit') ||
    q.includes('done') ||
    q.includes('stop') ||
    q.includes('finish') ||
    q.includes('that is all') ||
    q.includes("that's all") ||
    q.includes('thats all') ||
    q.includes('end') ||
    q.includes('quit') ||
    q.includes('cancel') ||
    q.includes('bye') ||
    q.includes('leave') ||
    q.includes('home') ||
    q.includes('main menu') ||
    q.includes('back') ||
    q.includes('close') ||
    q.includes('बाहर') ||
    q.includes('बंद') ||
    q.includes('खत्म') ||
    q.includes('रुकें') ||
    q.includes('बस') ||
    q.includes('हो गया') ||
    q.includes('मागे') ||
    q.includes('बाहेर') ||
    q.includes('संपले') ||
    q.includes('थांबा') ||
    q.includes('झाले')
  ) {
    return {
      intent: 'EXIT',
      spokenResponse:
        lang === 'hi'
          ? 'मुख्य मेनू पर वापस जा रहे हैं। धन्यवाद।'
          : lang === 'mr'
          ? 'मुख्य मेनूवर परत जात आहोत. धन्यवाद.'
          : 'Returning to the main menu. Thank you.',
    };
  }

  // 2. NAVIGATE TO SIGN LANGUAGE SECTION
  if (
    q.includes('sign') ||
    q.includes('gesture') ||
    q.includes('isl') ||
    q.includes('deaf') ||
    q.includes('साइन') ||
    q.includes('सांकेतिक') ||
    q.includes('इशार') ||
    q.includes('हस्तभाषा') ||
    q.includes('बधिर') ||
    q.includes('मुकबधिर') ||
    q.includes('हातवारे')
  ) {
    return {
      intent: 'NAVIGATE_SIGN',
      navigateTo: '/sign',
      spokenResponse:
        lang === 'hi'
          ? 'साइन लैंग्वेज (सांकेतिक भाषा) मोड खोला जा रहा है। कृपया प्रतीक्षा करें।'
          : lang === 'mr'
          ? 'सांकेतिक भाषा मोड उघडत आहे. कृपया प्रतीक्षा करा.'
          : 'Opening Indian Sign Language mode. Please wait.',
    };
  }

  // 3. CHANGE LANGUAGE (Hindi, Marathi, English, or general query)
  const mentionsHindi = q.includes('hindi') || q.includes('हिंदी') || q.includes('हिन्दी');
  const mentionsMarathi = q.includes('marathi') || q.includes('मराठी');
  const mentionsEnglish = q.includes('english') || q.includes('अंग्रेजी') || q.includes('अंग्रेज़ी') || q.includes('इंग्रजी') || q.includes('इंग्लिश');
  const mentionsLanguageGeneric = q.includes('language') || q.includes('भाषा') || q.includes('बोल');

  if (mentionsHindi) {
    return {
      intent: 'CHANGE_LANGUAGE',
      targetLanguage: 'hi',
      spokenResponse: 'भाषा बदलकर हिंदी कर दी गई है। आप किस सेवा में सहायता चाहते हैं?',
    };
  }

  if (mentionsMarathi) {
    return {
      intent: 'CHANGE_LANGUAGE',
      targetLanguage: 'mr',
      spokenResponse: 'भाषा बदलून मराठी करण्यात आली आहे. आपण कोणत्या सेवेसाठी मदत इच्छिता?',
    };
  }

  if (mentionsEnglish) {
    return {
      intent: 'CHANGE_LANGUAGE',
      targetLanguage: 'en',
      spokenResponse: 'Language switched to English. How can I assist you today?',
    };
  }

  if (mentionsLanguageGeneric && (q.includes('change') || q.includes('switch') || q.includes('बदल') || q.includes('select') || q.includes('choose'))) {
    return {
      intent: 'CHANGE_LANGUAGE',
      spokenResponse:
        lang === 'hi'
          ? 'उपलब्ध भाषाएं अंग्रेजी, हिंदी और मराठी हैं। कृपया कहें "हिंदी में बदलें", "मराठी में बदलें", या "अंग्रेजी में बदलें"।'
          : lang === 'mr'
          ? 'उपलब्ध भाषा इंग्रजी, हिंदी आणि मराठी आहेत. कृपया "मराठी करा", "हिंदी करा" किंवा "इंग्रजी करा" म्हणा.'
          : 'Available languages are English, Hindi, and Marathi. Please say "switch to Hindi", "switch to Marathi", or "switch to English".',
    };
  }

  // 4. REPEAT / REPLAY
  if (
    q.includes('repeat') ||
    q.includes('again') ||
    q.includes('what did you say') ||
    q.includes('pardon') ||
    q.includes('दोहराएं') ||
    q.includes('फिर से') ||
    q.includes('पुन्हा') ||
    q.includes('परत सांगा')
  ) {
    if (inst === 'bank') {
      return {
        intent: 'REPEAT',
        spokenResponse:
          lang === 'hi'
            ? 'मैं दोहराता हूँ: आप नया खाता खोलने, पैसे जमा या निकासी, ऋण योजनाएं, या बैंक अधिकारी सहायता के लिए कह सकते हैं।'
            : lang === 'mr'
            ? 'मी पुन्हा सांगतो: आपण नवीन खाते, पैसे भरणे किंवा काढणे, कर्ज योजना, किंवा बँक अधिकारी मदतीसाठी विचारू शकता.'
            : 'I repeat: You can say open new account, deposit or withdrawal, loan schemes, or talk to bank officer.',
      };
    }
    if (inst === 'hospital') {
      return {
        intent: 'REPEAT',
        spokenResponse:
          lang === 'hi'
            ? 'मैं दोहराता हूँ: आप डॉक्टर अपॉइंटमेंट, ओपीडी काउंटर, आयुष्मान भारत योजना, या स्टाफ सहायता के लिए कह सकते हैं।'
            : lang === 'mr'
            ? 'मी पुन्हा सांगतो: आपण डॉक्टर भेट, ओपीडी काउंटर, आयुष्मान भारत योजना, किंवा कर्मचारी मदतीसाठी विचारू शकता.'
            : 'I repeat: You can say doctor appointment, OPD counter, Ayushman health scheme, or talk to nurse.',
      };
    }
    return {
      intent: 'REPEAT',
      spokenResponse:
        lang === 'hi'
          ? 'मैं दोहराता हूँ: आप योजनाएं जांचने, पेंशन फॉर्म, सहायक उपकरण, या स्टाफ से बात करने के लिए कह सकते हैं।'
          : lang === 'mr'
          ? 'मी पुन्हा सांगतो: आपण योजना तपासण्यासाठी, पेन्शन अर्ज, उपकरण मदत, किंवा कर्मचाऱ्यांशी बोलण्यासाठी विचारू शकता.'
          : 'I repeat: You can say check eligibility for schemes, pension form, assistive equipment, or talk to staff.',
    };
  }

  // 3. STAFF HANDOFF / HUMAN ASSISTANCE
  if (
    q.includes('staff') ||
    q.includes('human') ||
    q.includes('officer') ||
    q.includes('help') ||
    q.includes('person') ||
    q.includes('talk to') ||
    q.includes('nurse') ||
    q.includes('manager') ||
    q.includes('मदद') ||
    q.includes('स्टाफ') ||
    q.includes('अधिकारी') ||
    q.includes('कर्मचारी') ||
    q.includes('सहायता') ||
    q.includes('मदत') ||
    q.includes('नर्स')
  ) {
    const role = inst === 'bank' ? 'Bank Officer' : inst === 'hospital' ? 'Duty Nurse / Staff' : 'Counter Officer';
    return {
      intent: 'STAFF_HANDOFF',
      spokenResponse:
        lang === 'hi'
          ? `${inst === 'bank' ? 'बैंक अधिकारी' : inst === 'hospital' ? 'अस्पताल स्टाफ' : 'काउंटर स्टाफ'} को सहायता अनुरोध भेज दिया गया है। एक कर्मचारी आपकी मदद के लिए काउंटर 1 पर आ रहा है।`
          : lang === 'mr'
          ? `${inst === 'bank' ? 'बँक अधिकाऱ्यांना' : inst === 'hospital' ? 'रुग्णालय कर्मचाऱ्यांना' : 'काउंटर कर्मचाऱ्यांना'} मदतीची विनंती पाठवली आहे. एक कर्मचारी आपल्या मदतीसाठी काउंटर 1 वर येत आहे.`
          : `Connecting you to a ${role}. A priority assistance notification has been broadcasted to the staff dashboard. An officer is on their way to assist you.`,
    };
  }

  // 4. BANK-SPECIFIC INTENTS (Account, Deposit, Withdrawal, Loan)
  if (inst === 'bank') {
    if (
      q.includes('account') ||
      q.includes('open') ||
      q.includes('deposit') ||
      q.includes('withdraw') ||
      q.includes('cash') ||
      q.includes('passbook') ||
      q.includes('statement') ||
      q.includes('cheque') ||
      q.includes('loan') ||
      q.includes('credit') ||
      q.includes('atm') ||
      q.includes('खाता') ||
      q.includes('खाते') ||
      q.includes('जमा') ||
      q.includes('निकासी') ||
      q.includes('पैसे') ||
      q.includes('कर्ज')
    ) {
      return {
        intent: 'ELIGIBILITY_SCHEMES',
        spokenResponse:
          lang === 'hi'
            ? 'बचत खाता खोलने या पासबुक सेवा के लिए काउंटर 2 पर जाएं। नकद जमा और निकासी के लिए प्राथमिकता काउंटर 4 उपलब्ध है। दिव्यांगजनों के लिए NHFDC 4 प्रतिशत ब्याज ऋण योजना भी उपलब्ध है।'
            : lang === 'mr'
            ? 'बचत खाते उघडण्यासाठी किंवा पासबुक सेवेसाठी काउंटर 2 वर जा. रोख ठेव व पैसे काढण्यासाठी प्राधान्य काउंटर 4 उपलब्ध आहे. दिव्यांग व्यक्तींसाठी NHFDC 4 टक्के व्याज कर्ज योजना उपलब्ध आहे.'
            : 'For savings account opening or passbook services, proceed to Counter 2 with Aadhaar and PAN. For cash deposit or withdrawal, priority Counter 4 is available. Low-interest NHFDC self-employment loans are also available.',
      };
    }
  }

  // 5. HOSPITAL-SPECIFIC INTENTS (Doctor, OPD, Appointment, Emergency, Medicine)
  if (inst === 'hospital') {
    if (
      q.includes('doctor') ||
      q.includes('opd') ||
      q.includes('appointment') ||
      q.includes('emergency') ||
      q.includes('medicine') ||
      q.includes('pharmacy') ||
      q.includes('health') ||
      q.includes('ayushman') ||
      q.includes('treatment') ||
      q.includes('डॉक्टर') ||
      q.includes('ओपीडी') ||
      q.includes('दवा') ||
      q.includes('इलाज') ||
      q.includes('आरोग्य') ||
      q.includes('आयुष्मान') ||
      q.includes('रुग्ण')
    ) {
      return {
        intent: 'ELIGIBILITY_SCHEMES',
        spokenResponse:
          lang === 'hi'
            ? 'सामान्य ओपीडी परामर्श और टोकन के लिए काउंटर 1 पर जाएं। 5 लाख रुपये के निःशुल्क इलाज के लिए आयुष्मान भारत डेस्क काउंटर 3 पर है। आपातकालीन वार्ड सीधे आगे बाईं ओर है।'
            : lang === 'mr'
            ? 'सामान्य ओपीडी तपासणी आणि टोकनसाठी काउंटर 1 वर जा. 5 लाख रुपयांच्या मोफत उपचारांसाठी आयुष्मान भारत डेस्क काउंटर 3 वर आहे. आपत्कालीन विभाग थेट समोर डाव्या बाजूला आहे.'
            : 'For general OPD consultation and registration tokens, proceed to Counter 1. The Ayushman Bharat ₹5 Lakh cashless health cover desk is at Counter 3, and emergency triage is straight ahead.',
      };
    }
  }

  // 6. ELIGIBILITY / FORMS / SCHEMES (Government & General)
  if (
    q.includes('scheme') ||
    q.includes('schemes') ||
    q.includes('eligibility') ||
    q.includes('eligible') ||
    q.includes('pension') ||
    q.includes('form') ||
    q.includes('apply') ||
    q.includes('benefit') ||
    q.includes('adip') ||
    q.includes('loan') ||
    q.includes('योजना') ||
    q.includes('पात्रता') ||
    q.includes('फॉर्म') ||
    q.includes('पेंशन') ||
    q.includes('अर्ज') ||
    q.includes('लाभ')
  ) {
    const allSchemes = await fetchSchemes();
    const relevant = allSchemes.slice(0, 3);

    const spoken =
      lang === 'hi'
        ? `हमने आपके लिए योजनाएं ढूंढी हैं: पहली, सहायक उपकरणों और ब्रेल के लिए ADIP योजना। दूसरी, मासिक पेंशन के लिए इंदिरा गांधी दिव्यांग पेंशन योजना। तीसरी, रियायती ऋण के लिए NHFDC योजना। अधिक जानकारी के लिए स्टाफ कहें या बाहर जाने के लिए एग्जिट कहें।`
        : lang === 'mr'
        ? `आम्ही आपल्यासाठी योजना शोधल्या आहेत: पहिली, मोफत उपकरणांसाठी ADIP योजना. दुसरी, मासिक आर्थिक भत्त्यासाठी इंदिरा गांधी दिव्यांग पेन्शन योजना. तिसरी, कमी व्याजाच्या कर्जासाठी NHFDC योजना. अधिक मदतीसाठी कर्मचारी म्हणा किंवा बाहेर पडण्यासाठी एक्झिट म्हणा.`
        : `We identified top schemes for you: First, the ADIP scheme for free assistive devices and braille equipment. Second, the Disability Pension Scheme for monthly allowances. Third, the NHFDC low-interest self-employment loan. Say 'talk to staff' for registration, or 'exit' to finish.`;

    return {
      intent: 'ELIGIBILITY_SCHEMES',
      spokenResponse: spoken,
      matchedSchemes: relevant,
    };
  }

  // 7. DIRECTIONS / COUNTERS / LOCATIONS
  if (
    q.includes('where') ||
    q.includes('counter') ||
    q.includes('desk') ||
    q.includes('direction') ||
    q.includes('room') ||
    q.includes('location') ||
    q.includes('कहाँ') ||
    q.includes('काउंटर') ||
    q.includes('दिशा') ||
    q.includes('कुठे') ||
    q.includes('मार्ग')
  ) {
    return {
      intent: 'DIRECTIONS',
      spokenResponse:
        inst === 'bank'
          ? (lang === 'hi' ? 'खाता सेवा काउंटर 2 पर है, और नकद काउंटर 4 पर सीधे आगे है।' : lang === 'mr' ? 'खाते सेवा काउंटर 2 वर आहे, आणि रोख काउंटर 4 वर थेट समोर आहे.' : 'Account services are at counter 2, and cash deposits are straight ahead at counter 4.')
          : inst === 'hospital'
          ? (lang === 'hi' ? 'ओपीडी पंजीकरण काउंटर 1 पर है, और आयुष्मान भारत डेस्क काउंटर 3 पर है।' : lang === 'mr' ? 'ओपीडी नोंदणी काउंटर 1 वर आहे, आणि आयुष्मान भारत डेस्क काउंटर 3 वर आहे.' : 'OPD registration is at counter 1, and the Ayushman Bharat desk is at counter 3.')
          : (lang === 'hi' ? 'मुख्य सेवा डेस्क सीधे आगे काउंटर 3 पर स्थित है। वरिष्ठ नागरिकों और दिव्यांगजनों के लिए प्राथमिकता कतार बाईं ओर है।' : lang === 'mr' ? 'मुख्य सेवा डेस्क थेट समोर काउंटर 3 वर आहे. ज्येष्ठ नागरिक आणि दिव्यांग व्यक्तींसाठी प्राधान्य रांग डाव्या बाजूला आहे.' : 'The main assistance desk is straight ahead at counter 3. The priority accessible queue is located to your immediate left.'),
    };
  }

  // 8. GENERAL / FALLBACK
  return {
    intent: 'GENERAL_QUERY',
    spokenResponse:
      lang === 'hi'
        ? `धन्यवाद। आपने कहा: "${query}"। आप ${inst === 'bank' ? 'खाता सेवा, जमा या ऋण' : inst === 'hospital' ? 'डॉक्टर अपॉइंटमेंट या स्वास्थ्य योजनाएं' : 'सरकारी योजनाएं या फॉर्म'} के बारे में पूछ सकते हैं।`
        : lang === 'mr'
        ? `धन्यवाद. आपण म्हणालात: "${query}". आपण ${inst === 'bank' ? 'खाते सेवा, ठेव किंवा कर्ज' : inst === 'hospital' ? 'डॉक्टर भेट किंवा आरोग्य योजना' : 'सरकारी योजना किंवा अर्ज'} बद्दल विचारू शकता.`
        : `Understood. You said: "${query}". You can ask about ${inst === 'bank' ? 'opening accounts, deposits, or loans' : inst === 'hospital' ? 'doctor appointments, OPD, or health schemes' : 'government schemes, pensions, or forms'}. How would you like to proceed?`,
  };
}

function getSuggestedVoiceCommands(inst: InstitutionType, lang: LangCode): string[] {
  if (inst === 'bank') {
    if (lang === 'hi') return ['"नया खाता खोलें"', '"पैसे जमा / निकासी"', '"ऋण योजनाएं"', '"साइन लैंग्वेज"', '"भाषा बदलें"', '"बैंक अधिकारी"', '"बाहर जाएं"'];
    if (lang === 'mr') return ['"नवीन खाते उघडा"', '"पैसे भरणे / काढणे"', '"कर्ज योजना"', '"साइन लँग्वेज"', '"भाषा बदला"', '"बँक अधिकारी"', '"बाहेर पडा"'];
    return ['"Open new account"', '"Deposit / Withdrawal"', '"Loan schemes"', '"Sign language"', '"Change language"', '"Talk to bank officer"', '"Exit"'];
  }
  if (inst === 'hospital') {
    if (lang === 'hi') return ['"डॉक्टर अपॉइंटमेंट"', '"ओपीडी / आपातकालीन"', '"आयुष्मान भारत"', '"साइन लैंग्वेज"', '"भाषा बदलें"', '"स्टाफ सहायता"', '"बाहर जाएं"'];
    if (lang === 'mr') return ['"डॉक्टर भेट / ओपीडी"', '"आपत्कालीन कक्ष"', '"आयुष्मान भारत"', '"साइन लँग्वेज"', '"भाषा बदला"', '"कर्मचारी मदत"', '"बाहेर पडा"'];
    return ['"Doctor appointment"', '"OPD / Emergency"', '"Ayushman scheme"', '"Sign language"', '"Change language"', '"Talk to nurse"', '"Exit"'];
  }
  // Government Office default
  if (lang === 'hi') return ['"सरकारी योजनाएं"', '"दिव्यांग पेंशन फॉर्म"', '"ADIP उपकरण सहायता"', '"साइन लैंग्वेज"', '"भाषा बदलें"', '"स्टाफ से बात करें"', '"बाहर जाएं"'];
  if (lang === 'mr') return ['"सरकारी योजना तपासा"', '"दिव्यांग पेन्शन अर्ज"', '"ADIP उपकरण मदत"', '"साइन लँग्वेज"', '"भाषा बदला"', '"कर्मचाऱ्यांशी बोला"', '"बाहेर पडा"'];
  return ['"Check schemes"', '"Disability pension"', '"Assistive equipment"', '"Sign language"', '"Change language"', '"Talk to staff"', '"Exit"'];
}

function getShortIntentHint(inst: InstitutionType, langCode: string): string {
  if (inst === 'bank') {
    if (langCode === 'hi') return "'नया खाता', 'जमा / निकासी', या 'बाहर जाएं'।";
    if (langCode === 'mr') return "'नवीन खाते', 'ठेव / पैसे काढणे', किंवा 'बाहेर पडा'.";
    return "'open account', 'deposit / withdrawal', or 'exit'.";
  }
  if (inst === 'hospital') {
    if (langCode === 'hi') return "'डॉक्टर अपॉइंटमेंट', 'ओपीडी काउंटर', या 'बाहर जाएं'।";
    if (langCode === 'mr') return "'डॉक्टर भेट', 'ओपीडी', किंवा 'बाहेर पडा'.";
    return "'doctor appointment', 'OPD counter', or 'exit'.";
  }
  if (langCode === 'hi') return "'योजनाएं जांचें', 'स्टाफ सहायता', या 'बाहर जाएं'।";
  if (langCode === 'mr') return "'योजना तपासा', 'कर्मचारी मदत', किंवा 'बाहेर पडा'.";
  return "'check eligibility', 'talk to staff', or 'exit'.";
}

// ── Styles ──────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: AccessColors.background,
    },
    screen: {
      flex: 1,
      backgroundColor: AccessColors.background,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: AccessSpacing.lg,
      paddingVertical: AccessSpacing.md,
      borderBottomWidth: 1,
      borderBottomColor: AccessColors.border,
      backgroundColor: AccessColors.cardDefault,
    },
    topBarNarrow: {
      paddingHorizontal: AccessSpacing.md,
    },
    exitBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: AccessSpacing.xs,
      paddingVertical: AccessSpacing.sm,
      paddingHorizontal: AccessSpacing.md,
      borderRadius: AccessRadius.md,
      backgroundColor: AccessColors.navy,
      ...AccessShadow.sm,
    },
    btnPressed: {
      opacity: 0.75,
    },
    exitBtnText: {
      color: '#FFFFFF',
      fontSize: AccessFontSize.sm,
      fontFamily: AccessFontFamily.semibold,
    },
    liveIndicatorBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.3)',
      paddingHorizontal: AccessSpacing.sm + 2,
      paddingVertical: AccessSpacing.xs,
      borderRadius: AccessRadius.full,
    },
    liveDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#10B981',
    },
    liveDotActive: {
      backgroundColor: '#10B981',
    },
    liveDotSpeaking: {
      backgroundColor: '#00F5D4',
    },
    liveBadgeText: {
      color: AccessColors.teal,
      fontSize: AccessFontSize.xs,
      fontFamily: AccessFontFamily.semibold,
      letterSpacing: 0.5,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: AccessSpacing.lg,
      gap: AccessSpacing.lg,
      maxWidth: 720,
      alignSelf: 'center',
      width: '100%',
    },
    contentNarrow: {
      padding: AccessSpacing.md,
      gap: AccessSpacing.md,
    },

    // ── Centerpiece & Orb ────────────────────────────────────────────────────
    orbSection: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: AccessSpacing.xl,
      gap: AccessSpacing.sm,
    },
    pulseContainer: {
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: AccessSpacing.xs,
    },
    pulseRing: {
      position: 'absolute',
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 2,
      borderColor: 'rgba(16, 185, 129, 0.4)',
      backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    pulseRingSecondary: {
      borderColor: 'rgba(0, 245, 212, 0.3)',
      backgroundColor: 'rgba(0, 245, 212, 0.05)',
    },
    orbCore: {
      width: 90,
      height: 90,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
      ...AccessShadow.lg,
    },
    fsmStateLabel: {
      fontSize: AccessFontSize.xl,
      fontFamily: AccessFontFamily.bold,
      color: AccessColors.textPrimary,
      textAlign: 'center',
    },
    fsmStateLabelNarrow: {
      fontSize: AccessFontSize.lg,
    },
    fsmSubHint: {
      fontSize: AccessFontSize.base,
      fontFamily: AccessFontFamily.regular,
      color: AccessColors.textSecondary,
      textAlign: 'center',
      maxWidth: 440,
      lineHeight: 24,
    },

    // ── Cards ────────────────────────────────────────────────────────────────
    card: {
      backgroundColor: AccessColors.cardDefault,
      borderWidth: 1,
      borderColor: AccessColors.border,
      borderRadius: AccessRadius.lg,
      padding: AccessSpacing.md,
      gap: AccessSpacing.sm,
      ...AccessShadow.sm,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: AccessSpacing.xs,
    },
    cardTitle: {
      fontSize: AccessFontSize.sm,
      fontFamily: AccessFontFamily.bold,
      color: AccessColors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    intentBadge: {
      backgroundColor: 'rgba(0, 245, 212, 0.15)',
      borderColor: 'rgba(0, 245, 212, 0.4)',
      borderWidth: 1,
      borderRadius: AccessRadius.full,
      paddingHorizontal: AccessSpacing.sm,
      paddingVertical: 2,
    },
    intentBadgeText: {
      fontSize: AccessFontSize.xs,
      fontFamily: AccessFontFamily.semibold,
      color: AccessColors.teal,
    },
    transcriptBox: {
      backgroundColor: AccessColors.cardHover,
      borderWidth: 1,
      borderColor: AccessColors.borderLight,
      borderRadius: AccessRadius.md,
      padding: AccessSpacing.md,
      minHeight: 56,
      justifyContent: 'center',
    },
    transcriptText: {
      fontSize: AccessFontSize.base,
      fontFamily: AccessFontFamily.medium,
      color: AccessColors.textPrimary,
      fontStyle: 'italic',
      lineHeight: 22,
    },
    responseBox: {
      backgroundColor: AccessColors.tealFaint,
      borderWidth: 1,
      borderColor: AccessColors.teal + '60',
      borderRadius: AccessRadius.md,
      padding: AccessSpacing.md,
      minHeight: 64,
      justifyContent: 'center',
    },
    responseText: {
      fontSize: AccessFontSize.base,
      fontFamily: AccessFontFamily.regular,
      color: AccessColors.tealDark,
      lineHeight: 24,
    },

    // ── Schemes ──────────────────────────────────────────────────────────────
    schemeItem: {
      backgroundColor: AccessColors.cardHover,
      borderWidth: 1,
      borderColor: AccessColors.borderLight,
      borderRadius: AccessRadius.md,
      padding: AccessSpacing.sm + 2,
      gap: 4,
    },
    schemeTitle: {
      fontSize: AccessFontSize.sm,
      fontFamily: AccessFontFamily.bold,
      color: AccessColors.tealDark,
    },
    schemeBenefit: {
      fontSize: AccessFontSize.xs,
      fontFamily: AccessFontFamily.regular,
      color: AccessColors.textSecondary,
      lineHeight: 18,
    },

    // ── Hints ────────────────────────────────────────────────────────────────
    promptHintsContainer: {
      gap: AccessSpacing.sm,
      marginTop: AccessSpacing.xs,
      paddingTop: AccessSpacing.sm,
    },
    hintsDivider: {
      height: 1,
      backgroundColor: AccessColors.borderLight,
      marginBottom: AccessSpacing.xs,
    },
    promptHintsHeading: {
      fontSize: AccessFontSize.xs,
      fontFamily: AccessFontFamily.bold,
      color: AccessColors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.7,
    },
    hintChipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: AccessSpacing.xs,
    },
    hintChip: {
      fontSize: AccessFontSize.xs,
      fontFamily: AccessFontFamily.medium,
      color: AccessColors.textSecondary,
      backgroundColor: AccessColors.cardDefault,
      borderWidth: 1,
      borderColor: AccessColors.border,
      borderRadius: AccessRadius.full,
      paddingHorizontal: AccessSpacing.sm,
      paddingVertical: 5,
    },
  }), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessRadius, AccessShadow]);
}

