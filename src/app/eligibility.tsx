/**
 * /eligibility — Eligibility & Benefit Matcher Screen
 *
 * Rule-based matching engine for government & institutional disability benefit schemes,
 * integrated with Supabase DB (with local JSON fallback) and TTS announcements.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import {
  fetchSchemes,
  isSupabaseConfigured,
  type Scheme,
} from '@/services/supabase-schemes';
import {
  EligibilityEngine,
  type CandidateProfile,
  type MatchedSchemeResult,
} from '@/services/eligibility-engine';
import { useSession } from '@/context/SessionContext';
import { useAudioNav } from '@/context/AudioNavContext';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

const DISABILITY_OPTIONS = [
  { id: 'any', label: 'All / Any' },
  { id: 'visual', label: 'Visual Impairment' },
  { id: 'hearing', label: 'Hearing Impairment' },
  { id: 'speech', label: 'Speech Impairment' },
  { id: 'locomotor', label: 'Locomotor Disability' },
] as const;

const INCOME_BRACKETS = [
  { label: 'Under ₹2.5 Lakhs', value: 250000 },
  { label: 'Under ₹5 Lakhs', value: 500000 },
  { label: 'Above ₹5 Lakhs', value: 1000000 },
] as const;

export default function EligibilityPage() {
  const { clearSession, broadcastEligibilityMatch } = useSession();
  const { announce } = useAudioNav();

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [age, setAge] = useState<number>(24);
  const [disabilityType, setDisabilityType] = useState<CandidateProfile['disabilityType']>('any');
  const [income, setIncome] = useState<number>(250000);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchSchemes();
      setSchemes(data);
      setLoading(false);
    }
    loadData();
    announce('Eligibility and Benefit Matcher loaded. Enter your profile details to match government schemes.');
  }, [announce]);

  const candidateProfile: CandidateProfile = {
    age,
    disabilityType,
    annualIncome: income,
    state: 'All',
  };

  const matchedResults: MatchedSchemeResult[] = EligibilityEngine.evaluate(
    candidateProfile,
    schemes
  );

  const eligibleCount = matchedResults.filter((r) => r.isEligible).length;

  function handleBack() {
    announce('Returning to main menu');
    clearSession();
    router.replace('/');
  }

  function handleAnnounceResults() {
    announce(
      `Profile evaluated. Found ${eligibleCount} fully eligible benefit schemes out of ${matchedResults.length} total schemes.`
    );

    matchedResults.forEach((res) => {
      if (res.isEligible) {
        broadcastEligibilityMatch(
          res.scheme.title,
          res.scheme.category,
          res.scheme.benefitSummary || 'Financial Assistance',
          'Verify citizen ID & provide counter registration form'
        );
      }
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* Header */}
        <AccessHeader />

        {/* Back Navigation Bar */}
        <View style={styles.navBar}>
          <Pressable
            onPress={handleBack}
            style={({ pressed, focused }: any) => [
              styles.backBtn,
              pressed && styles.backBtnPressed,
              focused && styles.backBtnFocused,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Back to communication options"
            testID="back-to-home"
          >
            <KioskIcon name="back" size={16} color={AccessColors.navy} />
            <Text style={styles.backBtnLabel}>Back to communication options</Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Banner */}
          <View style={styles.headerBlock}>
            <View style={styles.iconContainer}>
              <KioskIcon name="settings" size={40} color={AccessColors.teal} />
            </View>
            <Text style={styles.title} role="heading" aria-level={1}>
              Eligibility & Benefit Matcher
            </Text>
            <Text style={styles.subtitle}>
              Configure your profile below to calculate matching government financial grants, assistive device schemes, and pensions.
            </Text>
            <View style={styles.dbStatusPill}>
              <View
                style={[
                  styles.dbStatusDot,
                  isSupabaseConfigured && styles.dbStatusDotOnline,
                ]}
              />
              <Text style={styles.dbStatusText}>
                {isSupabaseConfigured ? 'Supabase Database Connected' : 'Local Offline Dataset Active'}
              </Text>
            </View>
          </View>

          {/* Form Wizard Filter Card */}
          <View style={styles.filterCard}>
            <Text style={styles.cardHeading}>1. Candidate Profile Criteria</Text>

            <View style={styles.filterGrid}>
              {/* Age Input */}
              <View style={styles.filterField}>
                <Text style={styles.fieldLabel}>Age (Years):</Text>
                <View style={styles.ageInputRow}>
                  <Pressable
                    onPress={() => setAge((prev) => Math.max(1, prev - 1))}
                    style={styles.ageStepBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease age"
                  >
                    <Text style={styles.ageStepBtnText}>-</Text>
                  </Pressable>
                  <TextInput
                    style={styles.ageInput}
                    keyboardType="number-pad"
                    value={String(age)}
                    onChangeText={(val) => setAge(parseInt(val, 10) || 0)}
                    accessibilityLabel="Candidate age"
                  />
                  <Pressable
                    onPress={() => setAge((prev) => prev + 1)}
                    style={styles.ageStepBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Increase age"
                  >
                    <Text style={styles.ageStepBtnText}>+</Text>
                  </Pressable>
                </View>
              </View>

              {/* Annual Income Selector */}
              <View style={styles.filterField}>
                <Text style={styles.fieldLabel}>Annual Family Income:</Text>
                <View style={styles.chipRow}>
                  {INCOME_BRACKETS.map((bracket) => (
                    <Pressable
                      key={bracket.value}
                      onPress={() => setIncome(bracket.value)}
                      style={[
                        styles.chip,
                        income === bracket.value && styles.chipActive,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: income === bracket.value }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          income === bracket.value && styles.chipTextActive,
                        ]}
                      >
                        {bracket.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Disability Type Selector */}
            <View style={styles.filterField}>
              <Text style={styles.fieldLabel}>Disability Type:</Text>
              <View style={styles.chipRow}>
                {DISABILITY_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.id}
                    onPress={() => setDisabilityType(opt.id as any)}
                    style={[
                      styles.chip,
                      disabilityType === opt.id && styles.chipActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: disabilityType === opt.id }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        disabilityType === opt.id && styles.chipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Recalculate & Announce Button */}
            <Pressable
              onPress={handleAnnounceResults}
              style={styles.evaluateBtn}
              accessibilityRole="button"
              accessibilityLabel="Announce matched schemes via voice"
            >
              <KioskIcon name="voice" size={18} color={AccessColors.cardDefault} />
              <Text style={styles.evaluateBtnText}>
                Hear Matched Results Summary ({eligibleCount} Eligible)
              </Text>
            </Pressable>
          </View>

          {/* Scheme Matching Results Section */}
          <View style={styles.resultsSection}>
            <View style={styles.resultsHeader}>
              <Text style={styles.resultsTitle}>
                Matching Benefit Schemes ({matchedResults.length})
              </Text>
              <Text style={styles.resultsSubtitle}>
                {eligibleCount} schemes fully match your profile criteria
              </Text>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={AccessColors.teal} />
                <Text style={styles.loadingText}>Fetching scheme rules database...</Text>
              </View>
            ) : (
              <View style={styles.schemesList}>
                {matchedResults.map(({ scheme, matchScore, isEligible, matchReasons, unmetCriteria }) => {
                  const isExpanded = expandedSchemeId === scheme.id;
                  return (
                    <View
                      key={scheme.id}
                      style={[
                        styles.schemeCard,
                        isEligible && styles.schemeCardEligible,
                      ]}
                    >
                      {/* Card Top Row: Badge + Category */}
                      <View style={styles.schemeCardHeader}>
                        <View
                          style={[
                            styles.badgePill,
                            isEligible ? styles.badgeEligible : styles.badgePartial,
                          ]}
                        >
                          <Text style={styles.badgeText}>
                            {isEligible ? '100% Eligible' : `${matchScore}% Match`}
                          </Text>
                        </View>
                        <Text style={styles.schemeCategory}>{scheme.category}</Text>
                      </View>

                      {/* Title & Summary */}
                      <Text style={styles.schemeTitle}>{scheme.title}</Text>
                      <Text style={styles.schemeProvider}>{scheme.provider}</Text>
                      <Text style={styles.schemeSummary}>{scheme.benefitSummary}</Text>

                      {/* Criteria Match Details */}
                      <View style={styles.reasonsBox}>
                        {matchReasons.map((reason, idx) => (
                          <Text key={idx} style={styles.reasonPassText}>
                            ✓ {reason}
                          </Text>
                        ))}
                        {unmetCriteria.map((fail, idx) => (
                          <Text key={idx} style={styles.reasonFailText}>
                            ✕ {fail}
                          </Text>
                        ))}
                      </View>

                      {/* Expandable Details Button */}
                      <Pressable
                        onPress={() =>
                          setExpandedSchemeId(isExpanded ? null : scheme.id)
                        }
                        style={styles.expandBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`${isExpanded ? 'Hide' : 'View'} required documents and application checklist for ${scheme.title}`}
                      >
                        <Text style={styles.expandBtnText}>
                          {isExpanded
                            ? '▲ Hide Checklist & Application Steps'
                            : '▼ View Required Documents & Application Steps'}
                        </Text>
                      </Pressable>

                      {/* Expanded Section: Checklist & Steps */}
                      {isExpanded && (
                        <View style={styles.expandedDetails}>
                          <Text style={styles.detailsHeading}>
                            Required Documents Checklist:
                          </Text>
                          {scheme.requiredDocuments.map((doc, idx) => (
                            <View key={idx} style={styles.docRow}>
                              <View style={styles.checkboxBox}>
                                <Text style={styles.checkboxCheck}>✓</Text>
                              </View>
                              <Text style={styles.docText}>{doc}</Text>
                            </View>
                          ))}

                          <Text style={[styles.detailsHeading, { marginTop: 12 }]}>
                            How to Apply:
                          </Text>
                          {scheme.applicationSteps.map((step, idx) => (
                            <Text key={idx} style={styles.stepText}>
                              {idx + 1}. {step}
                            </Text>
                          ))}

                          {Boolean(scheme.officialLink) && (
                            <Pressable
                              onPress={() => Linking.openURL(scheme.officialLink!)}
                              style={styles.officialLinkBtn}
                              accessibilityRole="link"
                              accessibilityLabel={`Open official portal for ${scheme.title}`}
                            >
                              <Text style={styles.officialLinkText}>
                                Visit Official Govt Portal ↗
                              </Text>
                            </Pressable>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AccessColors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: AccessColors.background,
  },
  navBar: {
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.divider,
    backgroundColor: AccessColors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.cardDefault,
  },
  backBtnPressed: {
    opacity: 0.75,
    backgroundColor: AccessColors.cardHover,
  },
  backBtnFocused: {
    outlineWidth: 3,
    outlineColor: AccessColors.focusRing,
    outlineStyle: 'solid',
    outlineOffset: 2,
  } as any,
  backBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.xxl,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
    gap: AccessSpacing.xl,
  },
  headerBlock: {
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: AccessRadius.lg,
    backgroundColor: AccessColors.cardSelected,
    borderWidth: 1.5,
    borderColor: AccessColors.tealBorder + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: AccessFontSize.xxl,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: AccessFontSize.md,
    color: AccessColors.textSecondary,
    textAlign: 'center',
    maxWidth: 640,
    lineHeight: 24,
  },
  dbStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: AccessColors.cardDefault,
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    marginTop: 4,
  },
  dbStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AccessColors.textTertiary,
  },
  dbStatusDotOnline: {
    backgroundColor: AccessColors.statusGreen,
  },
  dbStatusText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textSecondary,
    fontWeight: AccessFontWeight.medium,
  },
  filterCard: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.lg,
  },
  cardHeading: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.navy,
  },
  filterGrid: {
    flexDirection: 'row',
    gap: AccessSpacing.xl,
    flexWrap: 'wrap',
  },
  filterField: {
    gap: AccessSpacing.xs,
    flex: 1,
    minWidth: 260,
  },
  fieldLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  ageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
  },
  ageStepBtn: {
    width: 44,
    height: 44,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageStepBtnText: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
  },
  ageInput: {
    flex: 1,
    height: 44,
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
    textAlign: 'center',
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.xs,
  },
  chip: {
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.xs + 2,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.background,
  },
  chipActive: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  chipText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  chipTextActive: {
    color: AccessColors.cardDefault,
    fontWeight: AccessFontWeight.bold,
  },
  evaluateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.sm,
    backgroundColor: AccessColors.teal,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.xl,
    borderRadius: AccessRadius.sm,
    marginTop: AccessSpacing.sm,
  },
  evaluateBtnText: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.cardDefault,
  },
  resultsSection: {
    gap: AccessSpacing.md,
  },
  resultsHeader: {
    gap: 2,
  },
  resultsTitle: {
    fontSize: AccessFontSize.xl,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.navy,
  },
  resultsSubtitle: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
  },
  loadingBox: {
    padding: AccessSpacing.xxl,
    alignItems: 'center',
    gap: AccessSpacing.md,
  },
  loadingText: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textSecondary,
  },
  schemesList: {
    gap: AccessSpacing.lg,
  },
  schemeCard: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.sm,
  },
  schemeCardEligible: {
    borderColor: AccessColors.statusGreen,
    backgroundColor: '#F6FBF7',
  },
  schemeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeEligible: {
    backgroundColor: AccessColors.statusGreenBg,
  },
  badgePartial: {
    backgroundColor: '#FFF8E1',
  },
  badgeText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.statusGreen,
  },
  schemeCategory: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textTertiary,
    textTransform: 'uppercase',
  },
  schemeTitle: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
  },
  schemeProvider: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  schemeSummary: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
    lineHeight: 22,
    marginVertical: 4,
  },
  reasonsBox: {
    gap: 4,
    marginVertical: 4,
  },
  reasonPassText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.statusGreen,
    fontWeight: AccessFontWeight.medium,
  },
  reasonFailText: {
    fontSize: AccessFontSize.xs,
    color: '#D32F2F',
    fontWeight: AccessFontWeight.medium,
  },
  expandBtn: {
    paddingVertical: AccessSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: AccessColors.divider,
    marginTop: AccessSpacing.xs,
  },
  expandBtnText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.tealDark,
  },
  expandedDetails: {
    gap: AccessSpacing.sm,
    paddingTop: AccessSpacing.sm,
  },
  detailsHeading: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    backgroundColor: AccessColors.statusGreenBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    fontSize: 12,
    color: AccessColors.statusGreen,
    fontWeight: 'bold',
  },
  docText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textPrimary,
  },
  stepText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },
  officialLinkBtn: {
    alignSelf: 'flex-start',
    backgroundColor: AccessColors.navy,
    paddingHorizontal: AccessSpacing.lg,
    paddingVertical: AccessSpacing.sm,
    borderRadius: AccessRadius.sm,
    marginTop: AccessSpacing.sm,
  },
  officialLinkText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.cardDefault,
  },
});
