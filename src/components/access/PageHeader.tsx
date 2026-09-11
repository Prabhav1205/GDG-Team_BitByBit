/**
 * PageHeader â€” reusable sub-page header with back navigation.
 *
 * Used by all inner pages (sign, voice, text, easy-tap, conversation,
 * benefits, settings) to provide consistent back navigation.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';
import { KioskIcon } from './KioskIcon';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PageHeaderProps {
  title: string;
  /** Route to navigate back to. Defaults to '/' */
  backRoute?: string;
  /** Label for the back button. */
  backLabel?: string;
  /** Optional right-side action */
  rightAction?: React.ReactNode;
}

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function PageHeader({
  title,
  backRoute = '/',
  backLabel = 'Back',
  rightAction,
}: PageHeaderProps) {
  function handleBack() {
    router.push(backRoute as any);
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }: any) => [
          styles.backBtn,
          pressed && styles.backBtnPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="page-header-back"
      >
        <KioskIcon name="back" size={16} color={AccessColors.navy} />
        <Text style={styles.backLabel}>{backLabel}</Text>
      </Pressable>

      <Text
        style={styles.title}
        accessibilityRole="header"
        aria-level={1}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.right}>
        {rightAction ?? <View style={styles.spacer} />}
      </View>
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    backgroundColor: AccessColors.background,
    gap: AccessSpacing.md,
    minHeight: 60,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.cardDefault,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  backBtnPressed: {
    opacity: 0.75,
    backgroundColor: AccessColors.cardHover,
  },
  backBtnFocused: {
    ...Platform.select({
      web: {
        outlineWidth: 3,
        outlineColor: AccessColors.focusRing,
        outlineStyle: 'solid',
        outlineOffset: 2,
      },
      default: {},
    }),
  } as any,
  backLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },
  title: {
    flex: 1,
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    textAlign: 'center',
  },
  right: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  spacer: {
    width: 80,
  },
});



