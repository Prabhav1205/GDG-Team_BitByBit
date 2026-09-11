/**
 * /staff/session â€” Staff Session Detail
 *
 * Detailed view of the current active user session.
 * All data is mock/static. Teammates can wire up WebSocket/backend.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { StaffSidebar } from '@/components/access/StaffSidebar';
import { ConversationBubble, type ConversationMessage } from '@/components/access/ConversationBubble';
import { StatusBadge } from '@/components/access/StatusBadge';
import { KioskIcon } from '@/components/access/KioskIcon';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// â”€â”€ Mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SESSION_INFO = {
  user: 'User #1042',
  institution: 'Bank',
  mode: 'Sign Language',
  status: 'Active',
  startedAt: '09:41',
  sessionId: 'lp3m7x-k8q2nf',
};

const MOCK_MESSAGES: ConversationMessage[] = [
  { id: '1', sender: 'user',  text: 'I need help opening a bank account.',        timestamp: '09:42' },
  { id: '2', sender: 'staff', text: 'Sure, I can help you with that.',             timestamp: '09:43' },
  { id: '3', sender: 'user',  text: 'Do I need any documents?',                   timestamp: '09:43' },
  { id: '4', sender: 'staff', text: 'You will need a valid identity document.',   timestamp: '09:44' },
];

const CONVERTED_MESSAGES = [
  { id: 'c1', text: 'I need help opening a bank account.', mode: 'Sign Language', time: '09:42' },
  { id: 'c2', text: 'Do I need any documents?',            mode: 'Sign Language', time: '09:43' },
];

const TIMELINE = [
  { time: '09:41', event: 'Session started',              type: 'info'    },
  { time: '09:42', event: 'Mode selected: Sign Language', type: 'info'    },
  { time: '09:43', event: 'Message received from user',   type: 'message' },
  { time: '09:44', event: 'Staff response sent',          type: 'success' },
];

const DOT_COLOR: Record<string, string> = {
  info:    AccessColors.navy,
  message: AccessColors.teal,
  success: AccessColors.statusGreen,
};

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function StaffSessionPage() {
  const [staffResponse, setStaffResponse] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>(MOCK_MESSAGES);

  function handleSendResponse() {
    if (!staffResponse.trim()) return;
    const msg: ConversationMessage = {
      id: Date.now().toString(),
      sender: 'staff',
      text: staffResponse.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, msg]);
    setStaffResponse('');
  }

  function handleEndSession() {
    router.replace('/staff' as any);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }: any) => [styles.backBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/staff' as any)}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <KioskIcon name="back" size={16} color={AccessColors.textOnDarkMuted} />
            <Text style={styles.backLabel}>Dashboard</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Session Detail</Text>
          <Pressable
            style={({ pressed }: any) => [styles.endBtn, pressed && styles.btnPressed]}
            onPress={handleEndSession}
            accessibilityRole="button"
            accessibilityLabel="End session"
          >
            <Text style={styles.endBtnLabel}>End Session</Text>
          </Pressable>
        </View>

        <View style={styles.body}>
          {/* Sidebar */}
          <StaffSidebar sessionUser={SESSION_INFO.user} sessionStatus={SESSION_INFO.status} />

          {/* Main */}
          <View style={styles.main}>
            <ScrollView
              style={styles.mainScroll}
              contentContainerStyle={styles.mainContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Session info strip */}
              <View style={styles.infoStrip}>
                <InfoPill label="User" value={SESSION_INFO.user} />
                <InfoPill label="Institution" value={SESSION_INFO.institution} />
                <InfoPill label="Mode" value={SESSION_INFO.mode} />
                <InfoPill label="Started" value={SESSION_INFO.startedAt} />
                <StatusBadge label={SESSION_INFO.status} variant="active" />
              </View>

              {/* Two-column area */}
              <View style={styles.twoCol}>
                {/* Left: Conversation */}
                <View style={styles.col}>
                  <Text style={styles.colTitle}>Conversation</Text>
                  <View style={styles.chatCard}>
                    {messages.map((msg) => (
                      <ConversationBubble key={msg.id} message={msg} />
                    ))}
                  </View>

                  {/* Response input */}
                  <View style={styles.responseBox}>
                    <Text style={styles.responseLabel}>Staff Response</Text>
                    <TextInput
                      style={styles.responseInput}
                      value={staffResponse}
                      onChangeText={setStaffResponse}
                      placeholder="Type your response to the user..."
                      placeholderTextColor={AccessColors.textTertiary}
                      multiline
                      accessibilityLabel="Staff response input"
                      testID="staff-response-input"
                    />
                    <Pressable
                      style={({ pressed }: any) => [
                        styles.sendBtn,
                        !staffResponse.trim() && styles.sendBtnDisabled,
                        pressed && styles.btnPressed,
                      ]}
                      onPress={handleSendResponse}
                      disabled={!staffResponse.trim()}
                      accessibilityRole="button"
                      accessibilityLabel="Send response to user"
                    >
                      <KioskIcon
                        name="send"
                        size={16}
                        color={staffResponse.trim() ? AccessColors.textOnDark : AccessColors.textTertiary}
                      />
                      <Text
                        style={[
                          styles.sendBtnLabel,
                          !staffResponse.trim() && styles.sendBtnLabelDisabled,
                        ]}
                      >
                        Send Response
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Right: Converted messages + Timeline */}
                <View style={styles.colNarrow}>
                  <Text style={styles.colTitle}>Converted Messages</Text>
                  <View style={styles.sideCard}>
                    {CONVERTED_MESSAGES.map((m) => (
                      <View key={m.id} style={styles.convertedMsg}>
                        <View style={styles.convertedMsgHeader}>
                          <Text style={styles.convertedMsgTime}>{m.time}</Text>
                          <Text style={styles.convertedMsgMode}>{m.mode}</Text>
                        </View>
                        <Text style={styles.convertedMsgText}>{m.text}</Text>
                      </View>
                    ))}
                  </View>

                  <Text style={[styles.colTitle, { marginTop: AccessSpacing.lg }]}>Session Timeline</Text>
                  <View style={styles.sideCard}>
                    {TIMELINE.map((entry, i) => (
                      <View key={i} style={styles.timelineItem}>
                        <View style={styles.timelineDotCol}>
                          <View style={[styles.timelineDot, { backgroundColor: DOT_COLOR[entry.type] }]} />
                          {i < TIMELINE.length - 1 && <View style={styles.timelineLine} />}
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTime}>{entry.time}</Text>
                          <Text style={styles.timelineEvent}>{entry.event}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillLabel}>{label}</Text>
      <Text style={styles.infoPillValue}>{value}</Text>
    </View>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F3F7' },
  screen: { flex: 1, backgroundColor: '#F1F3F7' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AccessColors.navy,
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    minHeight: 56,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  backLabel: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textOnDarkMuted,
    fontWeight: AccessFontWeight.medium,
  },
  headerTitle: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textOnDark,
  },
  endBtn: {
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.lg,
    borderRadius: AccessRadius.sm,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  endBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: '#FCA5A5',
  },
  btnPressed: { opacity: 0.75 },

  // Body
  body: { flex: 1, flexDirection: 'row' },
  main: { flex: 1 },
  mainScroll: { flex: 1 },
  mainContent: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xl,
  },

  // Info strip
  infoStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
    alignItems: 'center',
  },
  infoPill: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    paddingVertical: AccessSpacing.xs + 2,
    paddingHorizontal: AccessSpacing.md,
    gap: 2,
  },
  infoPillLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoPillValue: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },

  // Two columns
  twoCol: {
    flexDirection: 'row',
    gap: AccessSpacing.xl,
    flexWrap: 'wrap',
  },
  col: {
    flex: 2,
    minWidth: 280,
    gap: AccessSpacing.lg,
  },
  colNarrow: {
    flex: 1,
    minWidth: 220,
    gap: AccessSpacing.sm,
  },
  colTitle: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },

  // Chat card
  chatCard: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.lg,
    minHeight: 200,
  },

  // Response box
  responseBox: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  responseLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  responseInput: {
    backgroundColor: AccessColors.background,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
    minHeight: 80,
    lineHeight: 24,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.sm,
    paddingVertical: AccessSpacing.md,
    borderRadius: AccessRadius.md,
    backgroundColor: AccessColors.navy,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  sendBtnDisabled: { backgroundColor: AccessColors.borderLight },
  sendBtnLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textOnDark,
  },
  sendBtnLabelDisabled: { color: AccessColors.textTertiary },

  // Side card
  sideCard: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.lg,
    gap: AccessSpacing.md,
  },
  convertedMsg: {
    backgroundColor: AccessColors.background,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderLeftWidth: 3,
    borderLeftColor: AccessColors.teal,
    padding: AccessSpacing.md,
    gap: 4,
  },
  convertedMsgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convertedMsgTime: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  convertedMsgMode: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.teal,
    fontWeight: AccessFontWeight.medium,
  },
  convertedMsgText: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
    lineHeight: 22,
  },

  // Timeline
  timelineItem: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    minHeight: 44,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 16,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: AccessColors.divider,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: AccessSpacing.sm,
    gap: 2,
  },
  timelineTime: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  timelineEvent: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textPrimary,
  },
});


