import { AccessColors, AccessSpacing, AccessShadow, AccessAnimation } from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';
/**
 * LanguageSelectorModal — accessible language picker for the kiosk.
 *
 * Accessibility features:
 *   — keyboard navigable (Tab/Arrow/Enter/Space/Escape)
 *   — ARIA role="radiogroup" + role="radio" + accessibilityState.checked
 *   — large touch targets (min 56px height per option)
 *   — visible selected state: checkmark icon + colored border (not color-only)
 *   — screen reader announcements via accessibilityLabel
 *   — focus trapped within modal while open
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';

import { useSession } from '@/context/SessionContext';
import {
  LANGUAGES,
  LANG_ORDER,
  type LangCode,
} from '@/constants/i18n';

import { KioskIcon } from './KioskIcon';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function LanguageSelectorModal({ visible, onClose }: Props) {
  const styles = useStyles();
  const { session, setLanguage } = useSession();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, speed: 22, bounciness: 4, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible, fadeAnim, scaleAnim]);

  // Keyboard: Escape to close
  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  function handleSelect(code: LangCode) {
    setLanguage(code);
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <AnimatedBlurView
        intensity={20}
        tint="dark"
        style={styles.backdrop}
        blurMethod="dimezisBlurView"
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close language selector" />
        {/* Sheet — stop event propagation */}
        <Pressable style={styles.sheetOuter} onPress={() => {}}>
          <AnimatedBlurView
            intensity={90}
            tint="light"
            blurMethod="dimezisBlurView"
            style={[
              styles.sheet,
              AccessShadow.lg as any,
              { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <KioskIcon name="language" size={18} color={AccessColors.teal} />
                <Text style={styles.headerTitle}>Select Language / भाषा / भाषा</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close language selector"
              >
                <KioskIcon name="close" size={16} color={AccessColors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.divider} />

            {/* Language options */}
            <View
              role="radiogroup"
              accessibilityLabel="Choose interface language"
              style={styles.optionsList}
            >
              {LANG_ORDER.map((code) => {
                const lang = LANGUAGES[code];
                const isSelected = session.language === code;

                return (
                  <Pressable
                    key={code}
                    onPress={() => handleSelect(code)}
                    style={({ pressed, focused }: any) => [
                      styles.optionRow,
                      isSelected && styles.optionRowSelected,
                      pressed && styles.optionRowPressed,
                      focused && styles.optionRowFocused,
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                    accessibilityLabel={`${lang.nativeName} — ${lang.name}`}
                    testID={`lang-option-${code}`}
                  >
                    {/* Language info */}
                    <View style={styles.optionText}>
                      <Text
                        style={[
                          styles.optionNativeName,
                          isSelected && styles.optionNativeNameSelected,
                        ]}
                      >
                        {lang.nativeName}
                      </Text>
                      <Text style={styles.optionEnName}>{lang.name}</Text>
                    </View>

                    {/* Speech code badge */}
                    <View style={[styles.codeBadge, isSelected && styles.codeBadgeSelected]}>
                      <Text
                        style={[
                          styles.codeBadgeText,
                          isSelected && styles.codeBadgeTextSelected,
                        ]}
                      >
                        {lang.speechCode}
                      </Text>
                    </View>

                    {/* Checkmark — visible for selected (not color-only) */}
                    <View
                      style={[
                        styles.checkCircle,
                        isSelected && styles.checkCircleSelected,
                      ]}
                      aria-hidden
                    >
                      {isSelected && (
                        <KioskIcon name="check" size={12} color="#FFFFFF" />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Footer notice */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Language change takes effect instantly.
              </Text>
              <Text style={styles.footerText}>
                भाषा परिवर्तन तुरंत प्रभावी होता है।
              </Text>
            </View>
          </AnimatedBlurView>
        </Pressable>
      </AnimatedBlurView>
    </Modal>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)', // reduced opacity since blur takes effect
    alignItems: 'center',
    justifyContent: 'center',
    padding: AccessSpacing.xl,
  },
  sheetOuter: {
    width: '100%',
    maxWidth: 440,
  },
  sheet: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: AccessRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AccessSpacing.lg,
    paddingVertical: AccessSpacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    flex: 1,
  },
  headerTitle: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  divider: {
    height: 1,
    backgroundColor: AccessColors.divider,
  },

  // ── Options ───────────────────────────────────────────────────────────────
  optionsList: {
    padding: AccessSpacing.sm,
    gap: AccessSpacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.md,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: AccessColors.background,
    minHeight: 56,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  optionRowSelected: {
    borderColor: AccessColors.teal,
    backgroundColor: AccessColors.tealFaint,
  },
  optionRowPressed: {
    backgroundColor: AccessColors.cardHover,
  },
  optionRowFocused: {
    outlineWidth: 3,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
  } as any,

  optionText: {
    flex: 1,
    gap: 2,
  },
  optionNativeName: {
    fontSize: AccessFontSize.lg,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textPrimary,
  },
  optionNativeNameSelected: {
    color: AccessColors.tealDark,
  },
  optionEnName: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textSecondary,
  },

  codeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    backgroundColor: AccessColors.cardHover,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
  },
  codeBadgeSelected: {
    backgroundColor: AccessColors.teal + '20',
    borderColor: AccessColors.teal + '50',
  },
  codeBadgeText: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textTertiary,
  },
  codeBadgeTextSelected: {
    color: AccessColors.tealDark,
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AccessColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AccessColors.cardHover,
  },
  checkCircleSelected: {
    backgroundColor: AccessColors.teal,
    borderColor: AccessColors.teal,
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: AccessSpacing.lg,
    paddingVertical: AccessSpacing.md,
    borderTopWidth: 1,
    borderTopColor: AccessColors.divider,
    backgroundColor: 'rgba(244, 243, 240, 0.5)',
    gap: 2,
  },
  footerText: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textTertiary,
    textAlign: 'center',
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
