/**
 * /staff — Employee Counter Console (Live Translation + Eligibility + Session Handoff)
 *
 * Designed for counter employees (bank/hospital/govt office staff) on their own laptop/PC screen.
 * Displays:
 *   1. Real-time text translation of citizen inputs (ISL sign, voice, text, assisted touch)
 *   2. Instant matched eligibility & benefit scheme results with recommended staff actions
 *   3. Complete timestamped session timeline & supervisor handoff log
 *   4. Direct staff response & audio broadcast controls
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StaffSidebar } from '@/components/access/StaffSidebar';
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

export default function StaffDashboardPage() {
  const {
    session,
    addStaffReply,
    addSupervisorNote,
    markSessionResolved,
  } = useSession();

  const [replyInput, setReplyInput] = useState('');
  const [supervisorInput, setSupervisorInput] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const activeMode = session.communicationMode
    ? session.communicationMode.replace('-', ' ').toUpperCase()
    : 'SIGN LANGUAGE';

  function handleSendReply() {
    if (!replyInput.trim()) return;
    const text = replyInput.trim();
    addStaffReply(text);
    speechEngine.speak(text, { lang: session.language });
    setReplyInput('');
  }

  function handleQuickReply(text: string) {
    addStaffReply(text);
    speechEngine.speak(text, { lang: session.language });
  }

  function handleAddSupervisorNote() {
    if (!supervisorInput.trim()) return;
    addSupervisorNote(supervisorInput.trim());
    setSupervisorInput('');
    setShowNoteForm(false);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* ── Employee Header ────────────────────────────────────────── */}
        <View style={styles.header} accessibilityRole="none">
          <View style={styles.headerLeft}>
            <Text style={styles.headerBrand}>AccessAssist</Text>
            <Text style={styles.headerSub}>Employee Counter Console</Text>
          </View>
          <View style={styles.headerRight}>
            <StatusBadge
              label={session.isResolved ? 'Session Resolved' : 'Live Connected'}
              variant={session.isResolved ? 'inactive' : 'active'}
            />
            <Text style={styles.sessionIdText}>ID: {session.sessionId}</Text>
          </View>
        </View>

        <View style={styles.body}>
          {/* ── Sidebar ─────────────────────────────────────────────── */}
          <StaffSidebar
            sessionUser={`Citizen ${session.sessionId.slice(-4)}`}
            sessionStatus={session.isResolved ? 'Resolved' : 'Active'}
          />

          {/* ── Main Content Area ───────────────────────────────────── */}
          <ScrollView
            style={styles.main}
            contentContainerStyle={styles.mainContent}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Active Session Summary Strip */}
            <View style={styles.sessionStrip}>
              <InfoTile label="Session ID" value={session.sessionId} />
              <InfoTile label="Institution" value={session.institution ? session.institution.toUpperCase() : 'BANK'} />
              <InfoTile label="Active Mode" value={activeMode} />
              <InfoTile label="Started At" value={session.startedAt} />
              <InfoTile
                label="Status"
                value=""
                badge={
                  <StatusBadge
                    label={session.isResolved ? 'RESOLVED' : 'ACTIVE'}
                    variant={session.isResolved ? 'inactive' : 'active'}
                  />
                }
              />
            </View>

            {/* 2. Live Translation Stream */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>📡 Live Real-Time Translation Stream</Text>
                <Text style={styles.sectionSubtitle}>Shows sign language, voice, or text citizen input without requiring ISL training</Text>
              </View>

              {session.liveTranslations.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>Waiting for live citizen input...</Text>
                </View>
              ) : (
                <View style={styles.translationList}>
                  {session.liveTranslations.map((item, idx) => (
                    <View key={item.id} style={[styles.translationCard, idx === 0 && styles.translationCardLatest]}>
                      <View style={styles.translationHeader}>
                        <View style={styles.modeTag}>
                          <Text style={styles.modeTagText}>{item.modeLabel}</Text>
                        </View>
                        <Text style={styles.timestampText}>{item.timestamp}</Text>
                        {item.confidence && (
                          <View style={styles.confBadge}>
                            <Text style={styles.confBadgeText}>{(item.confidence * 100).toFixed(0)}% Match</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.translationBody}>{`"${item.text}"`}</Text>
                      <View style={styles.translationFooter}>
                        <Pressable
                          style={({ pressed }: any) => [styles.audioReplayBtn, pressed && styles.btnPressed]}
                          onPress={() => speechEngine.speak(item.text, { lang: session.language })}
                        >
                          <KioskIcon name="voice" size={14} color={AccessColors.teal} />
                          <Text style={styles.audioReplayText}>Replay Audio</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 3. Matched Eligibility & Scheme Qualifications */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>📜 Matched Eligibility & Benefit Qualifications</Text>
                <Text style={styles.sectionSubtitle}>Identified government schemes & immediate recommended staff actions</Text>
              </View>

              {session.eligibilityMatches.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No scheme eligibility matches evaluated yet.</Text>
                </View>
              ) : (
                <View style={styles.eligibilityGrid}>
                  {session.eligibilityMatches.map((scheme) => (
                    <View key={scheme.id} style={styles.schemeCard}>
                      <View style={styles.schemeHeader}>
                        <Text style={styles.schemeBadge}>QUALIFIED BENEFIT</Text>
                        <Text style={styles.schemeCategory}>{scheme.category}</Text>
                      </View>
                      <Text style={styles.schemeTitle}>{scheme.schemeName}</Text>
                      <Text style={styles.schemeBenefit}>💰 {scheme.benefitText}</Text>
                      <View style={styles.actionRequiredBox}>
                        <Text style={styles.actionRequiredLabel}>RECOMMENDED STAFF ACTION:</Text>
                        <Text style={styles.actionRequiredText}>👉 {scheme.actionRequired}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* 4. Staff Actions & Kiosk Response Controls */}
            <View style={styles.cardSection}>
              <Text style={styles.sectionTitle}>💬 Respond & Kiosk Broadcast Controls</Text>
              <View style={styles.replyBox}>
                <TextInput
                  style={styles.replyInput}
                  value={replyInput}
                  onChangeText={setReplyInput}
                  placeholder="Type a response to display & announce on citizen kiosk..."
                  placeholderTextColor={AccessColors.textTertiary}
                  multiline
                />
                <View style={styles.replyBtnRow}>
                  <Pressable
                    style={({ pressed }: any) => [
                      styles.sendReplyBtn,
                      !replyInput.trim() && styles.btnDisabled,
                      pressed && styles.btnPressed,
                    ]}
                    onPress={handleSendReply}
                    disabled={!replyInput.trim()}
                  >
                    <KioskIcon name="send" size={16} color={AccessColors.textOnDark} />
                    <Text style={styles.sendReplyBtnText}>Send & Broadcast to Kiosk</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }: any) => [styles.resolveBtn, pressed && styles.btnPressed]}
                    onPress={markSessionResolved}
                  >
                    <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                  </Pressable>
                </View>
              </View>

              {/* Quick Staff Response Chips */}
              <View style={styles.quickChipsRow}>
                <Text style={styles.quickChipsLabel}>Quick Staff Responses:</Text>
                <Pressable
                  style={styles.chipBtn}
                  onPress={() => handleQuickReply('Please provide your identity document or Aadhaar Card.')}
                >
                  <Text style={styles.chipText}>🪪 Request ID Document</Text>
                </Pressable>
                <Pressable
                  style={styles.chipBtn}
                  onPress={() => handleQuickReply('I will assist you with filling out this form now.')}
                >
                  <Text style={styles.chipText}>📋 Form Fill Assistance</Text>
                </Pressable>
                <Pressable
                  style={styles.chipBtn}
                  onPress={() => handleQuickReply('Please proceed to Counter 3 for priority assistance.')}
                >
                  <Text style={styles.chipText}>🏃 Escalate to Counter 3</Text>
                </Pressable>
              </View>
            </View>

            {/* 5. Complete Session Log & Supervisor Handoff History */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🕒 Session Timeline & Handoff Log</Text>
                <Pressable
                  style={styles.addNoteBtn}
                  onPress={() => setShowNoteForm((prev) => !prev)}
                >
                  <Text style={styles.addNoteBtnText}>+ Add Handoff Note</Text>
                </Pressable>
              </View>

              {showNoteForm && (
                <View style={styles.noteFormBox}>
                  <TextInput
                    style={styles.noteInput}
                    value={supervisorInput}
                    onChangeText={setSupervisorInput}
                    placeholder="Enter handover details or supervisor guidance for shift change..."
                    placeholderTextColor={AccessColors.textTertiary}
                  />
                  <Pressable style={styles.saveNoteBtn} onPress={handleAddSupervisorNote}>
                    <Text style={styles.saveNoteBtnText}>Save Handoff Log Entry</Text>
                  </Pressable>
                </View>
              )}

              <View style={styles.timelineList}>
                {session.sessionLogs.map((log, i) => (
                  <View key={log.id} style={styles.timelineRow}>
                    <View style={styles.timelineDotCol}>
                      <View
                        style={[
                          styles.timelineDot,
                          log.type === 'CITIZEN_INPUT' && { backgroundColor: AccessColors.teal },
                          log.type === 'ELIGIBILITY' && { backgroundColor: '#F59E0B' },
                          log.type === 'STAFF_REPLY' && { backgroundColor: AccessColors.navy },
                          log.type === 'SUPERVISOR_NOTE' && { backgroundColor: '#8B5CF6' },
                        ]}
                      />
                      {i < session.sessionLogs.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineMeta}>
                        <Text style={styles.timelineTime}>{log.timestamp}</Text>
                        <Text style={styles.timelineType}>{log.type.replace('_', ' ')}</Text>
                      </View>
                      <Text style={styles.timelineText}>{log.content}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function InfoTile({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoTileLabel}>{label}</Text>
      {badge || <Text style={styles.infoTileValue}>{value}</Text>}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F5F9' },
  screen: { flex: 1, backgroundColor: '#F1F5F9' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: AccessColors.navy,
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    minHeight: 60,
  },
  headerLeft: { gap: 2 },
  headerBrand: { fontSize: AccessFontSize.lg, fontWeight: AccessFontWeight.bold, color: AccessColors.textOnDark },
  headerSub: { fontSize: AccessFontSize.xs, color: AccessColors.textOnDarkMuted },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: AccessSpacing.md },
  sessionIdText: { fontSize: AccessFontSize.xs, color: AccessColors.textOnDarkMuted, fontWeight: 'bold' },

  // Body & Layout
  body: { flex: 1, flexDirection: 'row' },
  main: { flex: 1 },
  mainContent: { padding: AccessSpacing.xl, gap: AccessSpacing.xl },

  // Session Strip
  sessionStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
    backgroundColor: AccessColors.cardDefault,
    padding: AccessSpacing.md,
    borderRadius: AccessRadius.md,
    borderWidth: 1,
    borderColor: AccessColors.border,
  },
  infoTile: {
    flex: 1,
    minWidth: 120,
    paddingVertical: AccessSpacing.xs,
    paddingHorizontal: AccessSpacing.sm,
  },
  infoTileLabel: { fontSize: AccessFontSize.xs, color: AccessColors.textTertiary, textTransform: 'uppercase' },
  infoTileValue: { fontSize: AccessFontSize.sm, fontWeight: AccessFontWeight.bold, color: AccessColors.textPrimary },

  // Card Sections
  cardSection: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    borderWidth: 1,
    borderColor: AccessColors.border,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  sectionHeaderRow: { gap: 4 },
  sectionTitle: { fontSize: AccessFontSize.base, fontWeight: AccessFontWeight.bold, color: AccessColors.textPrimary },
  sectionSubtitle: { fontSize: AccessFontSize.xs, color: AccessColors.textSecondary },

  // Translation Cards
  translationList: { gap: AccessSpacing.sm },
  translationCard: {
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    gap: AccessSpacing.xs,
  },
  translationCardLatest: {
    borderLeftWidth: 4,
    borderLeftColor: AccessColors.teal,
    backgroundColor: AccessColors.tealFaint,
  },
  translationHeader: { flexDirection: 'row', alignItems: 'center', gap: AccessSpacing.sm },
  modeTag: { backgroundColor: AccessColors.navy, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 4 },
  modeTagText: { fontSize: 10, color: '#FFFFFF', fontWeight: 'bold' },
  timestampText: { fontSize: AccessFontSize.xs, color: AccessColors.textTertiary },
  confBadge: { backgroundColor: '#D1FAE5', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 4 },
  confBadgeText: { fontSize: 10, color: '#065F46', fontWeight: 'bold' },
  translationBody: { fontSize: AccessFontSize.base, fontWeight: AccessFontWeight.semibold, color: AccessColors.textPrimary, lineHeight: 24 },
  translationFooter: { flexDirection: 'row', justifyContent: 'flex-end' },
  audioReplayBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4, backgroundColor: AccessColors.cardDefault, borderWidth: 1, borderColor: AccessColors.border },
  audioReplayText: { fontSize: AccessFontSize.xs, color: AccessColors.teal, fontWeight: 'bold' },

  // Eligibility Grid
  eligibilityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: AccessSpacing.md },
  schemeCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    gap: AccessSpacing.xs,
  },
  schemeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  schemeBadge: { fontSize: 9, fontWeight: 'bold', color: '#92400E', backgroundColor: '#FDE68A', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  schemeCategory: { fontSize: AccessFontSize.xs, color: '#92400E' },
  schemeTitle: { fontSize: AccessFontSize.base, fontWeight: AccessFontWeight.bold, color: '#78350F' },
  schemeBenefit: { fontSize: AccessFontSize.sm, fontWeight: AccessFontWeight.semibold, color: '#92400E' },
  actionRequiredBox: { backgroundColor: '#FFFFFF', padding: AccessSpacing.xs + 2, borderRadius: 4, marginTop: 4, gap: 2 },
  actionRequiredLabel: { fontSize: 9, fontWeight: 'bold', color: AccessColors.textTertiary },
  actionRequiredText: { fontSize: AccessFontSize.xs, fontWeight: AccessFontWeight.bold, color: AccessColors.textPrimary },

  // Reply Box
  replyBox: { gap: AccessSpacing.sm },
  replyInput: {
    backgroundColor: AccessColors.background,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
    minHeight: 70,
  },
  replyBtnRow: { flexDirection: 'row', gap: AccessSpacing.md },
  sendReplyBtn: {
    flex: 2,
    backgroundColor: AccessColors.navy,
    paddingVertical: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.xs,
  },
  sendReplyBtnText: { color: AccessColors.textOnDark, fontWeight: AccessFontWeight.bold, fontSize: AccessFontSize.sm },
  resolveBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resolveBtnText: { color: '#FFFFFF', fontWeight: AccessFontWeight.bold, fontSize: AccessFontSize.sm },

  // Quick Chips
  quickChipsRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: AccessSpacing.xs },
  quickChipsLabel: { fontSize: AccessFontSize.xs, fontWeight: 'bold', color: AccessColors.textSecondary },
  chipBtn: { backgroundColor: AccessColors.background, borderWidth: 1, borderColor: AccessColors.border, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 16 },
  chipText: { fontSize: AccessFontSize.xs, color: AccessColors.textPrimary, fontWeight: AccessFontWeight.medium },

  // Timeline
  addNoteBtn: { backgroundColor: AccessColors.tealLight, borderWidth: 1, borderColor: AccessColors.tealBorder, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 4, alignSelf: 'flex-start' },
  addNoteBtnText: { fontSize: AccessFontSize.xs, color: AccessColors.teal, fontWeight: 'bold' },
  noteFormBox: { gap: AccessSpacing.xs, backgroundColor: AccessColors.background, padding: AccessSpacing.md, borderRadius: AccessRadius.sm, borderWidth: 1, borderColor: AccessColors.border },
  noteInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: AccessColors.border, padding: AccessSpacing.sm, borderRadius: 4, fontSize: AccessFontSize.sm },
  saveNoteBtn: { backgroundColor: AccessColors.teal, paddingVertical: AccessSpacing.xs + 2, borderRadius: 4, alignItems: 'center' },
  saveNoteBtnText: { color: '#FFFFFF', fontSize: AccessFontSize.xs, fontWeight: 'bold' },

  timelineList: { gap: AccessSpacing.xs },
  timelineRow: { flexDirection: 'row', gap: AccessSpacing.md },
  timelineDotCol: { alignItems: 'center', width: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, backgroundColor: AccessColors.navy },
  timelineLine: { width: 1, flex: 1, backgroundColor: AccessColors.divider, marginTop: 4 },
  timelineContent: { flex: 1, paddingBottom: AccessSpacing.xs, gap: 2 },
  timelineMeta: { flexDirection: 'row', gap: AccessSpacing.sm, alignItems: 'center' },
  timelineTime: { fontSize: AccessFontSize.xs, color: AccessColors.textTertiary, fontVariant: ['tabular-nums'] },
  timelineType: { fontSize: 10, color: AccessColors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase' },
  timelineText: { fontSize: AccessFontSize.sm, color: AccessColors.textPrimary },

  emptyCard: { padding: AccessSpacing.lg, alignItems: 'center', backgroundColor: AccessColors.background, borderRadius: AccessRadius.sm },
  emptyText: { color: AccessColors.textTertiary, fontStyle: 'italic' },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.8 },
});
