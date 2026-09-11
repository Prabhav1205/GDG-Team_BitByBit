/**
 * /text â€” Text Communication Interface
 *
 * Full frontend placeholder for text-based communication.
 * Teammates can wire up the message delivery and response logic.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { PageHeader } from '@/components/access/PageHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import { ConversationBubble, type ConversationMessage } from '@/components/access/ConversationBubble';
import { useSession } from '@/context/SessionContext';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// â”€â”€ Quick phrases by institution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const QUICK_PHRASES: Record<string, string[]> = {
  bank: [
    'I need help with my account',
    'I want to withdraw money',
    'I need to update my details',
  ],
  hospital: [
    'I need an appointment',
    'Where is the reception?',
    'I need assistance',
  ],
  government: [
    'I need help with this form',
    'I want to apply for a scheme',
    'I need information',
  ],
  default: [
    'I need help',
    'Can I speak to someone?',
    'Please assist me',
  ],
};

// â”€â”€ Mock conversation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MOCK_MESSAGES: ConversationMessage[] = [
  { id: '1', sender: 'staff', text: 'Hello! How can I assist you today?', timestamp: '09:41' },
];

const MAX_CHARS = 500;

// â”€â”€ Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function TextPage() {
  const { session } = useSession();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ConversationMessage[]>(MOCK_MESSAGES);

  const institution = session.institution ?? 'default';
  const phrases = QUICK_PHRASES[institution] ?? QUICK_PHRASES.default;

  function handlePhrase(phrase: string) {
    setMessage(phrase);
  }

  function handleSend() {
    if (!message.trim()) return;
    const newMsg: ConversationMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: message.trim(),
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage('');

    // Mock staff response after delay
    setTimeout(() => {
      const staffReply: ConversationMessage = {
        id: Date.now().toString() + '-staff',
        sender: 'staff',
        text: 'Thank you, I will assist you with that shortly.',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, staffReply]);
    }, 1200);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <AccessHeader />
        <PageHeader title="Type Your Message" backLabel="Back to modes" backRoute="/" />

        <View style={styles.body}>
          {/* â”€â”€ Chat area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <ScrollView
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((msg) => (
              <ConversationBubble key={msg.id} message={msg} />
            ))}
          </ScrollView>

          {/* â”€â”€ Compose area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <View style={styles.compose}>
            {/* Quick phrases */}
            <View style={styles.phrasesRow}>
              <Text style={styles.phrasesLabel}>Quick phrases:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.phrasesScroll}>
                {phrases.map((p) => (
                  <Pressable
                    key={p}
                    style={({ pressed }: any) => [styles.phraseChip, pressed && styles.phraseChipPressed]}
                    onPress={() => handlePhrase(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Use phrase: ${p}`}
                  >
                    <Text style={styles.phraseChipLabel}>{p}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Textarea */}
            <View style={styles.inputRow}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.textInput}
                  value={message}
                  onChangeText={(t) => setMessage(t.slice(0, MAX_CHARS))}
                  placeholder="Type your message here..."
                  placeholderTextColor={AccessColors.textTertiary}
                  multiline
                  maxLength={MAX_CHARS}
                  accessibilityLabel="Message input"
                  testID="text-input"
                />
                <Text style={styles.charCount}>
                  {message.length}/{MAX_CHARS}
                </Text>
              </View>

              <View style={styles.inputActions}>
                <Pressable
                  style={({ pressed }: any) => [styles.clearBtn, pressed && styles.clearBtnPressed]}
                  onPress={() => setMessage('')}
                  accessibilityRole="button"
                  accessibilityLabel="Clear input"
                >
                  <KioskIcon name="close" size={16} color={AccessColors.textSecondary} />
                </Pressable>
                <Pressable
                  style={({ pressed }: any) => [
                    styles.sendBtn,
                    !message.trim() && styles.sendBtnDisabled,
                    pressed && styles.sendBtnPressed,
                  ]}
                  onPress={handleSend}
                  disabled={!message.trim()}
                  accessibilityRole="button"
                  accessibilityLabel="Send message"
                  testID="send-message"
                >
                  <KioskIcon
                    name="send"
                    size={20}
                    color={message.trim() ? AccessColors.textOnDark : AccessColors.textTertiary}
                  />
                  <Text style={[styles.sendBtnLabel, !message.trim() && styles.sendBtnLabelDisabled]}>
                    Send to Staff
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// â”€â”€ Styles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccessColors.background },
  screen: { flex: 1, backgroundColor: AccessColors.background },
  body: {
    flex: 1,
    flexDirection: 'column',
  },

  // Chat
  chatScroll: { flex: 1 },
  chatContent: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.lg,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },

  // Compose
  compose: {
    borderTopWidth: 1,
    borderTopColor: AccessColors.divider,
    backgroundColor: AccessColors.cardDefault,
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  phrasesRow: {
    gap: AccessSpacing.sm,
  },
  phrasesLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  phrasesScroll: {
    gap: AccessSpacing.sm,
  },
  phraseChip: {
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: AccessColors.navy,
    backgroundColor: AccessColors.cardDefault,
  },
  phraseChipPressed: {
    backgroundColor: AccessColors.overlay,
  },
  phraseChipLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.navy,
  },

  // Input
  inputRow: {
    gap: AccessSpacing.md,
  },
  inputWrapper: {
    position: 'relative',
    backgroundColor: AccessColors.background,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    minHeight: 100,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      },
      default: {},
    }) as any,
  },
  textInput: {
    padding: AccessSpacing.md,
    fontSize: AccessFontSize.md,
    color: AccessColors.textPrimary,
    lineHeight: 28,
    minHeight: 100,
    ...Platform.select({ web: { outlineStyle: 'none' } as any, default: {} }),
  },
  charCount: {
    position: 'absolute',
    bottom: AccessSpacing.sm,
    right: AccessSpacing.md,
    fontSize: AccessFontSize.xs,
    color: AccessColors.textTertiary,
  },
  inputActions: {
    flexDirection: 'row',
    gap: AccessSpacing.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  clearBtn: {
    width: 40,
    height: 40,
    borderRadius: AccessRadius.sm,
    backgroundColor: AccessColors.background,
    borderWidth: 1,
    borderColor: AccessColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnPressed: { opacity: 0.7 },
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.xl,
    borderRadius: AccessRadius.md,
    backgroundColor: AccessColors.navy,
    ...Platform.select({ web: { outlineStyle: 'none' }, default: {} }),
  },
  sendBtnDisabled: {
    backgroundColor: AccessColors.borderLight,
  },
  sendBtnPressed: { opacity: 0.8 },
  sendBtnFocused: {
    ...Platform.select({
      web: { outlineWidth: 3, outlineColor: AccessColors.focusRing, outlineStyle: 'solid', outlineOffset: 2 },
      default: {},
    }),
  } as any,
  sendBtnLabel: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textOnDark,
  },
  sendBtnLabelDisabled: { color: AccessColors.textTertiary },
});


