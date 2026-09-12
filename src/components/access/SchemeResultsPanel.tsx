/**
 * SchemeResultsPanel — Rich polished results UI for government scheme matches.
 *
 * Shows scheme cards with category badges, relevance bars, eligibility status,
 * expandable benefits/documents, and official source links.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SchemeMatch } from '@/hooks/use-scheme-search';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { useSession } from '@/context/SessionContext';
import { speechEngine } from '@/services/speech-engine';
import { LANGUAGES, toSafeLangCode } from '@/constants/i18n';
import {
  AccessColors,
  AccessCategoryColors,
  AccessRadius,
  AccessSpacing,
  AccessFontSize,
  AccessFontWeight,
  AccessShadow,
} from '@/constants/access-theme';

function getCategoryColors(category: string) {
  return AccessCategoryColors[category] ?? { bg: AccessColors.tealFaint, text: AccessColors.tealDark, border: AccessColors.teal };
}

// ── Eligibility Badge ─────────────────────────────────────────────────────

function EligibilityBadge({ result }: { result?: { status: string; notice: string } }) {
  if (!result) return null;
  const isMatch = result.status === 'potential_match';
  const isLikely = result.status === 'likely_ineligible';
  return (
    <View style={[
      styles.eligBadge,
      isMatch && styles.eligBadgeMatch,
      isLikely && styles.eligBadgeUnlikely,
    ]}>
      <Text style={[
        styles.eligBadgeText,
        isMatch && styles.eligBadgeTextMatch,
        isLikely && styles.eligBadgeTextUnlikely,
      ]}>
        {isMatch ? '✓ Potential Match' : isLikely ? '⚠ Check Eligibility' : '○ Verify Required'}
      </Text>
    </View>
  );
}

// ── Relevance Bar ─────────────────────────────────────────────────────────

function RelevanceBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.round(score * 100));
  const color = pct >= 60 ? AccessColors.teal : pct >= 35 ? '#F59E0B' : AccessColors.textTertiary;
  return (
    <View style={styles.relBar}>
      <View style={[styles.relBarFill, { width: `${pct}%` as any, backgroundColor: color }]} />
    </View>
  );
}

// ── Scheme Card ───────────────────────────────────────────────────────────

function SchemeCard({ scheme }: { scheme: SchemeMatch }) {
  const [expanded, setExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { session } = useSession();
  const lang = toSafeLangCode(session?.language);
  const speechCode = LANGUAGES[lang]?.speechCode || 'en-IN';
  const catColors = getCategoryColors(scheme.category);

  function handleOpenSource() {
    if (scheme.source_url) {
      Linking.openURL(scheme.source_url).catch(() => {});
    }
  }

  function handleToggleSpeak() {
    if (isSpeaking) {
      speechEngine.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = `${scheme.name}. Category: ${scheme.category}. ${scheme.description}. Benefits: ${scheme.benefits || 'Government financial support'}.`;
    setIsSpeaking(true);
    speechEngine.speak(textToSpeak, {
      lang: speechCode,
      rate: 0.95,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  return (
    <View style={styles.card} accessibilityRole="summary">
      {/* Fixed Listen Button */}
      <Pressable
        onPress={handleToggleSpeak}
        style={[
          styles.listenBtn,
          isSpeaking && styles.listenBtnActive,
        ]}
        accessibilityRole="button"
        accessibilityLabel={isSpeaking ? `Stop reading ${scheme.name}` : `Read ${scheme.name} aloud`}
      >
        <Text style={[styles.listenBtnText, isSpeaking && styles.listenBtnTextActive]}>
          {isSpeaking ? '⏹ Stop' : '🔊 Listen'}
        </Text>
      </Pressable>

      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: catColors.bg, borderColor: catColors.border }]}>
          <Text style={[styles.categoryBadgeText, { color: catColors.text }]}>
            {scheme.category}
          </Text>
        </View>
        <EligibilityBadge result={scheme.eligibility_result} />
      </View>

      {/* Scheme name */}
      <Text style={styles.schemeName} numberOfLines={3}>
        {scheme.name}
      </Text>

      {/* Relevance bar */}
      <View style={styles.relRow}>
        <Text style={styles.relLabel}>Relevance</Text>
        <RelevanceBar score={scheme.relevance} />
      </View>

      {/* Description */}
      <Text style={styles.schemeDesc} numberOfLines={expanded ? undefined : 3}>
        {scheme.description}
      </Text>

      {/* Expand / Collapse */}
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={styles.expandBtn}
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Show less details' : 'Show more details'}
        accessibilityState={{ expanded }}
      >
        <Text style={styles.expandBtnText}>
          {expanded ? '▲ Less details' : '▼ More details'}
        </Text>
      </Pressable>

      {/* Expanded section */}
      {expanded && (
        <View style={styles.expandedSection}>
          {/* Benefits */}
          {Boolean(scheme.benefits) && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>💰 Benefits</Text>
              <Text style={styles.detailText}>{scheme.benefits}</Text>
            </View>
          )}

          {/* Documents */}
          {Array.isArray(scheme.documents_required) && scheme.documents_required.length > 0 && (
            <View style={styles.detailBlock}>
              <Text style={styles.detailLabel}>📄 Documents Required</Text>
              {scheme.documents_required.map((doc, i) => (
                <Text key={i} style={styles.bulletItem}>• {doc}</Text>
              ))}
            </View>
          )}

          {/* Eligibility notice */}
          {scheme.eligibility_result?.notice && (
            <View style={styles.noticeBox}>
              <Text style={styles.noticeText}>ℹ {scheme.eligibility_result.notice}</Text>
            </View>
          )}
        </View>
      )}

      {/* Official source button */}
      {Boolean(scheme.source_url) && (
        <Pressable
          onPress={handleOpenSource}
          style={({ pressed }) => [styles.sourceBtn, pressed && styles.sourceBtnPressed]}
          accessibilityRole="link"
          accessibilityLabel={`View official requirements for ${scheme.name}`}
          testID={`scheme-source-${scheme.id}`}
        >
          <Text style={styles.sourceBtnText}>View Official Requirements →</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <View style={styles.skeletonWrap}>
      <ActivityIndicator size="large" color={AccessColors.teal} />
      <Text style={styles.skeletonText}>Finding potential support…</Text>
      <Text style={styles.skeletonSub}>Searching government schemes database</Text>
    </View>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyEmoji}>🔍</Text>
      <Text style={styles.emptyTitle}>No matches found</Text>
      <Text style={styles.emptyText}>
        Try using different words. For example: "disability support", "education scholarship", or "healthcare coverage".
      </Text>
    </View>
  );
}

// ── Error State ───────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <View style={styles.errorWrap} role="alert">
      <Text style={styles.errorEmoji}>⚠️</Text>
      <Text style={styles.errorTitle}>Search Unavailable</Text>
      <Text style={styles.errorText}>{message}</Text>
      <Text style={styles.errorHint}>
        The scheme search service may be starting up. Please try again in a moment, or visit myscheme.gov.in directly.
      </Text>
    </View>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────

interface SchemeResultsPanelProps {
  results: SchemeMatch[];
  loading: boolean;
  error: string | null;
}

export function SchemeResultsPanel({ results, loading, error }: SchemeResultsPanelProps) {
  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorState message={error} />;
  if (!results.length) return null;

  return (
    <View style={styles.panel}>
      {/* Panel header */}
      <View style={styles.panelHeader}>
        <View style={{ flex: 1, paddingRight: AccessSpacing.md }}>
          <Text style={styles.panelTitle}>Potential Support Available</Text>
          <Text style={styles.panelSubtitle}>
            {results.length} scheme{results.length !== 1 ? 's' : ''} may be relevant to your needs
          </Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{results.length}</Text>
        </View>
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚡ Always verify eligibility and requirements on the official government source before applying.
        </Text>
      </View>

      {/* Scheme cards */}
      <View style={styles.cardsList}>
        {results.map((scheme) => (
          <SchemeCard key={scheme.id ?? scheme.name} scheme={scheme} />
        ))}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Panel
  panel: {
    gap: AccessSpacing.md,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
  },
  panelSubtitle: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: AccessColors.teal,
    borderRadius: AccessRadius.full,
    minWidth: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AccessSpacing.sm,
  },
  countBadgeText: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.bold,
    color: '#FFFFFF',
  },
  disclaimer: {
    borderWidth: 1,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.sm,
    backgroundColor: AccessColors.alertWarningBg,
    borderColor: AccessColors.alertWarningBorder,
  },
  disclaimerText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.alertWarningText,
    lineHeight: 18,
  },
  cardsList: {
    gap: AccessSpacing.md,
  },

  card: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.lg,
    gap: AccessSpacing.sm,
    ...AccessShadow.sm,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    flexWrap: 'wrap',
    paddingRight: 85,
    marginBottom: AccessSpacing.xs,
  },
  categoryBadge: {
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: 3,
    borderRadius: AccessRadius.full,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.semibold,
  },

  // Eligibility badge
  eligBadge: {
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: 3,
    borderRadius: AccessRadius.full,
    backgroundColor: AccessColors.cardHover,
    borderWidth: 1,
    borderColor: AccessColors.border,
  },
  eligBadgeMatch: {
    backgroundColor: AccessColors.tealFaint,
    borderColor: AccessColors.teal,
  },
  eligBadgeUnlikely: {
    backgroundColor: AccessColors.alertWarningBg,
    borderColor: AccessColors.alertWarningBorder,
  },
  eligBadgeText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textSecondary,
  },
  eligBadgeTextMatch: {
    color: AccessColors.tealDark,
  },
  eligBadgeTextUnlikely: {
    color: AccessColors.alertWarningText,
  },

  listenBtn: {
    position: 'absolute',
    top: AccessSpacing.lg,
    right: AccessSpacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: AccessSpacing.sm + 4,
    paddingVertical: 4,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.cardHover,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    zIndex: 2,
    ...AccessShadow.sm,
  },
  listenBtnActive: {
    backgroundColor: AccessColors.alertErrorBg,
    borderColor: AccessColors.alertErrorBorder,
  },
  listenBtnText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
  },
  listenBtnTextActive: {
    color: AccessColors.alertErrorText,
  },

  // Scheme name
  schemeName: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    lineHeight: 24,
  },

  // Relevance bar
  relRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  relLabel: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textTertiary,
    width: 68,
  },
  relBar: {
    flex: 1,
    height: 6,
    backgroundColor: AccessColors.borderLight,
    borderRadius: AccessRadius.full,
    overflow: 'hidden',
  },
  relBarFill: {
    height: '100%',
    borderRadius: AccessRadius.full,
  },

  // Description
  schemeDesc: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },

  // Expand
  expandBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  expandBtnText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.teal,
    fontWeight: AccessFontWeight.semibold,
  },

  // Expanded section
  expandedSection: {
    gap: AccessSpacing.sm,
    borderTopWidth: 1,
    borderTopColor: AccessColors.borderLight,
    paddingTop: AccessSpacing.sm,
    marginTop: 2,
  },
  detailBlock: {
    gap: 4,
  },
  detailLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },
  bulletItem: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    lineHeight: 20,
    paddingLeft: 4,
  },
  noticeBox: {
    backgroundColor: AccessColors.tealFaint,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: AccessColors.teal,
  },
  noticeText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.tealDark,
    lineHeight: 18,
  },

  // Source button
  sourceBtn: {
    backgroundColor: AccessColors.navy,
    borderRadius: AccessRadius.sm,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  sourceBtnPressed: {
    opacity: 0.8,
  },
  sourceBtnText: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: '#FFFFFF',
  },

  // Loading skeleton
  skeletonWrap: {
    alignItems: 'center',
    paddingVertical: AccessSpacing.xl,
    gap: AccessSpacing.sm,
  },
  skeletonText: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
    marginTop: AccessSpacing.sm,
  },
  skeletonSub: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
  },

  // Empty state
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: AccessSpacing.xl,
    gap: AccessSpacing.sm,
  },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  emptyText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },

  // Error state
  errorWrap: {
    backgroundColor: AccessColors.alertErrorBg,
    borderWidth: 1,
    borderColor: AccessColors.alertErrorBorder,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.lg,
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  errorEmoji: { fontSize: 32 },
  errorTitle: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.alertErrorText,
  },
  errorText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.alertErrorText,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textTertiary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
