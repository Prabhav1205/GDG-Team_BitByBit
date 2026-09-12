/**
 * ModeSelector — 2 × 2 grid of communication mode options.
 *
 * Layout:
 *   — Landscape (width ≥ 700): two columns, two rows
 *   — Portrait / narrow (width < 700): single column
 *
 * The grid is intentionally constrained in max-width so that cards
 * do not become uncomfortably wide on large kiosk displays.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { router } from 'expo-router';

import { ModeCard } from './ModeCard';
import { useSession, type CommunicationMode } from '@/context/SessionContext';
import { useAudioNav } from '@/context/AudioNavContext';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { UI_STRINGS } from '@/constants/i18n';

// ── Mode definitions ─────────────────────────────────────────────────────

const getModes = (ui: typeof UI_STRINGS.en) => [
  {
    id: 'sign' as CommunicationMode,
    iconName: 'sign' as const,
    title: ui.modeSignTitle ?? 'Sign Language',
    description: ui.modeSignDesc ?? 'Communicate using sign language',
    route: '/sign' as const,
    testID: 'mode-sign',
    shortcutNumber: 1,
  },
  {
    id: 'text' as CommunicationMode,
    iconName: 'text' as const,
    title: ui.modeTextTitle ?? 'Text',
    description: ui.modeTextDesc ?? 'Type what you need to communicate',
    route: '/text' as const,
    testID: 'mode-text',
    shortcutNumber: 2,
  },
  {
    id: 'assisted-touch' as CommunicationMode,
    iconName: 'touch' as const,
    title: ui.modeAssistedTitle ?? 'Assisted Touch',
    description: ui.modeAssistedDesc ?? 'Use simplified controls with larger touch targets',
    route: '/assisted-touch' as const,
    testID: 'mode-assisted-touch',
    shortcutNumber: 3,
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────

export function ModeSelector() {
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const { session, setMode } = useSession();
  const { announce } = useAudioNav();
  const ui = UI_STRINGS[session.language] ?? UI_STRINGS.en;
  const modes = getModes(ui);

  const isNarrow = width < 700;

  function handleSelect(modeId: CommunicationMode, route: string, title: string) {
    setMode(modeId);
    announce(`Selected ${title}`);
    // Small deliberate pause so the selected state is visible before navigation
    setTimeout(() => {
      router.push(route as any);
    }, 160);
  }

  // Keyboard shortcut listener (1-4)
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['1', '2', '3', '4'].includes(e.key)) {
        const index = parseInt(e.key, 10) - 1;
        const targetMode = modes[index];
        if (targetMode) {
          handleSelect(targetMode.id, targetMode.route, targetMode.title);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modes]);

  // Chunk modes dynamically into rows
  const rows: (typeof modes[number])[][] = [];
  if (isNarrow) {
    modes.forEach((m) => rows.push([m]));
  } else {
    for (let i = 0; i < modes.length; i += 2) {
      rows.push(modes.slice(i, i + 2));
    }
  }

  return (
    <View
      style={styles.container}
      role="group"
      accessibilityLabel="Communication mode options. Press keys 1 through 3 to choose."
    >
      {rows.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={[styles.row, isNarrow && styles.rowNarrow]}
        >
          {row.map((mode) => (
            <ModeCard
              key={mode.id}
              iconName={mode.iconName}
              title={mode.title}
              description={mode.description}
              selected={session.communicationMode === mode.id}
              onSelect={() => handleSelect(mode.id, mode.route, mode.title)}
              shortcutNumber={mode.shortcutNumber}
              testID={mode.testID}
              isNarrow={isNarrow}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 960,
    alignSelf: 'center',
    gap: AccessSpacing.md,
  },

  // Two-column layout (landscape kiosk)
  gridDouble: {},
  // Single-column layout (narrow/portrait)
  gridSingle: {},

  row: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
  },
  rowNarrow: {
    flexDirection: 'column',
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
