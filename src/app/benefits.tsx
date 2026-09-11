/**
 * /benefits â€” Services & Benefits page.
 *
 * Mock eligibility cards with filter tabs.
 * Teammates can replace mock data with real eligibility engine output.
 */

import React, { useState } from 'react';
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
import { PageHeader } from '@/components/access/PageHeader';
import { BenefitCard, type BenefitItem } from '@/components/access/BenefitCard';
import { KioskIcon } from '@/components/access/KioskIcon';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// â”€â”€ Mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BENEFITS: BenefitItem[] = [
  {
    id: 'b1',
    title: 'Disability Assistance Scheme',
    status: 'Potentially Eligible',
    statusVariant: 'eligible',
    description:
      'Financial assistance may be available based on your disability certificate and income criteria.',
    category: 'government',
  },
  {
    id: 'b2',
    title: 'Accessible Banking Services',
    status: 'Available',
    statusVariant: 'available',
    description:
      'Dedicated accessible counters, doorstep banking, and braille statement options available.',
    category: 'bank',
  },
  {
    id: 'b3',
    title: 'Priority Hospital Assistance',
    status: 'Available',
    statusVariant: 'available',
    description:
      'Priority queue access and escort assistance may be requested at the hospital reception.',
    category: 'hospital',
  },
  {
    id: 'b4',
    title: 'National Scholarship for Disabled',
    status: 'Potentially Eligible',
    statusVariant: 'eligible',
    description:
      'Post-matric scholarship for students with benchmark disabilities under the National Scholarship Portal.',
    category: 'government',
  },
  {
    id: 'b5',
    title: 'Free Aids & Appliances',
    status: 'Potentially Eligible',
    statusVariant: 'eligible',
    description:
      'Assistive devices such as wheelchairs, hearing aids, and visual aids may be available under ADIP scheme.',
    category: 'government',
  },
  {
    id: 'b6',
    title: 'Zero Balance Accessible Account',
    status: 'Available',
    statusVariant: 'available',
    description:
      'A basic savings account with no minimum balance requirement for persons with disabilities.',
    category: 'bank',
  },
];

type FilterTab = 'all' | 'bank' | 'hospital' | 'government';

const FILTER_TABS: { id: FilterTab; label: string }[] = [
  { id: 'all',        label: 'All'             },
  { id: 'bank',       label: 'Bank'            },
  { id: 'hospital',   label: 'Hospital'        },
  { id: 'government', label: 'Government'      },
];

const NEXT_STEPS = [
  'Review your eligibility criteria',
  'Prepare required documents (ID, certificate)',
  'Speak with the counter staff for assistance',
];

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function BenefitsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const filtered = activeFilter === 'all'
    ? BENEFITS
    : BENEFITS.filter((b) => b.category === activeFilter);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <AccessHeader />
        <PageHeader title="Benefits & Services" backLabel="Back" backRoute="/" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* â”€â”€ Page heading â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.heading}>
            <Text style={styles.headingTitle} accessibilityRole="header" aria-level={1}>
              Services & Benefits You May Be Eligible For
            </Text>
            <Text style={styles.headingSub}>
              Based on your accessibility profile, the following services and schemes may be relevant.
            </Text>
          </View>

          {/* â”€â”€ Layout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.layout}>
            {/* LEFT: Cards */}
            <View style={styles.cardsSection}>
              {/* Filter tabs */}
              <View style={styles.filterRow} accessibilityRole="tablist">
                {FILTER_TABS.map((tab) => (
                  <Pressable
                    key={tab.id}
                    style={({ pressed }: any) => [
                      styles.filterTab,
                      activeFilter === tab.id && styles.filterTabActive,
                      pressed && styles.filterTabPressed,
                    ]}
                    onPress={() => setActiveFilter(tab.id)}
                    accessibilityRole="tab"
                    accessibilityLabel={`Filter: ${tab.label}`}
                    accessibilityState={{ selected: activeFilter === tab.id }}
                  >
                    <Text
                      style={[
                        styles.filterTabLabel,
                        activeFilter === tab.id && styles.filterTabLabelActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Benefit cards */}
              <View style={styles.cardsList}>
                {filtered.map((item) => (
                  <BenefitCard
                    key={item.id}
                    item={item}
                    onViewDetails={(id) => {
                      // Mock â€” teammates can wire up a details sheet/modal
                      alert(`Viewing details for: ${item.title}`);
                    }}
                  />
                ))}
                {filtered.length === 0 && (
                  <View style={styles.emptyState}>
                    <KioskIcon name="info" size={32} color={AccessColors.textTertiary} />
                    <Text style={styles.emptyText}>No services found for this filter.</Text>
                  </View>
                )}
              </View>
            </View>

            {/* RIGHT: Next steps sidebar */}
            <View style={styles.sidebar}>
              <Text style={styles.sidebarHeading}>Next Steps</Text>
              {NEXT_STEPS.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}

              <View style={styles.sidebarDivider} />

              <View style={styles.noteCard}>
                <KioskIcon name="info" size={16} color={AccessColors.navy} />
                <Text style={styles.noteText}>
                  Eligibility is indicative only. Final determination is made by the institution.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccessColors.background },
  screen: { flex: 1, backgroundColor: AccessColors.background },
  scroll: { flex: 1 },
  content: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xl,
  },

  heading: { gap: AccessSpacing.sm },
  headingTitle: {
    fontSize: AccessFontSize.xl,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    lineHeight: 38,
  },
  headingSub: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textSecondary,
    lineHeight: 24,
  },

  // Layout
  layout: {
    flexDirection: 'row',
    gap: AccessSpacing.xl,
    flexWrap: 'wrap',
  },

  // Cards
  cardsSection: {
    flex: 2,
    minWidth: 280,
    gap: AccessSpacing.lg,
  },
  filterRow: {
    flexDirection: 'row',
    gap: AccessSpacing.sm,
    flexWrap: 'wrap',
  },
  filterTab: {
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.cardDefault,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  filterTabActive: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  filterTabPressed: { opacity: 0.75 },
  filterTabFocused: {
    ...Platform.select({
      web: { outlineWidth: 3, outlineColor: AccessColors.focusRing, outlineStyle: 'solid', outlineOffset: 2 },
      default: {},
    }),
  } as any,
  filterTabLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  filterTabLabelActive: { color: AccessColors.textOnDark },
  cardsList: { gap: AccessSpacing.md },
  emptyState: {
    alignItems: 'center',
    padding: AccessSpacing.xxl,
    gap: AccessSpacing.md,
  },
  emptyText: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textTertiary,
    textAlign: 'center',
  },

  // Sidebar
  sidebar: {
    flex: 1,
    minWidth: 200,
    gap: AccessSpacing.md,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.xl,
    alignSelf: 'flex-start',
  },
  sidebarHeading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    marginBottom: AccessSpacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.md,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AccessColors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textOnDark,
  },
  stepText: {
    flex: 1,
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
    lineHeight: 22,
  },
  sidebarDivider: {
    height: 1,
    backgroundColor: AccessColors.divider,
    marginVertical: AccessSpacing.sm,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.sm,
    backgroundColor: AccessColors.background,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },
});


