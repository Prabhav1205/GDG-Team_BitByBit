/**
 * ModeCard — a single communication mode selection option.
 *
 * Designed to feel like a physical control on a public kiosk:
 *   — Large rectangular hit area with scale spring animation
 *   — Color-coded icon container per mode
 *   — Vivid selected state with teal glow shadow
 *   — Animated checkmark ring on selection
 *   — Fully keyboard-accessible with visible focus ring
 *
 * States:
 *   default  — white background, subtle shadow
 *   hover    — lifted shadow + scale 1.02
 *   focus    — high-visibility focus ring (WCAG AA+)
 *   selected — teal border + tinted background + glow shadow
 *   pressed  — scale 0.97
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { KioskIcon, type IconName } from './KioskIcon';
import { AccessColors, AccessSpacing, AccessShadow, AccessAnimation } from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ModeCardProps {
  /** The icon to render. */
  iconName: IconName;
  /** Short mode name — displayed prominently. */
  title: string;
  /** One-sentence description of this mode. */
  description: string;
  /** Whether this card is currently selected. */
  selected: boolean;
  /** Called when the card is pressed. */
  onSelect: () => void;
  /** Unique test/accessibility ID. */
  testID?: string;
  /** Keyboard shortcut number (1-4) */
  shortcutNumber?: number;
  /** Whether to use the narrow mobile horizontal layout */
  isNarrow?: boolean;
}

// ── Accent colour map ──────────────────────────────────────────────────────

const MODE_ACCENTS: Record<string, { accent: string; light: string; border: string; gradient: [string, string] }> = {
  sign:            { accent: AccessColors.signAccent,    light: AccessColors.signAccentLight,    border: AccessColors.signAccent + '50', gradient: [AccessColors.signAccent, '#6D28D9'] },
  voice:           { accent: AccessColors.voiceAccent,   light: AccessColors.voiceAccentLight,   border: AccessColors.voiceAccent + '50', gradient: [AccessColors.voiceAccent, '#0369A1'] },
  text:            { accent: AccessColors.textAccent,    light: AccessColors.textAccentLight,    border: AccessColors.textAccent + '50', gradient: [AccessColors.textAccent, '#B45309'] },
  'touch':         { accent: AccessColors.touchAccent,   light: AccessColors.touchAccentLight,   border: AccessColors.touchAccent + '50', gradient: [AccessColors.touchAccent, '#BE185D'] },
};

function getAccent(iconName: string) {
  return MODE_ACCENTS[iconName] ?? { accent: AccessColors.teal, light: AccessColors.tealFaint, border: AccessColors.teal + '50', gradient: [AccessColors.teal, AccessColors.tealDark] };
}

// ── Component ──────────────────────────────────────────────────────────────

export function ModeCard({
  iconName,
  title,
  description,
  selected,
  onSelect,
  testID,
  shortcutNumber,
  isNarrow = false,
}: ModeCardProps) {
  const styles = useStyles();
  const { AccessColors } = useAccessTheme();
  const [hovered, setHovered] = useState(false);
  const [scaleAnim] = useState(() => new Animated.Value(1));
  const [checkAnim] = useState(() => new Animated.Value(selected ? 1 : 0));
  const [iconAnim] = useState(() => new Animated.Value(1));

  const accent = getAccent(iconName);

  // Scale spring on hover/press
  function animateTo(toValue: number, duration = AccessAnimation.fast) {
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  }

  // Animate checkmark in/out when selection changes
  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();

    if (selected) {
      Animated.sequence([
        Animated.spring(iconAnim, { toValue: 1.15, useNativeDriver: true, speed: 20 }),
        Animated.spring(iconAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
      ]).start();
    }
  }, [selected, checkAnim, iconAnim]);

  const textColor = selected ? '#FFFFFF' : AccessColors.textPrimary;
  const descColor = selected ? 'rgba(255,255,255,0.9)' : AccessColors.textSecondary;

  return (
    <Animated.View style={[styles.wrapper, isNarrow && styles.wrapperNarrow, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') {
            Haptics.selectionAsync().catch(() => {});
          }
          onSelect();
        }}
        onHoverIn={() => { setHovered(true); animateTo(1.025); }}
        onHoverOut={() => { setHovered(false); animateTo(1); }}
        onPressIn={() => {
          if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          }
          animateTo(0.97);
        }}
        onPressOut={() => animateTo(hovered ? 1.025 : 1)}
        style={({ focused }: any) => [
          styles.card,
          isNarrow && styles.cardNarrow,
          hovered && !selected && styles.cardHover,
          selected && styles.cardSelected,
          selected && (AccessShadow.teal as any),
          !selected && !hovered && (AccessShadow.md as any),
          hovered && !selected && (AccessShadow.lg as any),
          focused && styles.cardFocused,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Option ${shortcutNumber ?? ''}: ${title}, ${description}`}
        accessibilityState={{ selected }}
        accessibilityHint={`Press key ${shortcutNumber ?? ''} or tap to select ${title}`}
        testID={testID}
      >
        {selected ? (
          <LinearGradient
            colors={accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={accent.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: isNarrow ? 0 : 1, y: isNarrow ? 1 : 0 }}
            style={[styles.accentBar, isNarrow && styles.accentBarNarrow]}
          />
        )}

        <View style={[styles.contentBlock, isNarrow && styles.contentBlockNarrow]}>
          {/* Icon container */}
          <Animated.View
            style={[
              styles.iconContainer,
              isNarrow && styles.iconContainerNarrow,
              selected
                ? { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }
                : { backgroundColor: accent.light, borderColor: accent.border },
              { transform: [{ scale: iconAnim }] }
            ]}
            aria-hidden
          >
            <KioskIcon name={iconName} size={isNarrow ? 20 : 34} color={selected ? '#FFFFFF' : accent.accent} />
          </Animated.View>

          {/* Text content */}
          <View style={styles.textBlock}>
            <View style={styles.titleRow}>
              <Text
                style={[
                  styles.title,
                  isNarrow && styles.titleNarrow,
                  { color: textColor },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {Boolean(shortcutNumber) && !isNarrow && (
                <View style={[styles.shortcutBadge, selected && { backgroundColor: 'rgba(255,255,255,0.3)' }]} aria-hidden>
                  <Text style={styles.shortcutText}>{shortcutNumber}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.description, isNarrow && styles.descriptionNarrow, { color: descColor }]} numberOfLines={2}>
              {description}
            </Text>
          </View>
        </View>

        {/* Animated checkmark badge (top-right corner) */}
        <Animated.View
          style={[
            styles.checkBadge,
            {
              transform: [{ scale: checkAnim }],
              opacity: checkAnim,
              backgroundColor: '#FFFFFF',
            },
          ]}
          aria-hidden
        >
          <KioskIcon name="check" size={12} color={accent.accent} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow, isDarkMode } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  wrapperNarrow: {
    width: '100%',
    flex: undefined,
  },

  // ── Card base ─────────────────────────────────────────────────────────────
  card: {
    flex: 1,
    minHeight: 172,
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
    borderRadius: AccessRadius.xl,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    // Ensure keyboard focus is visible
    outlineStyle: Platform.select({ web: 'none' as any, default: undefined }),
  },
  cardNarrow: {
    minHeight: 104,
    justifyContent: 'center',
  },

  // ── States ────────────────────────────────────────────────────────────────
  cardHover: {
    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF',
    transform: Platform.OS === 'web' ? [{ translateY: -2 }] : [],
  },
  cardSelected: {
    borderWidth: 0,
  },
  // Web-specific focus ring — high visibility per WCAG 2.4.11
  cardFocused: {
    ...Platform.select({
      web: {
        outlineWidth: 3,
        outlineColor: AccessColors.focusRing,
        outlineStyle: 'solid',
        outlineOffset: 2,
      },
      default: {},
    }),
  },

  // ── Accent top bar ────────────────────────────────────────────────────────
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  accentBarNarrow: {
    top: 0,
    bottom: 0,
    left: 0,
    right: undefined,
    width: 6,
    height: '100%',
  },

  contentBlock: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  contentBlockNarrow: {
    padding: AccessSpacing.md,
    gap: AccessSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: AccessRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  iconContainerNarrow: {
    width: 44,
    height: 44,
    borderRadius: AccessRadius.sm,
  },

  // ── Text ──────────────────────────────────────────────────────────────────
  textBlock: {
    gap: AccessSpacing.xs,
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AccessSpacing.xs,
  },
  shortcutBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: AccessRadius.sm,
    backgroundColor: isDarkMode ? 'rgba(56, 189, 248, 0.15)' : 'rgba(27, 45, 79, 0.15)',
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(56, 189, 248, 0.3)' : AccessColors.navy + '60',
  },
  shortcutText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
  },
  title: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.bold,
    lineHeight: 30,
  },
  titleNarrow: {
    fontSize: AccessFontSize.base,
    lineHeight: 24,
  },
  description: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    lineHeight: 22,
  },
  descriptionNarrow: {
    fontSize: AccessFontSize.sm,
    lineHeight: 22,
  },

  // ── Animated check badge ──────────────────────────────────────────────────
  checkBadge: {
    position: 'absolute',
    top: AccessSpacing.md,
    right: AccessSpacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...AccessShadow.sm,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow, isDarkMode]);
}
