/**
 * i18n — Centralized language & translation configuration
 *
 * Supports:
 *   — English  (en) → en-IN
 *   — Hindi    (hi) → hi-IN
 *   — Marathi  (mr) → mr-IN
 *
 * All UI strings, quick actions, assistant responses, and error messages
 * are defined here. Components import from this file — nothing is hardcoded.
 */

// ── Language Code Type ─────────────────────────────────────────────────────

export type LangCode = 'en' | 'hi' | 'mr';

// ── Language Definitions ───────────────────────────────────────────────────

export const LANGUAGES: Record<
  LangCode,
  { name: string; nativeName: string; speechCode: string; dir: 'ltr' | 'rtl' }
> = {
  en: { name: 'English',  nativeName: 'English', speechCode: 'en-IN', dir: 'ltr' },
  hi: { name: 'Hindi',    nativeName: 'हिन्दी',  speechCode: 'hi-IN', dir: 'ltr' },
  mr: { name: 'Marathi',  nativeName: 'मराठी',   speechCode: 'mr-IN', dir: 'ltr' },
};

export const LANG_ORDER: LangCode[] = ['en', 'hi', 'mr'];

/** Returns the BCP-47 speech code for the given language key */
export function getSpeechCode(lang: LangCode): string {
  return LANGUAGES[lang]?.speechCode ?? 'en-IN';
}

/** Safely coerce an unknown string to a valid LangCode, falling back to 'en' */
export function toSafeLangCode(lang: string): LangCode {
  if (lang === 'en' || lang === 'hi' || lang === 'mr') return lang;
  return 'en';
}

// ── UI String Translations ─────────────────────────────────────────────────

export interface UIStrings {
  // Navigation
  backToOptions: string;
  backToMain: string;

  // Home Page
  homeTagline: string;
  homeSub: string;
  homeSectionTitle: string;
  modeSectionTitle: string;
  modeSectionSub: string;
  modeSignTitle: string;
  modeVoiceTitle: string;
  modeTextTitle: string;
  modeAssistedTitle: string;
  modeSignDesc: string;
  modeVoiceDesc: string;
  modeTextDesc: string;
  modeAssistedDesc: string;
  accessAssistant: string;
  instBank: string;
  instBankDesc: string;
  instHospital: string;
  instHospitalDesc: string;
  instGov: string;
  instGovDesc: string;
  headerDescriptor: string;

  // Voice module
  voiceTitle: string;
  voiceSubtitle: string;
  micTap: string;
  micActive: string;
  micStop: string;
  youSpoke: string;
  kioskResponse: string;
  speaking: string;
  commonPhrases: string;

  // Text module
  textTitle: string;
  textSubtitle: string;
  textPlaceholder: string;
  speakMessage: string;
  speakingNow: string;
  clearText: string;
  speedLabel: string;
  speedNormal: string;
  speedSlow: string;
  recentPhrases: string;
  selectCategory: string;

  // Sign module
  signTitle: string;
  translatedMessage: string;
  performGesture: string;
  startCamera: string;
  stopCamera: string;
  sendToStaff: string;
  clear: string;
  messageSent: string;
  signVocabHeading: string;

  // Assisted touch module
  assistedTitle: string;

  // Common
  needHelp: string;
  requestStaff: string;
  staffNotified: string;
  benefitSchemes: string;
  languageLabel: string;
  sessionPrivate: string;
  available: string;

  // Errors
  errorMicPermission: string;
  errorSttUnsupported: string;
  errorVoiceFallback: string;
  errorEmptySpeech: string;
  errorNetwork: string;

  // Accessibility statement
  a11yStatement: string;
}

export const UI_STRINGS: Record<LangCode, UIStrings> = {
  en: {
    backToOptions: 'Back to communication options',
    backToMain: 'Back to main menu',

    homeTagline: 'Your communication assistant for accessible services.',
    homeSub: 'Select your institution and choose how you would like to interact. You can change your selection at any time.',
    homeSectionTitle: 'Where are you today?',
    modeSectionTitle: 'Choose how you would like to communicate.',
    modeSectionSub: 'Select the option that is most comfortable for you.',
    modeSignTitle: 'Sign Language',
    modeVoiceTitle: 'Voice',
    modeTextTitle: 'Text',
    modeAssistedTitle: 'Assisted Touch',
    modeSignDesc: 'Communicate using sign language',
    modeVoiceDesc: 'Speak naturally using your voice',
    modeTextDesc: 'Type what you need to communicate',
    modeAssistedDesc: 'Use simplified controls with larger touch targets',
    accessAssistant: 'Accessibility Assistant',
    instBank: 'Bank',
    instBankDesc: 'Account, transactions & banking services',
    instHospital: 'Hospital',
    instHospitalDesc: 'Appointments, reception & medical assistance',
    instGov: 'Government Office',
    instGovDesc: 'Registrations, certificates & public services',
    headerDescriptor: 'Accessible Communication Service',

    voiceTitle: 'Voice Communication',
    voiceSubtitle:
      'Speak naturally using your voice. The speech engine transcribes your words and responds aloud.',
    micTap: 'Tap microphone to speak',
    micActive: '🎙️ Listening... Speak into the microphone',
    micStop: 'Tap to stop listening',
    youSpoke: 'You Spoke',
    kioskResponse: 'Kiosk Response',
    speaking: '● Speaking',
    commonPhrases: 'Or select a common phrase:',

    textTitle: 'Type to Speak',
    textSubtitle:
      'Type your message below or choose pre-set quick phrases to synthesize voice output.',
    textPlaceholder: 'Type what you want to say...',
    speakMessage: 'Speak Message',
    speakingNow: 'Speaking...',
    clearText: 'Clear',
    speedLabel: 'Speed:',
    speedNormal: '1.0x Normal',
    speedSlow: '0.8x Slow',
    recentPhrases: 'Recently Spoken Phrases:',
    selectCategory: 'Select Institution Category:',

    signTitle: 'Sign Language (ISL Translation)',
    translatedMessage: 'Translated ISL Message',
    performGesture: 'Perform a gesture or select a phrase below',
    startCamera: 'Start Camera Feed',
    stopCamera: 'Stop Camera',
    sendToStaff: 'Send to Staff',
    clear: 'Clear',
    messageSent: '✅ Message transmitted to counter staff dashboard!',
    signVocabHeading: 'ISL Sign Vocabulary (Tap to Trigger Landmark Inference)',

    assistedTitle: 'Assisted Touch Interface',

    needHelp: 'Need help?',
    requestStaff: 'Request staff assistance',
    staffNotified: 'Staff notified — please wait',
    benefitSchemes: 'Benefit Schemes',
    languageLabel: 'Language:',
    sessionPrivate: '🔒 Your session is private and auto-cleared.',
    available: 'Available',

    errorMicPermission:
      'Microphone access was denied. Please allow microphone access in your browser settings.',
    errorSttUnsupported:
      'Voice recognition is not supported in this browser. Please use the Text mode instead.',
    errorVoiceFallback:
      'The requested voice is not available. Using the default voice instead.',
    errorEmptySpeech: 'Nothing was heard. Please try speaking again.',
    errorNetwork: 'A network error occurred. Please check your connection.',

    a11yStatement:
      'This kiosk supports Indian Sign Language, voice, text, and simplified touch interaction. All sessions are private and automatically cleared.',
  },

  hi: {
    backToOptions: 'संचार विकल्पों पर वापस जाएं',
    backToMain: 'मुख्य मेनू पर वापस जाएं',

    homeTagline: 'सुलभ सेवाओं के लिए आपका संचार सहायक।',
    homeSub: 'अपनी संस्था चुनें और चुनें कि आप कैसे बातचीत करना चाहते हैं। आप किसी भी समय अपना चयन बदल सकते हैं।',
    homeSectionTitle: 'आज आप कहाँ हैं?',
    modeSectionTitle: 'चुनें कि आप कैसे संवाद करना चाहेंगे।',
    modeSectionSub: 'वह विकल्प चुनें जो आपके लिए सबसे सुविधाजनक हो।',
    modeSignTitle: 'सांकेतिक भाषा',
    modeVoiceTitle: 'आवाज़',
    modeTextTitle: 'टेक्स्ट',
    modeAssistedTitle: 'सहायक टच',
    modeSignDesc: 'सांकेतिक भाषा का उपयोग करके संवाद करें',
    modeVoiceDesc: 'स्वाभाविक रूप से अपनी आवाज़ का उपयोग करके बोलें',
    modeTextDesc: 'जो आप कहना चाहते हैं उसे टाइप करें',
    modeAssistedDesc: 'बड़े स्पर्श लक्ष्यों के साथ सरलीकृत नियंत्रणों का उपयोग करें',
    accessAssistant: 'पहुंच सहायक (Accessibility Assistant)',
    instBank: 'बैंक',
    instBankDesc: 'खाता, लेनदेन और बैंकिंग सेवाएं',
    instHospital: 'अस्पताल',
    instHospitalDesc: 'अपॉइंटमेंट, रिसेप्शन और चिकित्सा सहायता',
    instGov: 'सरकारी कार्यालय',
    instGovDesc: 'पंजीकरण, प्रमाण पत्र और सार्वजनिक सेवाएं',
    headerDescriptor: 'सुलभ संचार सेवा',

    voiceTitle: 'वॉइस कम्युनिकेशन',
    voiceSubtitle:
      'अपनी आवाज़ से बोलें। स्पीच इंजन आपके शब्दों को लिखेगा और जवाब देगा।',
    micTap: 'बोलने के लिए माइक्रोफ़ोन दबाएं',
    micActive: '🎙️ सुन रहा है... माइक्रोफ़ोन में बोलें',
    micStop: 'सुनना बंद करने के लिए दबाएं',
    youSpoke: 'आपने कहा',
    kioskResponse: 'कियोस्क का जवाब',
    speaking: '● बोल रहा है',
    commonPhrases: 'या एक सामान्य वाक्य चुनें:',

    textTitle: 'टाइप करके बोलें',
    textSubtitle:
      'नीचे अपना संदेश टाइप करें या त्वरित वाक्यांश चुनें।',
    textPlaceholder: 'आप क्या कहना चाहते हैं टाइप करें...',
    speakMessage: 'संदेश बोलें',
    speakingNow: 'बोल रहा है...',
    clearText: 'साफ़ करें',
    speedLabel: 'गति:',
    speedNormal: '1.0x सामान्य',
    speedSlow: '0.8x धीमा',
    recentPhrases: 'हाल ही में बोले गए वाक्यांश:',
    selectCategory: 'संस्था श्रेणी चुनें:',

    signTitle: 'सांकेतिक भाषा (ISL अनुवाद)',
    translatedMessage: 'अनुवादित ISL संदेश',
    performGesture: 'इशारा करें या नीचे से एक वाक्यांश चुनें',
    startCamera: 'कैमरा शुरू करें',
    stopCamera: 'कैमरा बंद करें',
    sendToStaff: 'स्टाफ को भेजें',
    clear: 'साफ़ करें',
    messageSent: '✅ संदेश काउंटर स्टाफ को भेज दिया गया!',
    signVocabHeading: 'ISL सांकेतिक शब्दावली (इशारे का परीक्षण करने के लिए दबाएं)',

    assistedTitle: 'सहायक टच इंटरफ़ेस',

    needHelp: 'मदद चाहिए?',
    requestStaff: 'स्टाफ सहायता के लिए अनुरोध करें',
    staffNotified: 'स्टाफ को सूचित किया गया — कृपया प्रतीक्षा करें',
    benefitSchemes: 'लाभ योजनाएं',
    languageLabel: 'भाषा:',
    sessionPrivate: '🔒 आपका सत्र निजी है और स्वचालित रूप से साफ़ हो जाएगा।',
    available: 'उपलब्ध',

    errorMicPermission:
      'माइक्रोफ़ोन की अनुमति अस्वीकार कर दी गई। कृपया ब्राउज़र सेटिंग में माइक्रोफ़ोन की अनुमति दें।',
    errorSttUnsupported:
      'इस ब्राउज़र में वॉइस पहचान समर्थित नहीं है। कृपया टेक्स्ट मोड का उपयोग करें।',
    errorVoiceFallback:
      'अनुरोधित आवाज़ उपलब्ध नहीं है। डिफ़ॉल्ट आवाज़ का उपयोग किया जा रहा है।',
    errorEmptySpeech: 'कुछ भी सुनाई नहीं दिया। कृपया फिर से बोलने का प्रयास करें।',
    errorNetwork: 'नेटवर्क त्रुटि हुई। कृपया अपना कनेक्शन जांचें।',

    a11yStatement:
      'यह कियोस्क भारतीय सांकेतिक भाषा, आवाज़, टेक्स्ट और सरलीकृत टच इंटरैक्शन का समर्थन करता है। सभी सत्र निजी हैं और स्वचालित रूप से साफ़ हो जाते हैं।',
  },

  mr: {
    backToOptions: 'संवाद पर्यायांवर परत जा',
    backToMain: 'मुख्य मेनूवर परत जा',

    homeTagline: 'सुलभ सेवांसाठी तुमचा संवाद सहाय्यक.',
    homeSub: 'तुमची संस्था निवडा आणि तुम्हाला कसा संवाद साधायचा आहे ते निवडा. तुम्ही तुमची निवड कधीही बदलू शकता.',
    homeSectionTitle: 'तुम्ही आज कुठे आहात?',
    modeSectionTitle: 'तुम्हाला कसा संवाद साधायचा आहे ते निवडा.',
    modeSectionSub: 'तुमच्यासाठी सर्वात सोयीस्कर पर्याय निवडा.',
    modeSignTitle: 'सांकेतिक भाषा',
    modeVoiceTitle: 'आवाज',
    modeTextTitle: 'मजकूर',
    modeAssistedTitle: 'सहायक टच',
    modeSignDesc: 'सांकेतिक भाषा वापरून संवाद साधा',
    modeVoiceDesc: 'नैसर्गिकरित्या तुमचा आवाज वापरून बोला',
    modeTextDesc: 'तुम्हाला काय सांगायचे आहे ते टाइप करा',
    modeAssistedDesc: 'मोठ्या टच टार्गेटसह सोपी नियंत्रणे वापरा',
    accessAssistant: 'प्रवेश सहाय्यक (Accessibility Assistant)',
    instBank: 'बँक',
    instBankDesc: 'खाते, व्यवहार आणि बँकिंग सेवा',
    instHospital: 'रुग्णालय',
    instHospitalDesc: 'अपॉइंटमेंट, रिसेप्शन आणि वैद्यकीय मदत',
    instGov: 'सरकारी कार्यालय',
    instGovDesc: 'नोंदणी, प्रमाणपत्रे आणि सार्वजनिक सेवा',
    headerDescriptor: 'सुलभ संवाद सेवा',

    voiceTitle: 'व्हॉइस कम्युनिकेशन',
    voiceSubtitle:
      'आपल्या आवाजात बोला. स्पीच इंजन तुमचे शब्द लिहून प्रतिसाद देईल.',
    micTap: 'बोलण्यासाठी मायक्रोफोन दाबा',
    micActive: '🎙️ ऐकत आहे... मायक्रोफोनमध्ये बोला',
    micStop: 'ऐकणे थांबवण्यासाठी दाबा',
    youSpoke: 'तुम्ही म्हणालात',
    kioskResponse: 'कियोस्कचे उत्तर',
    speaking: '● बोलत आहे',
    commonPhrases: 'किंवा एक सामान्य वाक्य निवडा:',

    textTitle: 'टाइप करून बोला',
    textSubtitle:
      'खाली तुमचा संदेश टाइप करा किंवा त्वरित वाक्ये निवडा.',
    textPlaceholder: 'तुम्हाला काय म्हणायचे आहे ते टाइप करा...',
    speakMessage: 'संदेश बोला',
    speakingNow: 'बोलत आहे...',
    clearText: 'साफ करा',
    speedLabel: 'वेग:',
    speedNormal: '1.0x सामान्य',
    speedSlow: '0.8x हळू',
    recentPhrases: 'अलीकडे बोललेले वाक्ये:',
    selectCategory: 'संस्था श्रेणी निवडा:',

    signTitle: 'सांकेतिक भाषा (ISL भाषांतर)',
    translatedMessage: 'भाषांतरित ISL संदेश',
    performGesture: 'खूण करा किंवा खालून एक वाक्यांश निवडा',
    startCamera: 'कॅमेरा सुरू करा',
    stopCamera: 'कॅमेरा थांबवा',
    sendToStaff: 'कर्मचाऱ्यांना पाठवा',
    clear: 'साफ करा',
    messageSent: '✅ संदेश काउंटर कर्मचाऱ्यांना पाठवला गेला!',
    signVocabHeading: 'ISL सांकेतिक शब्दसंग्रह (खूण तपासण्यासाठी दाबा)',

    assistedTitle: 'सहायक टच इंटरफेस',

    needHelp: 'मदत हवी आहे?',
    requestStaff: 'कर्मचारी सहाय्यासाठी विनंती करा',
    staffNotified: 'कर्मचाऱ्यांना सूचित केले — कृपया प्रतीक्षा करा',
    benefitSchemes: 'लाभ योजना',
    languageLabel: 'भाषा:',
    sessionPrivate: '🔒 तुमचे सत्र खाजगी आहे आणि आपोआप साफ होईल.',
    available: 'उपलब्ध',

    errorMicPermission:
      'मायक्रोफोन परवानगी नाकारली. कृपया ब्राउझर सेटिंग्जमध्ये मायक्रोफोन परवानगी द्या.',
    errorSttUnsupported:
      'या ब्राउझरमध्ये व्हॉइस ओळख समर्थित नाही. कृपया टेक्स्ट मोड वापरा.',
    errorVoiceFallback:
      'विनंती केलेला आवाज उपलब्ध नाही. डीफॉल्ट आवाज वापरला जात आहे.',
    errorEmptySpeech: 'काहीही ऐकू आले नाही. कृपया पुन्हा बोलण्याचा प्रयत्न करा.',
    errorNetwork: 'नेटवर्क त्रुटी आली. कृपया तुमचे कनेक्शन तपासा.',

    a11yStatement:
      'हे कियोस्क भारतीय सांकेतिक भाषा, आवाज, मजकूर आणि सरलीकृत टच संवादास समर्थन देते. सर्व सत्रे खाजगी आहेत आणि आपोआप साफ होतात.',
  },
};

// ── Quick Actions ──────────────────────────────────────────────────────────
// 5 common institutional requests per language

export const QUICK_ACTIONS: Record<LangCode, string[]> = {
  en: [
    'I need help.',
    'I want to fill a form.',
    'Where is the registration counter?',
    'I need to make a payment.',
    'I want to open an account.',
  ],
  hi: [
    'मुझे मदद चाहिए।',
    'मुझे फ़ॉर्म भरना है।',
    'पंजीकरण काउंटर कहाँ है?',
    'मुझे भुगतान करना है।',
    'मुझे खाता खोलना है।',
  ],
  mr: [
    'मला मदत हवी आहे.',
    'मला फॉर्म भरायचा आहे.',
    'नोंदणी काउंटर कुठे आहे?',
    'मला पेमेंट करायचे आहे.',
    'मला खाते उघडायचे आहे.',
  ],
};

// ── Assistant Responses ────────────────────────────────────────────────────
// Keyed by intent; used in voice.tsx response logic

export interface AssistantResponseSet {
  desk: string;
  document: string;
  staff: string;
  default: (userText: string) => string;
}

export const ASSISTANT_RESPONSES: Record<LangCode, AssistantResponseSet> = {
  en: {
    desk: 'The main service desk is located straight ahead, counter 3.',
    document: 'Please have your government ID and appointment confirmation ready.',
    staff: 'Staff notification sent. A member of staff is coming to counter 1.',
    default: (t) =>
      `Thank you. You said: "${t}". How else can I assist you at the kiosk?`,
  },
  hi: {
    desk: 'मुख्य सेवा काउंटर सीधे आगे, काउंटर 3 पर है।',
    document: 'कृपया अपना सरकारी आईडी और अपॉइंटमेंट की पुष्टि तैयार रखें।',
    staff: 'स्टाफ को सूचित कर दिया गया। एक स्टाफ सदस्य काउंटर 1 पर आ रहा है।',
    default: (t) =>
      `धन्यवाद। आपने कहा: "${t}"। मैं कियोस्क पर और कैसे मदद कर सकता हूँ?`,
  },
  mr: {
    desk: 'मुख्य सेवा काउंटर सरळ समोर, काउंटर 3 वर आहे.',
    document: 'कृपया तुमचे सरकारी ओळखपत्र आणि अपॉइंटमेंट पुष्टी तयार ठेवा.',
    staff: 'कर्मचाऱ्यांना सूचित करण्यात आले. एक कर्मचारी काउंटर 1 वर येत आहे.',
    default: (t) =>
      `धन्यवाद. तुम्ही म्हणालात: "${t}". मी कियोस्कवर आणखी कशी मदत करू?`,
  },
};

/** Pick the correct assistant response based on spoken text + language */
export function getAssistantResponse(userText: string, lang: LangCode): string {
  const lower = userText.toLowerCase();
  const responses = ASSISTANT_RESPONSES[lang];

  if (lower.includes('desk') || lower.includes('where') ||
      lower.includes('काउंटर') || lower.includes('कुठे') || lower.includes('कहाँ')) {
    return responses.desk;
  }
  if (lower.includes('document') || lower.includes('need') || lower.includes('form') ||
      lower.includes('दस्तावेज़') || lower.includes('फ़ॉर्म') || lower.includes('कागदपत्र')) {
    return responses.document;
  }
  if (lower.includes('help') || lower.includes('staff') || lower.includes('assist') ||
      lower.includes('मदद') || lower.includes('स्टाफ') || lower.includes('मदत')) {
    return responses.staff;
  }
  return responses.default(userText);
}
