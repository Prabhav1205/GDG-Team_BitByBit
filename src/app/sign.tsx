/**
 * /sign — Sign Language communication module (placeholder).
 *
 * Plug-in point for the Sign Language interaction system.
 * The session state (communicationMode: 'sign') is already set
 * by the ModeSelector before navigation.
 */

import React from 'react';
import { ModePage } from '@/components/access/ModePage';

export default function SignLanguagePage() {
  return (
    <ModePage
      mode="sign"
      iconName="sign"
      title="Sign Language"
      subtitle="Communicate using sign language. A sign language interpreter or recognition system will be available here."
    />
  );
}
