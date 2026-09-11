/**
 * /text — Text communication module (placeholder).
 *
 * Plug-in point for the text input and output system.
 * The session state (communicationMode: 'text') is already set
 * by the ModeSelector before navigation.
 */

import React from 'react';
import { ModePage } from '@/components/access/ModePage';

export default function TextPage() {
  return (
    <ModePage
      mode="text"
      iconName="text"
      title="Text"
      subtitle="Type what you need to communicate. Your messages will be displayed clearly for the staff member to read."
    />
  );
}
