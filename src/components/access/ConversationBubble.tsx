/**
 * ConversationBubble — a single chat message in the conversation view.
 *
 * Sender variants:
 *   user  — right-aligned, navy background
 *   staff — left-aligned, white card with border
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// ── Types ─────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  id: string;
  sender: 'user' | 'staff';
  text: string;
  timestamp: string;
}

interface ConversationBubbleProps {
  message: ConversationMessage;
}

// ── Component ─────────────────────────────────────────────────────────────

export function ConversationBubble({ message }: ConversationBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowStaff]}>
      {/* Sender label */}
      {!isUser && (
        <Text style={styles.senderLabel}>Staff</Text>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleStaff]}>
        <Text style={[styles.text, isUser ? styles.textUser : styles.textStaff]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isUser ? styles.timeUser : styles.timeStaff]}>
          {message.timestamp}
        </Text>
      </View>

      {isUser && (
        <Text style={styles.senderLabelRight}>You</Text>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  row: {
    gap: AccessSpacing.xs,
  },
  rowUser: {
    alignItems: 'flex-end',
  },
  rowStaff: {
    alignItems: 'flex-start',
  },
  senderLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textTertiary,
    paddingLeft: AccessSpacing.sm,
  },
  senderLabelRight: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textTertiary,
    paddingRight: AccessSpacing.sm,
  },
  bubble: {
    maxWidth: '78%',
    paddingVertical: AccessSpacing.sm + 2,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.md,
    gap: 4,
  },
  bubbleUser: {
    backgroundColor: AccessColors.navy,
    borderBottomRightRadius: 4,
  },
  bubbleStaff: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: AccessFontSize.base,
    lineHeight: 24,
  },
  textUser: {
    color: AccessColors.textOnDark,
    fontWeight: AccessFontWeight.regular,
  },
  textStaff: {
    color: AccessColors.textPrimary,
    fontWeight: AccessFontWeight.regular,
  },
  time: {
    fontSize: AccessFontSize.xs,
  },
  timeUser: {
    color: AccessColors.textOnDarkMuted,
    textAlign: 'right',
  },
  timeStaff: {
    color: AccessColors.textTertiary,
  },
});
