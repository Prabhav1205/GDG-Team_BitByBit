import { AccessColors, AccessSpacing, AccessShadow, AccessAnimation } from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';
/**
 * /settings — Application settings page.
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
import { type LangCode, toSafeLangCode } from '@/constants/i18n';

// ── Types ───────────────────────────────────────────────────────────────────

type AccessibilityKey = keyof AccessibilitySettings;

const ACCESSIBILITY_SETTINGS: {
  key: AccessibilityKey;
  emoji: string;
  localLabel: Record<LangCode, string>;
  localDescription: Record<LangCode, string>;
}[] = [
  {
    key: 'highContrast',
    emoji: '🔳',
    localLabel: { en: 'High Contrast', hi: 'उच्च कंट्रास्ट', mr: 'हाय कॉन्ट्रास्ट' },
    localDescription: {
      en: 'Maximum contrast for low vision users',
      hi: 'कम दृष्टि वाले उपयोगकर्ताओं के लिए अधिकतम कंट्रास्ट',
      mr: 'कमी दृष्टी असलेल्या वापरकर्त्यांसाठी कमाल कॉन्ट्रास्ट',
    },
  },
  {
    key: 'largeText',
    emoji: '🔤',
    localLabel: { en: 'Large Text', hi: 'बड़ा टेक्स्ट', mr: 'मोठा मजकूर' },
    localDescription: {
      en: 'Increases all text sizes across the app',
      hi: 'ऐप में सभी टेक्स्ट का आकार बढ़ाता है',
      mr: 'अ‍ॅपमधील सर्व मजकुराचा आकार वाढवतो',
    },
  },
  {
    key: 'reducedMotion',
    emoji: '⏸️',
    localLabel: { en: 'Reduced Motion', hi: 'कम गति (Reduced Motion)', mr: 'कमी मोशन' },
    localDescription: {
      en: 'Disables non-essential animations',
      hi: 'अनावश्यक एनिमेशन अक्षम करता है',
      mr: 'अनावश्यक अ‍ॅनिमेशन बंद करतो',
    },
  },
  {
    key: 'screenReaderFriendly',
    emoji: '👁️',
    localLabel: { en: 'Screen Reader Friendly', hi: 'स्क्रीन रीडर अनुकूल', mr: 'स्क्रीन रीडर अनुकूल' },
    localDescription: {
      en: 'Optimises layout for screen reader use',
      hi: 'स्क्रीन रीडर उपयोग के लिए लेआउट को अनुकूलित करता है',
      mr: 'स्क्रीन रीडर वापरासाठी मांडणी अनुकूल करतो',
    },
  },
  {
    key: 'largeTouchTargets',
    emoji: '👆',
    localLabel: { en: 'Large Touch Targets', hi: 'बड़े टच लक्ष्य', mr: 'मोठे टच टार्गेट्स' },
    localDescription: {
      en: 'Increases minimum tap target size',
      hi: 'न्यूनतम टैप लक्ष्य का आकार बढ़ाता है',
      mr: 'किमान टॅप टार्गेटचा आकार वाढवतो',
    },
  },
  {
    key: 'dwellClick',
    emoji: '⏱️',
    localLabel: { en: 'Dwell Selection (Tremor Tolerant)', hi: 'ड्वेल चयन (कंपन सहनशील)', mr: 'ड्वेल निवड (कंपन सहनशील)' },
    localDescription: {
      en: 'Auto-selects button after holding pointer over it for 1.5s',
      hi: '1.5 सेकंड तक पॉइंटर रखने के बाद बटन का स्वत: चयन करता है',
      mr: '1.5 सेकंद पॉइंटर धरून ठेवल्यानंतर बटण आपोआप निवडले जाते',
    },
  },
  {
    key: 'switchScanning',
    emoji: '🔘',
    localLabel: { en: 'Switch Scanning Mode', hi: 'स्विच स्कैनिंग मोड', mr: 'स्विच स्कॅनिंग मोड' },
    localDescription: {
      en: 'Auto-cycles highlight sequentially; trigger via Space/Enter or Switch Button',
      hi: 'क्रमशः हाइलाइट को स्वचालित रूप से घुमाता है; स्पेस/एंटर या स्विच बटन से ट्रिगर करें',
      mr: 'क्रमशः हायलाइट फिरवतो; स्पेस/एंटर किंवा स्विच बटणाने ट्रिगर करा',
    },
  },
];

const LANGUAGES: { code: LangCode | string; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en',  label: 'English',  nativeLabel: 'English',  flag: '🇬🇧' },
  { code: 'hi',  label: 'Hindi',    nativeLabel: 'हिंदी',    flag: '🇮🇳' },
  { code: 'mr',  label: 'Marathi',  nativeLabel: 'मराठी',    flag: '🇮🇳' },
];

const INSTITUTIONS: {
  id: InstitutionType;
  emoji: string;
  accent: string;
  localLabel: Record<LangCode, string>;
}[] = [
  { id: 'bank',       emoji: '🏦', accent: AccessColors.bankAccent,       localLabel: { en: 'Bank', hi: 'बैंक', mr: 'बँक' } },
  { id: 'hospital',   emoji: '🏥', accent: AccessColors.hospitalAccent,   localLabel: { en: 'Hospital', hi: 'अस्पताल', mr: 'रुग्णालय' } },
  { id: 'government', emoji: '🏛️', accent: AccessColors.governmentAccent, localLabel: { en: 'Gov. Office', hi: 'सरकारी कार्यालय', mr: 'सरकारी कार्यालय' } },
];

const SETTINGS_I18N: Record<
  LangCode,
  {
    pageTitle: string;
    backLabel: string;
    sectionA11y: string;
    sectionInst: string;
    sectionLang: string;
    launchTitle: string;
    launchDesc: string;
    infoNotice: string;
  }
> = {
  en: {
    pageTitle: 'Settings',
    backLabel: 'Back',
    sectionA11y: 'Accessibility & Motor Controls',
    sectionInst: 'Institution',
    sectionLang: 'Language',
    launchTitle: '⚡ Easy Interaction Interface →',
    launchDesc: 'Launch the dedicated simplified UI with motor-tolerant dwell selection and single-switch controls.',
    infoNotice: 'Settings are applied immediately to the current session.',
  },
  hi: {
    pageTitle: 'सेटिंग्स',
    backLabel: 'वापस',
    sectionA11y: 'पहुंच और मोटर नियंत्रण (Accessibility)',
    sectionInst: 'संस्था',
    sectionLang: 'भाषा',
    launchTitle: '⚡ सरल इंटरैक्शन इंटरफ़ेस →',
    launchDesc: 'मोटर-सहनशील ड्वेल चयन और सिंगल-स्विच नियंत्रणों के साथ समर्पित सरल UI खोलें।',
    infoNotice: 'सेटिंग्स वर्तमान सत्र पर तुरंत लागू हो जाती हैं।',
  },
  mr: {
    pageTitle: 'सेटिंग्ज',
    backLabel: 'परत',
    sectionA11y: 'ऍक्सेसिबिलिटी आणि मोटर नियंत्रणे',
    sectionInst: 'संस्था',
    sectionLang: 'भाषा',
    launchTitle: '⚡ सोपी संवाद व्यवस्था →',
    launchDesc: 'ड्वेल निवड आणि सिंगल-स्विच नियंत्रणांसह समर्पित सोपे UI उघडा.',
    infoNotice: 'सेटिंग्ज चालू सत्रावर त्वरित लागू होतात.',
  },
};

// ── Screen ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const styles = useStyles();
  const { session, setInstitution, setLanguage, updateAccessibility } = useSession();
  const lang = toSafeLangCode(session.language);
  const t = SETTINGS_I18N[lang] || SETTINGS_I18N.en;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <AccessHeader />
        <PageHeader title={t.pageTitle} backLabel={t.backLabel} backRoute="/" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Accessibility ─────────────────────────────────────────── */}
          <SettingsSection title={t.sectionA11y} icon="🛡️">
            {ACCESSIBILITY_SETTINGS.map((s, i) => {
              const active = session.accessibility[s.key];
              const sLabel = s.localLabel[lang] || s.localLabel.en;
              const sDesc = s.localDescription[lang] || s.localDescription.en;

              return (
                <SettingRow
                  key={s.key}
                  isLast={i === ACCESSIBILITY_SETTINGS.length - 1}
                  onPress={() => updateAccessibility(s.key)}
                  active={active}
                >
                  <View style={styles.settingInfo} pointerEvents="none">
                    <Text style={styles.settingEmoji}>{s.emoji}</Text>
                    <View style={styles.settingText}>
                      <Text style={styles.settingLabel}>{sLabel}</Text>
                      <Text style={styles.settingDesc}>{sDesc}</Text>
                    </View>
                  </View>
                  <View pointerEvents="none">
                    <Switch
                      value={active}
                      onValueChange={() => updateAccessibility(s.key)}
                      thumbColor={active ? '#FFFFFF' : AccessColors.textTertiary}
                      trackColor={{ false: AccessColors.border, true: AccessColors.teal }}
                      accessibilityLabel={sLabel}
                      accessibilityRole="switch"
                    />
                  </View>
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
              accessibilityLabel={t.launchTitle}
            >
              <View style={styles.launchCardText}>
                <Text style={styles.launchCardTitle}>{t.launchTitle}</Text>
                <Text style={styles.launchCardDesc}>{t.launchDesc}</Text>
              </View>
            </Pressable>
          </SettingsSection>

          {/* ── Institution ───────────────────────────────────────────── */}
          <SettingsSection title={t.sectionInst} icon="🏢">
            <View style={styles.chipRow}>
              {INSTITUTIONS.map((inst) => {
                const selected = session.institution === inst.id;
                const instLabel = inst.localLabel[lang] || inst.localLabel.en;
                return (
                  <InstitutionChip
                    key={inst.id}
                    inst={inst}
                    label={instLabel}
                    selected={selected}
                    onPress={() => setInstitution(inst.id)}
                  />
                );
              })}
            </View>
          </SettingsSection>

          {/* ── Language ──────────────────────────────────────────────── */}
          <SettingsSection title={t.sectionLang} icon="🌐">
            {LANGUAGES.map((l, i) => {
              const selected = session.language === l.code;
              return (
                <Pressable
                  key={l.code}
                  style={({ pressed }: any) => [
                    styles.langRow,
                    i === LANGUAGES.length - 1 && styles.langRowLast,
                    selected && styles.langRowSelected,
                    pressed && styles.langRowPressed,
                    ...Platform.select({ web: [{ outlineStyle: 'none' }], default: [] }),
                  ]}
                  onPress={() => setLanguage(l.code as LangCode)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`Language: ${l.label}`}
                >
                  <Text style={styles.langFlag}>{l.flag}</Text>
                  <View style={styles.langInfo}>
                    <Text style={styles.langLabel}>{l.label}</Text>
                    <Text style={styles.langNative}>{l.nativeLabel}</Text>
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
            <Text style={styles.infoText}>{t.infoNotice}</Text>
          </LinearGradient>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Institution chip (with scale animation) ────────────────────────────────

function InstitutionChip({
  inst,
  label,
  selected,
  onPress,
}: {
  inst: (typeof INSTITUTIONS)[0];
  label?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const [scale] = useState(() => new Animated.Value(1));

  function handlePress() {
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, speed: 30, bounciness: 0 }),
      Animated.spring(scale, { toValue: 1.05, useNativeDriver: true, speed: 20, bounciness: 5 }),
      Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 20, bounciness: 3 }),
    ]).start();
    onPress();
  }

  const displayLabel = label || inst.localLabel.en;

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
        accessibilityLabel={`Select institution: ${displayLabel}`}
      >
        <Text style={styles.chipEmoji}>{inst.emoji}</Text>
        <Text
          style={[
            styles.optionChipLabel,
            selected && styles.optionChipLabelSelected,
          ]}
        >
          {displayLabel}
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
  const styles = useStyles();
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
  onPress,
  active,
}: {
  children: React.ReactNode;
  isLast?: boolean;
  onPress: () => void;
  active: boolean;
}) {
  const styles = useStyles();
  return (
    <Pressable
      style={({ pressed }: any) => [
        styles.settingRow,
        isLast && styles.settingRowLast,
        pressed && styles.settingRowPressed,
        ...Platform.select({ web: [{ outlineStyle: 'none' }], default: [] }) as any,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ checked: active }}
    >
      {children}
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
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
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionCard: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
  },

  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    backgroundColor: AccessColors.cardDefault,
  },
  settingRowPressed: {
    backgroundColor: AccessColors.cardHover,
  },
  settingRowLast: { borderBottomWidth: 0 },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    flex: 1,
    paddingRight: AccessSpacing.md,
  },
  settingEmoji: { fontSize: 20 },
  settingText: { flex: 1 },
  settingLabel: {
    fontSize: AccessFontSize.md,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textPrimary,
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textSecondary,
    lineHeight: 18,
  },

  launchCard: {
    margin: AccessSpacing.sm,
    padding: AccessSpacing.md,
    backgroundColor: AccessColors.tealFaint,
    borderRadius: AccessRadius.md,
    borderWidth: 1,
    borderColor: AccessColors.teal + '40',
  },
  launchCardPressed: {
    backgroundColor: AccessColors.teal + '30',
  },
  launchCardText: { gap: 2 },
  launchCardTitle: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.tealDark,
  },
  launchCardDesc: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textPrimary,
    lineHeight: 18,
  },

  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.md,
    padding: AccessSpacing.lg,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.lg,
    backgroundColor: AccessColors.background,
    borderRadius: AccessRadius.full,
    borderWidth: 2,
    borderColor: AccessColors.border,
  },
  optionChipPressed: { opacity: 0.8 },
  optionChipSelected: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  chipEmoji: { fontSize: 18 },
  optionChipLabel: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textSecondary,
  },
  optionChipLabelSelected: { color: '#FFFFFF' },

  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    backgroundColor: AccessColors.cardDefault,
    gap: AccessSpacing.md,
  },
  langRowPressed: { backgroundColor: AccessColors.cardHover },
  langRowLast: { borderBottomWidth: 0 },
  langRowSelected: { backgroundColor: AccessColors.tealFaint + '40' },
  langFlag: { fontSize: 20 },
  langInfo: { flex: 1 },
  langLabel: {
    fontSize: AccessFontSize.md,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textPrimary,
  },
  langNative: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textSecondary,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: AccessColors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: { borderColor: AccessColors.teal },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AccessColors.teal,
  },

  infoNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.sm,
    padding: AccessSpacing.lg,
    borderRadius: AccessRadius.lg,
    marginTop: AccessSpacing.md,
    borderWidth: 1,
    borderColor: AccessColors.teal + '30',
  },
  infoEmoji: { fontSize: 18, marginTop: 2 },
  infoText: {
    flex: 1,
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.tealDark,
    lineHeight: 20,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
