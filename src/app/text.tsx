/**
 * /text — Type-to-Speak Module (Speech-Impaired Kiosk Interface)
 *
 * Enables speech-impaired users to type custom messages or tap
 * JSON-configured quick phrases for real-time Text-to-Speech playback.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import { speechEngine } from '@/services/speech-engine';
import { PhraseService, type InstitutionConfig } from '@/services/phrase-service';
import { useSession } from '@/context/SessionContext';
import { useAudioNav } from '@/context/AudioNavContext';
import { useSchemeSearch } from '@/hooks/use-scheme-search';
import { SchemeResultsPanel } from '@/components/access/SchemeResultsPanel';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { UI_STRINGS, LANGUAGES, toSafeLangCode } from '@/constants/i18n';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

export default function TextToSpeakScreen() {
  const styles = useStyles();
  const { session, clearSession, broadcastTranslation } = useSession();
  const { announce } = useAudioNav();

  const lang = toSafeLangCode(session.language);
  const speechCode = LANGUAGES[lang].speechCode;
  const t = UI_STRINGS[lang];

  const institutions = PhraseService.getInstitutions(lang);
  const [selectedInstId, setSelectedInstId] = useState<string>(
    session.institution || 'bank'
  );
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [recentPhrases, setRecentPhrases] = useState<string[]>([]);
  const schemeSearch = useSchemeSearch();

  const currentInstitution: InstitutionConfig =
    PhraseService.getInstitutionById(selectedInstId || 'bank', lang);

  useEffect(() => {
    announce(t.textSubtitle);
  }, [announce, t.textSubtitle]);

  function handleBack() {
    speechEngine.stopSpeaking();
    announce(t.backToMain);
    clearSession();
    router.replace('/');
  }

  function handleSpeak(textToSpeak: string) {
    const trimmed = textToSpeak.trim();
    if (!trimmed) return;

    setIsSpeaking(true);
    announce(`Speaking: ${trimmed}`);
    broadcastTranslation(trimmed, 'Text');

    // Add to recent history if not already top
    setRecentPhrases((prev) => {
      const filtered = prev.filter((p) => p !== trimmed);
      return [trimmed, ...filtered].slice(0, 5);
    });

    speechEngine.speak(trimmed, {
      rate: speechRate,
      lang: speechCode,
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }

  function handleSelectPhrase(phrase: string) {
    setInputText(phrase);
    handleSpeak(phrase);
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
            accessibilityLabel={t.backToOptions}
            testID="back-to-home"
          >
            <KioskIcon name="back" size={16} color={AccessColors.navy} />
            <Text style={styles.backBtnLabel}>{t.backToOptions}</Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Module Banner */}
          <View style={styles.headerBlock}>
            <View style={styles.iconContainer}>
              <KioskIcon name="text" size={44} color={AccessColors.teal} />
            </View>
            <Text style={styles.title} role="heading" aria-level={1}>
              {t.textTitle}
            </Text>
            <Text style={styles.subtitle}>
              {t.textSubtitle}
            </Text>
          </View>

          {/* Text Input & TTS Action Box */}
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder={t.textPlaceholder}
                placeholderTextColor={AccessColors.textTertiary}
                value={inputText}
                onChangeText={setInputText}
                multiline
                numberOfLines={3}
                accessibilityLabel="Type text message to speak aloud"
                testID="text-input"
              />
              {Boolean(inputText) && (
                <Pressable
                  onPress={() => setInputText('')}
                  style={styles.clearInputBtn}
                  accessibilityRole="button"
                  accessibilityLabel={t.clearText}
                >
                  <Text style={styles.clearInputText}>{t.clearText}</Text>
                </Pressable>
              )}
            </View>

            {/* Controls Bar: Rate Selector + Speak Button */}
            <View style={styles.controlsRow}>
              <View style={styles.rateSelector}>
                <Text style={styles.rateLabel}>{t.speedLabel}</Text>
                <Pressable
                  onPress={() => setSpeechRate(1.0)}
                  style={[
                    styles.rateChip,
                    speechRate === 1.0 && styles.rateChipActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t.speedNormal}
                >
                  <Text
                    style={[
                      styles.rateChipText,
                      speechRate === 1.0 && styles.rateChipTextActive,
                    ]}
                  >
                    {t.speedNormal}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSpeechRate(0.8)}
                  style={[
                    styles.rateChip,
                    speechRate === 0.8 && styles.rateChipActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={t.speedSlow}
                >
                  <Text
                    style={[
                      styles.rateChipText,
                      speechRate === 0.8 && styles.rateChipTextActive,
                    ]}
                  >
                    {t.speedSlow}
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={() => handleSpeak(inputText)}
                disabled={!inputText.trim() || isSpeaking}
                style={({ pressed }) => [
                  styles.speakBtn,
                  (!inputText.trim() || isSpeaking) && styles.speakBtnDisabled,
                  pressed && styles.speakBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={
                  isSpeaking ? t.speakingNow : t.speakMessage
                }
                testID="speak-button"
              >
                <KioskIcon
                  name="voice"
                  size={20}
                  color={
                    !inputText.trim() || isSpeaking
                      ? AccessColors.textTertiary
                      : AccessColors.cardDefault
                  }
                />
                <Text
                  style={[
                    styles.speakBtnLabel,
                    (!inputText.trim() || isSpeaking) && styles.speakBtnLabelDisabled,
                  ]}
                >
                  {isSpeaking ? t.speakingNow : t.speakMessage}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => schemeSearch.search(inputText)}
                disabled={!inputText.trim() || schemeSearch.loading}
                style={({ pressed }) => [
                  styles.speakBtn,
                  { backgroundColor: AccessColors.tealDark },
                  (!inputText.trim() || schemeSearch.loading) && styles.speakBtnDisabled,
                  pressed && styles.speakBtnPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Find relevant government schemes"
                testID="find-schemes-button"
              >
                <Text style={styles.speakBtnLabel}>
                  {schemeSearch.loading ? 'Searching…' : '🔍 Find Schemes'}
                </Text>
              </Pressable>
            </View>
          </View>

          <SchemeResultsPanel
            results={schemeSearch.results}
            loading={schemeSearch.loading}
            error={schemeSearch.error}
          />

          {/* Recent History Section */}
          {recentPhrases.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.sectionHeading}>{t.recentPhrases}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.historyRow}
              >
                {recentPhrases.map((phrase, i) => (
                  <Pressable
                    key={i}
                    onPress={() => handleSelectPhrase(phrase)}
                    style={styles.historyChip}
                    accessibilityRole="button"
                    accessibilityLabel={`Repeat phrase: ${phrase}`}
                  >
                    <Text style={styles.historyChipText} numberOfLines={1}>
                      {phrase}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Institution Quick Phrase Selector Section */}
          <View style={styles.quickPhrasesSection}>
            <Text style={styles.sectionHeading}>{t.selectCategory}:</Text>

            {/* Institution Tabs */}
            <View style={styles.tabsRow} role="tablist">
              {institutions.map((inst) => {
                const isActive = inst.id === selectedInstId;
                return (
                  <Pressable
                    key={inst.id}
                    onPress={() => setSelectedInstId(inst.id)}
                    style={({ pressed }) => [
                      styles.tabItem,
                      isActive && styles.tabItemActive,
                      pressed && styles.tabItemPressed,
                    ]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isActive }}
                    accessibilityLabel={`${inst.name} phrases`}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        isActive && styles.tabTextActive,
                      ]}
                    >
                      {inst.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Phrase Categories & Chips Grid */}
            <View style={styles.categoriesContainer}>
              {currentInstitution.categories.map((cat, idx) => (
                <View key={idx} style={styles.categoryBlock}>
                  <Text style={styles.categoryTitle}>{cat.name}</Text>
                  <View style={styles.phraseGrid}>
                    {cat.phrases.map((phrase, pIdx) => (
                      <Pressable
                        key={pIdx}
                        onPress={() => handleSelectPhrase(phrase)}
                        style={({ pressed }) => [
                          styles.phraseCard,
                          pressed && styles.phraseCardPressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Speak quick phrase: ${phrase}`}
                      >
                        <Text style={styles.phraseText}>{phrase}</Text>
                        <KioskIcon
                          name="voice"
                          size={14}
                          color={AccessColors.teal}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ))}
            </View>
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
  },
  navBar: {
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.borderLight,
    backgroundColor: AccessColors.cardDefault,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    alignSelf: 'flex-start',
    paddingVertical: AccessSpacing.xs,
    paddingHorizontal: AccessSpacing.sm,
    borderRadius: AccessRadius.sm,
  },
  backBtnPressed: {
    opacity: 0.7,
  },
  backBtnFocused: {
    ...Platform.select({
      web: {
        outlineWidth: 2,
        outlineColor: AccessColors.teal,
        outlineStyle: 'solid',
      },
      default: {},
    }),
  } as any,
  backBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.navy,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: AccessSpacing.xl,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    gap: AccessSpacing.xl,
    paddingBottom: AccessSpacing.xxl * 2,
  },
  headerBlock: {
    alignItems: 'center',
    gap: AccessSpacing.xs,
    paddingVertical: AccessSpacing.md,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: AccessRadius.full,
    backgroundColor: AccessColors.tealLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: AccessSpacing.xs,
  },
  title: {
    fontSize: AccessFontSize.xl,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.navy,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textSecondary,
    textAlign: 'center',
    maxWidth: 600,
  },
  inputCard: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.lg,
    gap: AccessSpacing.md,
    ...AccessShadow.sm,
  },
  inputRow: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: AccessColors.background,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  clearInputBtn: {
    position: 'absolute',
    top: AccessSpacing.sm,
    right: AccessSpacing.sm,
    backgroundColor: AccessColors.borderLight,
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: AccessSpacing.xs,
    borderRadius: AccessRadius.sm,
  },
  clearInputText: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textSecondary,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: AccessSpacing.md,
  },
  rateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
  },
  rateLabel: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textSecondary,
    marginRight: AccessSpacing.xs,
  },
  rateChip: {
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.xs,
    borderRadius: AccessRadius.full,
    borderWidth: 1,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.background,
  },
  rateChipActive: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  rateChipText: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textSecondary,
  },
  rateChipTextActive: {
    color: AccessColors.cardDefault,
    fontFamily: AccessFontFamily.semibold,
  },
  speakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    backgroundColor: AccessColors.teal,
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
  },
  speakBtnDisabled: {
    backgroundColor: AccessColors.borderLight,
    opacity: 0.6,
  },
  speakBtnPressed: {
    backgroundColor: AccessColors.tealDark,
  },
  speakBtnLabel: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.cardDefault,
  },
  speakBtnLabelDisabled: {
    color: AccessColors.textTertiary,
  },
  historyContainer: {
    gap: AccessSpacing.xs,
  },
  sectionHeading: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyRow: {
    flexDirection: 'row',
    gap: AccessSpacing.xs,
    paddingVertical: AccessSpacing.xs,
  },
  historyChip: {
    backgroundColor: AccessColors.cardHover,
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.xs,
    borderRadius: AccessRadius.full,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    maxWidth: 240,
  },
  historyChipText: {
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textPrimary,
  },
  quickPhrasesSection: {
    gap: AccessSpacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: AccessSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: AccessColors.borderLight,
    paddingBottom: AccessSpacing.xs,
    flexWrap: 'wrap',
  },
  tabItem: {
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.sm,
    borderRadius: AccessRadius.sm,
  },
  tabItemActive: {
    backgroundColor: AccessColors.navy,
  },
  tabItemPressed: {
    opacity: 0.8,
  },
  tabText: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textPrimary,
  },
  tabTextActive: {
    color: AccessColors.cardDefault,
    fontFamily: AccessFontFamily.semibold,
  },
  categoriesContainer: {
    gap: AccessSpacing.lg,
  },
  categoryBlock: {
    gap: AccessSpacing.sm,
  },
  categoryTitle: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.navy,
  },
  phraseGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
  },
  phraseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AccessSpacing.sm,
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.md,
    flexGrow: 1,
    minWidth: 260,
  },
  phraseCardPressed: {
    backgroundColor: AccessColors.cardHover,
    borderColor: AccessColors.teal,
  },
  phraseText: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.regular,
    color: AccessColors.textPrimary,
    flex: 1,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
