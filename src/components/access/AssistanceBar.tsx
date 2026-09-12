/**
 * AssistanceBar — footer utility area for the accessibility kiosk.
 *
 * Mobile-responsive layout:
 *   — narrow (<600): stacked compact row (label + buttons), language on same line
 *   — wide (≥600): full horizontal layout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import {
  AccessColors,
  AccessSpacing,
  AccessFontSize,
  AccessFontWeight,
  AccessRadius,
  AccessShadow,
} from '@/constants/access-theme';
import { KioskIcon } from './KioskIcon';

// ── Component ──────────────────────────────────────────────────────────────

export function AssistanceBar() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;

  const [staffRequested, setStaffRequested] = useState(false);
  const [staffHovered, setStaffHovered] = useState(false);
  const [benefitsHovered, setBenefitsHovered] = useState(false);
  const [staffScaleAnim] = useState(() => new Animated.Value(1));

  function handleRequestStaff() {
    if (staffRequested) return;
    setStaffRequested(true);
    Animated.sequence([
      Animated.spring(staffScaleAnim, { toValue: 0.95, useNativeDriver: true, speed: 30, bounciness: 0 }),
      Animated.spring(staffScaleAnim, { toValue: 1.04, useNativeDriver: true, speed: 25, bounciness: 5 }),
      Animated.spring(staffScaleAnim, { toValue: 1,    useNativeDriver: true, speed: 25, bounciness: 3 }),
    ]).start();
    setTimeout(() => setStaffRequested(false), 8000);
  }

  return (
    <View style={styles.container} role="contentinfo">
      <View style={styles.divider} />

      {isNarrow ? (
        /* ── NARROW / MOBILE layout ──────────────────────────────── */
        <View style={styles.narrowInner}>
          {/* Row 1: Staff + Benefits buttons */}
          <View style={styles.narrowButtonRow}>
            <Animated.View style={[styles.narrowBtnFlex, { transform: [{ scale: staffScaleAnim }] }]}>
              <Pressable
                onPress={handleRequestStaff}
                style={({ pressed }: any) => [
                  styles.staffBtn,
                  styles.staffBtnFlex,
                  staffRequested && styles.staffBtnActive,
                  pressed && styles.staffBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  staffRequested
                    ? 'Staff assistance requested.'
                    : 'Request staff assistance'
                }
                accessibilityState={{ busy: staffRequested }}
                testID="request-staff"
              >
                <KioskIcon
                  name={staffRequested ? 'check' : 'person'}
                  size={13}
                  color={staffRequested ? AccessColors.statusGreen : '#FFFFFF'}
                />
                <Text
                  style={[styles.staffBtnLabel, staffRequested && styles.staffBtnLabelActive]}
                  numberOfLines={1}
                >
                  {staffRequested ? 'Staff notified' : 'Request Staff'}
                </Text>
              </Pressable>
            </Animated.View>

            <Pressable
              onPress={() => router.push('/eligibility' as any)}
              style={({ pressed }: any) => [styles.benefitsWrapper, styles.narrowBtnFlex, pressed && { opacity: 0.85 }]}
              accessibilityRole="button"
              accessibilityLabel="Check Benefit Schemes"
              testID="eligibility-matcher-btn"
            >
              <LinearGradient
                colors={[AccessColors.teal, AccessColors.tealDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.benefitsBtn}
              >
                <KioskIcon name="benefits" size={13} color="#FFFFFF" />
                <Text style={styles.benefitsBtnLabel} numberOfLines={1}>Benefit Schemes</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Row 2: Language + Privacy */}
          <View style={styles.narrowBottomRow}>
            <Text style={styles.privacyNotice}>🔒 Session is private and auto-cleared.</Text>
            <Pressable
              style={styles.languageBtn}
              accessibilityRole="button"
              accessibilityLabel="Language: English. Tap to change."
              testID="language-selector"
            >
              <KioskIcon name="language" size={12} color={AccessColors.textTertiary} />
              <Text style={styles.languageBtnLabel}>English</Text>
              <Text style={styles.languageCaret}>›</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* ── WIDE / DESKTOP layout ───────────────────────────────── */
        <View style={styles.inner}>
          {/* LEFT: Assistance & Eligibility */}
          <View style={styles.left}>
            <Text style={styles.assistanceLabel}>Need help?</Text>

            <Animated.View style={{ transform: [{ scale: staffScaleAnim }] }}>
              <Pressable
                onPress={handleRequestStaff}
                onHoverIn={() => setStaffHovered(true)}
                onHoverOut={() => setStaffHovered(false)}
                style={({ pressed, focused }: any) => [
                  styles.staffBtn,
                  staffRequested ? styles.staffBtnActive : (staffHovered && styles.staffBtnHovered),
                  pressed && styles.staffBtnPressed,
                  focused && styles.staffBtnFocused,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  staffRequested
                    ? 'Staff assistance requested. A member of staff will be with you shortly.'
                    : 'Request staff assistance'
                }
                accessibilityState={{ busy: staffRequested }}
                testID="request-staff"
              >
                <KioskIcon
                  name={staffRequested ? 'check' : 'person'}
                  size={14}
                  color={staffRequested ? AccessColors.statusGreen : '#FFFFFF'}
                />
                <Text style={[styles.staffBtnLabel, staffRequested && styles.staffBtnLabelActive]}>
                  {staffRequested ? 'Staff notified — please wait' : 'Request staff assistance'}
                </Text>
              </Pressable>
            </Animated.View>

            <Pressable
              onPress={() => router.push('/eligibility' as any)}
              onHoverIn={() => setBenefitsHovered(true)}
              onHoverOut={() => setBenefitsHovered(false)}
              style={({ pressed, focused }: any) => [
                styles.benefitsWrapper,
                pressed && { opacity: 0.85 },
                focused && styles.staffBtnFocused,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Check Eligibility and Benefit Schemes"
              testID="eligibility-matcher-btn"
            >
              <LinearGradient
                colors={[AccessColors.teal, AccessColors.tealDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.benefitsBtn, benefitsHovered && { opacity: 0.92 }]}
              >
                <KioskIcon name="benefits" size={14} color="#FFFFFF" />
                <Text style={styles.benefitsBtnLabel}>Benefit Schemes</Text>
                <Text style={styles.benefitsArrow}>↗</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* RIGHT: Language + Privacy */}
          <View style={styles.right}>
            <View style={styles.languageRow}>
              <KioskIcon name="language" size={14} color={AccessColors.textTertiary} />
              <Text style={styles.languagePrefix}>Language:</Text>
              <Pressable
                style={({ focused }: any) => [styles.languageBtn, focused && styles.languageBtnFocused]}
                accessibilityRole="button"
                accessibilityLabel="Language: English. Tap to change."
                testID="language-selector"
              >
                <Text style={styles.languageBtnLabel}>English</Text>
                <Text style={styles.languageCaret}>›</Text>
              </Pressable>
            </View>
            <Text style={styles.privacyNotice}>🔒 Your session is private and auto-cleared.</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    backgroundColor: AccessColors.background,
  },
  divider: {
    height: 1,
    backgroundColor: AccessColors.divider,
  },

  // ── Wide layout ───────────────────────────────────────────────────────────
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    gap: AccessSpacing.xl,
    minHeight: 72,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.md,
    flex: 1,
    flexWrap: 'wrap',
  },
  right: {
    alignItems: 'flex-end',
    gap: AccessSpacing.xs,
  },
  assistanceLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },

  // ── Narrow / mobile layout ────────────────────────────────────────────────
  narrowInner: {
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.sm,
    gap: AccessSpacing.xs,
  },
  narrowButtonRow: {
    flexDirection: 'row',
    gap: AccessSpacing.sm,
  },
  narrowBtnFlex: {
    flex: 1,
  },
  narrowBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },

  // ── Staff button ──────────────────────────────────────────────────────────
  staffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: AccessSpacing.sm + 1,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.navy,
    ...AccessShadow.sm,
  },
  staffBtnFlex: {
    // fills narrowBtnFlex container
  },
  staffBtnHovered: {
    backgroundColor: AccessColors.navyHover,
    ...AccessShadow.md,
  },
  staffBtnActive: {
    backgroundColor: AccessColors.statusGreenBg,
    borderWidth: 1.5,
    borderColor: AccessColors.statusGreen,
  },
  staffBtnPressed: { opacity: 0.85 },
  staffBtnFocused: {
    outlineWidth: 3,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as any,
  staffBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: '#FFFFFF',
  },
  staffBtnLabelActive: {
    color: AccessColors.statusGreen,
  },

  // ── Benefits button ───────────────────────────────────────────────────────
  benefitsWrapper: {
    borderRadius: AccessRadius.full,
    overflow: 'hidden',
    ...AccessShadow.sm,
  },
  benefitsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: AccessSpacing.sm + 1,
    paddingHorizontal: AccessSpacing.md,
  },
  benefitsBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: '#FFFFFF',
  },
  benefitsArrow: {
    fontSize: AccessFontSize.sm,
    color: 'rgba(255,255,255,0.8)',
  },

  // ── Language ──────────────────────────────────────────────────────────────
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
  },
  languagePrefix: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textTertiary,
  },
  languageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
  },
  languageBtnFocused: {
    outlineWidth: 2,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
  } as any,
  languageBtnLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  languageCaret: {
    fontSize: 12,
    color: AccessColors.textSecondary,
  },
  privacyNotice: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textTertiary,
    textAlign: 'right',
  },
});
