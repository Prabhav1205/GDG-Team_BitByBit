import {
  AccessColors,
  AccessCategoryColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontFamily,
  AccessFontWeight,
  AccessShadow,
} from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { useSchemeSearch } from '@/hooks/use-scheme-search';
import { SchemeResultsPanel } from '@/components/access/SchemeResultsPanel';

/**
 * /eligibility — Unified Government Support & Benefit Schemes Hub
 *
 * Combines:
 *   1. RAG Instant Semantic Search (FAISS + MiniLM vector search) & Category Browsing
 *   2. Rule-Based Eligibility Evaluation Wizard with TTS voice announcements
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
  Platform,
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
import { speechEngine } from '@/services/speech-engine';
import { LANGUAGES, toSafeLangCode } from '@/constants/i18n';

const SCHEME_CATEGORIES = [
  { emoji: '🎓', label: 'Education / Scholarship', query: 'education scholarship student financial help school college', color: AccessCategoryColors['Education and Scholarship'].text, bg: AccessCategoryColors['Education and Scholarship'].bg },
  { emoji: '🏥', label: 'Healthcare', query: 'healthcare hospital medical treatment family health coverage', color: AccessCategoryColors['Healthcare'].text, bg: AccessCategoryColors['Healthcare'].bg },
  { emoji: '♿', label: 'Disability Support', query: 'disability support assistive devices rehabilitation', color: AccessCategoryColors['Disability Support'].text, bg: AccessCategoryColors['Disability Support'].bg },
  { emoji: '💰', label: 'Financial Help', query: 'financial assistance money income support poor BPL', color: AccessCategoryColors['Financial Assistance'].text, bg: AccessCategoryColors['Financial Assistance'].bg },
  { emoji: '🏠', label: 'Housing', query: 'housing home pucca house construction shelter', color: AccessCategoryColors['Housing'].text, bg: AccessCategoryColors['Housing'].bg },
  { emoji: '👩‍👧', label: 'Women & Child', query: 'women child girl welfare protection development scheme', color: AccessCategoryColors['Women and Child'].text, bg: AccessCategoryColors['Women and Child'].bg },
  { emoji: '👴', label: 'Senior Citizens', query: 'old age senior citizen pension retirement 60 years', color: AccessCategoryColors['Senior Citizens'].text, bg: AccessCategoryColors['Senior Citizens'].bg },
  { emoji: '💼', label: 'Employment / Skills', query: 'employment skill training job certificate youth unemployed', color: AccessCategoryColors['Employment and Skills'].text, bg: AccessCategoryColors['Employment and Skills'].bg },
];

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
  const styles = useStyles();
  const { session, clearSession, broadcastEligibilityMatch } = useSession();
  const { announce } = useAudioNav();

  const lang = toSafeLangCode(session.language);
  const speechCode = LANGUAGES[lang]?.speechCode || 'en-IN';

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);

  // Instant RAG Search & Categories State
  const [searchQuery, setSearchQuery] = useState('');
  const schemeSearch = useSchemeSearch();

  // Form State
  const [age, setAge] = useState<number>(24);
  const [disabilityType, setDisabilityType] = useState<CandidateProfile['disabilityType']>('any');
  const [income, setIncome] = useState<number>(250000);
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  // Audio / Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingSchemeId, setSpeakingSchemeId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchSchemes();
      setSchemes(data);
      setLoading(false);
    }
    loadData();
    announce('Eligibility and Benefit Matcher loaded. Enter your profile details to match government schemes.');

    return () => {
      speechEngine.stopSpeaking();
    };
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
    speechEngine.stopSpeaking();
    announce('Returning to main menu');
    clearSession();
    router.replace('/');
  }

  function handleAnnounceResults() {
    if (isSpeaking && !speakingSchemeId) {
      speechEngine.stopSpeaking();
      setIsSpeaking(false);
      announce('Voice announcement stopped.');
      return;
    }

    const eligibleSchemes = matchedResults.filter((r) => r.isEligible);
    const count = eligibleSchemes.length;
    const total = matchedResults.length;

    let speechText = '';
    if (count === 0) {
      speechText =
        lang === 'hi'
          ? `प्रोफ़ाइल का मूल्यांकन किया गया। आपकी वर्तमान प्रोफ़ाइल के लिए कोई पूर्णतः पात्र योजना नहीं मिली। कृपया आय या आयु मानदंड समायोजित करें।`
          : lang === 'mr'
          ? `प्रोफाइलचे मूल्यांकन केले. आपल्या सध्याच्या प्रोफाइलसाठी कोणतीही पूर्ण पात्र योजना आढळली नाही.`
          : `Profile evaluated. Found no fully eligible benefit schemes for your current criteria out of ${total} total schemes. You can adjust your age or income settings to explore more.`;
    } else {
      const topTitles = eligibleSchemes.slice(0, 3).map((s) => s.scheme.title).join(', ');
      const moreSuffix = count > 3 ? (lang === 'hi' ? ` और ${count - 3} अन्य योजनाएं` : lang === 'mr' ? ` आणि ${count - 3} इतर योजना` : ` and ${count - 3} more`) : '';
      speechText =
        lang === 'hi'
          ? `प्रोफ़ाइल का मूल्यांकन पूरा हुआ। कुल ${total} में से ${count} सरकारी योजनाएं आपके लिए पूर्णतः पात्र हैं। प्रमुख योजनाएं हैं: ${topTitles}${moreSuffix}।`
          : lang === 'mr'
          ? `प्रोफाइलचे मूल्यांकन पूर्ण झाले. एकूण ${total} पैकी ${count} योजना आपल्यासाठी पात्र आहेत. प्रमुख योजना: ${topTitles}${moreSuffix}.`
          : `Profile evaluated. Found ${count} fully eligible benefit schemes out of ${total} total schemes. Top matching schemes include: ${topTitles}${moreSuffix}.`;
    }

    announce(speechText);
    setIsSpeaking(true);
    setSpeakingSchemeId(null);

    // Broadcast to staff dashboard
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

    speechEngine.speak(speechText, {
      lang: speechCode,
      rate: 0.95,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  function handleSpeakSingleScheme(schemeTitle: string, category: string, summary: string, schemeId: string) {
    if (isSpeaking && speakingSchemeId === schemeId) {
      speechEngine.stopSpeaking();
      setIsSpeaking(false);
      setSpeakingSchemeId(null);
      return;
    }

    const readText = `${schemeTitle}. Category: ${category}. Benefit summary: ${summary}.`;
    announce(`Reading scheme: ${schemeTitle}`);
    setIsSpeaking(true);
    setSpeakingSchemeId(schemeId);

    speechEngine.speak(readText, {
      lang: speechCode,
      rate: 0.95,
      onEnd: () => {
        setIsSpeaking(false);
        setSpeakingSchemeId(null);
      },
      onError: () => {
        setIsSpeaking(false);
        setSpeakingSchemeId(null);
      },
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

          {/* ── 1. Instant Natural-Language Search (RAG + FAISS) ────────────── */}
          <View style={styles.searchCard}>
            <Text style={styles.cardHeading}>1. Search Government Schemes</Text>
            <Text style={styles.searchSubText}>
              Type your need in plain language (e.g., "scholarship for college", "wheelchair subsidy", "medical insurance")
            </Text>

            <View style={styles.searchBarRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search schemes (e.g. disability grant, pension, education)..."
                placeholderTextColor={AccessColors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    announce(`Searching for ${searchQuery}`);
                    schemeSearch.search(searchQuery.trim(), { age, annual_income: income });
                  }
                }}
                accessibilityLabel="Search government benefit schemes"
                testID="eligibility-search-input"
              />
              <Pressable
                onPress={() => {
                  if (searchQuery.trim()) {
                    announce(`Searching for ${searchQuery}`);
                    schemeSearch.search(searchQuery.trim(), { age, annual_income: income });
                  }
                }}
                style={({ pressed }) => [
                  styles.searchSubmitBtn,
                  pressed && { opacity: 0.85 },
                  schemeSearch.loading && { opacity: 0.6 },
                ]}
                disabled={schemeSearch.loading}
                accessibilityRole="button"
                accessibilityLabel="Submit search"
              >
                <Text style={styles.searchSubmitBtnText}>
                  {schemeSearch.loading ? 'Searching…' : '🔍 Search'}
                </Text>
              </Pressable>
            </View>

            {/* Category Quick Pills */}
            <Text style={styles.categoriesLabel}>Or browse by category:</Text>
            <View style={styles.categoryGrid}>
              {SCHEME_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.label}
                  style={({ pressed }) => [
                    styles.categoryPill,
                    { backgroundColor: cat.bg, borderColor: cat.color + '40' },
                    pressed && { opacity: 0.75, transform: [{ scale: 0.98 }] },
                    schemeSearch.loading && { opacity: 0.5 },
                  ]}
                  onPress={() => {
                    setSearchQuery(cat.label);
                    announce(`Browsing ${cat.label} schemes`);
                    schemeSearch.search(cat.query, { age, annual_income: income });
                  }}
                  disabled={schemeSearch.loading}
                  accessibilityRole="button"
                  accessibilityLabel={`Browse ${cat.label} schemes`}
                >
                  <Text style={styles.categoryPillEmoji}>{cat.emoji}</Text>
                  <Text style={[styles.categoryPillText, { color: cat.color }]}>
                    {cat.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* RAG Search Results */}
            {(schemeSearch.loading || schemeSearch.results.length > 0 || schemeSearch.error) && (
              <View style={styles.ragResultsContainer}>
                <SchemeResultsPanel
                  results={schemeSearch.results}
                  loading={schemeSearch.loading}
                  error={schemeSearch.error}
                />
              </View>
            )}
          </View>

          {/* ── 2. Candidate Profile Criteria Wizard ───────────────────────── */}
          <View style={styles.filterCard}>
            <Text style={styles.cardHeading}>2. Candidate Profile Calculator</Text>

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
              style={[
                styles.evaluateBtn,
                isSpeaking && !speakingSchemeId && styles.evaluateBtnSpeaking,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isSpeaking && !speakingSchemeId ? "Stop speaking matched results" : "Hear matched schemes via voice"}
              testID="hear-matched-results-btn"
            >
              <KioskIcon name="voice" size={20} color={AccessColors.cardDefault} />
              <Text style={styles.evaluateBtnText}>
                {isSpeaking && !speakingSchemeId
                  ? `⏹ Stop Speaking (${eligibleCount} Eligible)`
                  : `🔊 Hear Matched Results Summary (${eligibleCount} Eligible)`}
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
                  const isThisSchemeSpeaking = isSpeaking && speakingSchemeId === scheme.id;
                  return (
                    <View
                      key={scheme.id}
                      style={[
                        styles.schemeCard,
                        isEligible && styles.schemeCardEligible,
                      ]}
                    >
                      {/* Card Top Row: Badge + Category + Read Aloud Btn */}
                      <View style={styles.schemeCardHeader}>
                        <View style={styles.schemeHeaderLeft}>
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

                        <Pressable
                          onPress={() => handleSpeakSingleScheme(scheme.title, scheme.category, scheme.benefitSummary || '', scheme.id)}
                          style={[
                            styles.readSchemeBtn,
                            isThisSchemeSpeaking && styles.readSchemeBtnActive,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Read ${scheme.title} aloud`}
                        >
                          <Text style={[styles.readSchemeBtnText, isThisSchemeSpeaking && styles.readSchemeBtnTextActive]}>
                            {isThisSchemeSpeaking ? '⏹ Stop' : '🔊 Listen'}
                          </Text>
                        </Pressable>
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

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
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
  searchCard: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  searchSubText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },
  searchBarRow: {
    flexDirection: 'row',
    gap: AccessSpacing.sm,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 48,
    backgroundColor: AccessColors.background,
    borderWidth: 1.5,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
    paddingHorizontal: AccessSpacing.md,
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
  },
  searchSubmitBtn: {
    height: 48,
    paddingHorizontal: AccessSpacing.lg,
    backgroundColor: AccessColors.teal,
    borderRadius: AccessRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSubmitBtnText: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.cardDefault,
  },
  categoriesLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: AccessSpacing.xs,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    paddingVertical: AccessSpacing.xs + 2,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.full ?? 20,
    borderWidth: 1,
  },
  categoryPillEmoji: {
    fontSize: 16,
  },
  categoryPillText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.semibold,
  },
  ragResultsContainer: {
    marginTop: AccessSpacing.sm,
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
  evaluateBtnSpeaking: {
    backgroundColor: '#DC2626',
  },
  evaluateBtnText: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.cardDefault,
  },
  schemeHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    flexWrap: 'wrap',
  },
  readSchemeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: AccessSpacing.sm + 2,
    paddingVertical: 4,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.cardHover,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
  },
  readSchemeBtnActive: {
    backgroundColor: AccessColors.alertErrorBg,
    borderColor: AccessColors.alertErrorBorder,
  },
  readSchemeBtnText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
  },
  readSchemeBtnTextActive: {
    color: AccessColors.alertErrorText,
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
    backgroundColor: AccessColors.statusGreenBg,
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
    backgroundColor: AccessColors.alertWarningBg,
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
    color: AccessColors.alertErrorText,
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
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
