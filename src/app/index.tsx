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

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
  AccessShadow,
  AccessAnimation,
} from '@/constants/access-theme';

// ── Institution definitions ────────────────────────────────────────────────

const INSTITUTIONS: {
  id: InstitutionType;
  label: string;
  icon: IconName;
  description: string;
  accent: string;
  accentLight: string;
  accentBorder: string;
  gradient: [string, string];
}[] = [
  {
    id: 'bank',
    label: 'Bank',
    icon: 'bank',
    description: 'Account, transactions & banking services',
    accent: AccessColors.bankAccent,
    accentLight: AccessColors.bankAccentLight,
    accentBorder: AccessColors.bankAccentBorder,
    gradient: [AccessColors.bankAccent, '#1D4ED8'],
  },
  {
    id: 'hospital',
    label: 'Hospital',
    icon: 'hospital',
    description: 'Appointments, reception & medical assistance',
    accent: AccessColors.hospitalAccent,
    accentLight: AccessColors.hospitalAccentLight,
    accentBorder: AccessColors.hospitalAccentBorder,
    gradient: [AccessColors.hospitalAccent, '#BE185D'],
  },
  {
    id: 'government',
    label: 'Government Office',
    icon: 'government',
    description: 'Forms, schemes & government services',
    accent: AccessColors.governmentAccent,
    accentLight: AccessColors.governmentAccentLight,
    accentBorder: AccessColors.governmentAccentBorder,
    gradient: [AccessColors.governmentAccent, '#6D28D9'],
  },
];

// ── Animated Institution Card ──────────────────────────────────────────────

function InstitutionCard({
  inst,
  selected,
  onPress,
  isNarrow = false,
}: {
  inst: (typeof INSTITUTIONS)[0];
  selected: boolean;
  onPress: () => void;
  isNarrow?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const [hovered, setHovered] = React.useState(false);

  useEffect(() => {
    Animated.spring(checkAnim, {
      toValue: selected ? 1 : 0,
      useNativeDriver: true,
      speed: 22,
      bounciness: 6,
    }).start();
  }, [selected, checkAnim]);

  return (
    <Animated.View
      style={[
        styles.institutionCardWrapper,
        isNarrow && styles.institutionCardWrapperNarrow,
        { transform: [{ scale: scaleAnim }] },
        selected && (AccessShadow.teal as any),
        !selected && (AccessShadow.sm as any),
      ]}
    >
      <Pressable
        style={({ pressed }: any) => [
          styles.institutionCard,
          selected && styles.institutionCardSelected,
          selected && { borderColor: inst.accent },
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
        {/* Colour-coded top accent stripe */}
        <LinearGradient
          colors={inst.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.institutionStripe}
        />

        {/* Icon */}
        <View
          style={[
            styles.institutionIcon,
            selected
              ? { backgroundColor: inst.accentLight, borderColor: inst.accentBorder }
              : styles.institutionIconDefault,
            isNarrow && styles.institutionIconNarrow,
          ]}
        >
          <KioskIcon
            name={inst.icon}
            size={28}
            color={selected ? inst.accent : AccessColors.navy}
          />
        </View>

        <Text
          style={[
            styles.institutionLabel,
            selected && { color: inst.accent },
          ]}
        >
          {inst.label}
        </Text>
        <Text style={styles.institutionDesc} numberOfLines={2}>
          {inst.description}
        </Text>

        {/* Animated check badge */}
        <Animated.View
          style={[
            styles.institutionCheck,
            {
              transform: [{ scale: checkAnim }],
              opacity: checkAnim,
              backgroundColor: inst.accent,
            },
          ]}
          aria-hidden
        >
          <KioskIcon name="check" size={9} color="#FFFFFF" />
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { session, setInstitution } = useSession();
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;
  const badgePulse = useRef(new Animated.Value(0.95)).current;

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        {/* ── 1. Header ──────────────────────────────────────────────────── */}
        <AccessHeader />

        {/* ── 2–4. Scrollable content ─────────────────────────────────── */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, isNarrow && styles.scrollContentNarrow]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero section */}
          <View style={styles.hero} accessibilityLabel="Welcome">
            {/* Animated badge */}
            <Animated.View style={[styles.heroBadge, { transform: [{ scale: badgePulse }] }]}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>Accessibility Assistant</Text>
            </Animated.View>

            <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]} accessibilityRole="header" aria-level={1}>
              AccessAssist
            </Text>
            <Text style={[styles.heroTagline, isNarrow && styles.heroTaglineNarrow]}>
              Your communication assistant for accessible services.
            </Text>
            <Text style={styles.heroSub}>
              Select your institution and choose how you would like to interact.
              You can change your selection at any time.
            </Text>
          </View>

          {/* ── Institution cards ──────────────────────────────────────── */}
          <View
            style={styles.section}
            accessibilityLabel="Institution selection"
          >
            <View style={styles.sectionLabelRow}>
              <View style={styles.sectionDot} />
              <Text style={styles.sectionLabel}>Where are you today?</Text>
            </View>
            <View style={[styles.institutionRow, isNarrow && styles.institutionRowNarrow]}>
              {INSTITUTIONS.map((inst) => (
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
              <Text style={styles.sectionLabel}>Choose how you would like to communicate.</Text>
            </View>
            <Text style={styles.sectionSub}>
              Select the option that is most comfortable for you.
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
              This kiosk supports Indian Sign Language, voice, text, and simplified
              touch interaction. All sessions are private and automatically cleared.
            </Text>
          </LinearGradient>
        </ScrollView>

        {/* ── 5. Footer ─────────────────────────────────────────────────── */}
        <AssistanceBar />
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

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
    fontSize: AccessFontSize.xxl,
  },
  heroTagline: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textPrimary,
    lineHeight: 32,
  },
  heroTaglineNarrow: {
    fontSize: AccessFontSize.md,
    lineHeight: 28,
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
    minWidth: 160,
    borderRadius: AccessRadius.md,
  },
  institutionCardWrapperNarrow: {
    minWidth: 0,
    flex: undefined,
    width: '100%',
  },
  institutionCard: {
    flex: 1,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.lg,
    gap: AccessSpacing.sm,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  institutionCardSelected: {
    borderWidth: 2,
    backgroundColor: AccessColors.cardDefault,
  },
  institutionCardHovered: {
    borderColor: AccessColors.borderHover,
    backgroundColor: AccessColors.cardHover,
  },
  institutionCardPressed: {
    opacity: 0.9,
  },
  institutionStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: AccessRadius.md,
    borderTopRightRadius: AccessRadius.md,
  },
  institutionIcon: {
    width: 48,
    height: 48,
    borderRadius: AccessRadius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  institutionIconNarrow: {
    width: 40,
    height: 40,
  },
  institutionIconDefault: {
    backgroundColor: AccessColors.background,
    borderColor: AccessColors.borderLight,
  },
  institutionLabel: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  institutionDesc: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.regular,
    color: AccessColors.textSecondary,
    lineHeight: 20,
  },
  institutionCheck: {
    position: 'absolute',
    top: AccessSpacing.md,
    right: AccessSpacing.md,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
});
