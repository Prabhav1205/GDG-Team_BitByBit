/**
 * StatusBadge — coloured status pill for use in cards and dashboards.
 *
 * Variants:
 *   available   — green
 *   eligible    — blue
 *   active      — teal/green
 *   pending     — amber
 *   inactive    — gray
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { AccessColors } from '@/constants/access-theme';

// ── Types ─────────────────────────────────────────────────────────────────

export type StatusVariant =
  | 'available'
  | 'eligible'
  | 'active'
  | 'pending'
  | 'inactive';

interface StatusBadgeProps {
  label: string;
  variant?: StatusVariant;
}

// ── Variant styles ─────────────────────────────────────────────────────────

const VARIANT_COLORS: Record<
  StatusVariant,
  { bg: string; text: string; dot: string }
> = {
  available: { bg: AccessColors.alertSuccessBg, text: AccessColors.alertSuccessText, dot: AccessColors.alertSuccessDot },
  eligible:  { bg: AccessColors.alertInfoBg, text: AccessColors.alertInfoText, dot: AccessColors.alertInfoDot },
  active:    { bg: AccessColors.alertSuccessBg, text: AccessColors.alertSuccessText, dot: AccessColors.statusGreen },
  pending:   { bg: AccessColors.alertWarningBg, text: AccessColors.alertWarningText, dot: AccessColors.alertWarningDot },
  inactive:  { bg: AccessColors.cardHover, text: AccessColors.textTertiary, dot: AccessColors.border },
};

// ── Component ─────────────────────────────────────────────────────────────

export function StatusBadge({ label, variant = 'available' }: StatusBadgeProps) {
  const styles = useStyles();
  const colors = VARIANT_COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: 4,
    borderRadius: AccessRadius.sm,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    letterSpacing: 0.2,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
