/**
 * /settings — Application settings page.
 *
 * UI-only toggles for accessibility, institution, and language preferences.
 * Teammates can wire these up to persist in AsyncStorage/context.
 *
 * Visual enhancements:
 *   — Sectioned cards with subtle shadows
 *   — Animated institution chip selection
 *   — Language rows with native labels and vivid radio buttons
 *   — Vibrant teal switch track
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { router } from 'expo-router';
import { AccessHeader } from '@/components/access/AccessHeader';
import { PageHeader } from '@/components/access/PageHeader';
import { useSession, type InstitutionType, type AccessibilitySettings } from '@/context/SessionContext';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
  AccessShadow,
} from '@/constants/access-theme';

// ── Types ───────────────────────────────────────────────────────────────────

type AccessibilityKey = keyof AccessibilitySettings;

const ACCESSIBILITY_SETTINGS: { key: AccessibilityKey; label: string; description: string; emoji: string }[] = [
  { key: 'highContrast',          emoji: '🔳', label: 'High Contrast',           description: 'Maximum contrast for low vision users' },
  { key: 'largeText',             emoji: '🔤', label: 'Large Text',              description: 'Increases all text sizes across the app' },
  { key: 'reducedMotion',         emoji: '⏸️', label: 'Reduced Motion',          description: 'Disables non-essential animations' },
  { key: 'screenReaderFriendly',  emoji: '👁️', label: 'Screen Reader Friendly',  description: 'Optimises layout for screen reader use' },
  { key: 'largeTouchTargets',     emoji: '👆', label: 'Large Touch Targets',     description: 'Increases minimum tap target size' },
  { key: 'dwellClick',            emoji: '⏱️', label: 'Dwell Selection (Tremor Tolerant)', description: 'Auto-selects button after holding pointer over it for 1.5s' },
  { key: 'switchScanning',        emoji: '🔘', label: 'Switch Scanning Mode',    description: 'Auto-cycles highlight sequentially; trigger via Space/Enter or Switch Button' },
];

const LANGUAGES: { code: string; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en',  label: 'English',  nativeLabel: 'English',  flag: '🇬🇧' },
  { code: 'hi',  label: 'Hindi',    nativeLabel: 'हिंदी',    flag: '🇮🇳' },
  { code: 'mr',  label: 'Marathi',  nativeLabel: 'मराठी',    flag: '🇮🇳' },
  { code: 'kok', label: 'Konkani',  nativeLabel: 'कोंकणी',   flag: '🇮🇳' },
];

const INSTITUTIONS: { id: InstitutionType; label: string; emoji: string; accent: string }[] = [
  { id: 'bank',       label: 'Bank',             emoji: '🏦', accent: AccessColors.bankAccent },
  { id: 'hospital',   label: 'Hospital',         emoji: '🏥', accent: AccessColors.hospitalAccent },
  { id: 'government', label: 'Gov. Office',      emoji: '🏛️', accent: AccessColors.governmentAccent },
];

// ── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { session, setInstitution, setLanguage, updateAccessibility } = useSession();

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
          {/* ── Accessibility ─────────────────────────────────────────── */}
          <SettingsSection title="Accessibility & Motor Controls" icon="🛡️">
            {ACCESSIBILITY_SETTINGS.map((s, i) => {
              const active = session.accessibility[s.key];
              return (
                <SettingRow key={s.key} isLast={i === ACCESSIBILITY_SETTINGS.length - 1}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingEmoji}>{s.emoji}</Text>
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>{s.label}</Text>
                      <Text style={styles.settingDesc}>{s.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={active}
                    onValueChange={() => updateAccessibility(s.key)}
                    thumbColor={active ? '#FFFFFF' : AccessColors.textTertiary}
                    trackColor={{ false: AccessColors.border, true: AccessColors.teal }}
                    accessibilityLabel={s.label}
                    accessibilityRole="switch"
                  />
                </SettingRow>
              );
            })}

            {/* Quick link card for Assisted Touch */}
            <Pressable
              style={({ pressed }: any) => [
                styles.launchCard,
                pressed && styles.launchCardPressed,
              ]}
              onPress={() => router.push('/assisted-touch')}
              accessibilityRole="button"
              accessibilityLabel="Open Easy Interaction Mode"
            >
              <View style={styles.launchCardText}>
                <Text style={styles.launchCardTitle}>⚡ Easy Interaction Interface →</Text>
                <Text style={styles.launchCardDesc}>Launch the dedicated simplified UI with motor-tolerant dwell selection and single-switch controls.</Text>
              </View>
            </Pressable>
          </SettingsSection>

          {/* ── Institution ───────────────────────────────────────────── */}
          <SettingsSection title="Institution" icon="🏢">
            <View style={styles.chipRow}>
              {INSTITUTIONS.map((inst) => {
                const selected = session.institution === inst.id;
                return (
                  <InstitutionChip
                    key={inst.id}
                    inst={inst}
                    selected={selected}
                    onPress={() => setInstitution(inst.id)}
                  />
                );
              })}
            </View>
          </SettingsSection>

          {/* ── Language ──────────────────────────────────────────────── */}
          <SettingsSection title="Language" icon="🌐">
            {LANGUAGES.map((lang, i) => {
              const selected = session.language === lang.code;
              return (
                <Pressable
                  key={lang.code}
                  style={({ pressed }: any) => [
                    styles.langRow,
                    i === LANGUAGES.length - 1 && styles.langRowLast,
                    selected && styles.langRowSelected,
                    pressed && styles.langRowPressed,
                    ...Platform.select({ web: [{ outlineStyle: 'none' }], default: [] }),
                  ]}
                  onPress={() => setLanguage(lang.code)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Language: ${lang.label}`}
                >
                  <Text style={styles.langFlag}>{lang.flag}</Text>
                  <View style={styles.langInfo}>
                    <Text style={styles.langLabel}>{lang.label}</Text>
                    <Text style={styles.langNative}>{lang.nativeLabel}</Text>
                  </View>
                  {/* Radio button */}
                  <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
                    {selected && <View style={styles.radioInner} />}
                  </View>
                </Pressable>
              );
            })}
          </SettingsSection>

          {/* ── Info notice ───────────────────────────────────────────── */}
          <LinearGradient
            colors={[AccessColors.tealFaint, AccessColors.bankAccentLight]}
            style={styles.infoNotice}
          >
            <Text style={styles.infoEmoji}>ℹ️</Text>
            <Text style={styles.infoText}>
              Settings are applied immediately to the current session.
              Some settings may require a page refresh to take full effect.
            </Text>
          </LinearGradient>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Institution chip (with scale animation) ────────────────────────────────

function InstitutionChip({
  inst,
  selected,
  onPress,
}: {
  inst: (typeof INSTITUTIONS)[0];
  selected: boolean;
  onPress: () => void;
}) {
  const [scale] = useState(() => new Animated.Value(1));

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 30, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, speed: 20, bounciness: 5 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 3 }),
    ]).start();
    onPress();
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        style={({ pressed }: any) => [
          styles.optionChip,
          selected && [styles.optionChipSelected, { borderColor: inst.accent, backgroundColor: inst.accent }],
          pressed && styles.optionChipPressed,
          ...Platform.select({ web: [{ outlineStyle: 'none' }], default: [] }),
        ]}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={`Select institution: ${inst.label}`}
      >
        <Text style={styles.chipEmoji}>{inst.emoji}</Text>
        <Text
          style={[
            styles.optionChipLabel,
            selected && styles.optionChipLabelSelected,
          ]}
        >
          {inst.label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SettingsSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={[styles.sectionCard, AccessShadow.sm as any]}>{children}</View>
    </View>
  );
}

function SettingRow({
  children,
  isLast,
}: {
  children: React.ReactNode;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.settingRow, isLast && styles.settingRowLast]}>
      {children}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

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

  section: { gap: AccessSpacing.sm },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    paddingLeft: 2,
    marginBottom: 2,
  },
  sectionIcon: { fontSize: 16 },
  sectionTitle: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textPrimary,
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
    paddingHorizontal: AccessSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    gap: AccessSpacing.md,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.sm,
  },
  settingEmoji: { fontSize: 18, marginTop: 1 },
  settingText: { flex: 1, gap: 2 },
  settingLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  settingDesc: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 18,
  },

  // Institution chips
  chipRow: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    padding: AccessSpacing.lg,
    flexWrap: 'wrap',
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: AccessSpacing.sm + 2,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.full,
    borderWidth: 2,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.background,
  },
  optionChipSelected: {
    // borderColor and backgroundColor set inline
  },
  optionChipPressed: { opacity: 0.8 },
  chipEmoji: { fontSize: 16 },
  optionChipLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textSecondary,
  },
  optionChipLabelSelected: { color: '#FFFFFF' },

  // Language rows
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    gap: AccessSpacing.md,
  },
  langRowLast: { borderBottomWidth: 0 },
  langRowSelected: { backgroundColor: AccessColors.tealFaint },
  langRowPressed: { backgroundColor: AccessColors.cardHover },
  langFlag: { fontSize: 22 },
  langInfo: { flex: 1, gap: 2 },
  langLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
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
  radioOuterSelected: { borderColor: AccessColors.teal },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AccessColors.teal,
  },

  // Info notice
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.sm,
    padding: AccessSpacing.md,
    borderWidth: 1,
    borderColor: AccessColors.teal + '30',
    borderRadius: AccessRadius.md,
  },
  infoEmoji: { fontSize: 16 },
  infoText: {
    flex: 1,
    fontSize: AccessFontSize.sm,
    color: AccessColors.tealDark,
    lineHeight: 20,
  },

  // Launch card
  launchCard: {
    backgroundColor: AccessColors.tealLight,
    borderWidth: 1.5,
    borderColor: AccessColors.tealBorder,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AccessSpacing.md,
    marginTop: AccessSpacing.md,
  },
  launchCardPressed: { opacity: 0.8 },
  launchCardText: { flex: 1, gap: 2 },
  launchCardTitle: { fontSize: AccessFontSize.base, fontWeight: AccessFontWeight.bold, color: AccessColors.teal },
  launchCardDesc: { fontSize: AccessFontSize.sm, color: AccessColors.textSecondary, lineHeight: 18 },
});
