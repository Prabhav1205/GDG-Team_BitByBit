import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { router } from 'expo-router';
import { speechEngine, type VoiceAction } from '@/services/speech-engine';
import { useSession, type CommunicationMode } from './SessionContext';
import { LANGUAGES, toSafeLangCode, type LangCode } from '@/constants/i18n';

interface AudioNavContextValue {
  /** Whether audio-first navigation mode is turned on */
  isAudioNavEnabled: boolean;
  /** Toggle audio-first navigation mode on/off */
  toggleAudioNav: () => void;
  /** Speak an audio announcement and update ARIA live region */
  announce: (text: string, assertive?: boolean) => void;
  /** Stop ongoing speech immediately */
  stopSpeech: () => void;
  /** Whether microphone is actively listening for voice commands */
  isListening: boolean;
  /** Start listening for spoken navigation commands */
  startCommandListening: () => void;
  /** Stop listening for voice commands */
  stopCommandListening: () => void;
  /** Last recognized transcript string */
  lastTranscript: string;
  /** ARIA live message for screen readers */
  ariaLiveMessage: string;
  /** Whether live message is assertive */
  ariaLiveAssertive: boolean;
}

const AudioNavContext = createContext<AudioNavContextValue | null>(null);

export function AudioNavProvider({ children }: { children: ReactNode }) {
  const [isAudioNavEnabled, setIsAudioNavEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');
  const [ariaLiveAssertive, setAriaLiveAssertive] = useState(false);
  const { session, setMode, setLanguage, broadcastTranslation, requestStaffAssistance, clearSession } = useSession();

  const lang = toSafeLangCode(session.language);
  const speechCode = LANGUAGES[lang]?.speechCode || 'en-IN';

  const announce = (text: string, assertive = false) => {
    setAriaLiveMessage(text);
    setAriaLiveAssertive(assertive);

    if (isAudioNavEnabled) {
      speechEngine.speak(text, { lang: speechCode });
    }
  };

  const stopSpeech = () => {
    speechEngine.stopSpeaking();
  };

  const handleVoiceCommand = (action: VoiceAction) => {
    switch (action.type) {
      case 'CHANGE_LANGUAGE': {
        setLanguage(action.language);
        const targetLang = action.language;
        const newSpeechCode = LANGUAGES[targetLang]?.speechCode || 'en-IN';
        const msg =
          targetLang === 'hi'
            ? 'भाषा बदलकर हिंदी कर दी गई है।'
            : targetLang === 'mr'
            ? 'भाषा बदलून मराठी करण्यात आली आहे.'
            : 'Language switched to English.';
        speechEngine.speak(msg, { lang: newSpeechCode });
        announce(msg);
        break;
      }

      case 'NAVIGATE': {
        if (action.mode) {
          setMode(action.mode as CommunicationMode);
        } else if (action.route === '/') {
          clearSession();
        }

        let navMsg = `Navigating to ${action.mode ? action.mode.replace('-', ' ') : 'home menu'}`;
        if (action.mode === 'sign') {
          navMsg = lang === 'hi' ? 'साइन लैंग्वेज (सांकेतिक भाषा) मोड खोला जा रहा है।' : lang === 'mr' ? 'सांकेतिक भाषा मोड उघडत आहे.' : 'Opening Indian Sign Language mode.';
        } else if (action.mode === 'voice') {
          navMsg = lang === 'hi' ? 'आवाज़ नेविगेशन खोला जा रहा है।' : lang === 'mr' ? 'आवाज नेव्हिगेशन उघडत आहे.' : 'Opening Voice Assistant.';
        } else if (action.mode === 'text') {
          navMsg = lang === 'hi' ? 'टेक्स्ट मोड खोला जा रहा है।' : lang === 'mr' ? 'टेक्स्ट मोड उघडत आहे.' : 'Opening Text to Speech mode.';
        } else if (action.mode === 'assisted-touch') {
          navMsg = lang === 'hi' ? 'असिस्टेड टच मोड खोला जा रहा है।' : lang === 'mr' ? 'असिस्टेड टच मोड उघडत आहे.' : 'Opening Assisted Touch mode.';
        } else if (action.route === '/settings') {
          navMsg = lang === 'hi' ? 'सेटिंग्स खोली जा रही हैं।' : lang === 'mr' ? 'सेटिंग्ज उघडत आहे.' : 'Opening Settings.';
        } else if (action.route === '/eligibility') {
          navMsg = lang === 'hi' ? 'सरकारी योजनाएं खोली जा रही हैं।' : lang === 'mr' ? 'सरकारी योजना उघडत आहे.' : 'Opening Eligibility & Schemes.';
        } else if (action.route === '/') {
          navMsg = lang === 'hi' ? 'मुख्य मेनू पर वापस जा रहे हैं।' : lang === 'mr' ? 'मुख्य मेनूवर परत जात आहोत.' : 'Returning to Main Menu.';
        }

        speechEngine.speak(navMsg, { lang: speechCode });
        announce(navMsg);
        router.push(action.route as any);
        break;
      }

      case 'REQUEST_STAFF': {
        requestStaffAssistance('Citizen requested priority staff assistance via Voice Navigation', 'Voice Navigation');
        const staffMsg =
          lang === 'hi'
            ? 'स्टाफ सहायता अनुरोध भेज दिया गया है। एक कर्मचारी आपकी मदद के लिए आ रहा है।'
            : lang === 'mr'
            ? 'कर्मचारी मदतीची विनंती पाठवली आहे. एक कर्मचारी आपल्या मदतीसाठी येत आहे.'
            : 'Staff assistance requested. An officer is on their way to assist you.';
        speechEngine.speak(staffMsg, { lang: speechCode });
        announce(staffMsg, true);
        break;
      }

      case 'STOP_SPEECH': {
        speechEngine.stopSpeaking();
        break;
      }

      case 'READ_SCREEN': {
        const screenMsg =
          lang === 'hi'
            ? 'उपलब्ध विकल्प: साइन लैंग्वेज, आवाज़, टेक्स्ट, असिस्टेड टच, सेटिंग्स, या स्टाफ सहायता।'
            : lang === 'mr'
            ? 'उपलब्ध पर्याय: साइन लँग्वेज, व्हॉइस, टेक्स्ट, असिस्टेड टच, सेटिंग्ज किंवा कर्मचारी मदत.'
            : 'Available options: Sign Language, Voice Navigation, Text, Assisted Touch, Settings, or Staff Assistance.';
        speechEngine.speak(screenMsg, { lang: speechCode });
        announce(screenMsg);
        break;
      }

      case 'UNKNOWN': {
        if (action.query && action.query.trim().length > 2) {
          const helpMsg =
            lang === 'hi'
              ? `आपने कहा: "${action.query}"। आप साइन लैंग्वेज, टेक्स्ट, सेटिंग्स, योजनाएं या स्टाफ कह सकते हैं।`
              : lang === 'mr'
              ? `आपण म्हणालात: "${action.query}". आपण साइन लँग्वेज, टेक्स्ट, सेटिंग्ज, योजना किंवा कर्मचारी बोलू शकता.`
              : `Command heard: "${action.query}". You can say Sign Language, Text, Settings, Schemes, or Staff.`;
          announce(helpMsg);
        }
        break;
      }
    }
  };

  const startCommandListening = () => {
    if (!speechEngine.isSTTSupported()) {
      const msg = 'Voice commands are not supported in this browser.';
      announce(msg, true);
      setLastTranscript(msg);
      setTimeout(() => setLastTranscript(''), 4000);
      return;
    }

    setIsListening(true);
    setIsAudioNavEnabled(true);
    setLastTranscript('Listening...');

    speechEngine.startListening(
      (transcript, isFinal) => {
        setLastTranscript(transcript);
        if (transcript.trim().length > 1) {
          broadcastTranslation(transcript, 'Live Voice Assistant', 0.95);
        }
        if (isFinal) {
          const action = speechEngine.parseVoiceCommand(transcript);
          handleVoiceCommand(action);
        }
      },
      (error) => {
        console.warn('[AudioNav Voice Command Error]:', error);
        let errorMsg = 'Could not understand command.';
        if (error === 'microphone-permission-denied' || error === 'not-allowed') {
          errorMsg = 'Microphone permission denied. Please allow microphone access.';
          setIsListening(false);
          setIsAudioNavEnabled(false);
        }
        setLastTranscript(errorMsg);
        announce(errorMsg, true);
        setTimeout(() => setLastTranscript(''), 5000);
      },
      { continuous: true, lang: speechCode }
    );
  };

  const stopCommandListening = () => {
    speechEngine.stopListening();
    setIsListening(false);
  };

  const toggleAudioNav = () => {
    setIsAudioNavEnabled((prev) => {
      const next = !prev;
      if (next) {
        startCommandListening();
        const welcomeMsg =
          lang === 'hi'
            ? 'ऑडियो नेविगेशन और वॉइस असिस्टेंट चालू है। आप कभी भी बोल सकते हैं।'
            : lang === 'mr'
            ? 'ऑडिओ नेव्हिगेशन आणि व्हॉइस असिस्टंट सुरू आहे. आपण कधीही बोलू शकता.'
            : 'Audio navigation and continuous voice assistant enabled. You can speak commands at any time.';
        speechEngine.speak(welcomeMsg, { lang: speechCode });
        announce(welcomeMsg);
      } else {
        stopSpeech();
        stopCommandListening();
        const offMsg =
          lang === 'hi' ? 'ऑडियो नेविगेशन बंद किया गया।' : lang === 'mr' ? 'ऑडिओ नेव्हिगेशन बंद केले.' : 'Audio navigation disabled.';
        speechEngine.speak(offMsg, { lang: speechCode });
        announce(offMsg);
      }
      return next;
    });
  };

  // Keep speech engine synced on unmount
  useEffect(() => {
    return () => {
      speechEngine.stopSpeaking();
      speechEngine.stopListening();
    };
  }, []);

  return (
    <AudioNavContext.Provider
      value={{
        isAudioNavEnabled,
        toggleAudioNav,
        announce,
        stopSpeech,
        isListening,
        startCommandListening,
        stopCommandListening,
        lastTranscript,
        ariaLiveMessage,
        ariaLiveAssertive,
      }}
    >
      {children}
    </AudioNavContext.Provider>
  );
}

export function useAudioNav(): AudioNavContextValue {
  const ctx = useContext(AudioNavContext);
  if (!ctx) {
    throw new Error('useAudioNav must be used within an <AudioNavProvider>');
  }
  return ctx;
}
