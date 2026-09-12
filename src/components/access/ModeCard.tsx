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

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native';

import { KioskIcon, type IconName } from './KioskIcon';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
  AccessShadow,
  AccessAnimation,
} from '@/constants/access-theme';

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
}

// ── Accent colour map ──────────────────────────────────────────────────────

const MODE_ACCENTS: Record<string, { accent: string; light: string; border: string }> = {
  sign:            { accent: AccessColors.signAccent,    light: AccessColors.signAccentLight,    border: AccessColors.signAccent + '50' },
  voice:           { accent: AccessColors.voiceAccent,   light: AccessColors.voiceAccentLight,   border: AccessColors.voiceAccent + '50' },
  text:            { accent: AccessColors.textAccent,    light: AccessColors.textAccentLight,    border: AccessColors.textAccent + '50' },
  'touch':         { accent: AccessColors.touchAccent,   light: AccessColors.touchAccentLight,   border: AccessColors.touchAccent + '50' },
};

function getAccent(iconName: string) {
  return MODE_ACCENTS[iconName] ?? { accent: AccessColors.teal, light: AccessColors.tealFaint, border: AccessColors.teal + '50' };
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
}: ModeCardProps) {
  const [hovered, setHovered] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;

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
  }, [selected, checkAnim]);

  const iconColor = selected ? accent.accent : AccessColors.navy;

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        onPress={onSelect}
        onHoverIn={() => { setHovered(true); animateTo(1.025); }}
        onHoverOut={() => { setHovered(false); animateTo(1); }}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(hovered ? 1.025 : 1)}
        style={({ focused }: any) => [
          styles.card,
          hovered && !selected && styles.cardHover,
          selected && styles.cardSelected,
          selected && (AccessShadow.teal as any),
          !selected && !hovered && (AccessShadow.sm as any),
          hovered && !selected && (AccessShadow.md as any),
          focused && styles.cardFocused,
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Option ${shortcutNumber ?? ''}: ${title}, ${description}`}
        accessibilityState={{ selected }}
        accessibilityHint={`Press key ${shortcutNumber ?? ''} or tap to select ${title}`}
        testID={testID}
      >
        {/* Coloured top accent bar */}
        <View style={[styles.accentBar, { backgroundColor: accent.accent }]} />

        {/* Icon container */}
        <View
          style={[
            styles.iconContainer,
            selected
              ? [styles.iconContainerSelected, { backgroundColor: accent.light, borderColor: accent.border }]
              : styles.iconContainerDefault,
          ]}
          aria-hidden
        >
          <KioskIcon name={iconName} size={34} color={iconColor} />
        </View>

        {/* Text content */}
        <View style={styles.textBlock}>
          <View style={styles.titleRow}>
            <Text
              style={[
                styles.title,
                selected && [styles.titleSelected, { color: accent.accent }],
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {Boolean(shortcutNumber) && (
              <View style={styles.shortcutBadge} aria-hidden>
                <Text style={styles.shortcutText}>{shortcutNumber}</Text>
              </View>
            )}
          </View>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        </View>

        {/* Animated checkmark badge (top-right corner) */}
        <Animated.View
          style={[
            styles.checkBadge,
            {
              transform: [{ scale: checkAnim }],
              opacity: checkAnim,
              backgroundColor: accent.accent,
            },
          ]}
          aria-hidden
        >
          <KioskIcon name="check" size={10} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },

  // ── Card base ─────────────────────────────────────────────────────────────
  card: {
    flex: 1,
    minHeight: 172,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
    position: 'relative',
    overflow: 'hidden',
    // Ensure keyboard focus is visible
    outlineStyle: Platform.select({ web: 'none' as any, default: undefined }),
  },

  // ── States ────────────────────────────────────────────────────────────────
  cardHover: {
    borderColor: AccessColors.borderHover,
    backgroundColor: AccessColors.cardHover,
  },
  cardSelected: {
    borderColor: AccessColors.tealBorder,
    borderWidth: 2,
    backgroundColor: AccessColors.cardSelected,
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
    height: 3,
    borderTopLeftRadius: AccessRadius.md,
    borderTopRightRadius: AccessRadius.md,
    opacity: 0.85,
  },

  // ── Icon ──────────────────────────────────────────────────────────────────
  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: AccessRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  iconContainerDefault: {
    backgroundColor: AccessColors.background,
    borderColor: AccessColors.borderLight,
  },
  iconContainerSelected: {
    // backgroundColor and borderColor set inline
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
    backgroundColor: AccessColors.navy,
  },
  shortcutText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: '#FFFFFF',
  },
  title: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    lineHeight: 30,
  },
  titleSelected: {
    // color set inline via accent
  },
  description: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 22,
  },

  // ── Animated check badge ──────────────────────────────────────────────────
  checkBadge: {
    position: 'absolute',
    top: AccessSpacing.md,
    right: AccessSpacing.md,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
