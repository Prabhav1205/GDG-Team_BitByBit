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
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [isSpeakingResponse, setIsSpeakingResponse] = useState(false);

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
        <View style={styles.navBar}>
          <Pressable
            onPress={handleBack}
            style={({ pressed, focused }: any) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
              focused && styles.backBtnFocused,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back to communication options"
            testID="back-to-home"
          >
            <KioskIcon name="back" size={16} color={AccessColors.navy} />
            <Text style={styles.backBtnLabel}>Back to communication options</Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Module Banner */}
          <View style={styles.headerBlock}>
            <View style={styles.iconContainer}>
              <KioskIcon name="voice" size={44} color={AccessColors.teal} />
            </View>
            <Text style={styles.title} accessibilityRole="header" aria-level={1}>
              Voice Communication
            </Text>
            <Text style={styles.subtitle}>
              Speak naturally using your voice. The speech engine transcribes your words and responds aloud.
            </Text>
          </View>

          {/* Voice Mic Input Card */}
          <View style={styles.micCard}>
            <Pressable
              onPress={toggleListening}
              style={({ pressed }) => [
                styles.micCircle,
                isListening && styles.micCircleActive,
                pressed && styles.micCirclePressed,
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
              <KioskIcon
                name="voice"
                size={40}
                color={isListening ? '#E53935' : AccessColors.teal}
              />
            </Pressable>

            <Text style={styles.micStatusText}>
              {isListening ? 'Listening... Speak into the microphone' : 'Tap microphone to speak'}
            </Text>

            {/* Transcript Display */}
            {Boolean(transcript) && (
              <View style={styles.transcriptBox} role="status" aria-live="polite">
                <Text style={styles.transcriptLabel}>You Spoke:</Text>
                <Text style={styles.transcriptText}>{`"${transcript}"`}</Text>
              </View>
            )}

            {/* Kiosk TTS Response Display */}
            {Boolean(responseMessage) && (
              <View style={styles.responseBox} role="status" aria-live="assertive">
                <View style={styles.responseHeader}>
                  <Text style={styles.responseLabel}>Kiosk Voice Response:</Text>
                  {isSpeakingResponse && (
                    <Text style={styles.speakingBadge}>[Speaking...]</Text>
                  )}
                </View>
                <Text style={styles.responseText}>{responseMessage}</Text>
              </View>
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
  navBar: {
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    backgroundColor: AccessColors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.cardDefault,
  },
  backBtnPressed: {
    opacity: 0.75,
    backgroundColor: AccessColors.cardHover,
  },
  backBtnFocused: {
    outlineWidth: 3,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as any,
  backBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },
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
  headerBlock: {
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: AccessRadius.lg,
    backgroundColor: AccessColors.cardSelected,
    borderWidth: 1.5,
    borderColor: AccessColors.tealBorder + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: AccessFontSize.xxl,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: AccessFontSize.md,
    color: AccessColors.textSecondary,
    textAlign: 'center',
    maxWidth: 580,
    lineHeight: 24,
  },
  micCard: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    padding: AccessSpacing.xxl,
    alignItems: 'center',
    gap: AccessSpacing.lg,
  },
  micCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: AccessColors.cardSelected,
    borderWidth: 2,
    borderColor: AccessColors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCircleActive: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E53935',
  },
  micCirclePressed: {
    opacity: 0.8,
  },
  micStatusText: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  transcriptBox: {
    width: '100%',
    backgroundColor: AccessColors.background,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    gap: 4,
  },
  transcriptLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textTertiary,
    textTransform: 'uppercase',
  },
  transcriptText: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },
  responseBox: {
    width: '100%',
    backgroundColor: AccessColors.cardSelected,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    borderWidth: 1,
    borderColor: AccessColors.tealBorder,
    gap: 4,
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
  },
  speakingBadge: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.teal,
  },
  responseText: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
    lineHeight: 24,
  },
  presetsContainer: {
    gap: AccessSpacing.md,
  },
  presetsHeading: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
  },
  presetChip: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.sm,
  },
  presetChipPressed: {
    backgroundColor: AccessColors.cardHover,
  },
  presetText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textPrimary,
  },
});
