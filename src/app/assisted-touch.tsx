/**
 * /assisted-touch — Assisted Touch communication module (placeholder).
 *
 * Plug-in point for the simplified large-target touch interaction system.
 * The session state (communicationMode: 'assisted-touch') is already set
 * by the ModeSelector before navigation.
 */

import React from 'react';
import { ModePage } from '@/components/access/ModePage';

export default function AssistedTouchPage() {
  return (
    <ModePage
      mode="assisted-touch"
      iconName="touch"
      title="Assisted Touch"
      subtitle="Use simplified controls with larger touch targets. All buttons and actions are designed for easy, precise interaction."
    />
  );
}
