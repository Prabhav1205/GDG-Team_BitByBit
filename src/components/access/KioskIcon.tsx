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
  | 'status'
  | 'mic'
  | 'camera'
  | 'chat'
  | 'star'
  | 'person'
  | 'check'
  | 'send'
  | 'close'
  | 'filter'
  | 'contrast'
  | 'bank'
  | 'hospital'
  | 'government'
  | 'help'
  | 'info'
  | 'next'
  | 'repeat'
  | 'done'
  | 'language'
  | 'time'
  | 'warning'
  | 'dashboard'
  | 'history'
  | 'session'
  | 'benefits'
  | 'respond'
  | 'resolve';

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
  mic: {
    ios: 'mic.fill',
    android: 'mic',
    web: 'mic',
  },
  camera: {
    ios: 'camera',
    android: 'videocam',
    web: 'videocam',
  },
  chat: {
    ios: 'bubble.left.and.bubble.right',
    android: 'chat',
    web: 'chat',
  },
  star: {
    ios: 'star',
    android: 'star',
    web: 'star',
  },
  person: {
    ios: 'person',
    android: 'person',
    web: 'person',
  },
  check: {
    ios: 'checkmark',
    android: 'check',
    web: 'check',
  },
  send: {
    ios: 'paperplane',
    android: 'send',
    web: 'send',
  },
  close: {
    ios: 'xmark',
    android: 'close',
    web: 'close',
  },
  filter: {
    ios: 'line.3.horizontal.decrease',
    android: 'filter_list',
    web: 'filter_list',
  },
  contrast: {
    ios: 'circle.lefthalf.filled',
    android: 'contrast',
    web: 'contrast',
  },
  bank: {
    ios: 'building.columns',
    android: 'account_balance',
    web: 'account_balance',
  },
  hospital: {
    ios: 'cross.case',
    android: 'local_hospital',
    web: 'local_hospital',
  },
  government: {
    ios: 'flag',
    android: 'account_balance',
    web: 'account_balance',
  },
  help: {
    ios: 'questionmark.circle',
    android: 'help',
    web: 'help',
  },
  info: {
    ios: 'info.circle',
    android: 'info',
    web: 'info',
  },
  next: {
    ios: 'arrow.right',
    android: 'arrow_forward',
    web: 'arrow_forward',
  },
  repeat: {
    ios: 'repeat',
    android: 'repeat',
    web: 'repeat',
  },
  done: {
    ios: 'checkmark.circle',
    android: 'check_circle',
    web: 'check_circle',
  },
  language: {
    ios: 'globe',
    android: 'language',
    web: 'language',
  },
  time: {
    ios: 'clock',
    android: 'schedule',
    web: 'schedule',
  },
  warning: {
    ios: 'exclamationmark.triangle',
    android: 'warning',
    web: 'warning',
  },
  dashboard: {
    ios: 'square.grid.2x2',
    android: 'dashboard',
    web: 'dashboard',
  },
  history: {
    ios: 'clock.arrow.circlepath',
    android: 'history',
    web: 'history',
  },
  session: {
    ios: 'person.crop.rectangle',
    android: 'badge',
    web: 'badge',
  },
  benefits: {
    ios: 'star.circle',
    android: 'verified',
    web: 'verified',
  },
  respond: {
    ios: 'arrowshape.turn.up.left',
    android: 'reply',
    web: 'reply',
  },
  resolve: {
    ios: 'checkmark.seal',
    android: 'task_alt',
    web: 'task_alt',
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
