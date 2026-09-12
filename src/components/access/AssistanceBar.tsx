import { AccessColors, AccessSpacing, AccessShadow, AccessAnimation, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius } from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { KioskIcon } from './KioskIcon';
import { LanguageSelectorModal } from './LanguageSelectorModal';
import { useSession } from '@/context/SessionContext';
import { LANGUAGES, UI_STRINGS } from '@/constants/i18n';

// ── Component ──────────────────────────────────────────────────────────────

export function AssistanceBar() {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNarrow = width < 600;
  const { session } = useSession();
  const currentLang = LANGUAGES[session.language] ?? LANGUAGES.en;
  const ui = UI_STRINGS[session.language] ?? UI_STRINGS.en;

  const [staffRequested, setStaffRequested] = useState(false);
  const [staffHovered, setStaffHovered] = useState(false);
  const [benefitsHovered, setBenefitsHovered] = useState(false);
  const [staffScaleAnim] = useState(() => new Animated.Value(1));
  const [langModalVisible, setLangModalVisible] = useState(false);

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
    <BlurView intensity={80} tint="light" style={styles.container} blurMethod="dimezisBlurView">
      <LanguageSelectorModal
        visible={langModalVisible}
        onClose={() => setLangModalVisible(false)}
      />
      <View style={styles.divider} />

      {isNarrow ? (
        /* ── NARROW / MOBILE layout ──────────────────────────────── */
        <View style={[styles.narrowInner, { paddingLeft: Math.max(AccessSpacing.md, insets.left), paddingRight: Math.max(AccessSpacing.md, insets.right), paddingBottom: Math.max(AccessSpacing.sm, insets.bottom) }]}>
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
                    ? ui.staffNotified
                    : ui.requestStaff
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
                  {staffRequested ? ui.staffNotified : ui.requestStaff}
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
                <Text style={styles.benefitsBtnLabel} numberOfLines={1}>{ui.benefitSchemes}</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Row 2: Language + Privacy */}
          <View style={styles.narrowBottomRow}>
            <Text style={styles.privacyNotice}>{ui.sessionPrivate}</Text>
            <Pressable
              style={styles.languageBtn}
              onPress={() => setLangModalVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`Language: ${currentLang.name}. Tap to change.`}
              testID="language-selector"
            >
              <KioskIcon name="language" size={12} color={AccessColors.textTertiary} />
              <Text style={styles.languageBtnLabel}>{currentLang.nativeName}</Text>
              <Text style={styles.languageCaret}>›</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        /* ── WIDE / DESKTOP layout ───────────────────────────────── */
        <View style={[styles.inner, { paddingLeft: Math.max(AccessSpacing.xl, insets.left), paddingRight: Math.max(AccessSpacing.xl, insets.right), paddingBottom: Math.max(AccessSpacing.md, insets.bottom) }]}>
          {/* LEFT: Assistance & Eligibility */}
          <View style={styles.left}>
            <Text style={styles.assistanceLabel}>{ui.needHelp}</Text>

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
                    ? ui.staffNotified
                    : ui.requestStaff
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
                  {staffRequested ? ui.staffNotified : ui.requestStaff}
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
                <Text style={styles.benefitsBtnLabel}>{ui.benefitSchemes}</Text>
                <Text style={styles.benefitsArrow}>↗</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* RIGHT: Language + Privacy */}
          <View style={styles.right}>
            <View style={styles.languageRow}>
              <KioskIcon name="language" size={14} color={AccessColors.textTertiary} />
              <Text style={styles.languagePrefix}>{ui.languageLabel}</Text>
              <Pressable
                style={({ focused }: any) => [styles.languageBtn, focused && styles.languageBtnFocused]}
                onPress={() => setLangModalVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={`Language: ${currentLang.name}. Tap to change.`}
                testID="language-selector"
              >
                <Text style={styles.languageBtnLabel}>{currentLang.nativeName}</Text>
                <Text style={styles.languageCaret}>›</Text>
              </Pressable>
            </View>
            <Text style={styles.privacyNotice}>{ui.sessionPrivate}</Text>
          </View>
        </View>
      )}
    </BlurView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  container: {
    backgroundColor: 'rgba(244, 243, 240, 0.75)', // AccessColors.background but transparent
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
    fontFamily: AccessFontFamily.medium,
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
    fontFamily: AccessFontFamily.semibold,
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
    fontFamily: AccessFontFamily.semibold,
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
    fontFamily: AccessFontFamily.regular,
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
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textPrimary,
  },
  languageCaret: {
    fontSize: 12,
    color: AccessColors.textSecondary,
  },
  privacyNotice: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textTertiary,
    textAlign: 'right',
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
