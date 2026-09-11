/**
 * /settings â€” Application settings page.
 *
 * UI-only toggles for accessibility, institution, and language preferences.
 * Teammates can wire these up to persist in AsyncStorage/context.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { PageHeader } from '@/components/access/PageHeader';
import { useSession, type InstitutionType } from '@/context/SessionContext';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type AccessibilityKey =
  | 'highContrast'
  | 'largeText'
  | 'reducedMotion'
  | 'screenReaderFriendly'
  | 'largeTouchTargets';

const ACCESSIBILITY_SETTINGS: { key: AccessibilityKey; label: string; description: string }[] = [
  { key: 'highContrast',          label: 'High Contrast',           description: 'Maximum contrast for low vision users' },
  { key: 'largeText',             label: 'Large Text',              description: 'Increases all text sizes across the app' },
  { key: 'reducedMotion',         label: 'Reduced Motion',          description: 'Disables non-essential animations' },
  { key: 'screenReaderFriendly',  label: 'Screen Reader Friendly',  description: 'Optimises layout for screen reader use' },
  { key: 'largeTouchTargets',     label: 'Large Touch Targets',     description: 'Increases minimum tap target size' },
];

const LANGUAGES: { code: string; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English',  nativeLabel: 'English'  },
  { code: 'hi', label: 'Hindi',    nativeLabel: 'à¤¹à¤¿à¤‚à¤¦à¥€'    },
  { code: 'mr', label: 'Marathi',  nativeLabel: 'à¤®à¤°à¤¾à¤ à¥€'    },
  { code: 'kok', label: 'Konkani', nativeLabel: 'à¤•à¥‹à¤‚à¤•à¤£à¥€'   },
];

const INSTITUTIONS: { id: InstitutionType; label: string }[] = [
  { id: 'bank',       label: 'Bank'            },
  { id: 'hospital',   label: 'Hospital'        },
  { id: 'government', label: 'Government Office' },
];

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function SettingsPage() {
  const { session, setInstitution, setLanguage } = useSession();

  const [a11y, setA11y] = useState<Record<AccessibilityKey, boolean>>({
    highContrast:         false,
    largeText:            false,
    reducedMotion:        false,
    screenReaderFriendly: false,
    largeTouchTargets:    false,
  });

  function toggleA11y(key: AccessibilityKey) {
    setA11y((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <AccessHeader />
        <PageHeader title="Settings" backLabel="Back" backRoute="/" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* â”€â”€ Accessibility â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <SettingsSection title="Accessibility">
            {ACCESSIBILITY_SETTINGS.map((s) => (
              <SettingRow key={s.key}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>{s.label}</Text>
                  <Text style={styles.settingDesc}>{s.description}</Text>
                </View>
                <Switch
                  value={a11y[s.key]}
                  onValueChange={() => toggleA11y(s.key)}
                  thumbColor={a11y[s.key] ? AccessColors.teal : AccessColors.textTertiary}
                  trackColor={{ false: AccessColors.border, true: AccessColors.tealBorder + '50' }}
                  accessibilityLabel={s.label}
                  accessibilityRole="switch"
                />
              </SettingRow>
            ))}
          </SettingsSection>

          {/* â”€â”€ Institution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <SettingsSection title="Institution">
            <View style={styles.optionRow}>
              {INSTITUTIONS.map((inst) => {
                const selected = session.institution === inst.id;
                return (
                  <Pressable
                    key={inst.id}
                    style={({ pressed }: any) => [
                      styles.optionChip,
                      selected && styles.optionChipSelected,
                      pressed && styles.optionChipPressed,
                    ]}
                    onPress={() => setInstitution(inst.id)}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`Select institution: ${inst.label}`}
                  >
                    <Text
                      style={[
                        styles.optionChipLabel,
                        selected && styles.optionChipLabelSelected,
                      ]}
                    >
                      {inst.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SettingsSection>

          {/* â”€â”€ Language â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <SettingsSection title="Language">
            {LANGUAGES.map((lang) => {
              const selected = session.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  style={({ pressed }: any) => [
                    styles.langRow,
                    selected && styles.langRowSelected,
                    pressed && styles.langRowPressed,
                  ]}
                  onPress={() => setLanguage(lang.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Language: ${lang.label}`}
                >
                  <View style={styles.langInfo}>
                    <Text style={styles.langLabel}>{lang.label}</Text>
                    <Text style={styles.langNative}>{lang.nativeLabel}</Text>
                  </View>
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </SettingsSection>

          {/* â”€â”€ Info notice â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.infoNotice}>
            <Text style={styles.infoText}>
              Settings are applied immediately to the current session.
              Some settings may require a page refresh to take full effect.
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

function SettingRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.settingRow}>{children}</View>;
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccessColors.background },
  screen: { flex: 1, backgroundColor: AccessColors.background },
  scroll: { flex: 1 },
  content: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xl,
    maxWidth: 720,
    alignSelf: 'center',
    width: '100%',
  },

  section: { gap: AccessSpacing.md },
  sectionTitle: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    paddingLeft: AccessSpacing.xs,
  },
  sectionCard: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    overflow: 'hidden',
  },

  // Setting rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
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

  // Institution chips
  optionRow: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    padding: AccessSpacing.xl,
    flexWrap: 'wrap',
  },
  optionChip: {
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.lg,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.background,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  optionChipSelected: {
    borderColor: AccessColors.navy,
    backgroundColor: AccessColors.navy,
  },
  optionChipPressed: { opacity: 0.75 },
  optionChipFocused: {
    ...Platform.select({
      web: { outlineWidth: 3, outlineColor: AccessColors.focusRing, outlineStyle: 'solid', outlineOffset: 2 },
      default: {},
    }),
  } as any,
  optionChipLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  optionChipLabelSelected: { color: AccessColors.textOnDark },

  // Language rows
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  langRowSelected: {
    backgroundColor: AccessColors.background,
  },
  langRowPressed: { backgroundColor: AccessColors.cardHover },
  langInfo: { gap: 2 },
  langLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  langNative: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: AccessColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: { borderColor: AccessColors.navy },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AccessColors.navy,
  },

  // Info notice
  infoNotice: {
    padding: AccessSpacing.md,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
  },
  infoText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});



