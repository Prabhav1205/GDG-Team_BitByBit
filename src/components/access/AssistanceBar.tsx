/**
 * AssistanceBar — footer utility area for the accessibility kiosk.
 *
 * Contents:
 *   LEFT  — "Need assistance?" label + "Request staff assistance" action
 *   RIGHT — Language selector + privacy notice
 *
 * This area is deliberately restrained — no unnecessary links,
 * no decorative content. Only functional utility information.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';

import {
  AccessColors,
  AccessSpacing,
  AccessFontSize,
  AccessFontWeight,
  AccessRadius,
} from '@/constants/access-theme';

// ── Component ─────────────────────────────────────────────────────────────

export function AssistanceBar() {
  const [staffRequested, setStaffRequested] = useState(false);

  function handleRequestStaff() {
    setStaffRequested(true);
    // In production, this would signal the desk system.
    // Reset after 8 seconds for demo purposes.
    setTimeout(() => setStaffRequested(false), 8000);
  }

  return (
    <View style={styles.container} accessibilityRole="contentinfo">
      {/* ── Top divider ─────────────────────────────────────────── */}
      <View style={styles.divider} />

      <View style={styles.inner}>
        {/* ── LEFT: Assistance ──────────────────────────────────── */}
        <View style={styles.left}>
          <Text style={styles.assistanceLabel}>Need assistance?</Text>
          <Pressable
            onPress={handleRequestStaff}
            style={({ pressed, focused }) => [
              styles.staffBtn,
              staffRequested && styles.staffBtnActive,
              pressed && styles.staffBtnPressed,
              focused && styles.staffBtnFocused,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              staffRequested
                ? 'Staff assistance requested. A member of staff will be with you shortly.'
                : 'Request staff assistance'
            }
            accessibilityState={{ pressed: staffRequested }}
            testID="request-staff"
          >
            <Text
              style={[
                styles.staffBtnLabel,
                staffRequested && styles.staffBtnLabelActive,
              ]}
            >
              {staffRequested
                ? 'Staff notified — please wait'
                : 'Request staff assistance'}
            </Text>
          </Pressable>
        </View>

        {/* ── RIGHT: Language + Privacy notice ─────────────────── */}
        <View style={styles.right}>
          <View style={styles.languageRow}>
            <Text style={styles.languagePrefix}>Language:</Text>
            <Pressable
              style={({ focused }) => [
                styles.languageBtn,
                focused && styles.languageBtnFocused,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Language: English. Tap to change."
              accessibilityHint="Opens language selection"
              testID="language-selector"
            >
              <Text style={styles.languageBtnLabel}>English</Text>
              <Text style={styles.languageCaret} aria-hidden>›</Text>
            </Pressable>
          </View>

          <Text style={styles.privacyNotice} accessibilityRole="text">
            Your session is private and will be cleared when you finish.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: AccessColors.background,
  },
  divider: {
    height: 1,
    backgroundColor: AccessColors.divider,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    gap: AccessSpacing.xl,
    minHeight: 80,
  },

  // ── Left ───────────────────────────────────────────────────────────────
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.lg,
    flex: 1,
  },
  assistanceLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  staffBtn: {
    paddingVertical: AccessSpacing.sm + 2,
    paddingHorizontal: AccessSpacing.lg,
    borderRadius: AccessRadius.sm,
    borderWidth: 1.5,
    borderColor: AccessColors.navy,
    backgroundColor: 'transparent',
  },
  staffBtnActive: {
    backgroundColor: AccessColors.statusGreenBg,
    borderColor: AccessColors.statusGreen,
  },
  staffBtnPressed: {
    opacity: 0.75,
  },
  staffBtnFocused: {
    outlineWidth: 3,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as any,
  staffBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },
  staffBtnLabelActive: {
    color: AccessColors.statusGreen,
  },

  // ── Right ──────────────────────────────────────────────────────────────
  right: {
    alignItems: 'flex-end',
    gap: AccessSpacing.xs,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  languagePrefix: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
  },
  languageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: AccessSpacing.sm,
    borderRadius: AccessRadius.sm,
  },
  languageBtnFocused: {
    outlineWidth: 2,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
  } as any,
  languageBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  languageCaret: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textSecondary,
    marginTop: -1,
  },
  privacyNotice: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textTertiary,
    textAlign: 'right',
  },
});
