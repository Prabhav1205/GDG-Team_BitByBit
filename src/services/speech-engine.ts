/**
 * Speech Engine Service — Web Speech API wrapper for STT (Speech-to-Text) & TTS (Text-to-Speech).
 *
 * Provides cross-platform speech capabilities for:
 *   1. Audio-first navigation for visually impaired users.
 *   2. Voice communication module (/voice) and ISL reverse channel text-to-speech output.
 */

import { Platform } from 'react-native';

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  lang?: string;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export type VoiceAction =
  | { type: 'NAVIGATE'; route: string; mode: string }
  | { type: 'REQUEST_STAFF' }
  | { type: 'STOP_SPEECH' }
  | { type: 'READ_SCREEN' }
  | { type: 'UNKNOWN'; query: string };

class SpeechEngineService {
  private recognition: any = null;
  private isListeningActive = false;

  /** Check if Text-to-Speech is supported in current environment */
  public isTTSSupported(): boolean {
    if (Platform.OS !== 'web') return false;
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /** Check if Speech-to-Text is supported in current environment */
  public isSTTSupported(): boolean {
    if (Platform.OS !== 'web') return false;
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  /** Speak text using SpeechSynthesis */
  public speak(text: string, options: SpeakOptions = {}): void {
    if (!this.isTTSSupported()) {
      console.log('[SpeechEngine TTS Fallback]:', text);
      options.onEnd?.();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.lang = options.lang ?? 'en-US';

      if (options.onEnd) {
        utterance.onend = () => options.onEnd?.();
      }
      if (options.onError) {
        utterance.onerror = (e) => options.onError?.(e);
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[SpeechEngine TTS Error]:', err);
      options.onEnd?.();
    }
  }

  /** Stop speaking immediately */
  public stopSpeaking(): void {
    if (this.isTTSSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
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
      this.recognition.lang = options.lang ?? 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentText = finalTranscript || interimTranscript;
        onResult(currentText.trim(), Boolean(finalTranscript));
      };

      this.recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          onError?.(event.error);
        }
      };

      this.recognition.onend = () => {
        if (this.isListeningActive && options.continuous) {
          // Restart continuous listening if still active
          try {
            this.recognition?.start();
          } catch {
            this.isListeningActive = false;
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

  /** Parse spoken transcript into a navigation or UI action */
  public parseVoiceCommand(transcript: string): VoiceAction {
    const text = transcript.toLowerCase().trim();

    if (!text) {
      return { type: 'UNKNOWN', query: '' };
    }

    // Stop command
    if (text.includes('stop') || text.includes('quiet') || text.includes('silence') || text.includes('mute')) {
      return { type: 'STOP_SPEECH' };
    }

    // Help / Staff assistance
    if (
      text.includes('help') ||
      text.includes('staff') ||
      text.includes('assistance') ||
      text.includes('assistant')
    ) {
      return { type: 'REQUEST_STAFF' };
    }

    // Read screen summary
    if (text.includes('repeat') || text.includes('read') || text.includes('where am i') || text.includes('options')) {
      return { type: 'READ_SCREEN' };
    }

    // Navigation: Sign Language
    if (text.includes('sign') || text.includes('gesture') || text.includes('deaf') || text.includes('option 1') || text.includes('one')) {
      return { type: 'NAVIGATE', route: '/sign', mode: 'sign' };
    }

    // Navigation: Voice
    if (text.includes('voice') || text.includes('speak') || text.includes('talk') || text.includes('option 2') || text.includes('two')) {
      return { type: 'NAVIGATE', route: '/voice', mode: 'voice' };
    }

    // Navigation: Text
    if (text.includes('text') || text.includes('type') || text.includes('keyboard') || text.includes('option 3') || text.includes('three')) {
      return { type: 'NAVIGATE', route: '/text', mode: 'text' };
    }

    // Navigation: Assisted Touch
    if (text.includes('touch') || text.includes('assisted') || text.includes('large') || text.includes('option 4') || text.includes('four')) {
      return { type: 'NAVIGATE', route: '/assisted-touch', mode: 'assisted-touch' };
    }

    // Navigation: Home / Back
    if (text.includes('back') || text.includes('home') || text.includes('main menu') || text.includes('start over')) {
      return { type: 'NAVIGATE', route: '/', mode: '' };
    }

    return { type: 'UNKNOWN', query: text };
  }
}

export const speechEngine = new SpeechEngineService();
