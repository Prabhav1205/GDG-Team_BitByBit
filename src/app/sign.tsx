/**
 * /sign â€” Sign Language Interface
 *
 * Full frontend placeholder for the ISL recognition module.
 * Teammates can replace the mock state/handlers with real MediaPipe/camera logic.
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

// â”€â”€ Common phrases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PHRASES = ['Help', 'Appointment', 'Form', 'Yes', 'No', 'Money'];

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function SignLanguagePage() {
  const [cameraActive, setCameraActive] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [status, setStatus] = useState<'waiting' | 'recognizing' | 'done'>('waiting');

  function handleToggleCamera() {
    setCameraActive((prev) => !prev);
    setStatus('waiting');
  }

  function handlePhrase(phrase: string) {
    setRecognizedText(phrase);
    setStatus('done');
  }

  function handleClear() {
    setRecognizedText('');
    setStatus('waiting');
  }

  function handleSend() {
    // Placeholder â€” teammates will wire this to the backend
    alert('Message sent to staff: ' + recognizedText);
  }

  const statusLabel =
    status === 'waiting'
      ? 'â³ Waiting for sign...'
      : status === 'recognizing'
      ? 'ðŸ” Recognizing...'
      : 'âœ… Sign recognized';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <AccessHeader />
        <PageHeader title="Sign Language" backLabel="Back to modes" backRoute="/" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* â”€â”€ Camera placeholder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.cameraContainer} accessibilityLabel="Camera preview area">
            <View style={[styles.cameraPreview, cameraActive && styles.cameraActive]}>
              <KioskIcon
                name="camera"
                size={48}
                color={cameraActive ? AccessColors.teal : AccessColors.textTertiary}
              />
              <Text style={styles.cameraLabel}>
                {cameraActive ? 'Camera active' : 'Camera preview'}
              </Text>
              <Text style={styles.cameraSubLabel}>
                ISL recognition will appear here
              </Text>
            </View>

            {/* Status indicator */}
            <View style={[styles.statusBar, status === 'done' && styles.statusBarDone]}>
              <Text style={styles.statusText}>{statusLabel}</Text>
            </View>
          </View>

          {/* â”€â”€ Camera toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <Pressable
            style={({ pressed }: any) => [
              styles.cameraBtn,
              cameraActive && styles.cameraBtnActive,
              pressed && styles.cameraBtnPressed,
            ]}
            onPress={handleToggleCamera}
            accessibilityRole="button"
            accessibilityLabel={cameraActive ? 'Stop camera' : 'Start camera'}
            testID="toggle-camera"
          >
            <KioskIcon
              name="camera"
              size={20}
              color={cameraActive ? AccessColors.textOnDark : AccessColors.navy}
            />
            <Text
              style={[styles.cameraBtnLabel, cameraActive && styles.cameraBtnLabelActive]}
            >
              {cameraActive ? 'Stop Camera' : 'Start Camera'}
            </Text>
          </Pressable>

          {/* â”€â”€ Recognized message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.recognizedCard}>
            <Text style={styles.recognizedHeading}>Recognized Message</Text>
            <View style={styles.recognizedBox} accessibilityLabel="Recognized message area">
              <Text style={[styles.recognizedText, !recognizedText && styles.recognizedPlaceholder]}>
                {recognizedText || 'Recognized message will appear here'}
              </Text>
            </View>
            <View style={styles.recognizedActions}>
              <Pressable
                style={({ pressed }: any) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Clear recognized message"
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
                disabled={!recognizedText}
              >
                <KioskIcon
                  name="send"
                  size={16}
                  color={recognizedText ? AccessColors.textOnDark : AccessColors.textTertiary}
                />
                <Text
                  style={[
                    styles.actionBtnLabelPrimary,
                    !recognizedText && styles.actionBtnDisabled,
                  ]}
                >
                  Send to Staff
                </Text>
              </Pressable>
            </View>
          </View>

          {/* â”€â”€ Common phrases â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.phrasesSection}>
            <Text style={styles.phrasesHeading}>Common Phrases</Text>
            <Text style={styles.phrasesSub}>Tap to populate the message area</Text>
            <View style={styles.phrasesGrid}>
              {PHRASES.map((phrase) => (
                <Pressable
                  key={phrase}
                  style={({ pressed }: any) => [
                    styles.phraseBtn,
                    pressed && styles.phraseBtnPressed,
                  ]}
                  onPress={() => handlePhrase(phrase)}
                  accessibilityRole="button"
                  accessibilityLabel={`Use phrase: ${phrase}`}
                >
                  <Text style={styles.phraseBtnLabel}>{phrase}</Text>
                </Pressable>
              ))}
            </View>
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
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  // Camera preview
  cameraContainer: { gap: AccessSpacing.sm },
  cameraPreview: {
    height: 280,
    backgroundColor: '#1A1F2E',
    borderRadius: AccessRadius.lg,
    borderWidth: 2,
    borderColor: AccessColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.md,
  },
  cameraActive: {
    borderColor: AccessColors.teal,
    borderStyle: 'solid',
  },
  cameraLabel: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textOnDark,
  },
  cameraSubLabel: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textOnDarkMuted,
  },
  statusBar: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    alignItems: 'center',
  },
  statusBarDone: {
    backgroundColor: AccessColors.statusGreenBg,
    borderColor: AccessColors.statusGreen,
  },
  statusText: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },

  // Camera button
  cameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.sm,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.xl,
    borderRadius: AccessRadius.md,
    borderWidth: 2,
    borderColor: AccessColors.navy,
    backgroundColor: AccessColors.cardDefault,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  cameraBtnActive: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  cameraBtnPressed: { opacity: 0.8 },
  cameraBtnFocused: {
    ...Platform.select({
      web: { outlineWidth: 3, outlineColor: AccessColors.focusRing, outlineStyle: 'solid', outlineOffset: 2 },
      default: {},
    }),
  } as any,
  cameraBtnLabel: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.navy,
  },
  cameraBtnLabelActive: { color: AccessColors.textOnDark },

  // Recognized message
  recognizedCard: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  recognizedHeading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  recognizedBox: {
    minHeight: 80,
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    justifyContent: 'center',
  },
  recognizedText: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textPrimary,
    lineHeight: 28,
  },
  recognizedPlaceholder: { color: AccessColors.textTertiary },
  recognizedActions: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    justifyContent: 'flex-end',
  },
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
  actionBtnDisabled: { color: AccessColors.textTertiary },

  // Common phrases
  phrasesSection: { gap: AccessSpacing.md },
  phrasesHeading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  phrasesSub: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
  },
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
  },
  phraseBtn: {
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.xl,
    borderRadius: AccessRadius.md,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    minWidth: 90,
    alignItems: 'center',
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  phraseBtnPressed: { backgroundColor: AccessColors.cardHover },
  phraseBtnFocused: {
    ...Platform.select({
      web: { outlineWidth: 3, outlineColor: AccessColors.focusRing, outlineStyle: 'solid', outlineOffset: 2 },
      default: {},
    }),
  } as any,
  phraseBtnLabel: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },
});


