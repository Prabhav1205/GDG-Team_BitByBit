/**
 * AccessHeader â€” institutional kiosk header.
 *
 * Structure:
 *   LEFT  â€” ACCESS wordmark + "Accessible Communication Service" descriptor
 *   RIGHT â€” Service status indicator + settings button
 *
 * Visual language: deep navy background, restrained typography,
 * no decorative elements.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { router } from 'expo-router';

import { KioskIcon } from './KioskIcon';
import {
  AccessColors,
  AccessSpacing,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function AccessHeader() {
  return (
    <View
      style={styles.container}
      accessibilityRole="none"
      accessibilityLabel="ACCESS â€” Accessible Communication Service"
    >
      {/* â”€â”€ LEFT: Wordmark â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.left}>
        <Text
          style={styles.wordmark}
          accessibilityRole="header"
          aria-level={1}
          numberOfLines={1}
        >
          ACCESS
        </Text>
        <View style={styles.wordmarkDivider} />
        <Text style={styles.descriptor} numberOfLines={1}>
          Accessible Communication Service
        </Text>
      </View>

      {/* â”€â”€ RIGHT: Status + Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.right}>
        <View
          style={styles.statusPill}
          accessibilityLabel="Service status: available"
          accessibilityRole="text"
        >
          <View style={styles.statusDot} />
          <Text style={styles.statusLabel}>Service available</Text>
        </View>

        <Pressable
          onPress={() => router.push('/settings' as any)}
          style={({ pressed }: any) => [
            styles.settingsBtn,
            pressed && styles.settingsBtnPressed,
          ]}
          accessibilityLabel="Accessibility settings"
          accessibilityRole="button"
          accessibilityHint="Opens settings and accessibility configuration"
        >
          <KioskIcon
            name="settings"
            size={18}
            color={AccessColors.textOnDarkMuted}
          />
        </Pressable>
      </View>

      {/* â”€â”€ Bottom divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <View style={styles.divider} />
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  container: {
    backgroundColor: AccessColors.headerBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    minHeight: 64,
    position: 'relative',
  },

  // â”€â”€ Left â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: AccessSpacing.md,
  },
  wordmark: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textOnDark,
    letterSpacing: Platform.select({ web: 2, default: 1.5 }),
  },
  wordmarkDivider: {
    width: 1,
    height: 18,
    backgroundColor: AccessColors.headerBorder,
  },
  descriptor: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textOnDarkMuted,
    letterSpacing: 0.1,
  },

  // â”€â”€ Right â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.lg,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AccessColors.statusGreen,
  },
  statusLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textOnDarkMuted,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsBtnPressed: {
    backgroundColor: 'rgba(255,255,255,0.10)',
  },

  // â”€â”€ Bottom divider â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  divider: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: AccessColors.headerBorder,
  },
});


