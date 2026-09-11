/**
 * Home screen — Mode-Switching Interface / Core Router
 *
 * This is the primary screen of the accessibility kiosk. The user
 * approaches the kiosk and must be able to choose a communication
 * mode immediately, with no unnecessary intermediate steps.
 *
 * Screen structure (top → bottom):
 *   1. AccessHeader     — institutional wordmark + service status
 *   2. Intro section    — single heading + supporting sentence
 *   3. ModeSelector     — 2 × 2 grid of communication mode options
 *   4. AssistanceBar    — staff assistance + language + privacy notice
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { ModeSelector } from '@/components/access/ModeSelector';
import { AssistanceBar } from '@/components/access/AssistanceBar';
import {
  AccessColors,
  AccessSpacing,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// ── Screen ────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* ── 1. Institutional header ──────────────────────────────── */}
        <AccessHeader />

        {/* ── 2 + 3. Scrollable main content ──────────────────────── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Intro ─────────────────────────────────────────────────── */}
          <View
            style={styles.intro}
            role="region"
            accessibilityLabel="Communication mode selection"
          >
            <Text
              style={styles.heading}
              accessibilityRole="header"
              aria-level={2}
            >
              Choose how you would like to communicate.
            </Text>
            <Text style={styles.subheading}>
              Select the option that is most comfortable for you.
              You can change your selection at any time.
            </Text>
          </View>

          {/* Mode grid ──────────────────────────────────────────────── */}
          <View style={styles.selectorWrapper}>
            <ModeSelector />
          </View>
        </ScrollView>

        {/* ── 4. Footer utility bar ────────────────────────────────── */}
        <AssistanceBar />
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

  // ── Scrollable content area ─────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: AccessSpacing.xl,
    paddingTop: AccessSpacing.xxl,
    paddingBottom: AccessSpacing.xl,
    gap: AccessSpacing.xl,
  },

  // ── Intro section ──────────────────────────────────────────────────────
  intro: {
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
    gap: AccessSpacing.md,
  },
  heading: {
    fontSize: AccessFontSize.xxl,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    lineHeight: 46,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 28,
  },

  // ── Mode selector wrapper ──────────────────────────────────────────────
  selectorWrapper: {
    flex: 1,
    alignItems: 'center',
  },
});
