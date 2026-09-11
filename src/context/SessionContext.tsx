import React, {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

// ── Types ─────────────────────────────────────────────────────────────────

export type CommunicationMode =
  | 'sign'
  | 'voice'
  | 'text'
  | 'assisted-touch'
  | null;

export interface SessionState {
  /** Unique identifier for this kiosk session. */
  sessionId: string;
  /** The communication mode selected by the user. */
  communicationMode: CommunicationMode;
  /** ISO 639-1 language code, e.g. "en". */
  language: string;
  /** ISO 8601 timestamp of when this session began. */
  startedAt: string;
}

interface SessionContextValue {
  session: SessionState;
  /** Update the selected communication mode. */
  setMode: (mode: CommunicationMode) => void;
  /** Update the session language. */
  setLanguage: (lang: string) => void;
  /** Clear the session and create a fresh one (e.g. on user exit). */
  clearSession: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function generateSessionId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 8);
  return `${ts}-${rnd}`;
}

function createInitialSession(): SessionState {
  return {
    sessionId: generateSessionId(),
    communicationMode: null,
    language: 'en',
    startedAt: new Date().toISOString(),
  };
}

// ── Context ───────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(createInitialSession);

  const setMode = (mode: CommunicationMode) =>
    setSession((prev) => ({ ...prev, communicationMode: mode }));

  const setLanguage = (lang: string) =>
    setSession((prev) => ({ ...prev, language: lang }));

  const clearSession = () => setSession(createInitialSession());

  return (
    <SessionContext.Provider value={{ session, setMode, setLanguage, clearSession }}>
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
