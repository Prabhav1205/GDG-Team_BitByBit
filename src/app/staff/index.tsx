/**
 * /staff â€” Staff Dashboard
 *
 * Professional desktop dashboard for institutional staff.
 * All data is mock/static. Teammates can replace with WebSocket/API integration.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { AccessHeader } from '@/components/access/AccessHeader';
import { StaffSidebar } from '@/components/access/StaffSidebar';
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

const SESSION = {
  user: 'User #1042',
  institution: 'Bank',
  mode: 'Sign Language',
  status: 'Active',
};

const TRANSLATED_MESSAGE = 'I need help opening a bank account.';

const SUGGESTIONS = [
  { id: 's1', title: 'Accessible Account Opening',  desc: 'Guide user through accessible account opening process.' },
  { id: 's2', title: 'Priority Assistance',          desc: 'Escalate to priority counter for faster service.'       },
  { id: 's3', title: 'Form Assistance',              desc: 'Provide form filling support for the user.'             },
];

const TIMELINE = [
  { time: '09:41', event: 'Interaction started'          },
  { time: '09:42', event: 'Mode selected: Sign Language' },
  { time: '09:43', event: 'Message received'             },
  { time: '09:44', event: 'Staff response sent'          },
];

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function StaffDashboardPage() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* â”€â”€ Staff header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <View style={styles.header} accessibilityRole="none">
          <Text style={styles.headerTitle}>AccessAssist â€” Staff Dashboard</Text>
          <View style={styles.headerRight}>
            <StatusBadge label="System Online" variant="active" />
          </View>
        </View>

        <View style={styles.body}>
          {/* â”€â”€ Sidebar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <StaffSidebar
            sessionUser={SESSION.user}
            sessionStatus={SESSION.status}
          />

          {/* â”€â”€ Main content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <ScrollView
            style={styles.main}
            contentContainerStyle={styles.mainContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Current session */}
            <Section title="Current Session">
              <View style={styles.sessionGrid}>
                <InfoTile label="User"        value={SESSION.user}        />
                <InfoTile label="Institution" value={SESSION.institution} />
                <InfoTile label="Mode"        value={SESSION.mode}        />
                <InfoTile
                  label="Status"
                  value=""
                  badge={<StatusBadge label={SESSION.status} variant="active" />}
                />
              </View>
              <Pressable
                style={({ pressed }: any) => [styles.viewSessionBtn, pressed && styles.btnPressed]}
                onPress={() => router.push('/staff/session' as any)}
                accessibilityRole="button"
                accessibilityLabel="View full session details"
              >
                <Text style={styles.viewSessionBtnLabel}>View Full Session</Text>
                <KioskIcon name="next" size={14} color={AccessColors.navy} />
              </Pressable>
            </Section>

            {/* Translated message */}
            <Section title="Translated / Converted Message">
              <View style={styles.messageCard}>
                <Text style={styles.messageText}>{TRANSLATED_MESSAGE}</Text>
              </View>
              <View style={styles.messageActions}>
                <StaffActionBtn
                  icon="respond"
                  label="Respond"
                  onPress={() => router.push('/staff/session' as any)}
                />
                <StaffActionBtn
                  icon="repeat"
                  label="Repeat"
                  onPress={() => {}}
                />
                <StaffActionBtn
                  icon="resolve"
                  label="Mark Resolved"
                  variant="success"
                  onPress={() => {}}
                />
              </View>
            </Section>

            {/* Suggested assistance */}
            <Section title="Suggested Assistance">
              <View style={styles.suggestionRow}>
                {SUGGESTIONS.map((s) => (
                  <View key={s.id} style={styles.suggestionCard}>
                    <KioskIcon name="star" size={20} color={AccessColors.teal} />
                    <Text style={styles.suggestionTitle}>{s.title}</Text>
                    <Text style={styles.suggestionDesc}>{s.desc}</Text>
                  </View>
                ))}
              </View>
            </Section>

            {/* Session timeline */}
            <Section title="Session Timeline">
              <View style={styles.timeline}>
                {TIMELINE.map((entry, i) => (
                  <View key={i} style={styles.timelineItem}>
                    <View style={styles.timelineDotCol}>
                      <View style={styles.timelineDot} />
                      {i < TIMELINE.length - 1 && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineTime}>{entry.time}</Text>
                      <Text style={styles.timelineEvent}>{entry.event}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </Section>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function InfoTile({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <View style={styles.infoTile}>
      <Text style={styles.infoTileLabel}>{label}</Text>
      {badge ?? <Text style={styles.infoTileValue}>{value}</Text>}
    </View>
  );
}

function StaffActionBtn({
  icon,
  label,
  onPress,
  variant = 'default',
}: {
  icon: any;
  label: string;
  onPress: () => void;
  variant?: 'default' | 'success';
}) {
  return (
    <Pressable
      style={({ pressed }: any) => [
        styles.staffActionBtn,
        variant === 'success' && styles.staffActionBtnSuccess,
        pressed && styles.btnPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <KioskIcon
        name={icon}
        size={16}
        color={variant === 'success' ? '#065F46' : AccessColors.navy}
      />
      <Text
        style={[
          styles.staffActionBtnLabel,
          variant === 'success' && styles.staffActionBtnLabelSuccess,
        ]}
      >
        {label}
      </Text>
    </Pressable>
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textOnDark,
    letterSpacing: 0.2,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center' },

  // Body
  body: { flex: 1, flexDirection: 'row' },

  // Main content
  main: { flex: 1 },
  mainContent: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xl,
  },

  // Section
  section: { gap: AccessSpacing.md },
  sectionTitle: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  sectionBody: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.lg,
  },

  // Session grid
  sessionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.md,
  },
  infoTile: {
    flex: 1,
    minWidth: 120,
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    gap: 4,
  },
  infoTileLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoTileValue: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  viewSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.lg,
    borderRadius: AccessRadius.sm,
    borderWidth: 1.5,
    borderColor: AccessColors.navy,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  viewSessionBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },

  // Message card
  messageCard: {
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.xl,
    borderLeftWidth: 4,
    borderLeftColor: AccessColors.teal,
  },
  messageText: {
    fontSize: AccessFontSize.xl,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textPrimary,
    lineHeight: 36,
  },
  messageActions: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    flexWrap: 'wrap',
  },
  staffActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.lg,
    borderRadius: AccessRadius.sm,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.background,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  staffActionBtnSuccess: {
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
  },
  staffActionBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },
  staffActionBtnLabelSuccess: { color: '#065F46' },
  btnPressed: { opacity: 0.75 },

  // Suggestions
  suggestionRow: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    flexWrap: 'wrap',
  },
  suggestionCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.lg,
    gap: AccessSpacing.sm,
  },
  suggestionTitle: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  suggestionDesc: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },

  // Timeline
  timeline: { gap: 0 },
  timelineItem: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    minHeight: 48,
  },
  timelineDotCol: {
    alignItems: 'center',
    width: 20,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AccessColors.teal,
    marginTop: 5,
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: AccessColors.divider,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: AccessSpacing.md,
    gap: 2,
  },
  timelineTime: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  timelineEvent: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
  },
});


