/**
 * /assisted-touch â€” Easy Tap / Motor Accessibility Interface
 *
 * Full frontend placeholder demonstrating the Easy Tap concept.
 * Very large buttons, minimal text, high contrast, large spacing.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { PageHeader } from '@/components/access/PageHeader';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// â”€â”€ Action buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ActionConfig = { id: string; label: string; emoji: string; variant: 'primary' | 'danger' | 'neutral' };

const ACTIONS: ActionConfig[] = [
  { id: 'yes',    label: 'Yes',    emoji: 'âœ…', variant: 'primary'  },
  { id: 'no',     label: 'No',     emoji: 'âŒ', variant: 'danger'   },
  { id: 'help',   label: 'Help',   emoji: 'ðŸ†˜', variant: 'primary'  },
  { id: 'next',   label: 'Next',   emoji: 'âž¡ï¸', variant: 'neutral'  },
  { id: 'back',   label: 'Back',   emoji: 'â¬…ï¸', variant: 'neutral'  },
  { id: 'repeat', label: 'Repeat', emoji: 'ðŸ”', variant: 'neutral'  },
  { id: 'done',   label: 'Done',   emoji: 'âœ”ï¸', variant: 'primary'  },
];

// â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type SettingKey = 'largeButtons' | 'extraLargeButtons' | 'slowSelection' | 'highContrast';

const SETTINGS: { key: SettingKey; label: string; description: string }[] = [
  { key: 'largeButtons',      label: 'Large Buttons',         description: 'Increases button size for easier tapping' },
  { key: 'extraLargeButtons', label: 'Extra Large Buttons',   description: 'Maximum button size for motor accessibility' },
  { key: 'slowSelection',     label: 'Slow Selection',        description: 'Adds a delay before a selection registers' },
  { key: 'highContrast',      label: 'High Contrast',         description: 'Maximum contrast for low-vision users' },
];

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AssistedTouchPage() {
  const [lastPressed, setLastPressed] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>({
    largeButtons:      true,
    extraLargeButtons: false,
    slowSelection:     false,
    highContrast:      false,
  });

  const btnSize = settings.extraLargeButtons ? 140 : settings.largeButtons ? 110 : 90;

  function toggleSetting(key: SettingKey) {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const VARIANT_STYLES: Record<ActionConfig['variant'], object> = {
    primary: {
      backgroundColor: settings.highContrast ? '#000080' : AccessColors.navy,
      borderColor: settings.highContrast ? '#000080' : AccessColors.navy,
    },
    danger: {
      backgroundColor: settings.highContrast ? '#8B0000' : '#DC2626',
      borderColor: settings.highContrast ? '#8B0000' : '#DC2626',
    },
    neutral: {
      backgroundColor: settings.highContrast ? '#333333' : AccessColors.cardDefault,
      borderColor: settings.highContrast ? '#333333' : AccessColors.border,
    },
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && styles.safeAreaHC]}
      edges={['bottom']}
    >
      <View style={styles.screen}>
        <AccessHeader />
        <PageHeader title="Easy Interaction" backLabel="Back to modes" backRoute="/" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* â”€â”€ Last action feedback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {lastPressed && (
            <View style={styles.feedbackBar} accessibilityLiveRegion="polite">
              <Text style={styles.feedbackText}>âœ… Selected: {lastPressed}</Text>
            </View>
          )}

          {/* â”€â”€ Large action buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View
            style={styles.buttonSection}
            accessibilityRole="none"
            accessibilityLabel="Interaction options"
          >
            {ACTIONS.map((action) => {
              const isNeutral = action.variant === 'neutral';
              return (
                <Pressable
                  key={action.id}
                  style={({ pressed }: any) => [
                    styles.bigBtn,
                    {
                      width: btnSize,
                      height: btnSize,
                      ...VARIANT_STYLES[action.variant],
                    },
                    pressed && styles.bigBtnPressed,
                  ]}
                  onPress={() => setLastPressed(action.label)}
                  accessibilityRole="button"
                  accessibilityLabel={action.label}
                  testID={`easy-tap-${action.id}`}
                >
                  <Text style={styles.bigBtnEmoji}>{action.emoji}</Text>
                  <Text
                    style={[
                      styles.bigBtnLabel,
                      isNeutral && !settings.highContrast && styles.bigBtnLabelDark,
                      settings.highContrast && styles.bigBtnLabelHC,
                    ]}
                  >
                    {action.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* â”€â”€ Explanation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.explainCard}>
            <Text style={styles.explainText}>
              Designed for users who may have difficulty with precise touch or sustained motor control.
            </Text>
          </View>

          {/* â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsHeading}>Interaction Settings</Text>
            {SETTINGS.map((setting) => (
              <View key={setting.key} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{setting.label}</Text>
                  <Text style={styles.settingDesc}>{setting.description}</Text>
                </View>
                <Switch
                  value={settings[setting.key]}
                  onValueChange={() => toggleSetting(setting.key)}
                  thumbColor={settings[setting.key] ? AccessColors.teal : AccessColors.textTertiary}
                  trackColor={{ false: AccessColors.border, true: AccessColors.tealBorder + '60' }}
                  accessibilityLabel={setting.label}
                  accessibilityRole="switch"
                />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccessColors.background },
  safeAreaHC: { backgroundColor: '#000000' },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xl,
    alignItems: 'center',
  },

  // Feedback
  feedbackBar: {
    alignSelf: 'stretch',
    backgroundColor: AccessColors.statusGreenBg,
    borderWidth: 1,
    borderColor: AccessColors.statusGreen,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: '#1A6B34',
  },

  // Big buttons
  buttonSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.lg,
    justifyContent: 'center',
  },
  bigBtn: {
    borderRadius: AccessRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.sm,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  bigBtnPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  bigBtnFocused: {
    ...Platform.select({
      web: { outlineWidth: 4, outlineColor: AccessColors.focusRing, outlineStyle: 'solid', outlineOffset: 3 },
      default: {},
    }),
  } as any,
  bigBtnEmoji: { fontSize: 32 },
  bigBtnLabel: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textOnDark,
  },
  bigBtnLabelDark: { color: AccessColors.textPrimary },
  bigBtnLabelHC: { color: '#FFFFFF' },

  // Explanation
  explainCard: {
    alignSelf: 'stretch',
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
  },
  explainText: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textSecondary,
    lineHeight: 24,
    textAlign: 'center',
  },

  // Settings
  settingsSection: {
    alignSelf: 'stretch',
    gap: AccessSpacing.md,
  },
  settingsHeading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.lg,
    gap: AccessSpacing.md,
  },
  settingInfo: { flex: 1, gap: 2 },
  settingLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  settingDesc: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 18,
  },
});


