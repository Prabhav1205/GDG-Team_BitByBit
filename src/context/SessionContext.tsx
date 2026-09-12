import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────

export type CommunicationMode =
  | 'sign'
  | 'voice'
  | 'text'
  | 'assisted-touch'
  | null;

export type InstitutionType = 'bank' | 'hospital' | 'government' | null;

export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReaderFriendly: boolean;
  largeTouchTargets: boolean;
  dwellClick: boolean;
  switchScanning: boolean;
}

export interface StaffTranslationItem {
  id: string;
  modeLabel: string;
  text: string;
  timestamp: string;
  confidence?: number;
}

export interface StaffEligibilityMatch {
  id: string;
  schemeName: string;
  category: string;
  benefitText: string;
  qualifies: boolean;
  actionRequired: string;
  timestamp: string;
}

export interface StaffLogEntry {
  id: string;
  timestamp: string;
  type: 'SYSTEM' | 'CITIZEN_INPUT' | 'ELIGIBILITY' | 'STAFF_REPLY' | 'SUPERVISOR_NOTE';
  mode?: string;
  content: string;
}

export interface SessionState {
  /** Unique identifier for this kiosk session. */
  sessionId: string;
  /** The communication mode selected by the user. */
  communicationMode: CommunicationMode;
  /** The institution type selected by the user. */
  institution: InstitutionType;
  /** ISO 639-1 language code, e.g. "en". */
  language: string;
  /** ISO 8601 timestamp of when this session began. */
  startedAt: string;
  /** Global accessibility preferences */
  accessibility: AccessibilitySettings;
  /** Live translations sent by citizen via sign/voice/text/assisted-touch */
  liveTranslations: StaffTranslationItem[];
  /** Matched eligibility scheme results identified for citizen */
  eligibilityMatches: StaffEligibilityMatch[];
  /** Full session interaction timeline & supervisor handoff logs */
  sessionLogs: StaffLogEntry[];
  /** Latest staff response sent back to kiosk */
  latestStaffReply: string | null;
  /** Whether the session is marked resolved */
  isResolved: boolean;
}

interface SessionContextValue {
  session: SessionState;
  setMode: (mode: CommunicationMode) => void;
  setInstitution: (institution: InstitutionType) => void;
  setLanguage: (lang: string) => void;
  updateAccessibility: (key: keyof AccessibilitySettings, value?: boolean) => void;
  /** Broadcast citizen input live to staff dashboard */
  broadcastTranslation: (text: string, modeLabel: string, confidence?: number) => void;
  /** Broadcast matched eligibility benefit results live to staff dashboard */
  broadcastEligibilityMatch: (schemeName: string, category: string, benefitText: string, actionRequired: string) => void;
  /** Send staff reply back to kiosk */
  addStaffReply: (replyText: string) => void;
  /** Add supervisor / shift handoff note */
  addSupervisorNote: (note: string) => void;
  /** Mark current session resolved */
  markSessionResolved: () => void;
  /** Clear the session and create a fresh one */
  clearSession: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function generateSessionId(): string {
  const ts = Date.now().toString(36).slice(-4);
  const rnd = Math.random().toString(36).slice(2, 6);
  return `CS-${ts.toUpperCase()}-${rnd.toUpperCase()}`;
}

const DEFAULT_A11Y: AccessibilitySettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  screenReaderFriendly: false,
  largeTouchTargets: true,
  dwellClick: false,
  switchScanning: false,
};

function getTimeStr(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function createInitialSession(): SessionState {
  const now = getTimeStr();
  return {
    sessionId: generateSessionId(),
    communicationMode: null,
    institution: 'bank',
    language: 'en',
    startedAt: now,
    accessibility: DEFAULT_A11Y,
    liveTranslations: [
      {
        id: 'init-1',
        modeLabel: 'Sign Language',
        text: 'I need help with my bank account and government scheme eligibility.',
        timestamp: now,
        confidence: 0.96,
      },
    ],
    eligibilityMatches: [
      {
        id: 'el-1',
        schemeName: 'Disability Pension Scheme',
        category: 'Financial Assistance',
        benefitText: '₹1,500/month direct benefit transfer',
        qualifies: true,
        actionRequired: 'Verify Disability Certificate (40%+) & Aadhaar Card',
        timestamp: now,
      },
      {
        id: 'el-2',
        schemeName: 'Ayushman Bharat Health Scheme',
        category: 'Healthcare Support',
        benefitText: '₹5,00,000/year free health cover',
        qualifies: true,
        actionRequired: 'Issue counter registration token #4B',
        timestamp: now,
      },
    ],
    sessionLogs: [
      { id: 'log-1', timestamp: now, type: 'SYSTEM', content: 'Kiosk session initialized at Counter 3' },
      { id: 'log-2', timestamp: now, type: 'CITIZEN_INPUT', mode: 'Sign Language', content: 'Recognized ISL Gesture: HELP ("I need help with bank account")' },
      { id: 'log-3', timestamp: now, type: 'ELIGIBILITY', content: 'Matched Disability Pension & Ayushman Bharat schemes' },
    ],
    latestStaffReply: null,
    isResolved: false,
  };
}

// ── Context ───────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

// ── BroadcastChannel for Cross-Tab Sync ───────────────────────────────────

let broadcastChan: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChan = new BroadcastChannel('kiosk_staff_sync_channel');
  } catch {
    broadcastChan = null;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(createInitialSession);

  // Listen to BroadcastChannel messages from other browser tabs (e.g. Kiosk tab -> Staff tab)
  useEffect(() => {
    if (!broadcastChan) return;

    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data || {};
      if (type === 'SYNC_STATE' && payload) {
        setSession((prev) => ({ ...prev, ...payload }));
      }
    };

    broadcastChan.onmessage = handleMessage;
    return () => {
      if (broadcastChan) broadcastChan.onmessage = null;
    };
  }, []);

  function syncState(updater: (prev: SessionState) => SessionState) {
    setSession((prev) => {
      const next = updater(prev);
      if (broadcastChan) {
        try {
          broadcastChan.postMessage({ type: 'SYNC_STATE', payload: next });
        } catch {
          // ignore postMessage error
        }
      }
      return next;
    });
  }

  const setMode = (mode: CommunicationMode) => {
    const label = mode === 'sign' ? 'Sign Language' : mode === 'voice' ? 'Voice' : mode === 'text' ? 'Text' : mode === 'assisted-touch' ? 'Assisted Touch' : 'None';
    const now = getTimeStr();
    syncState((prev) => ({
      ...prev,
      communicationMode: mode,
      sessionLogs: [
        ...prev.sessionLogs,
        { id: Date.now().toString(), timestamp: now, type: 'SYSTEM', content: `Communication mode changed to: ${label}` },
      ],
    }));
  };

  const setInstitution = (institution: InstitutionType) =>
    syncState((prev) => ({ ...prev, institution }));

  const setLanguage = (lang: string) =>
    syncState((prev) => ({ ...prev, language: lang }));

  const updateAccessibility = (key: keyof AccessibilitySettings, value?: boolean) =>
    syncState((prev) => ({
      ...prev,
      accessibility: {
        ...prev.accessibility,
        [key]: value !== undefined ? value : !prev.accessibility[key],
      },
    }));

  const broadcastTranslation = (text: string, modeLabel: string, confidence?: number) => {
    const now = getTimeStr();
    const newItem: StaffTranslationItem = {
      id: Date.now().toString(),
      modeLabel,
      text,
      timestamp: now,
      confidence: confidence || 0.95,
    };
    const newLog: StaffLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'CITIZEN_INPUT',
      mode: modeLabel,
      content: `Citizen (${modeLabel}): "${text}"`,
    };

    syncState((prev) => ({
      ...prev,
      liveTranslations: [newItem, ...prev.liveTranslations],
      sessionLogs: [...prev.sessionLogs, newLog],
    }));
  };

  const broadcastEligibilityMatch = (
    schemeName: string,
    category: string,
    benefitText: string,
    actionRequired: string
  ) => {
    const now = getTimeStr();
    const newMatch: StaffEligibilityMatch = {
      id: `el-${Date.now()}`,
      schemeName,
      category,
      benefitText,
      qualifies: true,
      actionRequired,
      timestamp: now,
    };
    const newLog: StaffLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: now,
      type: 'ELIGIBILITY',
      content: `Scheme Matched: ${schemeName} (${benefitText}) — Action: ${actionRequired}`,
    };

    syncState((prev) => ({
      ...prev,
      eligibilityMatches: [newMatch, ...prev.eligibilityMatches],
      sessionLogs: [...prev.sessionLogs, newLog],
    }));
  };

  const addStaffReply = (replyText: string) => {
    const now = getTimeStr();
    const newLog: StaffLogEntry = {
      id: `reply-${Date.now()}`,
      timestamp: now,
      type: 'STAFF_REPLY',
      content: `Staff Reply sent to Kiosk: "${replyText}"`,
    };

    syncState((prev) => ({
      ...prev,
      latestStaffReply: replyText,
      sessionLogs: [...prev.sessionLogs, newLog],
    }));
  };

  const addSupervisorNote = (note: string) => {
    const now = getTimeStr();
    const newLog: StaffLogEntry = {
      id: `sup-${Date.now()}`,
      timestamp: now,
      type: 'SUPERVISOR_NOTE',
      content: `Supervisor Handoff Note: "${note}"`,
    };

    syncState((prev) => ({
      ...prev,
      sessionLogs: [...prev.sessionLogs, newLog],
    }));
  };

  const markSessionResolved = () => {
    const now = getTimeStr();
    const newLog: StaffLogEntry = {
      id: `res-${Date.now()}`,
      timestamp: now,
      type: 'SYSTEM',
      content: 'Session marked RESOLVED by counter staff.',
    };

    syncState((prev) => ({
      ...prev,
      isResolved: true,
      sessionLogs: [...prev.sessionLogs, newLog],
    }));
  };

  const clearSession = () => syncState(createInitialSession);

  return (
    <SessionContext.Provider
      value={{
        session,
        setMode,
        setInstitution,
        setLanguage,
        updateAccessibility,
        broadcastTranslation,
        broadcastEligibilityMatch,
        addStaffReply,
        addSupervisorNote,
        markSessionResolved,
        clearSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a <SessionProvider>');
  }
  return ctx;
}
