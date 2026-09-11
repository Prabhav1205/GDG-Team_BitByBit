/**
 * /voice â€” Voice Interface
 *
 * Full frontend placeholder for the voice recognition and TTS module.
 * Teammates can replace mock state/handlers with real speech-to-text/TTS.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { PageHeader } from '@/components/access/PageHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function VoicePage() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [staffResponse] = useState(
    'Thank you, I will assist you with that right away.'
  );

  function handleToggleMic() {
    if (listening) {
      setListening(false);
      // Mock: simulate something was spoken
      if (!transcript) {
        setTranscript('I need help with my account.');
      }
    } else {
      setListening(true);
    }
  }

  function handleClear() {
    setTranscript('');
    setListening(false);
  }

  function handleSend() {
    alert('Message sent to staff: ' + transcript);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <AccessHeader />
        <PageHeader title="Voice" backLabel="Back to modes" backRoute="/" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* â”€â”€ Mic illustration + button â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.micSection} accessibilityRole="none" accessibilityLabel="Microphone control">
            <View style={[styles.micRing, listening && styles.micRingActive]}>
              <View style={[styles.micInner, listening && styles.micInnerActive]}>
                <KioskIcon
                  name="mic"
                  size={48}
                  color={listening ? AccessColors.textOnDark : AccessColors.navy}
                />
              </View>
            </View>

            <Text style={[styles.statusText, listening && styles.statusTextActive]}>
              {listening ? 'ðŸŽ¤ Listening...' : 'Ready to listen'}
            </Text>

            <Pressable
              style={({ pressed }: any) => [
                styles.micBtn,
                listening && styles.micBtnActive,
                pressed && styles.micBtnPressed,
              ]}
              onPress={handleToggleMic}
              accessibilityRole="button"
              accessibilityLabel={listening ? 'Stop listening' : 'Start listening'}
              testID="toggle-mic"
            >
              <Text style={[styles.micBtnLabel, listening && styles.micBtnLabelActive]}>
                {listening ? 'Stop Listening' : 'Start Listening'}
              </Text>
            </Pressable>
          </View>

          {/* â”€â”€ Transcription box â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.card}>
            <Text style={styles.cardHeading}>Your Message</Text>
            <View style={styles.transcriptBox} accessibilityLabel="Transcription area" accessibilityLiveRegion="polite">
              <Text style={[styles.transcriptText, !transcript && styles.transcriptPlaceholder]}>
                {transcript || 'Your spoken message will appear here.'}
              </Text>
            </View>
            <View style={styles.cardActions}>
              <Pressable
                style={({ pressed }: any) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Clear transcript"
              >
                <KioskIcon name="close" size={16} color={AccessColors.textSecondary} />
                <Text style={styles.actionBtnLabel}>Clear</Text>
              </Pressable>
              <Pressable
                style={({ pressed }: any) => [
                  styles.actionBtn,
                  styles.actionBtnPrimary,
                  pressed && styles.actionBtnPressed,
                ]}
                onPress={handleSend}
                accessibilityRole="button"
                accessibilityLabel="Send message to staff"
                disabled={!transcript}
              >
                <KioskIcon
                  name="send"
                  size={16}
                  color={transcript ? AccessColors.textOnDark : AccessColors.textTertiary}
                />
                <Text style={[styles.actionBtnLabelPrimary, !transcript && styles.disabledText]}>
                  Send to Staff
                </Text>
              </Pressable>
            </View>
          </View>

          {/* â”€â”€ Staff response area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={[styles.card, styles.responseCard]}>
            <View style={styles.responseHeader}>
              <View style={styles.responseIconBg}>
                <KioskIcon name="person" size={18} color={AccessColors.textOnDark} />
              </View>
              <Text style={styles.cardHeading}>Staff Response</Text>
            </View>
            <View style={styles.responseBox}>
              <Text style={styles.responseText}>{staffResponse}</Text>
            </View>
            <Pressable
              style={({ pressed }: any) => [styles.actionBtn, styles.speakBtn, pressed && styles.actionBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Play staff response aloud"
            >
              <KioskIcon name="voice" size={16} color={AccessColors.teal} />
              <Text style={styles.speakBtnLabel}>Play aloud (TTS placeholder)</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccessColors.background },
  screen: { flex: 1, backgroundColor: AccessColors.background },
  scroll: { flex: 1 },
  content: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xl,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },

  // Mic section
  micSection: {
    alignItems: 'center',
    gap: AccessSpacing.xl,
    paddingVertical: AccessSpacing.xl,
  },
  micRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    borderColor: AccessColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AccessColors.background,
  },
  micRingActive: {
    borderColor: AccessColors.teal,
    backgroundColor: AccessColors.cardSelected,
  },
  micInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 2,
    borderColor: AccessColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micInnerActive: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  statusText: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  statusTextActive: {
    color: AccessColors.teal,
  },
  micBtn: {
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.xxl,
    borderRadius: AccessRadius.md,
    borderWidth: 2,
    borderColor: AccessColors.navy,
    backgroundColor: AccessColors.cardDefault,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  micBtnActive: {
    backgroundColor: AccessColors.navy,
  },
  micBtnPressed: { opacity: 0.8 },
  micBtnFocused: {
    ...Platform.select({
      web: { outlineWidth: 3, outlineColor: AccessColors.focusRing, outlineStyle: 'solid', outlineOffset: 2 },
      default: {},
    }),
  } as any,
  micBtnLabel: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.navy,
  },
  micBtnLabelActive: { color: AccessColors.textOnDark },

  // Card
  card: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  responseCard: {
    borderColor: AccessColors.tealBorder + '40',
    backgroundColor: AccessColors.cardSelected,
  },
  cardHeading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    justifyContent: 'flex-end',
  },

  // Transcript
  transcriptBox: {
    minHeight: 80,
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    justifyContent: 'center',
  },
  transcriptText: {
    fontSize: AccessFontSize.lg,
    color: AccessColors.textPrimary,
    lineHeight: 28,
  },
  transcriptPlaceholder: { color: AccessColors.textTertiary },

  // Actions
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.lg,
    borderRadius: AccessRadius.sm,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
  },
  actionBtnPrimary: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  actionBtnPressed: { opacity: 0.75 },
  actionBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  actionBtnLabelPrimary: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textOnDark,
  },
  disabledText: { color: AccessColors.textTertiary },

  // Response
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.md,
  },
  responseIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AccessColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responseBox: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
  },
  responseText: {
    fontSize: AccessFontSize.md,
    color: AccessColors.textPrimary,
    lineHeight: 28,
  },
  speakBtn: {
    borderColor: AccessColors.tealBorder + '60',
    alignSelf: 'flex-start',
  },
  speakBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.tealDark,
  },
});


