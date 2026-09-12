/**
 * AccessHeader — institutional kiosk header.
 *
 * Mobile-responsive:
 *   — narrow (<600): compact single-line with hidden descriptor
 *   — wide (≥600): full wordmark with descriptor + status pill
 */

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
} from '@/constants/access-theme';
import { AudioNavControl } from './AudioNavControl';
import { KioskIcon } from './KioskIcon';

// ── Component ──────────────────────────────────────────────────────────────────

export function AccessHeader() {
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.7)).current;
  const [settingsHovered, setSettingsHovered] = useState(false);

  // Pulsing status dot animation
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: AccessAnimation.pulse / 2,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: AccessAnimation.pulse / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, pulseOpacity]);

  return (
    <LinearGradient
      colors={[AccessColors.headerGradientStart, AccessColors.headerGradientEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.container}
    >
      <View
        style={[styles.inner, isNarrow && styles.innerNarrow]}
        role="banner"
        accessibilityLabel="ACCESS — Accessible Communication Service"
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
              ACCESS
            </Text>
            {/* Only show descriptor on wide screens */}
            {!isNarrow && (
              <Text style={styles.descriptor} numberOfLines={1}>
                Accessible Communication Service
              </Text>
            )}
          </View>
        </View>

        {/* ── RIGHT: Controls ─────────────────────────────────────── */}
        <View style={styles.right}>
          {/* Hide AudioNavControl on very narrow screens to save space */}
          {!isNarrow && <AudioNavControl />}

          {/* Status dot — compact on mobile, pill on wide */}
          {isNarrow ? (
            <View style={styles.statusDotWrapper}>
              <Animated.View
                style={[
                  styles.statusRing,
                  { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                ]}
              />
              <View style={styles.statusDot} />
            </View>
          ) : (
            <View
              style={styles.statusPill}
              accessibilityLabel="Service status: available"
              accessibilityRole="text"
            >
              <View style={styles.statusDotWrapper}>
                <Animated.View
                  style={[
                    styles.statusRing,
                    { transform: [{ scale: pulseAnim }], opacity: pulseOpacity },
                  ]}
                />
                <View style={styles.statusDot} />
              </View>
              <Text style={styles.statusLabel}>Available</Text>
            </View>
          )}

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
              color={settingsHovered ? AccessColors.textOnDark : AccessColors.textOnDarkMuted}
            />
          </Pressable>
        </View>
      </View>

      {/* ── Bottom accent line ─────────────────────────────────────── */}
      <View style={styles.accentLine} />
    </LinearGradient>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: AccessColors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoLetter: {
    fontSize: 17,
    fontWeight: AccessFontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  wordmarkGroup: {
    gap: 1,
    minWidth: 0,
    flex: 1,
  },
  wordmark: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textOnDark,
    letterSpacing: Platform.select({ web: 2.5, default: 2 }),
  },
  descriptor: {
    fontSize: 11,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textOnDarkMuted,
    letterSpacing: 0.1,
  },
  wordmarkDivider: {
    width: 1,
    height: 22,
    backgroundColor: AccessColors.headerBorder,
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
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
    color: AccessColors.textOnDarkMuted,
  },
  settingsBtn: {
    width: 36,
    height: 36,
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
    height: 2,
    backgroundColor: AccessColors.teal,
    opacity: 0.6,
  },
});
