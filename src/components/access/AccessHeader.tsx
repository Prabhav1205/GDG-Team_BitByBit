/**
 * AccessHeader — institutional kiosk header.
 *
 * Mobile-responsive:
 *   — narrow (<600): compact single-line with hidden descriptor
 *   — wide (≥600): full wordmark with descriptor + status pill
 */

import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import {
  AccessAnimation,
  AccessColors,
  AccessFontSize,
  AccessFontWeight,
  AccessSpacing,
  AccessShadow,
} from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { UI_STRINGS } from '@/constants/i18n';
import { useSession } from '@/context/SessionContext';
import { AudioNavControl } from './AudioNavControl';
import { ConnectivityStatus } from './ConnectivityStatus';
import { KioskIcon } from './KioskIcon';

// ── Component ──────────────────────────────────────────────────────────────────

export function AccessHeader() {
  const { session, updateAccessibility } = useSession();
  const ui = UI_STRINGS[session.language] ?? UI_STRINGS.en;
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;
  const insets = useSafeAreaInsets();
  const { isDarkMode, AccessColors } = useAccessTheme();
  const styles = useStyles();

  const [settingsHovered, setSettingsHovered] = useState(false);
  const [themeHovered, setThemeHovered] = useState(false);

  return (
    <BlurView
      intensity={85}
      tint={isDarkMode ? "dark" : "light"}
      style={styles.container}
      blurMethod="dimezisBlurView"
    >
      <View
        style={[
          styles.inner,
          isNarrow && styles.innerNarrow,
          { 
            paddingTop: Math.max(AccessSpacing.md, insets.top),
            paddingLeft: Math.max(isNarrow ? AccessSpacing.md : AccessSpacing.xl, insets.left), 
            paddingRight: Math.max(isNarrow ? AccessSpacing.md : AccessSpacing.xl, insets.right) 
          }
        ]}
        role="banner"
        accessibilityLabel="ABLELINK — Accessible Communication Service"
      >
        {/* ── LEFT: Logo + Wordmark ──────────────────────────────── */}
        <View style={styles.left}>
          <View style={styles.logoMark}>
            <Text style={styles.logoLetter}>A</Text>
          </View>
          <View style={styles.wordmarkDivider} />
          <View style={styles.wordmarkGroup}>
            <Text
              style={styles.wordmark}
              accessibilityRole="header"
              aria-level={1}
              numberOfLines={1}
            >
              ABLELINK
            </Text>
            {/* Only show descriptor on wide screens */}
            {!isNarrow && (
              <Text style={styles.descriptor} numberOfLines={1}>
                {ui.headerDescriptor}
              </Text>
            )}
          </View>
        </View>

        {/* ── RIGHT: Controls ─────────────────────────────────────── */}
        <View style={styles.right}>
          {/* AudioNavControl renders on both mobile (floating FAB) and desktop (inline) */}
          <AudioNavControl isNarrow={isNarrow} insets={insets} />

          {/* Connectivity Status (Online/Offline indicator) */}
          <ConnectivityStatus isNarrow={isNarrow} />

          {/* Theme toggle */}
          <Pressable
            onPress={() => updateAccessibility('darkMode', !session.accessibility.darkMode)}
            onHoverIn={() => setThemeHovered(true)}
            onHoverOut={() => setThemeHovered(false)}
            style={({ pressed }: any) => [
              styles.settingsBtn,
              themeHovered && styles.settingsBtnHovered,
              pressed && styles.settingsBtnPressed,
            ]}
            accessibilityLabel="Toggle Dark Mode"
            accessibilityRole="button"
          >
            <KioskIcon
              name="contrast"
              size={isNarrow ? 20 : 18}
              color={themeHovered ? AccessColors.navy : AccessColors.textSecondary}
            />
          </Pressable>

          {/* Settings button */}
          <Pressable
            onPress={() => router.push('/settings' as any)}
            onHoverIn={() => setSettingsHovered(true)}
            onHoverOut={() => setSettingsHovered(false)}
            style={({ pressed }: any) => [
              styles.settingsBtn,
              settingsHovered && styles.settingsBtnHovered,
              pressed && styles.settingsBtnPressed,
            ]}
            accessibilityLabel="Accessibility settings"
            accessibilityRole="button"
            accessibilityHint="Opens settings and accessibility configuration"
          >
            <KioskIcon
              name="settings"
              size={isNarrow ? 20 : 18}
              color={settingsHovered ? AccessColors.navy : AccessColors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      {/* ── Bottom accent line ─────────────────────────────────────── */}
      <View style={styles.accentLine} />
    </BlurView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontWeight, isDarkMode } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  container: {
    position: 'relative',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    minHeight: 68,
  },
  innerNarrow: {
    paddingHorizontal: AccessSpacing.md,
    minHeight: 56,
  },

  // ── Left ──────────────────────────────────────────────────────────────────
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: AccessSpacing.sm,
    minWidth: 0,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: AccessColors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    shadowColor: AccessColors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 4,
  },
  logoLetter: {
    fontSize: 18,
    fontWeight: AccessFontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  wordmarkGroup: {
    gap: 1,
    minWidth: 0,
    flex: 1,
  },
  wordmark: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.bold,
    color: isDarkMode ? '#FFFFFF' : AccessColors.navy,
    letterSpacing: Platform.select({ web: 3.0, default: 2.5 }),
  },
  descriptor: {
    fontSize: 11,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    letterSpacing: 0.2,
  },
  wordmarkDivider: {
    width: 1,
    height: 22,
    backgroundColor: AccessColors.borderLight,
    flexShrink: 0,
  },

  // ── Right ─────────────────────────────────────────────────────────────────
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    flexShrink: 0,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusDotWrapper: {
    width: 10,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRing: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AccessColors.statusGreenPulse,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AccessColors.statusGreen,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  settingsBtnHovered: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.20)',
  },
  settingsBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  // ── Bottom accent line ────────────────────────────────────────────────────
  accentLine: {
    height: 2.5,
    backgroundColor: AccessColors.teal,
    opacity: 0.85,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontWeight, isDarkMode]);
}
