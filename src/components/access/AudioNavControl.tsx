/**
 * AudioNavControl — Toggle control & ARIA Live region for Audio-First Navigation.
 *
 * Provides:
 *   1. Web Speech TTS + Voice Command control (Audio-first mode).
 *   2. Accessible ARIA live region fallback layer for screen readers.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useAudioNav } from '@/context/AudioNavContext';
import { KioskIcon } from './KioskIcon';
import { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';

export function AudioNavControl({ isNarrow, insets }: { isNarrow?: boolean, insets?: any }) {
  const styles = useStyles();
  const {
    isAudioNavEnabled,
    toggleAudioNav,
    isListening,
    startCommandListening,
    stopCommandListening,
    ariaLiveMessage,
    ariaLiveAssertive,
    lastTranscript,
  } = useAudioNav();

  if (isNarrow) {
    // Mobile Floating Action Button (FAB)
    return (
      <View style={styles.fabContainer}>
        {Boolean(ariaLiveMessage) && (
          <View aria-live={ariaLiveAssertive ? 'assertive' : 'polite'} aria-atomic="true" role="status" style={styles.srOnly}>
            <Text>{ariaLiveMessage}</Text>
          </View>
        )}
        
        {isListening && Boolean(lastTranscript) && (
          <View style={[styles.transcriptBadge, styles.transcriptBadgeFab]}>
            <Text style={styles.transcriptText} numberOfLines={2}>
              {`"${lastTranscript}"`}
            </Text>
          </View>
        )}

        <Pressable
          onPress={isListening ? stopCommandListening : startCommandListening}
          style={({ pressed, focused }: any) => [
            styles.fab,
            isListening && styles.fabListening,
            pressed && styles.pressed,
            focused && styles.focused,
            { bottom: Math.max(80, (insets?.bottom || 0) + 70), right: Math.max(24, (insets?.right || 0) + 16) }
          ]}
          accessibilityRole="button"
          accessibilityLabel={isListening ? 'Voice listening active. Press to stop continuous voice commands.' : 'Press to speak voice commands like Sign, Voice, Text, or Help.'}
          testID="voice-command-toggle"
        >
          <View style={[styles.micDot, isListening && styles.micDotListening, { position: 'absolute', top: 12, right: 12 }]} />
          <KioskIcon name="voice" size={24} color={isListening ? '#E53935' : '#FFFFFF'} />
        </Pressable>
      </View>
    );
  }

  // Desktop inline control
  return (
    <View style={styles.container}>
      {/* Hidden ARIA Live region for screen-reader fallback */}
      {Boolean(ariaLiveMessage) && (
        <View
          aria-live={ariaLiveAssertive ? 'assertive' : 'polite'}
          aria-atomic="true"
          role="status"
          style={styles.srOnly}
        >
          <Text>{ariaLiveMessage}</Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        {/* Toggle Audio Navigation */}
        <Pressable
          onPress={toggleAudioNav}
          style={({ pressed, focused }: any) => [
            styles.toggleBtn,
            isAudioNavEnabled && styles.toggleBtnActive,
            pressed && styles.pressed,
            focused && styles.focused,
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Audio Navigation: ${isAudioNavEnabled ? 'On' : 'Off'}. Press to toggle speech guidance.`}
          accessibilityState={{ checked: isAudioNavEnabled }}
          testID="audio-nav-toggle"
        >
          <KioskIcon
            name="voice"
            size={16}
            color={isAudioNavEnabled ? AccessColors.navy : AccessColors.textOnDarkMuted}
          />
          <Text
            style={[
              styles.toggleLabel,
              isAudioNavEnabled && styles.toggleLabelActive,
            ]}
          >
            {isAudioNavEnabled ? 'Audio Nav ON' : 'Audio Nav'}
          </Text>
        </Pressable>

        {/* Toggle Voice Command Listening (when Audio Nav is enabled) */}
        {isAudioNavEnabled && (
          <Pressable
            onPress={isListening ? stopCommandListening : startCommandListening}
            style={({ pressed, focused }: any) => [
              styles.micBtn,
              isListening && styles.micBtnListening,
              pressed && styles.pressed,
              focused && styles.focused,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isListening
                ? 'Voice listening active. Press to stop continuous voice commands.'
                : 'Press to speak voice commands like Sign, Voice, Text, or Help.'
            }
            testID="voice-command-toggle"
          >
            <View style={[styles.micDot, isListening && styles.micDotListening]} />
            <Text style={styles.micLabel}>
              {isListening ? 'Listening...' : 'Voice Commands'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Voice command transcript preview */}
      {isListening && Boolean(lastTranscript) && (
        <View style={styles.transcriptBadge}>
          <Text style={styles.transcriptText} numberOfLines={1}>
            {`"${lastTranscript}"`}
          </Text>
        </View>
      )}
    </View>
  );
}

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: AccessSpacing.sm,
    },
    srOnly: {
      position: 'absolute',
      width: 1,
      height: 1,
      overflow: 'hidden',
      opacity: 0,
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: AccessSpacing.xs,
    },
    toggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: AccessSpacing.xs,
      paddingHorizontal: AccessSpacing.sm + 2,
      borderRadius: AccessRadius.sm,
      borderWidth: 1,
      borderColor: AccessColors.headerBorder,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    toggleBtnActive: {
      backgroundColor: AccessColors.tealBorder,
      borderColor: AccessColors.teal,
    },
    toggleLabel: {
      fontSize: AccessFontSize.xs,
      fontWeight: AccessFontWeight.medium,
      color: AccessColors.textOnDarkMuted,
    },
    toggleLabelActive: {
      color: AccessColors.navy,
      fontWeight: AccessFontWeight.bold,
    },
    micBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: AccessSpacing.xs,
      paddingHorizontal: AccessSpacing.sm,
      borderRadius: AccessRadius.sm,
      borderWidth: 1,
      borderColor: AccessColors.headerBorder,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    micBtnListening: {
      backgroundColor: '#FFEBEE',
      borderColor: '#E53935',
    },
    micDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: AccessColors.textOnDarkMuted,
    },
    micDotListening: {
      backgroundColor: '#E53935',
    },
    micLabel: {
      fontSize: AccessFontSize.xs,
      fontWeight: AccessFontWeight.medium,
      color: AccessColors.textOnDark,
    },
    transcriptBadge: {
      backgroundColor: 'rgba(0,0,0,0.3)',
      paddingHorizontal: AccessSpacing.sm,
      paddingVertical: 2,
      borderRadius: 4,
    },
    transcriptText: {
      fontSize: AccessFontSize.xs,
      color: AccessColors.textOnDarkMuted,
      fontStyle: 'italic',
    },
    pressed: {
      opacity: 0.75,
    },
    focused: {
      outlineWidth: 2,
      outlineColor: AccessColors.focusRing,
      outlineStyle: 'solid',
    } as any,
    fabContainer: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      zIndex: 9999,
    },
    fab: {
      position: 'absolute',
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: AccessColors.navy,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#1B2D4F',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    fabListening: {
      backgroundColor: '#FFEBEE',
      shadowColor: '#E53935',
    },
    transcriptBadgeFab: {
      position: 'absolute',
      bottom: 150,
      right: 24,
      maxWidth: 250,
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: AccessSpacing.md,
      borderRadius: AccessRadius.md,
    },
  }), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
