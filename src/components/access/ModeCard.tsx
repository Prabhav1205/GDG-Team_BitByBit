/**
 * ModeCard — a single communication mode selection option.
 *
 * Designed to feel like a physical control on a public kiosk:
 *   — Large rectangular hit area
 *   — Clear icon, title, and description hierarchy
 *   — Restrained hover / selected states
 *   — Fully keyboard-accessible with visible focus ring
 *
 * States:
 *   default  — white background, subtle border
 *   hover    — slightly darker border
 *   focus    — high-visibility focus ring (WCAG AA+)
 *   selected — teal border + tinted background
 */

import React, { useState } from 'react';
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
} from '@/constants/access-theme';

// ── Types ─────────────────────────────────────────────────────────────────

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
}

// ── Component ─────────────────────────────────────────────────────────────

export function ModeCard({
  iconName,
  title,
  description,
  selected,
  onSelect,
  testID,
}: ModeCardProps) {
  const [hovered, setHovered] = useState(false);

  const iconColor = selected
    ? AccessColors.teal
    : AccessColors.navy;

  return (
    <Pressable
      onPress={onSelect}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={({ pressed, focused }) => [
        styles.card,
        hovered && !selected && styles.cardHover,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
        focused && styles.cardFocused,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${description}`}
      accessibilityState={{ selected }}
      accessibilityHint={`Tap to communicate using ${title}`}
      testID={testID}
    >
      {/* Icon container */}
      <View
        style={[
          styles.iconContainer,
          selected && styles.iconContainerSelected,
        ]}
        aria-hidden
      >
        <KioskIcon name={iconName} size={36} color={iconColor} />
      </View>

      {/* Text content */}
      <View style={styles.textBlock}>
        <Text
          style={[
            styles.title,
            selected && styles.titleSelected,
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>

      {/* Selected indicator */}
      {selected && (
        <View style={styles.selectedIndicator} aria-hidden>
          <View style={styles.selectedDot} />
        </View>
      )}
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Card base ──────────────────────────────────────────────────────────
  card: {
    flex: 1,
    minHeight: 172,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
    // Ensure keyboard focus is visible
    outlineStyle: Platform.select({ web: 'none', default: undefined }),
  },

  // ── States ─────────────────────────────────────────────────────────────
  cardHover: {
    borderColor: AccessColors.borderHover,
    backgroundColor: AccessColors.cardHover,
  },
  cardSelected: {
    borderColor: AccessColors.tealBorder,
    borderWidth: 2,
    backgroundColor: AccessColors.cardSelected,
  },
  cardPressed: {
    opacity: 0.88,
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

  // ── Icon ───────────────────────────────────────────────────────────────
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
  },
  iconContainerSelected: {
    backgroundColor: AccessColors.tealBorder + '14', // teal at 8% opacity
    borderColor: AccessColors.tealBorder + '30',
  },

  // ── Text ───────────────────────────────────────────────────────────────
  textBlock: {
    gap: AccessSpacing.xs,
    flex: 1,
  },
  title: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    lineHeight: 30,
  },
  titleSelected: {
    color: AccessColors.tealDark,
  },
  description: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 22,
  },

  // ── Selected indicator (top-right corner dot) ─────────────────────────
  selectedIndicator: {
    position: 'absolute',
    top: AccessSpacing.md,
    right: AccessSpacing.md,
  },
  selectedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AccessColors.teal,
  },
});
