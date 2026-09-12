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
import { useFocusEffect, router } from 'expo-router';

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
  const { AccessColors, isDarkMode } = useAccessTheme();
  const { session, setInstitution, setMode } = useSession();
  const ui = UI_STRINGS[session.language] ?? UI_STRINGS.en;
  const institutions = getInstitutions(ui);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isNarrow = width < 600;
  const [badgePulse] = React.useState(() => new Animated.Value(0.95));
  const [mountAnim] = React.useState(() => new Animated.Value(0));
  
  // Fluid background animations (Dark mode)
  const [bgSpin1] = React.useState(() => new Animated.Value(0));
  
  // Golden Rays animations (Light mode)
  const [ray1] = React.useState(() => new Animated.Value(0.4));
  const [ray2] = React.useState(() => new Animated.Value(0.6));
  const [ray3] = React.useState(() => new Animated.Value(0.2));
  const [ray4] = React.useState(() => new Animated.Value(0.7));
  const [rayX] = React.useState(() => new Animated.Value(0));

  // Entrance animations
  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [mountAnim]);


  // Fluid background loops
  useEffect(() => {
    Animated.loop(Animated.timing(bgSpin1, { toValue: 1, duration: 25000, useNativeDriver: false })).start();
  }, [bgSpin1]);

  // Golden Rays loops
  useEffect(() => {
    const breathe = (anim: Animated.Value, lo: number, hi: number, dur: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: hi, duration: dur,       useNativeDriver: true }),
          Animated.timing(anim, { toValue: lo, duration: dur * 1.3, useNativeDriver: true }),
        ])
      ).start();
    breathe(ray1, 0.15, 0.7,  7000);
    breathe(ray2, 0.1,  0.55, 9000);
    breathe(ray3, 0.2,  0.65, 11000);
    breathe(ray4, 0.05, 0.5,  8500);
    Animated.loop(
      Animated.timing(rayX, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  }, [ray1, ray2, ray3, ray4, rayX]);

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

  // Interpolations for stagger
  // Native driver doesn't support backgroundColor, so we set useNativeDriver: false above
  const bgColorDark = bgSpin1.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: ['#040a14', '#0A192F', '#0D2738', '#081326', '#040a14']
  });
  
  const rayShiftX = rayX.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 30, 0] });

  const heroOpacity = mountAnim.interpolate({ inputRange: [0, 0.4], outputRange: [0, 1], extrapolate: 'clamp' });
  const heroTranslateY = mountAnim.interpolate({ inputRange: [0, 0.4], outputRange: [25, 0], extrapolate: 'clamp' });

  const instOpacity = mountAnim.interpolate({ inputRange: [0.2, 0.6], outputRange: [0, 1], extrapolate: 'clamp' });
  const instTranslateY = mountAnim.interpolate({ inputRange: [0.2, 0.6], outputRange: [25, 0], extrapolate: 'clamp' });

  const voiceOpacity = mountAnim.interpolate({ inputRange: [0.4, 0.8], outputRange: [0, 1], extrapolate: 'clamp' });
  const voiceTranslateY = mountAnim.interpolate({ inputRange: [0.4, 0.8], outputRange: [25, 0], extrapolate: 'clamp' });

  const modesOpacity = mountAnim.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const modesTranslateY = mountAnim.interpolate({ inputRange: [0.6, 1], outputRange: [25, 0], extrapolate: 'clamp' });



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
      <View style={styles.screen}>
        {/* ── Dynamic Background ──────────────────────────────────── */}
        {isDarkMode ? (
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: bgColorDark }]}>
            {/* Star-field (Dark mode only) */}
            {[...Array(25)].map((_, i) => (
              <View key={i} style={{
                position: 'absolute',
                width: i % 3 === 0 ? 3 : 2,
                height: i % 3 === 0 ? 3 : 2,
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.4)',
                top:  `${5  + (i * 31 % 90)}%`,
                left: `${8  + (i * 47 % 84)}%`,
              }} />
            ))}
          </Animated.View>
        ) : (
          <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
            {/* ── LIGHT: Golden Hour God Rays ────────────────────────────── */}
            {/* Warm ivory-peach-rose base */}
            <LinearGradient
              colors={['#FFFBF5', '#FFF7ED', '#FEF3C7', '#FFF1F5']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Soft warm bloom — sun just off the top-left corner */}
            <Animated.View style={{
              position: 'absolute', top: '-15%', left: '-10%',
              width: 480, height: 480,
              borderRadius: 240,
              opacity: ray1,
            }}>
              <LinearGradient
                colors={['rgba(253,186,116,0.55)', 'rgba(252,211,77,0.25)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ width: '100%', height: '100%', borderRadius: 240 }}
              />
            </Animated.View>
            {/* God Ray 1 — wide amber shaft, steep angle */}
            <Animated.View style={{
              position: 'absolute', top: '-40%', left: '-8%',
              width: 110, height: '240%',
              opacity: ray2,
              transform: [{ rotate: '28deg' }, { translateX: rayShiftX }],
            }}>
              <LinearGradient
                colors={['transparent', 'rgba(251,191,36,0.22)', 'rgba(252,211,77,0.14)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
            {/* God Ray 2 — narrow golden shaft */}
            <Animated.View style={{
              position: 'absolute', top: '-40%', left: '18%',
              width: 70, height: '240%',
              opacity: ray1,
              transform: [{ rotate: '28deg' }],
            }}>
              <LinearGradient
                colors={['transparent', 'rgba(253,186,116,0.28)', 'rgba(251,191,36,0.18)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
            {/* God Ray 3 — rose-blush shaft */}
            <Animated.View style={{
              position: 'absolute', top: '-40%', left: '38%',
              width: 90, height: '240%',
              opacity: ray3,
              transform: [{ rotate: '28deg' }, { translateX: rayShiftX }],
            }}>
              <LinearGradient
                colors={['transparent', 'rgba(251,113,133,0.16)', 'rgba(253,164,175,0.12)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
            {/* God Ray 4 — wide peach shaft far right */}
            <Animated.View style={{
              position: 'absolute', top: '-40%', left: '58%',
              width: 130, height: '240%',
              opacity: ray4,
              transform: [{ rotate: '28deg' }],
            }}>
              <LinearGradient
                colors={['transparent', 'rgba(251,191,36,0.18)', 'rgba(253,186,116,0.12)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
            {/* God Ray 5 — thin highlight accent */}
            <Animated.View style={{
              position: 'absolute', top: '-40%', left: '80%',
              width: 55, height: '240%',
              opacity: ray2,
              transform: [{ rotate: '28deg' }, { translateX: rayShiftX }],
            }}>
              <LinearGradient
                colors={['transparent', 'rgba(250,204,21,0.2)', 'rgba(253,224,71,0.13)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
            {/* Warm haze at the bottom — dusk settling */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: ray3 }]}>
              <LinearGradient
                colors={['transparent', 'transparent', 'rgba(253,186,116,0.12)', 'rgba(252,165,165,0.15)']}
                start={{ x: 0.2, y: 0.5 }} end={{ x: 0.8, y: 1.0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        )}

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
          <Animated.View 
            style={[styles.hero, { opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }]} 
            accessibilityLabel="Welcome"
          >
            {/* Animated badge */}
            <Animated.View style={[styles.heroBadge, { transform: [{ scale: badgePulse }] }]}>
              <View style={styles.heroBadgeDot} />
              <Text style={styles.heroBadgeText}>{ui.accessAssistant ?? 'Accessibility Assistant'}</Text>
            </Animated.View>

            <Text style={[styles.heroTitle, isNarrow && styles.heroTitleNarrow]} accessibilityRole="header" aria-level={1}>
              AbleLink
            </Text>
            <Text style={[styles.heroTagline, isNarrow && styles.heroTaglineNarrow]}>
              {ui.homeTagline ?? 'Your communication assistant for accessible services.'}
            </Text>
            {!isNarrow && (
              <Text style={styles.heroSub}>
                {ui.homeSub ?? 'Select your institution and choose how you would like to interact. You can change your selection at any time.'}
              </Text>
            )}
          </Animated.View>

          {/* ── Institution cards ──────────────────────────────────────── */}
          <Animated.View
            style={[styles.section, { opacity: instOpacity, transform: [{ translateY: instTranslateY }] }]}
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
          </Animated.View>

          {/* ── 3. One-Tap Auto Voice Assistant Mic (Main Screen) ─────── */}
          <Animated.View
            style={[styles.section, { opacity: voiceOpacity, transform: [{ translateY: voiceTranslateY }] }]}
            accessibilityLabel="Voice Assistant"
          >
            <Pressable
              onPress={() => router.push('/voice')}
              style={({ pressed }) => [styles.voiceHeroBtn, pressed && styles.voiceHeroBtnPressed]}
              accessibilityRole="button"
              accessibilityLabel={session.language === 'hi' ? 'वॉइस असिस्टेंट शुरू करने के लिए एक बार टैप करें (हाथ मुक्त)' : session.language === 'mr' ? 'व्हॉइस असिस्टंट सुरू करण्यासाठी एकदा टॅप करा (हात मुक्त)' : 'Tap once to start auto voice assistant. Entire session is hands-free.'}
              testID="main-screen-voice-mic"
            >
              <LinearGradient
                colors={['#0B8A7E', '#1B2D4F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.voiceHeroGradient, isNarrow && styles.voiceHeroGradientNarrow]}
              >
                <View style={styles.voiceHeroOrb}>
                  <KioskIcon name="voice" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.voiceHeroTextCol}>
                  <View style={styles.voiceHeroBadgeRow}>
                    <View style={styles.voiceHeroDot} />
                    <Text style={styles.voiceHeroBadgeText}>
                      {session.language === 'hi' ? 'एक बार टैप करें • ऑटो वॉइस लूप' : session.language === 'mr' ? 'एकदा टॅप करा • ऑटो व्हॉइस लूप' : 'ONE TAP • 100% HANDS-FREE VOICE'}
                    </Text>
                  </View>
                  <Text style={styles.voiceHeroTitle}>
                    {session.language === 'hi' ? 'बोलकर सहायता प्राप्त करें' : session.language === 'mr' ? 'बोलून मदत मिळवा' : 'Start Spoken Voice Assistant'}
                  </Text>
                  <Text style={styles.voiceHeroSubtitle} numberOfLines={isNarrow ? 2 : undefined}>
                    {session.language === 'hi' ? 'एक टैप से शुरू करें — बाकी पूरा सत्र बिना किसी अतिरिक्त टैप के चलेगा।' : session.language === 'mr' ? 'एका टॅपने सुरू करा — संपूर्ण सत्र विना अतिरिक्त टॅप चालेल.' : 'Tap once to begin. Auto-loops listen → respond → listen for the rest of your session.'}
                  </Text>
                </View>
                <View style={styles.voiceHeroArrow}>
                  <KioskIcon name="next" size={22} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* ── Mode selector ──────────────────────────────────────────── */}
          <Animated.View
            style={[styles.section, { opacity: modesOpacity, transform: [{ translateY: modesTranslateY }] }]}
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
          </Animated.View>

          {/* ── Accessibility statement ─────────────────────────────────── */}
          <LinearGradient
            colors={isDarkMode
              ? ['rgba(6,182,212,0.08)', 'rgba(30,41,59,0.5)']
              : [AccessColors.tealFaint, AccessColors.bankAccentLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.accessStatement}
          >
            <KioskIcon name="info" size={15} color={isDarkMode ? '#5EEAD4' : AccessColors.teal} />
            <Text style={styles.accessStatementText}>
              {ui.a11yStatement}
            </Text>
          </LinearGradient>
        </ScrollView>

        {/* ── 5. Assistance Footer ────────────────────────────────────── */}
        <AssistanceBar />
      </View>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow, isDarkMode } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
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
    gap: AccessSpacing.lg,
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
    backgroundColor: isDarkMode ? 'rgba(6,182,212,0.12)' : AccessColors.tealFaint,
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(94,234,212,0.4)' : AccessColors.teal + '50',
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
    color: isDarkMode ? '#5EEAD4' : AccessColors.tealDark,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: AccessFontSize.hero,
    fontWeight: AccessFontWeight.bold,
    color: isDarkMode ? '#FFFFFF' : '#0B8A7E',
    letterSpacing: -1.5,
    textShadowColor: isDarkMode ? 'rgba(45,212,191,0.6)' : 'rgba(11,138,126,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: isDarkMode ? 24 : 16,
  },
  heroTitleNarrow: {
    fontSize: 32,
    lineHeight: 38,
  },
  heroTagline: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.regular,
    color: isDarkMode ? 'rgba(226,232,240,0.95)' : AccessColors.textPrimary,
    lineHeight: 34,
  },
  heroTaglineNarrow: {
    fontSize: AccessFontSize.base,
    lineHeight: 26,
  },
  heroSub: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: isDarkMode ? 'rgba(148,163,184,0.9)' : AccessColors.textSecondary,
    lineHeight: 26,
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
    backgroundColor: isDarkMode ? '#5EEAD4' : AccessColors.navy,
  },
  sectionLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.bold,
    color: isDarkMode ? '#94A3B8' : AccessColors.tealDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionSub: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: isDarkMode ? 'rgba(148,163,184,0.85)' : AccessColors.textSecondary,
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
    backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.45)' : 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1.5,
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.9)',
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
    backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : '#FFFFFF',
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
    fontSize: AccessFontSize.sm,
    lineHeight: 20,
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

  // ── One-Tap Voice Hero Mic Button ─────────────────────────────────────────
  voiceHeroBtn: {
    width: '100%',
    borderRadius: AccessRadius.xl,
    overflow: 'hidden',
    ...AccessShadow.md,
  },
  voiceHeroBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  voiceHeroGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  voiceHeroGradientNarrow: {
    padding: AccessSpacing.lg,
    gap: AccessSpacing.sm,
  },
  voiceHeroOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceHeroTextCol: {
    flex: 1,
    gap: 4,
  },
  voiceHeroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceHeroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00F5D4',
  },
  voiceHeroBadgeText: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.bold,
    color: '#00F5D4',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  voiceHeroTitle: {
    fontSize: AccessFontSize.xl,
    fontFamily: AccessFontFamily.bold,
    color: '#FFFFFF',
    lineHeight: 28,
  },
  voiceHeroSubtitle: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
  },
  voiceHeroArrow: {
    padding: AccessSpacing.xs,
  },

  // ── Accessibility statement ──────────────────────────────────────────────
  accessStatement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: AccessSpacing.md,
    padding: AccessSpacing.lg,
    borderWidth: 1,
    borderColor: isDarkMode ? 'rgba(94,234,212,0.2)' : AccessColors.teal + '35',
    borderRadius: AccessRadius.lg,
  },
  accessStatementText: {
    flex: 1,
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.regular,
    color: isDarkMode ? 'rgba(148,163,184,0.9)' : AccessColors.tealDark,
    lineHeight: 22,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow, isDarkMode]);
}
