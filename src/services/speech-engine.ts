/**
 * Speech Engine Service — Web Speech API wrapper for STT (Speech-to-Text) & TTS (Text-to-Speech).
 *
 * Provides cross-platform speech capabilities for:
 *   1. Audio-first navigation for visually impaired users.
 *   2. Voice communication module (/voice) and ISL reverse channel text-to-speech output.
 */

import * as Speech from 'expo-speech';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export type VoiceAction =
  | { type: 'NAVIGATE'; route: string; mode: string }
  | { type: 'CHANGE_LANGUAGE'; language: 'en' | 'hi' | 'mr' }
  | { type: 'REQUEST_STAFF' }
  | { type: 'STOP_SPEECH' }
  | { type: 'READ_SCREEN' }
  | { type: 'UNKNOWN'; query: string };

class SpeechEngineService {
  private recognition: any = null;
  private isListeningActive = false;

  /** Check if Text-to-Speech is supported in current environment */
  public isTTSSupported(): boolean {
    return true; // expo-speech is supported across iOS, Android, and Web
  }

  /** Check if Speech-to-Text is supported in current environment */
  public isSTTSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  /** Speak text using expo-speech */
  public speak(text: string, options: SpeakOptions = {}): void {
    try {
      Speech.stop(); // Stop any ongoing speech

      Speech.speak(text, {
        rate: options.rate ?? 1.0,
        pitch: options.pitch ?? 1.0,
        language: options.lang ?? 'en-IN',
        onDone: options.onEnd,
        onError: (err) => {
          console.warn('[SpeechEngine Expo-Speech Error]:', err);
          options.onError?.(err);
        },
      });
    } catch (err) {
      console.warn('[SpeechEngine TTS Error]:', err);
      options.onEnd?.();
    }
  }

  /** Stop speaking immediately */
  public stopSpeaking(): void {
    try {
      Speech.stop();
    } catch {
      // ignore
    }
  }

  /** Start Speech-to-Text listening session */
  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    options: { continuous?: boolean; lang?: string } = {}
  ): boolean {
    if (!this.isSTTSupported()) {
      onError?.('Speech recognition is not supported in this browser environment.');
      return false;
    }

    try {
      if (this.recognition) {
        this.stopListening();
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = options.continuous ?? true;
      this.recognition.interimResults = true;
      this.recognition.lang = options.lang ?? 'en-IN';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const combined = (finalTranscript || interimTranscript).trim();
        if (combined) {
          onResult(combined, Boolean(finalTranscript));
        }
      };

      this.recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          onError?.('microphone-permission-denied');
        } else if (event.error !== 'no-speech') {
          onError?.(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListeningActive && (options.continuous ?? true)) {
          // Restart continuous listening if still active across page changes
          try {
            this.recognition?.start();
          } catch {
            setTimeout(() => {
              if (this.isListeningActive) {
                try {
                  this.recognition?.start();
                } catch {
                  // ignore
                }
              }
            }, 300);
          }
        } else {
          this.isListeningActive = false;
        }
      };

      this.isListeningActive = true;
      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListeningActive = false;
      onError?.(err?.message || 'Failed to start voice recognition');
      return false;
    }
  }

  /** Stop Speech-to-Text listening */
  public stopListening(): void {
    this.isListeningActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
      this.recognition = null;
    }
  }

  /** Is STT currently active */
  public isListening(): boolean {
    return this.isListeningActive;
  }

  /** Parse spoken transcript into a navigation or UI action (Multilingual EN/HI/MR) */
  public parseVoiceCommand(transcript: string): VoiceAction {
    const text = transcript.toLowerCase().trim();

    if (!text) {
      return { type: 'UNKNOWN', query: '' };
    }

    // 1. Stop / Silence / Mute
    if (
      text.includes('stop') ||
      text.includes('quiet') ||
      text.includes('silence') ||
      text.includes('mute') ||
      text.includes('रुकें') ||
      text.includes('थांबा') ||
      text.includes('शांत')
    ) {
      return { type: 'STOP_SPEECH' };
    }

    // 2. Help / Staff assistance
    if (
      text.includes('help') ||
      text.includes('staff') ||
      text.includes('assistance') ||
      text.includes('officer') ||
      text.includes('nurse') ||
      text.includes('human') ||
      text.includes('मदद') ||
      text.includes('सहायता') ||
      text.includes('स्टाफ') ||
      text.includes('कर्मचारी') ||
      text.includes('मदत') ||
      text.includes('अधिकारी')
    ) {
      return { type: 'REQUEST_STAFF' };
    }

    // 3. Language Switching
    if (text.includes('hindi') || text.includes('हिंदी') || text.includes('हिन्दी')) {
      return { type: 'CHANGE_LANGUAGE', language: 'hi' };
    }
    if (text.includes('marathi') || text.includes('मराठी')) {
      return { type: 'CHANGE_LANGUAGE', language: 'mr' };
    }
    if (text.includes('english') || text.includes('अंग्रेजी') || text.includes('इंग्रजी') || text.includes('इंग्लिश')) {
      return { type: 'CHANGE_LANGUAGE', language: 'en' };
    }

    // 4. Navigation: Sign Language
    if (
      text.includes('sign') ||
      text.includes('gesture') ||
      text.includes('isl') ||
      text.includes('deaf') ||
      text.includes('साइन') ||
      text.includes('सांकेतिक') ||
      text.includes('इशार') ||
      text.includes('हस्तभाषा') ||
      text.includes('बधिर') ||
      text.includes('मुकबधिर') ||
      text.includes('हातवारे')
    ) {
      return { type: 'NAVIGATE', route: '/sign', mode: 'sign' };
    }

    // 5. Navigation: Voice
    if (
      text.includes('voice') ||
      text.includes('speak') ||
      text.includes('talk') ||
      text.includes('audio') ||
      text.includes('बोलकर') ||
      text.includes('आवाज़') ||
      text.includes('ध्वनि') ||
      text.includes('आवाज')
    ) {
      return { type: 'NAVIGATE', route: '/voice', mode: 'voice' };
    }

    // 6. Navigation: Text
    if (
      text.includes('text') ||
      text.includes('type') ||
      text.includes('keyboard') ||
      text.includes('लिखकर') ||
      text.includes('टेक्स्ट') ||
      text.includes('टाइप')
    ) {
      return { type: 'NAVIGATE', route: '/text', mode: 'text' };
    }

    // 7. Navigation: Assisted Touch
    if (
      text.includes('touch') ||
      text.includes('assisted') ||
      text.includes('large target') ||
      text.includes('dwell') ||
      text.includes('टच') ||
      text.includes('स्पर्श')
    ) {
      return { type: 'NAVIGATE', route: '/assisted-touch', mode: 'assisted-touch' };
    }

    // 8. Navigation: Settings / Accessibility preferences
    if (
      text.includes('setting') ||
      text.includes('settings') ||
      text.includes('preference') ||
      text.includes('contrast') ||
      text.includes('font size') ||
      text.includes('सेटिंग्स') ||
      text.includes('सेटिंग')
    ) {
      return { type: 'NAVIGATE', route: '/settings', mode: '' };
    }

    // 9. Navigation: Eligibility / Schemes
    if (
      text.includes('scheme') ||
      text.includes('schemes') ||
      text.includes('eligibility') ||
      text.includes('benefit') ||
      text.includes('pension') ||
      text.includes('adip') ||
      text.includes('योजना') ||
      text.includes('पात्रता') ||
      text.includes('पेंशन') ||
      text.includes('अर्ज') ||
      text.includes('लाभ')
    ) {
      return { type: 'NAVIGATE', route: '/eligibility', mode: '' };
    }

    // 10. Navigation: Home / Back / Main Menu
    if (
      text.includes('back') ||
      text.includes('home') ||
      text.includes('main menu') ||
      text.includes('start over') ||
      text.includes('exit') ||
      text.includes('done') ||
      text.includes('मुख्य मेनू') ||
      text.includes('वापस') ||
      text.includes('बाहेर') ||
      text.includes('मागे')
    ) {
      return { type: 'NAVIGATE', route: '/', mode: '' };
    }

    // 11. Read screen summary
    if (
      text.includes('repeat') ||
      text.includes('read') ||
      text.includes('where am i') ||
      text.includes('options') ||
      text.includes('दोहराएं') ||
      text.includes('पुन्हा सांगा')
    ) {
      return { type: 'READ_SCREEN' };
    }

    return { type: 'UNKNOWN', query: text };
  }
}

export const speechEngine = new SpeechEngineService();
