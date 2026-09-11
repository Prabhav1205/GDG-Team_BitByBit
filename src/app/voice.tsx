/**
 * /voice — Voice communication module (placeholder).
 *
 * Plug-in point for the voice recognition and synthesis system.
 * The session state (communicationMode: 'voice') is already set
 * by the ModeSelector before navigation.
 */

import React from 'react';
import { ModePage } from '@/components/access/ModePage';

export default function VoicePage() {
  return (
    <ModePage
      mode="voice"
      iconName="voice"
      title="Voice"
      subtitle="Speak naturally using your voice. The system will listen and respond to your spoken requests."
    />
  );
}
