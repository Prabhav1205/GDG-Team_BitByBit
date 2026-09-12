import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { router } from 'expo-router';
import { speechEngine, type VoiceAction } from '@/services/speech-engine';
import { useSession, type CommunicationMode } from './SessionContext';

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
  ariaLiveAssertive: boolean;
}

const AudioNavContext = createContext<AudioNavContextValue | null>(null);

export function AudioNavProvider({ children }: { children: ReactNode }) {
  const [isAudioNavEnabled, setIsAudioNavEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');
  const [ariaLiveAssertive, setAriaLiveAssertive] = useState(false);
  const { setMode, clearSession } = useSession();

  const announce = (text: string, assertive = false) => {
    setAriaLiveMessage(text);
    setAriaLiveAssertive(assertive);

    if (isAudioNavEnabled) {
      speechEngine.speak(text);
    }
  };

  const stopSpeech = () => {
    speechEngine.stopSpeaking();
  };

  const toggleAudioNav = () => {
    setIsAudioNavEnabled((prev) => {
      const next = !prev;
      if (next) {
        speechEngine.speak(
          'Audio navigation enabled. You can use voice commands or listen to screen guidance.'
        );
      } else {
        speechEngine.stopSpeaking();
        speechEngine.stopListening();
        setIsListening(false);
      }
      return next;
    });
  };

  const handleVoiceCommand = (action: VoiceAction) => {
    switch (action.type) {
      case 'NAVIGATE':
        if (action.mode) {
          setMode(action.mode as CommunicationMode);
        } else {
          clearSession();
        }
        announce(`Navigating to ${action.mode ? action.mode.replace('-', ' ') : 'home menu'}`);
        router.push(action.route as any);
        break;

      case 'REQUEST_STAFF':
        announce('Staff assistance has been requested. A staff member will assist you shortly.', true);
        break;

      case 'STOP_SPEECH':
        speechEngine.stopSpeaking();
        break;

      case 'READ_SCREEN':
        announce('Screen summary: Main menu. Select Sign Language, Voice, Text, or Assisted Touch.');
        break;

      case 'UNKNOWN':
        if (action.query) {
          announce(`Command not recognized: ${action.query}. Say Help, Sign, Voice, Text, or Touch.`);
        }
        break;
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
    setLastTranscript('Listening...');
    speechEngine.startListening(
      (transcript, isFinal) => {
        setLastTranscript(transcript);
        if (isFinal) {
          const action = speechEngine.parseVoiceCommand(transcript);
          handleVoiceCommand(action);
        }
      },
      (error) => {
        console.warn('Voice command error:', error);
        setIsListening(false);

        let errorMsg = 'Could not understand command.';
        if (error === 'microphone-permission-denied' || error === 'not-allowed') {
          errorMsg = 'Microphone permission denied. Please allow microphone access.';
        }
        setLastTranscript(errorMsg);
        announce(errorMsg, true);
        setTimeout(() => setLastTranscript(''), 5000);
      },
      { continuous: true }
    );
  };

  const stopCommandListening = () => {
    speechEngine.stopListening();
    setIsListening(false);
  };

  // Clean up speech on unmount
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
