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
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// ── Action buttons ─────────────────────────────────────────────────────────

type ActionConfig = { id: string; label: string; emoji: string; variant: 'primary' | 'danger' | 'neutral' };

const ACTIONS: ActionConfig[] = [
  { id: 'yes',    label: 'Yes',    emoji: '✅', variant: 'primary'  },
  { id: 'no',     label: 'No',     emoji: '❌', variant: 'danger'   },
  { id: 'help',   label: 'Help',   emoji: '🆘', variant: 'primary'  },
  { id: 'next',   label: 'Next',   emoji: '➡️', variant: 'neutral'  },
  { id: 'back',   label: 'Back',   emoji: '⬅️', variant: 'neutral'  },
  { id: 'repeat', label: 'Repeat', emoji: '🔄', variant: 'neutral'  },
  { id: 'done',   label: 'Done',   emoji: '✔️', variant: 'primary'  },
];

// ── Settings ───────────────────────────────────────────────────────────────

type SettingKey = keyof AccessibilitySettings;

const SETTINGS: { key: SettingKey; label: string; description: string; emoji: string }[] = [
  { key: 'largeTouchTargets', emoji: '📐', label: 'Large Touch Targets', description: 'Increases button size for easier tapping' },
  { key: 'dwellClick',        emoji: '⏱️', label: 'Dwell Selection (Tremor Tolerant)', description: 'Auto-selects button after holding pointer over it for 1.5 seconds' },
  { key: 'switchScanning',    emoji: '🔘', label: 'Switch Scanning Mode', description: 'Auto-cycles highlight sequentially; press Space / Enter or Switch Trigger to select' },
  { key: 'highContrast',      emoji: '👁️', label: 'High Contrast Mode', description: 'Maximum contrast for low-vision users' },
];

// ── Screen ──────────────────────────────────────────────────────────────────

export default function AssistedTouchPage() {
  const { announce } = useAudioNav();
  const { session, updateAccessibility } = useSession();
  const [lastPressed, setLastPressed] = useState<string | null>(null);

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

  function handleSelectAction(label: string) {
    setLastPressed(label);
    announce(`Selected ${label}`);
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
      handleSelectAction(action.label);
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
        Animated.timing(scanPulseAnim, { toValue: 1.06, duration: 400, useNativeDriver: true }),
        Animated.timing(scanPulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
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
          handleSelectAction(activeAction.label);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.switchScanning, scanIndex]);

  // Clean up dwell on unmount
  useEffect(() => {
    return () => clearDwellTimer();
  }, []);

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
        <PageHeader title="Easy Interaction (Motor Accessibility)" backLabel="Back to modes" backRoute="/" />

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
              onPress={() => handleSelectAction(ACTIONS[scanIndex].label)}
              accessibilityRole="button"
              accessibilityLabel={`Switch Trigger: Select ${ACTIONS[scanIndex].label}`}
            >
              <Text style={styles.switchTriggerEmoji}>🔴</Text>
              <Text style={styles.switchTriggerText}>
                SWITCH TRIGGER — TAP OR PRESS SPACE TO SELECT ({ACTIONS[scanIndex].label.toUpperCase()})
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
              onPress={() => handleSelectAction(ACTIONS[scanIndex].label)}
              accessibilityRole="button"
              accessibilityLabel={`Single switch trigger: Select ${ACTIONS[scanIndex].label}`}
            >
              <Text style={styles.switchTriggerText}>
                🔘 TAP HERE TO SELECT: {ACTIONS[scanIndex].emoji} {ACTIONS[scanIndex].label.toUpperCase()}
              </Text>
            </Pressable>
          )}

          {/* ── Last action feedback ─────────────────────────────────────── */}
          {lastPressed && (
            <View style={styles.feedbackBar} accessibilityLiveRegion="polite">
              <Text style={styles.feedbackText}>✅ Selected: {lastPressed}</Text>
            </View>
          )}

          {/* Action Grid */}
          <View
            style={styles.buttonSection}
            accessibilityRole="none"
            accessibilityLabel="Interaction options"
          >
            {ACTIONS.map((action, index) => {
              const isNeutral = action.variant === 'neutral';
              const isScanHighlighted = settings.switchScanning && scanIndex === index;
              const isDwellActive = dwellActiveId === action.id;

              const AnimatedView = isScanHighlighted ? Animated.View : View;

              return (
                <AnimatedView
                  key={action.id}
                  style={isScanHighlighted ? { transform: [{ scale: scanPulseAnim }] } : undefined}
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
                    onPress={() => handleSelectAction(action.label)}
                    onPressIn={() => handlePointerEnter(action)}
                    onPressOut={handlePointerLeave}
                    onPointerEnter={() => handlePointerEnter(action)}
                    onPointerLeave={handlePointerLeave}
                    accessibilityRole="button"
                    accessibilityLabel={action.label}
                    testID={`easy-tap-${action.id}`}
                  >
                    {/* Dwell progress fill bar */}
                    {isDwellActive && (
                      <View style={[styles.dwellProgressBar, { width: `${dwellProgress}%` }]} />
                    )}

                    {/* Switch Scan Badge */}
                    {isScanHighlighted && (
                      <View style={styles.scanBadge}>
                        <Text style={styles.scanBadgeText}>TARGET</Text>
                      </View>
                    )}

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

                    {/* Dwell Timer Indicator text */}
                    {isDwellActive && (
                      <Text style={styles.dwellText}>{Math.round(dwellProgress)}%</Text>
                    )}
                  </Pressable>
                </AnimatedView>
              );
            })}
          </View>

          {/* ── Explanation ────────────────────────────────────────────── */}
          <View style={styles.explainCard}>
            <Text style={styles.explainTitle}>Motor Accessibility Controls</Text>
            <Text style={styles.explainText}>
              Designed for users with motor tremors or limited dexterity. Enable <Text style={{ fontWeight: 'bold' }}>Dwell Selection</Text> to select by holding your pointer, or <Text style={{ fontWeight: 'bold' }}>Switch Scanning</Text> to cycle options and trigger with any single press or key.
            </Text>
          </View>

          {/* ── Settings Toggles ────────────────────────────────────────── */}
          <View style={styles.settingsSection}>
            <Text style={styles.settingsHeading}>Interaction Settings</Text>
            {SETTINGS.map((setting) => (
              <View key={setting.key} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingLabelRow}>
                    <Text style={styles.settingEmoji}>{setting.emoji}</Text>
                    <Text style={styles.settingLabel}>{setting.label}</Text>
                  </View>
                  <Text style={styles.settingDesc}>{setting.description}</Text>
                </View>
                <Switch
                  value={settings[setting.key]}
                  onValueChange={() => toggleSetting(setting.key)}
                  thumbColor={settings[setting.key] ? AccessColors.teal : AccessColors.textTertiary}
                  trackColor={{ false: AccessColors.border, true: AccessColors.tealBorder + '80' }}
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

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    fontWeight: AccessFontWeight.bold,
    color: '#332200',
    textAlign: 'center',
  },

  // Feedback
  feedbackBar: {
    alignSelf: 'stretch',
    backgroundColor: AccessColors.statusGreenBg,
    borderWidth: 1.5,
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
    gap: AccessSpacing.xs,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  bigBtnPressed: { opacity: 0.75, transform: [{ scale: 0.96 }] },
  bigBtnScanHighlighted: {
    borderWidth: 4,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 8,
  },
  bigBtnDwellActive: {
    borderColor: AccessColors.teal,
  },
  dwellProgressBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    top: 0,
    backgroundColor: 'rgba(13, 148, 136, 0.35)',
  },
  dwellText: {
    position: 'absolute',
    bottom: 4,
    fontSize: 11,
    fontWeight: 'bold',
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
    fontWeight: 'bold',
    color: '#332200',
  },

  bigBtnEmoji: { fontSize: 32 },
  bigBtnLabel: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.bold,
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
  explainTitle: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textPrimary,
  },
  explainText: {
    fontSize: AccessFontSize.base,
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
  settingLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  settingEmoji: { fontSize: 18 },
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
