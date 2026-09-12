/**
 * PageHeader — reusable sub-page header with back navigation.
 *
 * Used by all inner pages (sign, voice, text, easy-tap, conversation,
 * benefits, settings) to provide consistent back navigation.
 *
 * Visual enhancements:
 *   — Filled navy back button with white text + icon
 *   — Centered bold title with teal underline accent
 *   — Subtle gradient background strip
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { KioskIcon } from './KioskIcon';

// ── Types ─────────────────────────────────────────────────────────────────

interface PageHeaderProps {
  title: string;
  /** Route to navigate back to. Defaults to '/' */
  backRoute?: string;
  /** Label for the back button. */
  backLabel?: string;
  /** Optional right-side action */
  rightAction?: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  backRoute = '/',
  backLabel = 'Back',
  rightAction,
}: PageHeaderProps) {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;
  const [backHovered, setBackHovered] = useState(false);

  function handleBack() {
    router.push(backRoute as any);
  }

  return (
    <View style={[styles.container, isNarrow && styles.containerNarrow]}>
      {/* Back button — filled navy */}
      <Pressable
        onPress={handleBack}
        onHoverIn={() => setBackHovered(true)}
        onHoverOut={() => setBackHovered(false)}
        style={({ pressed }: any) => [
          styles.backBtn,
          backHovered && styles.backBtnHovered,
          pressed && styles.backBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="page-header-back"
      >
        <KioskIcon name="back" size={15} color="#FFFFFF" />
        {!isNarrow && <Text style={styles.backLabel}>{backLabel}</Text>}
      </Pressable>

      {/* Title with underline accent */}
      <View style={styles.titleWrapper}>
        <Text
          style={styles.title}
          accessibilityRole="header"
          aria-level={1}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.titleAccent} />
      </View>

      <View style={[styles.right, isNarrow && styles.rightNarrow]}>
        {rightAction ?? <View style={[styles.spacer, isNarrow && styles.spacerNarrow]} />}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    backgroundColor: AccessColors.cardDefault,
    gap: AccessSpacing.md,
    minHeight: 64,
  },
  containerNarrow: {
    paddingHorizontal: AccessSpacing.md,
    minHeight: 52,
    gap: AccessSpacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.navy,
    ...AccessShadow.sm,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  backBtnHovered: {
    backgroundColor: AccessColors.navyHover,
    ...AccessShadow.md,
  },
  backBtnPressed: {
    opacity: 0.82,
  },
  backLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: '#FFFFFF',
  },
  titleWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  title: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textPrimary,
    textAlign: 'center',
    paddingBottom: 2,
  },
  titleAccent: {
    width: 48,
    height: 3,
    borderRadius: 99,
    backgroundColor: AccessColors.teal,
  },
  right: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  rightNarrow: {
    minWidth: 44,
  },
  spacer: {
    width: 80,
  },
  spacerNarrow: {
    width: 44,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
