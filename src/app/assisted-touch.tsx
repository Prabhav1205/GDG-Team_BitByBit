/**
 * /assisted-touch — Easy Tap / Motor Accessibility Interface
 *
 * Designed for users with motor disabilities, tremors, or limited dexterity:
 *   — Tremor-tolerant Dwell-Click (timeout-based auto-selection on hover/hold)
 *   — Switch-Scanning UI pattern (auto-cycling highlight with single-switch trigger)
 *   — Large hit targets and high contrast modes
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { PageHeader } from '@/components/access/PageHeader';
import { useAudioNav } from '@/context/AudioNavContext';
import { useSession, type AccessibilitySettings } from '@/context/SessionContext';
import { useAccessTheme } from '@/context/AccessThemeContext';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
  AccessShadow,
} from '@/constants/access-theme';
import {
  LANGUAGES,
  toSafeLangCode,
  type LangCode,
} from '@/constants/i18n';
import { speechEngine } from '@/services/speech-engine';

// ── Action buttons ─────────────────────────────────────────────────────────

type ActionConfig = {
  id: string;
  emoji: string;
  variant: 'primary' | 'danger' | 'neutral';
  localLabel: Record<LangCode, string>;
};

const ACTIONS: ActionConfig[] = [
  { id: 'yes',    emoji: '✅', variant: 'primary',  localLabel: { en: 'Yes',    hi: 'हाँ',      mr: 'होय' } },
  { id: 'no',     emoji: '❌', variant: 'danger',   localLabel: { en: 'No',     hi: 'नहीं',     mr: 'नाही' } },
  { id: 'help',   emoji: '🆘', variant: 'primary',  localLabel: { en: 'Help',   hi: 'मदद',      mr: 'मदत' } },
  { id: 'next',   emoji: '➡️', variant: 'neutral',  localLabel: { en: 'Next',   hi: 'आगे',      mr: 'पुढे' } },
  { id: 'back',   emoji: '⬅️', variant: 'neutral',  localLabel: { en: 'Back',   hi: 'पीछे',     mr: 'मागे' } },
  { id: 'repeat', emoji: '🔄', variant: 'neutral',  localLabel: { en: 'Repeat', hi: 'दोहराएं',  mr: 'पुन्हा' } },
  { id: 'done',   emoji: '✔️', variant: 'primary',  localLabel: { en: 'Done',   hi: 'पूर्ण',     mr: 'झाले' } },
];

// ── Settings ───────────────────────────────────────────────────────────────

type SettingKey = keyof AccessibilitySettings;

const SETTINGS: {
  key: SettingKey;
  emoji: string;
  localLabel: Record<LangCode, string>;
  localDescription: Record<LangCode, string>;
}[] = [
  {
    key: 'largeTouchTargets',
    emoji: '📐',
    localLabel: {
      en: 'Large Touch Targets',
      hi: 'बड़े टच लक्ष्य',
      mr: 'मोठे टच टार्गेट्स',
    },
    localDescription: {
      en: 'Increases button size for easier tapping',
      hi: 'आसानी से टैप करने के लिए बटन का आकार बढ़ाता है',
      mr: 'सहज टॅप करण्यासाठी बटणाचा आकार वाढवतो',
    },
  },
  {
    key: 'dwellClick',
    emoji: '⏱️',
    localLabel: {
      en: 'Dwell Selection (Tremor Tolerant)',
      hi: 'ड्वेल चयन (कंपन सहनशील)',
      mr: 'ड्वेल निवड (कंपन सहनशील)',
    },
    localDescription: {
      en: 'Auto-selects button after holding pointer over it for 1.5 seconds',
      hi: '1.5 सेकंड तक पॉइंटर रखने के बाद बटन का स्वत: चयन करता है',
      mr: '1.5 सेकंद पॉइंटर धरून ठेवल्यानंतर बटण आपोआप निवडले जाते',
    },
  },
  {
    key: 'switchScanning',
    emoji: '🔘',
    localLabel: {
      en: 'Switch Scanning Mode',
      hi: 'स्विच स्कैनिंग मोड',
      mr: 'स्विच स्कॅनिंग मोड',
    },
    localDescription: {
      en: 'Auto-cycles highlight sequentially; press Space / Enter or Switch Trigger to select',
      hi: 'क्रमशः हाइलाइट को स्वचालित रूप से घुमाता है; चुनने के लिए स्पेस / एंटर या स्विच ट्रिगर दबाएं',
      mr: 'क्रमशः हायलाइट फिरवतो; निवडण्यासाठी स्पेस / एंटर किंवा स्विच ट्रिगर दाबा',
    },
  },
  {
    key: 'highContrast',
    emoji: '👁️',
    localLabel: {
      en: 'High Contrast Mode',
      hi: 'उच्च कंट्रास्ट मोड',
      mr: 'हाय कॉन्ट्रास्ट मोड',
    },
    localDescription: {
      en: 'Maximum contrast for low-vision users',
      hi: 'कम दृष्टि वाले उपयोगकर्ताओं के लिए अधिकतम कंट्रास्ट',
      mr: 'कमी दृष्टी असलेल्या वापरकर्त्यांसाठी कमाल कॉन्ट्रास्ट',
    },
  },
];

const ASSISTED_STRINGS: Record<
  LangCode,
  {
    pageTitle: string;
    backLabel: string;
    switchTriggerPrompt: (label: string) => string;
    switchTriggerTap: (emoji: string, label: string) => string;
    selectedFeedback: (label: string) => string;
    explainTitle: string;
    explainText: React.ReactNode;
    settingsHeading: string;
    targetBadge: string;
  }
> = {
  en: {
    pageTitle: 'Easy Interaction (Motor Accessibility)',
    backLabel: 'Back to modes',
    switchTriggerPrompt: (label) =>
      `SWITCH TRIGGER — TAP OR PRESS SPACE TO SELECT (${label.toUpperCase()})`,
    switchTriggerTap: (emoji, label) =>
      `🔘 TAP HERE TO SELECT: ${emoji} ${label.toUpperCase()}`,
    selectedFeedback: (label) => `✅ Selected: ${label}`,
    explainTitle: 'Motor Accessibility Controls',
    explainText: (
      <>
        Designed for users with motor tremors or limited dexterity. Enable{' '}
        <Text style={{ fontWeight: 'bold' }}>Dwell Selection</Text> to select by
        holding your pointer, or{' '}
        <Text style={{ fontWeight: 'bold' }}>Switch Scanning</Text> to cycle
        options and trigger with any single press or key.
      </>
    ),
    settingsHeading: 'Interaction Settings',
    targetBadge: 'TARGET',
  },
  hi: {
    pageTitle: 'सरल इंटरैक्शन (मोटर पहुंच)',
    backLabel: 'विकल्पों पर वापस',
    switchTriggerPrompt: (label) =>
      `स्विच ट्रिगर — चुनने के लिए टैप करें या स्पेस दबाएं (${label.toUpperCase()})`,
    switchTriggerTap: (emoji, label) =>
      `🔘 चुनने के लिए यहां टैप करें: ${emoji} ${label.toUpperCase()}`,
    selectedFeedback: (label) => `✅ चुना गया: ${label}`,
    explainTitle: 'मोटर पहुंच नियंत्रण',
    explainText: (
      <>
        मोटर कंपन या सीमित निपुणता वाले उपयोगकर्ताओं के लिए डिज़ाइन किया गया।
        पॉइंटर को रोककर रखने के लिए{' '}
        <Text style={{ fontWeight: 'bold' }}>ड्वेल चयन</Text> सक्षम करें, या
        विकल्पों को घुमाने और किसी भी सिंगल प्रेस से ट्रिगर करने के लिए{' '}
        <Text style={{ fontWeight: 'bold' }}>स्विच स्कैनिंग</Text> सक्षम करें।
      </>
    ),
    settingsHeading: 'इंटरैक्शन सेटिंग्स',
    targetBadge: 'लक्ष्य',
  },
  mr: {
    pageTitle: 'सोपी संवाद व्यवस्था (मोटर ऍक्सेसिबिलिटी)',
    backLabel: 'पर्यायांवर परत',
    switchTriggerPrompt: (label) =>
      `स्विच ट्रिगर — निवडण्यासाठी टॅप करा किंवा स्पेस दाबा (${label.toUpperCase()})`,
    switchTriggerTap: (emoji, label) =>
      `🔘 निवडण्यासाठी येथे टॅप करा: ${emoji} ${label.toUpperCase()}`,
    selectedFeedback: (label) => `✅ निवडले: ${label}`,
    explainTitle: 'मोटर ऍक्सेसिबिलिटी नियंत्रणे',
    explainText: (
      <>
        कंपन किंवा मर्यादित हालचाल असलेल्या वापरकर्त्यांसाठी डिझाइन केलेले।
        पॉइंटर धरून ठेवून निवडण्यासाठी{' '}
        <Text style={{ fontWeight: 'bold' }}>ड्वेल निवड</Text> सक्षम करा, किंवा
        पर्याय फिरवून एकाच स्पर्शाने निवडण्यासाठी{' '}
        <Text style={{ fontWeight: 'bold' }}>स्विच स्कॅनिंग</Text> वापरा।
      </>
    ),
    settingsHeading: 'इंटरॅक्शन सेटिंग्ज',
    targetBadge: 'लक्ष्य',
  },
};

// ── Screen ──────────────────────────────────────────────────────────────────

export default function AssistedTouchPage() {
  const styles = useStyles();
  const { announce } = useAudioNav();
  const { session, updateAccessibility, broadcastTranslation } = useSession();
  const [lastPressed, setLastPressed] = useState<string | null>(null);

  const lang = toSafeLangCode(session.language);
  const speechCode = LANGUAGES[lang].speechCode;
  const t = ASSISTED_STRINGS[lang] || ASSISTED_STRINGS.en;

  const settings = session.accessibility;

  // Dwell state
  const [dwellActiveId, setDwellActiveId] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState<number>(0);
  const dwellTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dwellIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Switch Scanning state
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [scanPulseAnim] = useState(() => new Animated.Value(1));

  const btnSize = settings.largeTouchTargets ? 120 : 90;

  function toggleSetting(key: SettingKey) {
    if (key === 'switchScanning') {
      setScanIndex(0);
    }
    if (key === 'dwellClick') {
      clearDwellTimer();
    }
    updateAccessibility(key);
  }

  function handleSelectAction(actionConfig: ActionConfig) {
    const label = actionConfig.localLabel[lang] || actionConfig.localLabel.en;
    setLastPressed(label);
    announce(t.selectedFeedback(label));
    speechEngine.speak(label, { lang: speechCode });
    broadcastTranslation(label, 'Assisted Touch', 1.0);
    clearDwellTimer();
  }

  // ── Dwell Timer Handlers ──────────────────────────────────────────────────
  function clearDwellTimer() {
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    if (dwellIntervalRef.current) clearInterval(dwellIntervalRef.current);
    dwellTimerRef.current = null;
    dwellIntervalRef.current = null;
    setDwellActiveId(null);
    setDwellProgress(0);
  }

  function handlePointerEnter(action: ActionConfig) {
    if (!settings.dwellClick) return;
    clearDwellTimer();

    setDwellActiveId(action.id);
    setDwellProgress(0);

    const DWELL_DURATION = 1500;
    const INTERVAL_MS = 50;
    let elapsed = 0;

    dwellIntervalRef.current = setInterval(() => {
      elapsed += INTERVAL_MS;
      const progress = Math.min(100, (elapsed / DWELL_DURATION) * 100);
      setDwellProgress(progress);
    }, INTERVAL_MS);

    dwellTimerRef.current = setTimeout(() => {
      handleSelectAction(action);
    }, DWELL_DURATION);
  }

  function handlePointerLeave() {
    if (settings.dwellClick) {
      clearDwellTimer();
    }
  }

  // ── Switch Scanning Loop ──────────────────────────────────────────────────
  useEffect(() => {
    if (!settings.switchScanning) return;

    const interval = setInterval(() => {
      setScanIndex((prev) => (prev + 1) % ACTIONS.length);
    }, 1600);

    return () => clearInterval(interval);
  }, [settings.switchScanning]);

  // Pulse animation for switch scan highlight
  useEffect(() => {
    if (!settings.switchScanning) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scanPulseAnim, {
          toValue: 1.06,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scanPulseAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [settings.switchScanning, scanIndex, scanPulseAnim]);

  // Global Keyboard Listener for Switch Scanning (Space / Enter / Number keys)
  useEffect(() => {
    if (Platform.OS !== 'web' || !settings.switchScanning) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        const activeAction = ACTIONS[scanIndex];
        if (activeAction) {
          handleSelectAction(activeAction);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.switchScanning, scanIndex, lang]);

  // Clean up dwell on unmount
  useEffect(() => {
    return () => clearDwellTimer();
  }, []);

  const activeScanAction = ACTIONS[scanIndex];
  const activeScanLabel =
    activeScanAction?.localLabel[lang] || activeScanAction?.localLabel.en || '';

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
      backgroundColor: settings.highContrast
        ? '#333333'
        : AccessColors.cardDefault,
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
        <PageHeader
          title={t.pageTitle}
          backLabel={t.backLabel}
          backRoute="/"
        />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Switch Scanning Trigger Banner (if Switch Scanning ON) ───── */}
          {settings.switchScanning && (
            <Pressable
              style={({ pressed }: any) => [
                styles.switchTriggerBtn,
                pressed && styles.switchTriggerBtnPressed,
              ]}
              onPress={() => handleSelectAction(ACTIONS[scanIndex])}
              accessibilityRole="button"
              accessibilityLabel={t.switchTriggerPrompt(activeScanLabel)}
            >
              <Text style={styles.switchTriggerEmoji}>🔴</Text>
              <Text style={styles.switchTriggerText}>
                {t.switchTriggerPrompt(activeScanLabel)}
              </Text>
            </Pressable>
          )}

          {/* Single Switch Trigger Banner for Mobile & Switch Users */}
          {settings.switchScanning && (
            <Pressable
              style={({ pressed }: any) => [
                styles.switchTriggerBtn,
                pressed && styles.switchTriggerBtnPressed,
              ]}
              onPress={() => handleSelectAction(ACTIONS[scanIndex])}
              accessibilityRole="button"
              accessibilityLabel={t.switchTriggerTap(
                ACTIONS[scanIndex].emoji,
                activeScanLabel
              )}
            >
              <Text style={styles.switchTriggerText}>
                {t.switchTriggerTap(ACTIONS[scanIndex].emoji, activeScanLabel)}
              </Text>
            </Pressable>
          )}

          {/* ── Last action feedback ─────────────────────────────────────── */}
          {lastPressed && (
            <View style={styles.feedbackBar} accessibilityLiveRegion="polite">
              <Text style={styles.feedbackText}>{t.selectedFeedback(lastPressed)}</Text>
            </View>
          )}

          {/* Action Grid */}
          <View
            style={styles.buttonSection}
            accessibilityRole="none"
            accessibilityLabel="Interaction options"
          >
            {ACTIONS.map((action, index) => {
              const actionLabel = action.localLabel[lang] || action.localLabel.en;
              const isNeutral = action.variant === 'neutral';
              const isScanHighlighted =
                settings.switchScanning && scanIndex === index;
              const isDwellActive = dwellActiveId === action.id;

              return (
                <Animated.View
                  key={action.id}
                  style={
                    isScanHighlighted
                      ? { transform: [{ scale: scanPulseAnim }] }
                      : undefined
                  }
                >
                  <Pressable
                    style={({ pressed }: any) => [
                      styles.bigBtn,
                      {
                        width: btnSize,
                        height: btnSize,
                        ...VARIANT_STYLES[action.variant],
                      },
                      pressed && styles.bigBtnPressed,
                      isScanHighlighted && styles.bigBtnScanHighlighted,
                      isDwellActive && styles.bigBtnDwellActive,
                    ]}
                    onPress={() => handleSelectAction(action)}
                    onPressIn={() => handlePointerEnter(action)}
                    onPressOut={handlePointerLeave}
                    onPointerEnter={() => handlePointerEnter(action)}
                    onPointerLeave={handlePointerLeave}
                    accessibilityRole="button"
                    accessibilityLabel={actionLabel}
                    testID={`easy-tap-${action.id}`}
                  >
                    {/* Dwell progress fill bar */}
                    {isDwellActive && (
                      <View
                        style={[
                          styles.dwellProgressBar,
                          { width: `${dwellProgress}%` },
                        ]}
                      />
                    )}

                    {/* Switch Scan Badge */}
                    {isScanHighlighted && (
                      <View style={styles.scanBadge}>
                        <Text style={styles.scanBadgeText}>{t.targetBadge}</Text>
                      </View>
                    )}

                    <Text style={styles.bigBtnEmoji}>{action.emoji}</Text>
                    <Text
                      style={[
                        styles.bigBtnLabel,
                        isNeutral &&
                          !settings.highContrast &&
                          styles.bigBtnLabelDark,
                        settings.highContrast && styles.bigBtnLabelHC,
                      ]}
                    >
                      {actionLabel}
                    </Text>

                    {/* Dwell Timer Indicator text */}
                    {isDwellActive && (
                      <Text style={styles.dwellText}>
                        {Math.round(dwellProgress)}%
                      </Text>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {/* ── Explanation ────────────────────────────────────────────── */}
          <View style={styles.explainBox}>
            <Text style={styles.explainTitle}>{t.explainTitle}</Text>
            <Text style={styles.explainText}>{t.explainText}</Text>
          </View>

          {/* ── Settings Toggles ────────────────────────────────────────── */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsHeading}>{t.settingsHeading}</Text>
            {SETTINGS.map((setting) => {
              const settingLabel = setting.localLabel[lang] || setting.localLabel.en;
              const settingDesc =
                setting.localDescription[lang] ||
                setting.localDescription.en;

              return (
                <View key={setting.key} style={styles.settingRow}>
                  <View style={styles.settingInfo}>
                    <View style={styles.settingLabelRow}>
                      <Text style={styles.settingEmoji}>{setting.emoji}</Text>
                      <Text style={styles.settingLabel}>{settingLabel}</Text>
                    </View>
                    <Text style={styles.settingDesc}>{settingDesc}</Text>
                  </View>
                  <Switch
                    value={settings[setting.key]}
                    onValueChange={() => toggleSetting(setting.key)}
                    thumbColor={
                      settings[setting.key]
                        ? AccessColors.teal
                        : AccessColors.textTertiary
                    }
                    trackColor={{
                      false: AccessColors.border,
                      true: AccessColors.tealBorder + '80',
                    }}
                    accessibilityLabel={settingLabel}
                    accessibilityRole="switch"
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccessColors.background },
  safeAreaHC: { backgroundColor: '#000000' },
  screen: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xl,
    alignItems: 'center',
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },

  // Switch Trigger
  switchTriggerBtn: {
    width: '100%',
    backgroundColor: '#FFD700',
    borderWidth: 3,
    borderColor: '#B8860B',
    borderRadius: AccessRadius.md,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  switchTriggerBtnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  switchTriggerEmoji: { fontSize: 24 },
  switchTriggerText: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.bold,
    color: '#332200',
    textAlign: 'center',
  },

  // Feedback
  feedbackBar: {
    alignSelf: 'stretch',
    backgroundColor: AccessColors.cardSelected,
    borderWidth: 1.5,
    borderColor: AccessColors.teal,
    borderRadius: AccessRadius.md,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.lg,
    alignItems: 'center',
  },
  feedbackText: {
    fontSize: AccessFontSize.md,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.tealDark,
  },

  // Big Action Buttons
  buttonSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.md,
    justifyContent: 'center',
    width: '100%',
  },
  bigBtn: {
    borderRadius: AccessRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AccessSpacing.md,
    gap: AccessSpacing.xs,
    position: 'relative',
    overflow: 'hidden',
    ...AccessShadow.sm,
  },
  bigBtnPrimary: {
    backgroundColor: AccessColors.navy,
  },
  bigBtnDanger: {
    backgroundColor: '#991B1B',
  },
  bigBtnNeutral: {
    backgroundColor: AccessColors.cardHover,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
  },
  bigBtnPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  bigBtnScanHighlighted: {
    borderWidth: 4,
    borderColor: AccessColors.teal,
    backgroundColor: AccessColors.cardHover,
  },
  bigBtnDwellActive: {
    opacity: 0.9,
  },
  dwellProgressBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 6,
    backgroundColor: AccessColors.teal,
  },
  dwellText: {
    position: 'absolute',
    bottom: 4,
    fontSize: 11,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.teal,
  },
  scanBadge: {
    position: 'absolute',
    top: 4,
    backgroundColor: '#FFD700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  scanBadgeText: {
    fontSize: 9,
    fontFamily: AccessFontFamily.bold,
    color: '#332200',
  },

  bigBtnEmoji: { fontSize: 32 },
  bigBtnLabel: {
    fontSize: AccessFontSize.md,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.textOnDark,
    textAlign: 'center',
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
    gap: AccessSpacing.xs,
  },
  explainBox: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xs,
  },
  explainTitle: {
    fontSize: AccessFontSize.md,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.textPrimary,
  },
  explainText: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textSecondary,
    lineHeight: 24,
  },

  // Settings
  settingsSection: {
    alignSelf: 'stretch',
    gap: AccessSpacing.md,
  },
  settingsHeading: {
    fontSize: AccessFontSize.md,
    fontFamily: AccessFontFamily.semibold,
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
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingEmoji: { fontSize: 18 },
  settingLabel: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textPrimary,
  },
  settingDesc: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textSecondary,
    lineHeight: 18,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
