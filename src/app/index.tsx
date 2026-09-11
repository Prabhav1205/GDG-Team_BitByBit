/**
 * Home screen â€” AccessAssist Landing / Welcome
 *
 * Structure:
 *   1. AccessHeader  â€” institutional wordmark + service status
 *   2. Hero section  â€” branding + tagline
 *   3. Institution cards â€” Bank / Hospital / Government Office
 *   4. ModeSelector  â€” 2Ã—2 grid of communication modes
 *   5. AssistanceBar â€” footer with staff call + language selector
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

import { AccessHeader } from '@/components/access/AccessHeader';
import { ModeSelector } from '@/components/access/ModeSelector';
import { AssistanceBar } from '@/components/access/AssistanceBar';
import { KioskIcon, type IconName } from '@/components/access/KioskIcon';
import { useSession, type InstitutionType } from '@/context/SessionContext';
import {
  AccessColors,
  AccessSpacing,
  AccessFontSize,
  AccessFontWeight,
  AccessRadius,
} from '@/constants/access-theme';

// â”€â”€ Institution definitions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const INSTITUTIONS: {
  id: InstitutionType;
  label: string;
  icon: IconName;
  description: string;
}[] = [
  {
    id: 'bank',
    label: 'Bank',
    icon: 'bank',
    description: 'Account, transactions & banking services',
  },
  {
    id: 'hospital',
    label: 'Hospital',
    icon: 'hospital',
    description: 'Appointments, reception & medical assistance',
  },
  {
    id: 'government',
    label: 'Government Office',
    icon: 'government',
    description: 'Forms, schemes & government services',
  },
];

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function HomeScreen() {
  const { session, setInstitution } = useSession();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* â”€â”€ 1. Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <AccessHeader />

        {/* â”€â”€ 2â€“4. Scrollable content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero section */}
          <View style={styles.hero} role="region" accessibilityLabel="Welcome">
            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>Accessibility Assistant</Text>
            </View>
            <Text style={styles.heroTitle} accessibilityRole="header" aria-level={1}>
              AccessAssist
            </Text>
            <Text style={styles.heroTagline}>
              Your communication assistant for accessible services.
            </Text>
            <Text style={styles.heroSub}>
              Select your institution and choose how you would like to interact.
              You can change your selection at any time.
            </Text>
          </View>

          {/* â”€â”€ Institution cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View
            style={styles.section}
            accessibilityRole="none"
            accessibilityLabel="Institution selection"
          >
            <Text style={styles.sectionLabel}>Where are you today?</Text>
            <View style={styles.institutionRow}>
              {INSTITUTIONS.map((inst) => {
                const selected = session.institution === inst.id;
                return (
                  <Pressable
                    key={inst.id}
                    style={({ pressed }: any) => [
                      styles.institutionCard,
                      selected && styles.institutionCardSelected,
                      pressed && styles.institutionCardPressed,
                    ]}
                    onPress={() => setInstitution(inst.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`${inst.label}: ${inst.description}`}
                    accessibilityState={{ selected }}
                    testID={`institution-${inst.id}`}
                  >
                    <View
                      style={[
                        styles.institutionIcon,
                        selected && styles.institutionIconSelected,
                      ]}
                    >
                      <KioskIcon
                        name={inst.icon}
                        size={28}
                        color={selected ? AccessColors.teal : AccessColors.navy}
                      />
                    </View>
                    <Text
                      style={[
                        styles.institutionLabel,
                        selected && styles.institutionLabelSelected,
                      ]}
                    >
                      {inst.label}
                    </Text>
                    <Text style={styles.institutionDesc} numberOfLines={2}>
                      {inst.description}
                    </Text>
                    {selected && <View style={styles.selectedPip} />}
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* â”€â”€ Mode selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View
            style={styles.section}
            accessibilityRole="none"
            accessibilityLabel="Communication mode selection"
          >
            <Text style={styles.sectionLabel}>Choose how you would like to communicate.</Text>
            <Text style={styles.sectionSub}>
              Select the option that is most comfortable for you.
            </Text>
            <View style={styles.selectorWrapper}>
              <ModeSelector />
            </View>
          </View>

          {/* â”€â”€ Accessibility statement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.accessStatement}>
            <KioskIcon name="info" size={14} color={AccessColors.textTertiary} />
            <Text style={styles.accessStatementText}>
              This kiosk supports Indian Sign Language, voice, text, and simplified
              touch interaction. All sessions are private and automatically cleared.
            </Text>
          </View>
        </ScrollView>

        {/* â”€â”€ 5. Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <AssistanceBar />
      </View>
    </SafeAreaView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AccessColors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: AccessColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: AccessSpacing.xl,
    paddingTop: AccessSpacing.xl,
    paddingBottom: AccessSpacing.xl,
    gap: AccessSpacing.xxl,
    maxWidth: 1000,
    alignSelf: 'center',
    width: '100%',
  },

  // â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  hero: {
    gap: AccessSpacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: 99,
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: 5,
  },
  heroBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: AccessColors.statusGreen,
  },
  heroBadgeText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: AccessFontSize.hero,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
    letterSpacing: -0.5,
  },
  heroTagline: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textPrimary,
    lineHeight: 32,
  },
  heroSub: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 24,
  },

  // â”€â”€ Sections â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  section: {
    gap: AccessSpacing.md,
  },
  sectionLabel: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  sectionSub: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 24,
  },

  // â”€â”€ Institution cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  institutionRow: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    flexWrap: 'wrap',
  },
  institutionCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.lg,
    gap: AccessSpacing.sm,
    position: 'relative',
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  institutionCardSelected: {
    borderColor: AccessColors.tealBorder,
    borderWidth: 2,
    backgroundColor: AccessColors.cardSelected,
  },
  institutionCardPressed: {
    opacity: 0.85,
  },
  institutionCardFocused: {
    ...Platform.select({
      web: {
        outlineWidth: 3,
        outlineColor: AccessColors.focusRing,
        outlineStyle: 'solid',
        outlineOffset: 2,
      },
      default: {},
    }),
  } as any,
  institutionIcon: {
    width: 52,
    height: 52,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  institutionIconSelected: {
    backgroundColor: AccessColors.cardSelected,
    borderColor: AccessColors.tealBorder + '40',
  },
  institutionLabel: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  institutionLabelSelected: {
    color: AccessColors.tealDark,
  },
  institutionDesc: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },
  selectedPip: {
    position: 'absolute',
    top: AccessSpacing.md,
    right: AccessSpacing.md,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: AccessColors.teal,
  },

  // â”€â”€ Mode selector wrapper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  selectorWrapper: {
    width: '100%',
  },

  // â”€â”€ Accessibility statement â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  accessStatement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.sm,
    padding: AccessSpacing.md,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
  },
  accessStatementText: {
    flex: 1,
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },
});


