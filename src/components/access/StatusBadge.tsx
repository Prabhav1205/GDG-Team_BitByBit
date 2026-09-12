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
  available: { bg: '#E6F4EB', text: '#1A6B34', dot: '#2D7D46' },
  eligible:  { bg: '#EFF6FF', text: '#1D4ED8', dot: '#2563EB' },
  active:    { bg: '#E6F4EB', text: '#065F46', dot: '#059669' },
  pending:   { bg: '#FFFBEB', text: '#92400E', dot: '#D97706' },
  inactive:  { bg: '#F3F4F6', text: '#6B7280', dot: '#9CA3AF' },
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
