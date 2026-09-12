/**
 * /text — Text communication module (placeholder).
 *
 * Plug-in point for the text input and output system.
 * The session state (communicationMode: 'text') is already set
 * by the ModeSelector before navigation.
 */

<<<<<<< Updated upstream
import React from 'react';
import { ModePage } from '@/components/access/ModePage';
=======
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
import { useSchemeSearch } from '@/hooks/use-scheme-search';
import { SchemeResultsPanel } from '@/components/access/SchemeResultsPanel';
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
  const schemeSearch = useSchemeSearch();

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
>>>>>>> Stashed changes

export default function TextPage() {
  return (
<<<<<<< Updated upstream
    <ModePage
      mode="text"
      iconName="text"
      title="Text"
      subtitle="Type what you need to communicate. Your messages will be displayed clearly for the staff member to read."
    />
=======
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
              <Pressable
                onPress={() => schemeSearch.search(inputText)}
                disabled={!inputText.trim() || schemeSearch.loading}
                style={({ pressed }) => [styles.speakBtn, (!inputText.trim() || schemeSearch.loading) && styles.speakBtnDisabled, pressed && styles.speakBtnPressed]}
                accessibilityRole="button"
                accessibilityLabel="Find relevant government schemes"
              >
                <Text style={styles.speakBtnLabel}>{schemeSearch.loading ? 'Searching…' : 'Find Schemes'}</Text>
              </Pressable>
            </View>
          </View>
          <SchemeResultsPanel results={schemeSearch.results} loading={schemeSearch.loading} error={schemeSearch.error} />

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
>>>>>>> Stashed changes
  );
}
