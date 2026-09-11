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

import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { ModeCard } from './ModeCard';
import { useSession, type CommunicationMode } from '@/context/SessionContext';
import {
  AccessColors,
  AccessSpacing,
} from '@/constants/access-theme';

// ── Mode definitions ─────────────────────────────────────────────────────

const MODES = [
  {
    id: 'sign' as CommunicationMode,
    iconName: 'sign' as const,
    title: 'Sign Language',
    description: 'Communicate using sign language',
    route: '/sign' as const,
    testID: 'mode-sign',
  },
  {
    id: 'voice' as CommunicationMode,
    iconName: 'voice' as const,
    title: 'Voice',
    description: 'Speak naturally using your voice',
    route: '/voice' as const,
    testID: 'mode-voice',
  },
  {
    id: 'text' as CommunicationMode,
    iconName: 'text' as const,
    title: 'Text',
    description: 'Type what you need to communicate',
    route: '/text' as const,
    testID: 'mode-text',
  },
  {
    id: 'assisted-touch' as CommunicationMode,
    iconName: 'touch' as const,
    title: 'Assisted Touch',
    description: 'Use simplified controls with larger touch targets',
    route: '/assisted-touch' as const,
    testID: 'mode-assisted-touch',
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────

export function ModeSelector() {
  const { width } = useWindowDimensions();
  const { session, setMode } = useSession();

  const isNarrow = width < 700;
  const gridStyle = isNarrow ? styles.gridSingle : styles.gridDouble;

  function handleSelect(modeId: CommunicationMode, route: string) {
    setMode(modeId);
    // Small deliberate pause so the selected state is visible before navigation
    setTimeout(() => {
      router.push(route as any);
    }, 160);
  }

  // Chunk modes into rows of 2 for the 2-column layout
  const rows = isNarrow
    ? MODES.map((m) => [m])
    : [
        [MODES[0], MODES[1]],
        [MODES[2], MODES[3]],
      ];

  return (
    <View
      style={styles.container}
      accessibilityRole="group"
      accessibilityLabel="Communication mode options"
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
              onSelect={() => handleSelect(mode.id, mode.route)}
              testID={mode.testID}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
});
