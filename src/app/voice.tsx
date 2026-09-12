/**
 * /voice — Voice Communication Module
 *
 * Implements real-time Speech-to-Text (STT) and Text-to-Speech (TTS)
 * using the unified Web Speech Engine.
 *
 * Features:
 *   — Real-time voice listening & transcript rendering
 *   — Text-to-speech AI response output (ISL reverse channel / voice response)
 *   — ARIA-compliant screen reader status updates
 *   — Quick preset speech prompts
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
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
  AccessShadow,
} from '@/constants/access-theme';

const PRESET_QUERIES = [
  'Where is the main service desk?',
  'What documents do I need today?',
  'I would like to request staff assistance.',
  'Can you help me fill out a form?',
];

export default function VoicePage() {
  const { clearSession } = useSession();
  const { announce } = useAudioNav();
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
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
    announce(
      'Voice Communication Module. Press the microphone button or type below to speak with the kiosk.'
    );
  }, [announce]);

  function handleBack() {
    speechEngine.stopSpeaking();
    speechEngine.stopListening();
    announce('Returning to communication options');
    clearSession();
    router.replace('/');
  }

  function toggleListening() {
    if (isListening) {
      speechEngine.stopListening();
      setIsListening(false);
      announce('Microphone muted');
    } else {
      setTranscript('');
      setResponseMessage('');
      announce('Microphone active. Speak now.');
      const success = speechEngine.startListening(
        (text, isFinal) => {
          setTranscript(text);
          if (isFinal) {
            handleProcessUserSpeech(text);
          }
        },
        (error) => {
          console.warn('STT Error:', error);
          setIsListening(false);
          announce(`Voice input error: ${error}`);
        },
        { continuous: false }
      );
      if (success) {
        setIsListening(true);
      }
    }
  }

  function handleProcessUserSpeech(userText: string) {
    setIsListening(false);
    let reply = `Thank you. You said: "${userText}". How else can I assist you at the kiosk?`;

    const lower = userText.toLowerCase();
    if (lower.includes('desk') || lower.includes('where')) {
      reply = 'The main service desk is located straight ahead, counter 3.';
    } else if (lower.includes('document') || lower.includes('need') || lower.includes('form')) {
      reply = 'Please have your government ID and appointment confirmation ready.';
    } else if (lower.includes('help') || lower.includes('staff') || lower.includes('assist')) {
      reply = 'Staff notification sent. A member of staff is coming to counter 1.';
    }

    setResponseMessage(reply);
    setIsSpeakingResponse(true);
    announce(reply);
    speechEngine.speak(reply, {
      onEnd: () => setIsSpeakingResponse(false),
    });
  }

  function handlePresetSelect(presetText: string) {
    setTranscript(presetText);
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
            accessibilityLabel="Back to communication options"
            testID="back-to-home"
          >
            <KioskIcon name="back" size={15} color="#FFFFFF" />
            <Text style={styles.backBtnLabel} numberOfLines={1}>
              {isNarrow ? 'Back' : 'Back to communication options'}
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
              Voice Communication
            </Text>
            <Text style={styles.subtitle}>
              Speak naturally using your voice. The speech engine transcribes your words and responds aloud.
            </Text>
          </View>

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
                    isListening
                      ? 'Microphone active. Tap to stop listening.'
                      : 'Tap to start voice recognition.'
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
              {isListening ? '🎙️ Listening... Speak into the microphone' : 'Tap microphone to speak'}
            </Text>

            {/* Transcript Display */}
            {Boolean(transcript) && (
              <View style={styles.transcriptBox} role="status" aria-live="polite">
                <Text style={styles.transcriptLabel}>You Spoke</Text>
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
                  <Text style={styles.responseLabel}>Kiosk Response</Text>
                  {isSpeakingResponse && (
                    <View style={styles.speakingBadge}>
                      <Text style={styles.speakingBadgeText}>● Speaking</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.responseText}>{responseMessage}</Text>
              </LinearGradient>
            )}
          </View>

          {/* Quick Presets Section */}
          <View style={styles.presetsContainer}>
            <Text style={styles.presetsHeading}>Or select a common phrase:</Text>
            <View style={styles.presetsGrid}>
              {PRESET_QUERIES.map((query, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handlePresetSelect(query)}
                  style={({ pressed }) => [
                    styles.presetChip,
                    pressed && styles.presetChipPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask: ${query}`}
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

const styles = StyleSheet.create({
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
    opacity: 0.82,
  },
  backBtnFocused: {
    outlineWidth: 3,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as any,
  backBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: '#FFFFFF',
  },

  // ── Scroll ────────────────────────────────────────────────────────────────
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
    width: 88,
    height: 88,
    borderRadius: AccessRadius.lg,
    borderWidth: 1.5,
    borderColor: AccessColors.teal + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerNarrow: {
    width: 72,
    height: 72,
  },
  title: {
    fontSize: AccessFontSize.xxl,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textPrimary,
    textAlign: 'center',
  },
  titleNarrow: {
    fontSize: AccessFontSize.xl,
  },
  subtitle: {
    fontSize: AccessFontSize.md,
    color: AccessColors.textSecondary,
    textAlign: 'center',
    maxWidth: 580,
    lineHeight: 26,
  },

  // ── Mic card ─────────────────────────────────────────────────────────────
  micCard: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.lg,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    padding: AccessSpacing.xxl,
    alignItems: 'center',
    gap: AccessSpacing.lg,
  },
  micButtonArea: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 2,
  },
  micCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micStatusText: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
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
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  transcriptText: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.medium,
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
    fontWeight: AccessFontWeight.bold,
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
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.teal,
  },
  responseText: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
    lineHeight: 24,
  },

  // ── Presets ───────────────────────────────────────────────────────────────
  presetsContainer: {
    gap: AccessSpacing.md,
  },
  presetsHeading: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
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
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
});
