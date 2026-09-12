/**
 * Home screen — AccessAssist Landing / Welcome
 *
 * Structure:
 *   1. AccessHeader  — institutional wordmark + service status
 *   2. Hero section  — branding + animated badge + tagline
 *   3. Institution cards — Bank / Hospital / Government Office (color-coded)
 *   4. ModeSelector  — 2×2 grid of communication modes
 *   5. AssistanceBar — footer with staff call + language selector
 */

import React, { useEffect } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ScrollView,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';

import { AccessHeader } from '@/components/access/AccessHeader';
import { ModeSelector } from '@/components/access/ModeSelector';
import { AssistanceBar } from '@/components/access/AssistanceBar';
import { AudioNavControl } from '@/components/access/AudioNavControl';
import { KioskIcon, type IconName } from '@/components/access/KioskIcon';
import { useSession, type InstitutionType } from '@/context/SessionContext';
import {
  AccessAnimation,
  AccessColors,
  AccessSpacing,
  AccessFontSize,
  AccessFontWeight,
  AccessRadius,
  AccessShadow,
} from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { UI_STRINGS, LANG_ORDER } from '@/constants/i18n';

// ── Institution definitions ────────────────────────────────────────────────

const getInstitutions = (ui: typeof UI_STRINGS.en) => [
  {
    id: 'bank' as InstitutionType,
    label: ui.instBank ?? 'Bank',
    icon: 'bank' as IconName,
    description: ui.instBankDesc ?? 'Account, transactions & banking services',
    accent: AccessColors.bankAccent,
    accentLight: AccessColors.bankAccentLight,
    accentBorder: AccessColors.bankAccentBorder,
    gradient: [AccessColors.bankAccent, '#1D4ED8'] as [string, string],
  },
  {
    id: 'hospital' as InstitutionType,
    label: ui.instHospital ?? 'Hospital',
    icon: 'hospital' as IconName,
    description: ui.instHospitalDesc ?? 'Appointments, reception & medical assistance',
    accent: AccessColors.hospitalAccent,
    accentLight: AccessColors.hospitalAccentLight,
    accentBorder: AccessColors.hospitalAccentBorder,
    gradient: [AccessColors.hospitalAccent, '#BE185D'] as [string, string],
  },
  {
    id: 'government' as InstitutionType,
    label: ui.instGov ?? 'Government Office',
    icon: 'government' as IconName,
    description: ui.instGovDesc ?? 'Forms, schemes & government services',
    accent: AccessColors.governmentAccent,
    accentLight: AccessColors.governmentAccentLight,
    accentBorder: AccessColors.governmentAccentBorder,
    gradient: [AccessColors.governmentAccent, '#6D28D9'] as [string, string],
  },
];

// ── Animated Institution Card ──────────────────────────────────────────────

function InstitutionCard({
  inst,
  selected,
  onPress,
  isNarrow = false,
}: {
  inst: ReturnType<typeof getInstitutions>[0];
  selected: boolean;
  onPress: () => void;
  isNarrow?: boolean;
}) {
  const styles = useStyles();
  const { AccessColors, AccessShadow } = useAccessTheme();
  const [scaleAnim] = React.useState(() => new Animated.Value(1));
  const [checkAnim] = React.useState(() => new Animated.Value(selected ? 1 : 0));
  const [hovered, setHovered] = React.useState(false);

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [selected, checkAnim]);

  const textColor = selected ? '#FFFFFF' : AccessColors.textPrimary;
  const descColor = selected ? 'rgba(255,255,255,0.9)' : AccessColors.textSecondary;

  return (
    <Animated.View
      style={[
        styles.institutionCardWrapper,
        isNarrow && styles.institutionCardWrapperNarrow,
        { transform: [{ scale: scaleAnim }] },
        selected && (AccessShadow.teal as any),
        !selected && (AccessShadow.md as any),
      ]}
    >
      <Pressable
        style={({ pressed }: any) => [
          styles.institutionCard,
          isNarrow && styles.institutionCardNarrow,
          selected && styles.institutionCardSelected,
          hovered && !selected && styles.institutionCardHovered,
          pressed && styles.institutionCardPressed,
        ]}
        onPress={onPress}
        onHoverIn={() => {
          setHovered(true);
          Animated.spring(scaleAnim, { toValue: 1.03, useNativeDriver: true, speed: 28, bounciness: 4 }).start();
        }}
        onHoverOut={() => {
          setHovered(false);
          Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 28, bounciness: 4 }).start();
        }}
        onPressIn={() => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 30, bounciness: 0 }).start()}
        onPressOut={() => Animated.spring(scaleAnim, { toValue: hovered ? 1.03 : 1, useNativeDriver: true, speed: 28, bounciness: 4 }).start()}
        accessibilityRole="button"
        accessibilityLabel={`${inst.label}: ${inst.description}`}
        accessibilityState={{ selected }}
        testID={`institution-${inst.id}`}
      >
        {selected ? (
          <LinearGradient
            colors={inst.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={inst.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: isNarrow ? 0 : 1, y: isNarrow ? 1 : 0 }}
            style={[styles.institutionStripe, isNarrow && styles.institutionStripeNarrow]}
          />
        )}

        <View style={[styles.institutionContent, isNarrow && styles.institutionContentNarrow]}>
          {/* Icon */}
          <View
            style={[
              styles.institutionIcon,
              selected
                ? { backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'transparent' }
                : { backgroundColor: inst.accentLight, borderColor: inst.accentBorder },
              isNarrow && styles.institutionIconNarrow,
            ]}
          >
            <KioskIcon
              name={inst.icon}
              size={isNarrow ? 24 : 32}
              color={selected ? '#FFFFFF' : inst.accent}
            />
          </View>

          <View style={styles.institutionTextContainer}>
            <Text
              style={[
                styles.institutionLabel,
                isNarrow && styles.institutionLabelNarrow,
                { color: textColor },
              ]}
              numberOfLines={1}
            >
              {inst.label}
            </Text>
            <Text style={[styles.institutionDesc, isNarrow && styles.institutionDescNarrow, { color: descColor }]} numberOfLines={2}>
              {inst.description}
            </Text>
          </View>
        </View>

        {/* Animated check badge */}
        <Animated.View
          style={[
            styles.institutionCheck,
            {
              transform: [{ scale: checkAnim }],
              opacity: checkAnim,
              backgroundColor: '#FFFFFF',
            },
          ]}
          aria-hidden
        >
          <KioskIcon name="check" size={12} color={inst.accent} />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const styles = useStyles();
  const { AccessColors } = useAccessTheme();
  const { session, setInstitution, setMode } = useSession();
  const ui = UI_STRINGS[session.language] ?? UI_STRINGS.en;
  const institutions = getInstitutions(ui);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNarrow = width < 600;
  const [badgePulse] = React.useState(() => new Animated.Value(0.95));

  // Subtle badge breathing
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(badgePulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(badgePulse, { toValue: 0.95, duration: 2000, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [badgePulse]);

  // Clear communication mode when returning to the home screen
  useFocusEffect(
    React.useCallback(() => {
      if (session.communicationMode) {
        setMode(null);
      }
    }, [session.communicationMode, setMode])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <LinearGradient 
        colors={[AccessColors.background, AccessColors.tealFaint]} 
        start={{ x: 0, y: 0 }} 
        end={{ x: 1, y: 1 }} 
        style={styles.screen}
      >
        {/* ── 1. Header ──────────────────────────────────────────────────── */}
        <AccessHeader />

        {/* ── 2–4. Scrollable content ─────────────────────────────────── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isNarrow && styles.scrollContentNarrow,
            { paddingLeft: Math.max(isNarrow ? AccessSpacing.md : AccessSpacing.xl, insets.left), paddingRight: Math.max(isNarrow ? AccessSpacing.md : AccessSpacing.xl, insets.right), paddingBottom: Math.max(AccessSpacing.xl, insets.bottom + 80) }
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero section */}
          <View style={styles.hero} accessibilityLabel="Welcome">
            {/* Animated badge */}
            <Animated.View style={[styles.heroBadge, { transform: [{ scale: badgePulse }] }]}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>{ui.accessAssistant ?? 'Accessibility Assistant'}</Text>
            </Animated.View>

            <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]} accessibilityRole="header" aria-level={1}>
              AccessAssist
            </Text>
            <Text style={[styles.heroTagline, isNarrow && styles.heroTaglineNarrow]}>
              {ui.homeTagline ?? 'Your communication assistant for accessible services.'}
            </Text>
            <Text style={styles.heroSub}>
              {ui.homeSub ?? 'Select your institution and choose how you would like to interact. You can change your selection at any time.'}
            </Text>
          </View>

          {/* ── Institution cards ──────────────────────────────────────── */}
          <View
            style={styles.section}
            accessibilityLabel="Institution selection"
          >
            <View style={styles.sectionLabelRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionLabel}>{ui.homeSectionTitle ?? 'Where are you today?'}</Text>
            </View>
            <View style={[styles.institutionRow, isNarrow && styles.institutionRowNarrow]}>
              {institutions.map((inst) => (
                <InstitutionCard
                  key={inst.id}
                  inst={inst}
                  selected={session.institution === inst.id}
                  onPress={() => setInstitution(inst.id)}
                  isNarrow={isNarrow}
                />
              ))}
            </View>
          </View>

          {/* ── Mode selector ──────────────────────────────────────────── */}
          <View
            style={styles.section}
            accessibilityLabel="Communication mode selection"
          >
            <View style={styles.sectionLabelRow}>
              <View style={[styles.sectionDot, { backgroundColor: AccessColors.teal }]} />
              <Text style={styles.sectionLabel}>{ui.modeSectionTitle ?? 'Choose how you would like to communicate.'}</Text>
            </View>
            <Text style={styles.sectionSub}>
              {ui.modeSectionSub ?? 'Select the option that is most comfortable for you.'}
            </Text>
            <View style={styles.selectorWrapper}>
              <ModeSelector />
            </View>
          </View>

          {/* ── Accessibility statement ─────────────────────────────────── */}
          <LinearGradient
            colors={[AccessColors.tealFaint, AccessColors.bankAccentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accessStatement}
          >
            <KioskIcon name="info" size={15} color={AccessColors.teal} />
            <Text style={styles.accessStatementText}>
              {ui.a11yStatement}
            </Text>
          </LinearGradient>
        </ScrollView>

        {/* ── 5. Assistance Footer ────────────────────────────────────── */}
        <AssistanceBar />

        {/* ── 6. Mobile Voice Commands FAB ────────────────────────────── */}
        {isNarrow && <AudioNavControl isNarrow={true} insets={insets} />}
      </LinearGradient>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

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
  scrollContentNarrow: {
    paddingHorizontal: AccessSpacing.md,
    paddingTop: AccessSpacing.md,
    paddingBottom: AccessSpacing.md,
    gap: AccessSpacing.xl,
  },

  // ── Hero ──────────────────────────────────────────────────────────────────
  hero: {
    gap: AccessSpacing.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    alignSelf: 'flex-start',
    backgroundColor: AccessColors.tealFaint,
    borderWidth: 1.5,
    borderColor: AccessColors.teal + '50',
    borderRadius: 99,
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: 6,
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: AccessColors.statusGreenPulse,
  },
  heroBadgeText: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.tealDark,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: AccessFontSize.hero,
    fontWeight: AccessFontWeight.bold,
    color: AccessColors.navy,
    letterSpacing: -0.5,
  },
  heroTitleNarrow: {
    fontSize: 32,
    lineHeight: 38,
  },
  heroTagline: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textPrimary,
    lineHeight: 32,
  },
  heroTaglineNarrow: {
    fontSize: AccessFontSize.base,
    lineHeight: 24,
  },
  heroSub: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 24,
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    gap: AccessSpacing.md,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
  },
  sectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: AccessColors.navy,
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

  // ── Institution cards ──────────────────────────────────────────────────────
  institutionRow: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    flexWrap: 'wrap',
  },
  institutionRowNarrow: {
    flexDirection: 'column',
  },
  institutionCardWrapper: {
    flex: 1,
    minWidth: 200,
    minHeight: 180,
    borderRadius: AccessRadius.xl,
  },
  institutionCardWrapperNarrow: {
    minWidth: 0,
    minHeight: 90,
    flex: undefined,
    width: '100%',
  },
  institutionCard: {
    flex: 1,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: 'transparent', // We'll use shadow instead of border for premium feel
    borderRadius: AccessRadius.xl,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  institutionCardNarrow: {
    justifyContent: 'center',
  },
  institutionCardSelected: {
    borderWidth: 0,
  },
  institutionCardHovered: {
    backgroundColor: AccessColors.cardHover,
    transform: Platform.OS === 'web' ? [{ translateY: -2 }] : [],
  },
  institutionCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  institutionStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
  },
  institutionStripeNarrow: {
    top: 0,
    bottom: 0,
    left: 0,
    right: undefined,
    width: 6,
    height: '100%',
  },
  institutionContent: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  institutionContentNarrow: {
    padding: AccessSpacing.md,
    gap: AccessSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  institutionTextContainer: {
    gap: 4,
    flex: 1,
  },
  institutionIcon: {
    width: 64,
    height: 64,
    borderRadius: AccessRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  institutionIconNarrow: {
    width: 52,
    height: 52,
    borderRadius: AccessRadius.sm,
  },
  institutionLabel: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.bold,
  },
  institutionLabelNarrow: {
    fontSize: AccessFontSize.base,
  },
  institutionDesc: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    lineHeight: 20,
  },
  institutionDescNarrow: {
    fontSize: AccessFontSize.xs,
    lineHeight: 18,
  },
  institutionCheck: {
    position: 'absolute',
    top: AccessSpacing.md,
    right: AccessSpacing.md,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...AccessShadow.sm,
  },

  // ── Mode selector wrapper ───────────────────────────────────────────────
  selectorWrapper: {
    width: '100%',
  },

  // ── Accessibility statement ──────────────────────────────────────────────
  accessStatement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.sm,
    padding: AccessSpacing.md,
    borderWidth: 1,
    borderColor: AccessColors.teal + '30',
    borderRadius: AccessRadius.md,
  },
  accessStatementText: {
    flex: 1,
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.tealDark,
    lineHeight: 20,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
