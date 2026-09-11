/**
 * ModePage — shared placeholder layout for all four communication mode pages.
 *
 * Used by: /sign, /voice, /text, /assisted-touch
 *
 * Each page uses this component to display:
 *   — The selected mode name and icon
 *   — A clear "Back to communication options" control
 *   — A consistent header
 *   — A placeholder notice that the full module will be implemented here
 *
 * The back navigation updates the session state (clears the selected mode)
 * before returning to the home screen.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from './AccessHeader';
import { KioskIcon, type IconName } from './KioskIcon';
import { useSession, type CommunicationMode } from '@/context/SessionContext';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// ── Types ─────────────────────────────────────────────────────────────────

interface ModePageProps {
  mode: CommunicationMode;
  iconName: IconName;
  title: string;
  subtitle: string;
}

// ── Component ─────────────────────────────────────────────────────────────

export function ModePage({
  mode,
  iconName,
  title,
  subtitle,
}: ModePageProps) {
  const { clearSession } = useSession();

  function handleBack() {
    clearSession();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* ── Header ──────────────────────────────────────────────── */}
        <AccessHeader />

        {/* ── Back navigation ─────────────────────────────────────── */}
        <View style={styles.navBar}>
          <Pressable
            onPress={handleBack}
            style={({ pressed, focused }) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
              focused && styles.backBtnFocused,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back to communication options"
            testID="back-to-home"
          >
            <KioskIcon
              name="back"
              size={16}
              color={AccessColors.navy}
            />
            <Text style={styles.backBtnLabel}>
              Back to communication options
            </Text>
          </Pressable>
        </View>

        {/* ── Main content ────────────────────────────────────────── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Mode identity block */}
          <View style={styles.modeBlock}>
            <View style={styles.modeIconContainer}>
              <KioskIcon
                name={iconName}
                size={52}
                color={AccessColors.teal}
              />
            </View>

            <Text
              style={styles.modeTitle}
              accessibilityRole="header"
              aria-level={1}
            >
              {title}
            </Text>
            <Text style={styles.modeSubtitle}>{subtitle}</Text>
          </View>

          {/* Placeholder notice */}
          <View style={styles.placeholder}>
            <View style={styles.placeholderDot} />
            <Text style={styles.placeholderText}>
              This module is ready to receive its full implementation.
              The selected communication mode has been stored in the session.
            </Text>
          </View>

          {/* Session info (for development visibility) */}
          <View style={styles.sessionInfo}>
            <Text style={styles.sessionInfoLabel}>
              Active mode: <Text style={styles.sessionInfoValue}>{mode}</Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AccessColors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: AccessColors.background,
  },

  // ── Nav bar ────────────────────────────────────────────────────────────
  navBar: {
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    backgroundColor: AccessColors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.cardDefault,
  },
  backBtnPressed: {
    opacity: 0.75,
    backgroundColor: AccessColors.cardHover,
  },
  backBtnFocused: {
    outlineWidth: 3,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as any,
  backBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },

  // ── Content ────────────────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.xxxl,
    gap: AccessSpacing.xxl,
  },

  // ── Mode identity ──────────────────────────────────────────────────────
  modeBlock: {
    alignItems: 'center',
    gap: AccessSpacing.lg,
    maxWidth: 560,
  },
  modeIconContainer: {
    width: 96,
    height: 96,
    borderRadius: AccessRadius.lg,
    backgroundColor: AccessColors.cardSelected,
    borderWidth: 1.5,
    borderColor: AccessColors.tealBorder + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: AccessFontSize.xxl,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    textAlign: 'center',
  },
  modeSubtitle: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },

  // ── Placeholder notice ─────────────────────────────────────────────────
  placeholder: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    paddingVertical: AccessSpacing.lg,
    paddingHorizontal: AccessSpacing.xl,
    borderRadius: AccessRadius.md,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    maxWidth: 560,
    alignSelf: 'center',
    width: '100%',
  },
  placeholderDot: {
    width: 4,
    borderRadius: 2,
    backgroundColor: AccessColors.navy,
    alignSelf: 'stretch',
  },
  placeholderText: {
    flex: 1,
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 24,
  },

  // ── Session info ───────────────────────────────────────────────────────
  sessionInfo: {
    alignSelf: 'center',
  },
  sessionInfoLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textTertiary,
  },
  sessionInfoValue: {
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
});
