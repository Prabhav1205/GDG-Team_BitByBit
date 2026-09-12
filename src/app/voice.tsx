/**
 * /voice — Voice Communication Module
 *
 * Implements real-time Speech-to-Text (STT) and Text-to-Speech (TTS)
 * using Expo Audio recording + Groq Whisper AI on native, with multilingual
 * text-to-speech AI responses.
 *
 * Features:
 *   — Real-time voice recording & Whisper AI transcript rendering
 *   — Text-to-speech AI response output in selected language (en/hi/mr)
 *   — Multilingual quick prompts & institutional phrases
 *   — Animated mic button with pulsing ring when active
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { AccessHeader } from '@/components/access/AccessHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import { speechEngine } from '@/services/speech-engine';
import { useSession } from '@/context/SessionContext';
import { useAudioNav } from '@/context/AudioNavContext';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { UI_STRINGS, LANGUAGES, QUICK_ACTIONS, toSafeLangCode } from '@/constants/i18n';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
  AccessShadow,
} from '@/constants/access-theme';

import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { transcribeAudio } from '@/services/whisper-service';
import { PhraseService } from '@/services/phrase-service';

export default function VoicePage() {
  const styles = useStyles();
  const { session, clearSession, broadcastTranslation } = useSession();
  const { announce } = useAudioNav();
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;

  const lang = toSafeLangCode(session.language);
  const speechCode = LANGUAGES[lang].speechCode;
  const t = UI_STRINGS[lang];

  // Dynamically load institution phrases (Bank, Hospital, Govt) localized to current language
  const currentInstitution = PhraseService.getInstitutionById(
    session.institution || 'bank',
    lang
  );
  const instPhrases = currentInstitution.categories.flatMap((cat) => cat.phrases);
  const presetQueries = instPhrases.length > 0 ? instPhrases : QUICK_ACTIONS[lang];

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false);
  const [backHovered, setBackHovered] = useState(false);

  // Animation refs
  const [pulseOuter1] = useState(() => new Animated.Value(1));
  const [pulseOuter2] = useState(() => new Animated.Value(1));
  const [pulseOpacity1] = useState(() => new Animated.Value(0.5));
  const [pulseOpacity2] = useState(() => new Animated.Value(0.3));
  const [micScale] = useState(() => new Animated.Value(1));

  // Listening pulse rings
  useEffect(() => {
    if (!isListening) {
      pulseOuter1.setValue(1);
      pulseOuter2.setValue(1);
      pulseOpacity1.setValue(0.5);
      pulseOpacity2.setValue(0.3);
      return;
    }
    const ring1 = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseOuter1, { toValue: 1.8, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseOpacity1, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseOuter1, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity1, { toValue: 0.5, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    const ring2 = Animated.loop(
      Animated.sequence([
        Animated.delay(350),
        Animated.parallel([
          Animated.timing(pulseOuter2, { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseOpacity2, { toValue: 0, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseOuter2, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity2, { toValue: 0.3, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    ring1.start();
    ring2.start();
    return () => { ring1.stop(); ring2.stop(); };
  }, [isListening, pulseOuter1, pulseOuter2, pulseOpacity1, pulseOpacity2]);

  useEffect(() => {
    announce(t.voiceSubtitle);
  }, [announce, t.voiceSubtitle]);

  function handleBack() {
    speechEngine.stopSpeaking();
    if (isListening) {
      audioRecorder.stop().catch(() => {});
    }
    announce(t.backToMain);
    clearSession();
    router.replace('/');
  }

  async function toggleListening() {
    if (isListening) {
      // Stop recording and transcribe
      try {
        setIsListening(false);
        await audioRecorder.stop();
        const uri = audioRecorder.uri;
        announce('Recording stopped. Processing speech transcription...');

        if (uri) {
          console.log('[expo-audio] Recorded file URI:', uri);
          setIsTranscribing(true);
          const text = await transcribeAudio(uri);
          setIsTranscribing(false);
          setTranscript(text);
          setErrorMessage('');
          handleProcessUserSpeech(text);
        } else {
          throw new Error('No audio recording captured.');
        }
      } catch (err: any) {
        setIsListening(false);
        setIsTranscribing(false);
        const msg = err?.message || 'Transcription failed, please try again.';
        setErrorMessage(msg);
        announce(`Voice error: ${msg}`);
      }
    } else {
      // Start recording
      setTranscript('');
      setResponseMessage('');
      setErrorMessage('');
      try {
        const { granted } = await requestRecordingPermissionsAsync();
        if (!granted) {
          const errText = 'Microphone permission denied.';
          setErrorMessage(errText);
          announce(errText);
          return;
        }

        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });

        await audioRecorder.prepareToRecordAsync();
        audioRecorder.record();
        setIsListening(true);
        announce(t.micActive);
      } catch (err: any) {
        const msg = err?.message || 'Failed to start microphone recording.';
        setErrorMessage(msg);
        announce(msg);
        setIsListening(false);
      }
    }
  }

  function handleProcessUserSpeech(userText: string) {
    setIsListening(false);
    broadcastTranslation(userText, 'Voice', 0.95);

    let reply = `Thank you. You said: "${userText}". How else can I assist you at the kiosk?`;

    const lower = userText.toLowerCase();
    if (lower.includes('desk') || lower.includes('where') || lower.includes('कहाँ') || lower.includes('कुठे')) {
      reply = lang === 'hi'
        ? 'मुख्य सेवा काउंटर सीधे आगे काउंटर 3 पर है।'
        : lang === 'mr'
        ? 'मुख्य सेवा काउंटर थेट समोर काउंटर 3 वर आहे.'
        : 'The main service desk is located straight ahead, counter 3.';
    } else if (lower.includes('document') || lower.includes('need') || lower.includes('form') || lower.includes('दस्तावेज') || lower.includes('कागदपत्रे')) {
      reply = lang === 'hi'
        ? 'कृपया अपना पहचान पत्र और अपॉइंटमेंट रसीद तैयार रखें।'
        : lang === 'mr'
        ? 'कृपया आपले ओळखपत्र आणि अपॉइंटमेंट पावती तयार ठेवा.'
        : 'Please have your government ID and appointment confirmation ready.';
    } else if (lower.includes('help') || lower.includes('staff') || lower.includes('assist') || lower.includes('मदद') || lower.includes('मदत')) {
      reply = lang === 'hi'
        ? 'कर्मचारी सहायता अनुरोध भेज दिया गया है।'
        : lang === 'mr'
        ? 'कर्मचारी मदत विनंती पाठवली आहे.'
        : 'Staff notification sent. A member of staff is coming to counter 1.';
    }

    setResponseMessage(reply);
    setIsSpeakingResponse(true);
    announce(reply);
    speechEngine.speak(reply, {
      lang: speechCode,
      onEnd: () => setIsSpeakingResponse(false),
    });
  }

  function handlePresetSelect(presetText: string) {
    setTranscript(presetText);
    setErrorMessage('');
    handleProcessUserSpeech(presetText);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* Header */}
        <AccessHeader />

        {/* Back Navigation Bar */}
        <View style={[styles.navBar, isNarrow && styles.navBarNarrow]}>
          <Pressable
            onPress={handleBack}
            onHoverIn={() => setBackHovered(true)}
            onHoverOut={() => setBackHovered(false)}
            style={({ pressed, focused }: any) => [
              styles.backBtn,
              backHovered && styles.backBtnHovered,
              pressed && styles.backBtnPressed,
              focused && styles.backBtnFocused,
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.backToOptions}
            testID="back-to-home"
          >
            <KioskIcon name="back" size={15} color="#FFFFFF" />
            <Text style={styles.backBtnLabel} numberOfLines={1}>
              {isNarrow ? t.backToMain : t.backToOptions}
            </Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.contentContainer, isNarrow && styles.contentContainerNarrow]}
          showsVerticalScrollIndicator={false}
        >
          {/* Module Banner */}
          <View style={styles.headerBlock}>
            <LinearGradient
              colors={[AccessColors.voiceAccentLight, AccessColors.tealFaint]}
              style={[styles.iconContainer, isNarrow && styles.iconContainerNarrow]}
            >
              <KioskIcon name="voice" size={isNarrow ? 36 : 44} color={AccessColors.teal} />
            </LinearGradient>
            <Text style={[styles.title, isNarrow && styles.titleNarrow]} accessibilityRole="header" aria-level={1}>
              {t.voiceTitle}
            </Text>
            <Text style={styles.subtitle}>
              {t.voiceSubtitle}
            </Text>
          </View>

          {/* Error banner */}
          {Boolean(errorMessage) && (
            <View style={styles.errorBanner} role="alert">
              <KioskIcon name="info" size={14} color="#C62828" />
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable onPress={() => setErrorMessage('')} style={styles.errorClose}>
                <KioskIcon name="close" size={12} color="#C62828" />
              </Pressable>
            </View>
          )}

          {/* Voice Mic Input Card */}
          <View style={[styles.micCard, AccessShadow.md as any]}>
            {/* Animated mic button with pulse rings */}
            <View style={styles.micButtonArea}>
              {/* Pulse rings (only visible when listening) */}
              {isListening && (
                <>
                  <Animated.View
                    style={[
                      styles.pulseRing,
                      {
                        transform: [{ scale: pulseOuter1 }],
                        opacity: pulseOpacity1,
                        borderColor: '#E53935',
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.pulseRing,
                      {
                        transform: [{ scale: pulseOuter2 }],
                        opacity: pulseOpacity2,
                        borderColor: '#E53935',
                      },
                    ]}
                  />
                </>
              )}

              <Animated.View style={{ transform: [{ scale: micScale }] }}>
                <Pressable
                  onPress={toggleListening}
                  onPressIn={() => Animated.spring(micScale, { toValue: 0.93, useNativeDriver: true, speed: 30, bounciness: 0 }).start()}
                  onPressOut={() => Animated.spring(micScale, { toValue: 1, useNativeDriver: true, speed: 25, bounciness: 5 }).start()}
                  style={({ pressed }) => [
                    pressed && { opacity: 0.9 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isListening ? t.micStop : t.micTap
                  }
                  accessibilityState={{ expanded: isListening }}
                  testID="mic-button"
                >
                  {isListening ? (
                    <LinearGradient
                      colors={['#EF5350', '#C62828']}
                      style={styles.micCircle}
                    >
                      <KioskIcon name="voice" size={40} color="#FFFFFF" />
                    </LinearGradient>
                  ) : (
                    <LinearGradient
                      colors={[AccessColors.tealLight, AccessColors.teal]}
                      style={styles.micCircle}
                    >
                      <KioskIcon name="voice" size={40} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                </Pressable>
              </Animated.View>
            </View>

            <Text style={styles.micStatusText}>
              {isListening
                ? t.micActive
                : isTranscribing
                ? '⏳ Transcribing audio with Whisper AI...'
                : t.micTap}
            </Text>

            {/* Language indicator */}
            <View style={styles.langIndicator}>
              <KioskIcon name="language" size={12} color={AccessColors.teal} />
              <Text style={styles.langIndicatorText}>
                {LANGUAGES[lang].nativeName} · {speechCode}
              </Text>
            </View>

            {/* Transcript Display */}
            {Boolean(transcript) && (
              <View style={styles.transcriptBox} role="status" aria-live="polite">
                <Text style={styles.transcriptLabel}>{t.youSpoke}</Text>
                <Text style={styles.transcriptText}>{`"${transcript}"`}</Text>
              </View>
            )}

            {/* Kiosk TTS Response Display */}
            {Boolean(responseMessage) && (
              <LinearGradient
                colors={[AccessColors.tealFaint, AccessColors.voiceAccentLight]}
                style={styles.responseBox}
                role="status"
                aria-live="assertive"
              >
                <View style={styles.responseHeader}>
                  <Text style={styles.responseLabel}>{t.kioskResponse}</Text>
                  {isSpeakingResponse && (
                    <View style={styles.speakingBadge}>
                      <Text style={styles.speakingBadgeText}>{t.speaking}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.responseText}>{responseMessage}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Quick Presets Section */}
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsHeading}>
              {t.commonPhrases} ({currentInstitution.name}):
            </Text>
            <View style={styles.presetsGrid}>
              {presetQueries.map((query, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handlePresetSelect(query)}
                  style={({ pressed }) => [
                    styles.presetChip,
                    pressed && styles.presetChipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={query}
                >
                  <Text style={styles.presetText}>{query}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AccessColors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: AccessColors.background,
  },

  // ── Navigation bar ────────────────────────────────────────────────────────
  navBar: {
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    backgroundColor: AccessColors.cardDefault,
  },
  navBarNarrow: {
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.navy,
    ...AccessShadow.sm,
  },
  backBtnHovered: {
    backgroundColor: AccessColors.navyHover,
    ...AccessShadow.md,
  },
  backBtnPressed: {
    opacity: 0.85,
  },
  backBtnFocused: {
    outlineWidth: 3,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as any,
  backBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.semibold,
    color: '#FFFFFF',
  },

  // ── Content container ─────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.xxl,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
    gap: AccessSpacing.xl,
    paddingBottom: AccessSpacing.xxl * 2,
  },
  contentContainerNarrow: {
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.lg,
    gap: AccessSpacing.lg,
  },

  // ── Header block ──────────────────────────────────────────────────────────
  headerBlock: {
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: AccessRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: AccessColors.tealBorder + '40',
  },
  iconContainerNarrow: {
    width: 64,
    height: 64,
  },
  title: {
    fontSize: AccessFontSize.xxl,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.navy,
    textAlign: 'center',
  },
  titleNarrow: {
    fontSize: AccessFontSize.xl,
  },
  subtitle: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textSecondary,
    textAlign: 'center',
    maxWidth: 520,
    lineHeight: 26,
  },

  // ── Error banner ──────────────────────────────────────────────────────────
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.sm,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.md,
  },
  errorText: {
    flex: 1,
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.regular,
    color: '#C62828',
    lineHeight: 20,
  },
  errorClose: {
    padding: 4,
  },

  // ── Mic card ─────────────────────────────────────────────────────────────
  micCard: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.lg,
    padding: AccessSpacing.xxl,
    alignItems: 'center',
    gap: AccessSpacing.lg,
  },
  micButtonArea: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
  },
  micCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    ...AccessShadow.md,
  },
  micStatusText: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textPrimary,
    textAlign: 'center',
  },

  // ── Language indicator ────────────────────────────────────────────────────
  langIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: AccessColors.tealFaint,
    borderRadius: 99,
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: AccessColors.teal + '30',
  },
  langIndicatorText: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.tealDark,
  },

  // ── Transcript ────────────────────────────────────────────────────────────
  transcriptBox: {
    width: '100%',
    backgroundColor: AccessColors.background,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.md,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    gap: 6,
  },
  transcriptLabel: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  transcriptText: {
    fontSize: AccessFontSize.md,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.navy,
    lineHeight: 26,
  },

  // ── Response box ──────────────────────────────────────────────────────────
  responseBox: {
    width: '100%',
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.md,
    borderWidth: 1.5,
    borderColor: AccessColors.teal + '40',
    gap: 6,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  responseLabel: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  speakingBadge: {
    backgroundColor: AccessColors.teal + '20',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  speakingBadgeText: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.teal,
  },
  responseText: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textPrimary,
    lineHeight: 24,
  },

  // ── Presets ───────────────────────────────────────────────────────────────
  presetsContainer: {
    gap: AccessSpacing.md,
  },
  presetsHeading: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
  },
  presetChip: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.full,
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.sm + 2,
    ...AccessShadow.sm,
  },
  presetChipPressed: {
    backgroundColor: AccessColors.cardHover,
    borderColor: AccessColors.teal,
  },
  presetText: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textPrimary,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
