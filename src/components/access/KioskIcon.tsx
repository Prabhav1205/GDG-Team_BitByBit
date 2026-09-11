/**
 * KioskIcon — shared icon component for the accessibility kiosk.
 *
 * Uses expo-symbols which renders:
 *   – SF Symbols on iOS
 *   – Material Symbols (Google) on Android and web
 *
 * The `web` field of the name object maps to the exact Material Symbols
 * ligature name (confirmed against expo-symbols/build/android/symbols.json).
 */

import React from 'react';
import { SymbolView } from 'expo-symbols';

// ── Icon registry ─────────────────────────────────────────────────────────

export type IconName =
  | 'sign'
  | 'voice'
  | 'text'
  | 'touch'
  | 'settings'
  | 'back'
  | 'status';

const ICON_MAP: Record<
  IconName,
  { ios: string; android: string; web: string }
> = {
  sign: {
    ios: 'person.wave.2',
    android: 'sign_language',
    web: 'sign_language',
  },
  voice: {
    ios: 'mic',
    android: 'mic',
    web: 'mic',
  },
  text: {
    ios: 'message',
    android: 'keyboard',
    web: 'keyboard',
  },
  touch: {
    ios: 'hand.tap',
    android: 'touch_app',
    web: 'touch_app',
  },
  settings: {
    ios: 'gearshape',
    android: 'settings',
    web: 'settings',
  },
  back: {
    ios: 'arrow.left',
    android: 'arrow_back',
    web: 'arrow_back',
  },
  status: {
    ios: 'circle.fill',
    android: 'circle',
    web: 'circle',
  },
};

// ── Component ─────────────────────────────────────────────────────────────

interface KioskIconProps {
  name: IconName;
  /** Icon size in points. Default: 32 */
  size?: number;
  /** Icon colour. Default: institutional navy #1B2D4F */
  color?: string;
}

export function KioskIcon({
  name,
  size = 32,
  color = '#1B2D4F',
}: KioskIconProps) {
  const symbolName = ICON_MAP[name];
  return (
    <SymbolView
      // expo-symbols accepts { ios?, android?, web? } per-platform names
      name={symbolName as any}
      tintColor={color}
      size={size}
    />
  );
}
