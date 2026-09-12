/**
 * /staff/session — Staff Session Detail & Handoff View
 *
 * Employee-facing detailed view showing:
 *   — Real-time conversation stream (citizen translations + staff replies)
 *   — Converted message history by mode (Sign Language, Voice, Text, Assisted Touch)
 *   — Complete session timeline & supervisor handoff log
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
import { useSession } from '@/context/SessionContext';
import { speechEngine } from '@/services/speech-engine';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

export default function StaffSessionPage() {
  const { session, addStaffReply, markSessionResolved } = useSession();
  const [staffResponse, setStaffResponse] = useState('');

  const activeMode = session.communicationMode
    ? session.communicationMode.replace('-', ' ').toUpperCase()
    : 'SIGN LANGUAGE';

  // Build conversation messages array from liveTranslations + logs
  const conversationMessages: ConversationMessage[] = [
    ...session.liveTranslations.map((t) => ({
      id: t.id,
      sender: 'user' as const,
      text: t.text,
      timestamp: t.timestamp,
    })),
    ...session.sessionLogs
      .filter((l) => l.type === 'STAFF_REPLY')
      .map((l) => ({
        id: l.id,
        sender: 'staff' as const,
        text: l.content.replace('Staff Reply sent to Kiosk: ', '').replace(/^"|"$/g, ''),
        timestamp: l.timestamp,
      })),
  ].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  function handleSendResponse() {
    if (!staffResponse.trim()) return;
    const text = staffResponse.trim();
    addStaffReply(text);
    speechEngine.speak(text, { lang: session.language });
    setStaffResponse('');
  }

  function handleEndSession() {
    markSessionResolved();
    router.replace('/staff');
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={({ pressed }: any) => [styles.backBtn, pressed && styles.btnPressed]}
            onPress={() => router.push('/staff')}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <KioskIcon name="back" size={16} color={AccessColors.textOnDarkMuted} />
            <Text style={styles.backLabel}>Dashboard</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Session Detail — {session.sessionId}</Text>
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
          <StaffSidebar
            sessionUser={`Citizen ${session.sessionId.slice(-4)}`}
            sessionStatus={session.isResolved ? 'Resolved' : 'Active'}
          />

          {/* Main */}
          <View style={styles.main}>
            <ScrollView
              style={styles.mainScroll}
              contentContainerStyle={styles.mainContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Session info strip */}
              <View style={styles.infoStrip}>
                <InfoPill label="Session ID" value={session.sessionId} />
                <InfoPill label="Institution" value={session.institution ? session.institution.toUpperCase() : 'BANK'} />
                <InfoPill label="Mode" value={activeMode} />
                <InfoPill label="Started" value={session.startedAt} />
                <StatusBadge
                  label={session.isResolved ? 'RESOLVED' : 'ACTIVE'}
                  variant={session.isResolved ? 'inactive' : 'active'}
                />
              </View>

              {/* Two-column area */}
              <View style={styles.twoCol}>
                {/* Left: Conversation */}
                <View style={styles.col}>
                  <Text style={styles.colTitle}>Conversation History</Text>
                  <View style={styles.chatCard}>
                    {conversationMessages.length === 0 ? (
                      <Text style={styles.emptyText}>No messages recorded yet in this session.</Text>
                    ) : (
                      conversationMessages.map((msg) => (
                        <ConversationBubble key={msg.id} message={msg} />
                      ))
                    )}
                  </View>

                  {/* Response input */}
                  <View style={styles.responseBox}>
                    <Text style={styles.responseLabel}>Staff Response (Broadcasts to Kiosk & Speaks Aloud)</Text>
                    <TextInput
                      style={styles.responseInput}
                      value={staffResponse}
                      onChangeText={setStaffResponse}
                      placeholder="Type your response to the user..."
                      placeholderTextColor={AccessColors.textTertiary}
                      multiline
                      accessibilityLabel="Staff response input"
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
                        Send Response to Kiosk
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {/* Right: Converted messages + Timeline */}
                <View style={styles.colNarrow}>
                  <Text style={styles.colTitle}>Converted Input Stream</Text>
                  <View style={styles.sideCard}>
                    {session.liveTranslations.length === 0 ? (
                      <Text style={styles.emptyText}>No translated inputs.</Text>
                    ) : (
                      session.liveTranslations.map((m) => (
                        <View key={m.id} style={styles.convertedMsg}>
                          <View style={styles.convertedMsgHeader}>
                            <Text style={styles.convertedMsgTime}>{m.timestamp}</Text>
                            <Text style={styles.convertedMsgMode}>{m.modeLabel}</Text>
                          </View>
                          <Text style={styles.convertedMsgText}>{m.text}</Text>
                        </View>
                      ))
                    )}
                  </View>

                  <Text style={[styles.colTitle, { marginTop: AccessSpacing.lg }]}>Session Log & Handoff Timeline</Text>
                  <View style={styles.sideCard}>
                    {session.sessionLogs.map((entry) => (
                      <View key={entry.id} style={styles.timelineItem}>
                        <View style={styles.timelineDotCol}>
                          <View
                            style={[
                              styles.timelineDot,
                              entry.type === 'CITIZEN_INPUT' && { backgroundColor: AccessColors.teal },
                              entry.type === 'ELIGIBILITY' && { backgroundColor: '#F59E0B' },
                              entry.type === 'STAFF_REPLY' && { backgroundColor: AccessColors.navy },
                              entry.type === 'SUPERVISOR_NOTE' && { backgroundColor: '#8B5CF6' },
                            ]}
                          />
                        </View>
                        <View style={styles.timelineContent}>
                          <Text style={styles.timelineTime}>{entry.timestamp}</Text>
                          <Text style={styles.timelineEvent}>{entry.content}</Text>
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

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoPill}>
      <Text style={styles.infoPillLabel}>{label}</Text>
      <Text style={styles.infoPillValue}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

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
    minHeight: 36,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 14,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: AccessSpacing.xs,
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
  emptyText: {
    color: AccessColors.textTertiary,
    fontStyle: 'italic',
  },
});
