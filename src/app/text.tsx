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
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import { speechEngine } from '@/services/speech-engine';
import { PhraseService, type InstitutionConfig } from '@/services/phrase-service';
import { useSession } from '@/context/SessionContext';
import { useAudioNav } from '@/context/AudioNavContext';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

export default function TextToSpeakScreen() {
  const { session, clearSession, broadcastTranslation } = useSession();
  const { announce } = useAudioNav();

  const institutions = PhraseService.getInstitutions();
  const [selectedInstId, setSelectedInstId] = useState<string>(
    session.institution || 'bank'
  );
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [recentPhrases, setRecentPhrases] = useState<string[]>([]);

  const currentInstitution: InstitutionConfig =
    PhraseService.getInstitutionById(selectedInstId || 'bank');

  useEffect(() => {
    announce(
      'Type-to-speak module loaded. Type a message or select quick phrases below.'
    );
  }, [announce]);

  function handleBack() {
    speechEngine.stopSpeaking();
    announce('Returning to main menu');
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Module Banner */}
          <View style={styles.headerBlock}>
            <View style={styles.iconContainer}>
              <KioskIcon name="text" size={44} color={AccessColors.teal} />
            </View>
            <Text style={styles.title} role="heading" aria-level={1}>
              Type to Speak
            </Text>
            <Text style={styles.subtitle}>
              Type your message below or choose pre-set quick phrases to synthesize voice output.
            </Text>
          </View>

          {/* Text Input & TTS Action Box */}
          <View style={styles.inputCard}>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.textInput}
                placeholder="Type what you want to say..."
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
                  accessibilityLabel="Clear typed message"
                >
                  <Text style={styles.clearInputText}>Clear</Text>
                </Pressable>
              )}
            </View>

            {/* Controls Bar: Rate Selector + Speak Button */}
            <View style={styles.controlsRow}>
              <View style={styles.rateSelector}>
                <Text style={styles.rateLabel}>Speed:</Text>
                <Pressable
                  onPress={() => setSpeechRate(1.0)}
                  style={[
                    styles.rateChip,
                    speechRate === 1.0 && styles.rateChipActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Normal speech speed"
                >
                  <Text
                    style={[
                      styles.rateChipText,
                      speechRate === 1.0 && styles.rateChipTextActive,
                    ]}
                  >
                    1.0x Normal
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setSpeechRate(0.8)}
                  style={[
                    styles.rateChip,
                    speechRate === 0.8 && styles.rateChipActive,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Slow speech speed"
                >
                  <Text
                    style={[
                      styles.rateChipText,
                      speechRate === 0.8 && styles.rateChipTextActive,
                    ]}
                  >
                    0.8x Slow
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
                  isSpeaking ? 'Speaking message now' : 'Speak typed message aloud'
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
                  {isSpeaking ? 'Speaking...' : 'Speak Message'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Recent History Section */}
          {recentPhrases.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.sectionHeading}>Recently Spoken Phrases:</Text>
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
            <Text style={styles.sectionHeading}>Select Institution Category:</Text>

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
    maxWidth: 600,
    lineHeight: 24,
  },
  inputCard: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  inputRow: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.md,
    fontSize: AccessFontSize.lg,
    color: AccessColors.navy,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  clearInputBtn: {
    position: 'absolute',
    top: AccessSpacing.sm,
    right: AccessSpacing.sm,
    backgroundColor: AccessColors.divider,
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: 4,
    borderRadius: 4,
  },
  clearInputText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textSecondary,
    fontWeight: AccessFontWeight.medium,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: AccessSpacing.md,
    flexWrap: 'wrap',
  },
  rateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
  },
  rateLabel: {
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
    marginRight: 4,
  },
  rateChip: {
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: 4,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.borderLight,
    backgroundColor: AccessColors.background,
  },
  rateChipActive: {
    borderColor: AccessColors.teal,
    backgroundColor: AccessColors.cardSelected,
  },
  rateChipText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textSecondary,
  },
  rateChipTextActive: {
    color: AccessColors.tealDark,
    fontWeight: AccessFontWeight.bold,
  },
  speakBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    backgroundColor: AccessColors.navy,
    paddingHorizontal: AccessSpacing.xl,
    paddingVertical: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
  },
  speakBtnDisabled: {
    backgroundColor: AccessColors.divider,
  },
  speakBtnPressed: {
    opacity: 0.85,
  },
  speakBtnLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
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
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textSecondary,
  },
  historyRow: {
    gap: AccessSpacing.sm,
  },
  historyChip: {
    backgroundColor: AccessColors.cardSelected,
    borderWidth: 1,
    borderColor: AccessColors.tealBorder + '60',
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.xs,
    borderRadius: AccessRadius.sm,
    maxWidth: 240,
  },
  historyChipText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.tealDark,
  },
  quickPhrasesSection: {
    gap: AccessSpacing.md,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: AccessSpacing.xs,
    flexWrap: 'wrap',
  },
  tabItem: {
    paddingHorizontal: AccessSpacing.md,
    paddingVertical: AccessSpacing.sm,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.cardDefault,
  },
  tabItemActive: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  tabItemPressed: {
    opacity: 0.8,
  },
  tabText: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  tabTextActive: {
    color: AccessColors.cardDefault,
    fontWeight: AccessFontWeight.semibold,
  },
  categoriesContainer: {
    gap: AccessSpacing.lg,
  },
  categoryBlock: {
    gap: AccessSpacing.sm,
  },
  categoryTitle: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
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
    color: AccessColors.textPrimary,
    flex: 1,
  },
});
