import React, { useState, useEffect } from 'react';
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  FileText,
  MessageSquare,
  Send,
  Shield,
  UserCheck,
  Volume2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Search,
  ArrowRight,
  User,
  Layers,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fioczmozymmnjrxrfuyt.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpb2N6bW96eW1tbmpyeHJmdXl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDQxMjgsImV4cCI6MjEwNDcyMDEyOH0.7K-lujV9llVhsyRSaGU3GfvTOVc3UaaBfOSvYNOwshE';

const supabase = createClient(supabaseUrl, supabaseKey);

interface TranslationItem {
  id: string;
  modeLabel: string;
  text: string;
  timestamp: string;
  confidence?: number;
}

interface EligibilityMatch {
  id: string;
  schemeName: string;
  category: string;
  benefitText: string;
  qualifies: boolean;
  actionRequired: string;
  timestamp: string;
}

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'SYSTEM' | 'CITIZEN_INPUT' | 'ELIGIBILITY' | 'STAFF_REPLY' | 'SUPERVISOR_NOTE';
  mode?: string;
  content: string;
}

const INITIAL_TRANSLATIONS: TranslationItem[] = [
  {
    id: 'tr-1',
    modeLabel: 'Sign Language',
    text: 'I need assistance with my bank account and government pension eligibility.',
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    confidence: 0.96,
  },
];

const INITIAL_ELIGIBILITY: EligibilityMatch[] = [
  {
    id: 'el-1',
    schemeName: 'Disability Pension Scheme',
    category: 'Financial Assistance',
    benefitText: '₹1,500/month direct benefit transfer',
    qualifies: true,
    actionRequired: 'Verify Disability Certificate (40%+) & Aadhaar Card',
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'el-2',
    schemeName: 'Ayushman Bharat Health Scheme',
    category: 'Healthcare Support',
    benefitText: '₹5,00,000/year free health cover',
    qualifies: true,
    actionRequired: 'Issue counter registration token #4B',
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  },
];

const QUICK_REPLIES = [
  { id: '1', label: '🪪 Request ID Document', text: 'Please place your Aadhaar or Government ID card on the scanner counter.' },
  { id: '2', label: '📋 Form Fill Assistance', text: 'I am coming to help you fill out Form 4B. Please wait a moment.' },
  { id: '3', label: '🏃 Escalate to Counter 3', text: 'Your query has been assigned to Senior Officer at Counter 3.' },
  { id: '4', label: '✅ Verification Complete', text: 'Your document verification is successful! Here is your token receipt.' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'live' | 'session'>('live');
  const [translations, setTranslations] = useState<TranslationItem[]>(INITIAL_TRANSLATIONS);
  const [eligibility, setEligibility] = useState<EligibilityMatch[]>(INITIAL_ELIGIBILITY);
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: 'l1', timestamp: new Date().toLocaleTimeString('en-IN'), type: 'SYSTEM', content: 'Kiosk session initialized at Counter 3' },
    { id: 'l2', timestamp: new Date().toLocaleTimeString('en-IN'), type: 'CITIZEN_INPUT', mode: 'Sign Language', content: 'Recognized ISL Gesture: HELP ("I need help with bank account")' },
    { id: 'l3', timestamp: new Date().toLocaleTimeString('en-IN'), type: 'ELIGIBILITY', content: 'Matched Disability Pension & Ayushman Bharat schemes' },
  ]);
  const [customReply, setCustomReply] = useState('');
  const [supervisorNoteInput, setSupervisorNoteInput] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [latestStaffBroadcast, setLatestStaffBroadcast] = useState<string | null>(null);

  // Sync with BroadcastChannel & Supabase Realtime
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        bc = new BroadcastChannel('kiosk_staff_sync_channel');
        bc.onmessage = (event) => {
          const { payload } = event.data || {};
          if (payload) {
            if (payload.liveTranslations) setTranslations(payload.liveTranslations);
            if (payload.eligibilityMatches) setEligibility(payload.eligibilityMatches);
            if (payload.sessionLogs) setLogs(payload.sessionLogs);
          }
        };
      } catch {
        // ignore
      }
    }

    const channel = supabase.channel('kiosk_staff_sync_room');
    channel
      .on('broadcast', { event: 'SYNC_STATE' }, (payload: any) => {
        if (payload?.payload) {
          const data = payload.payload;
          if (data.liveTranslations) setTranslations(data.liveTranslations);
          if (data.eligibilityMatches) setEligibility(data.eligibilityMatches);
          if (data.sessionLogs) setLogs(data.sessionLogs);
        }
      })
      .subscribe();

    return () => {
      if (bc) bc.close();
      supabase.removeChannel(channel);
    };
  }, []);

  function broadcastStaffReply(replyText: string) {
    if (!replyText.trim()) return;

    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newLog: LogEntry = {
      id: `staff-${Date.now()}`,
      timestamp: now,
      type: 'STAFF_REPLY',
      content: `Staff Broadcast: "${replyText}"`,
    };

    setLogs((prev) => [newLog, ...prev]);
    setLatestStaffBroadcast(replyText);
    setCustomReply('');

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(replyText);
      utt.rate = 1.0;
      window.speechSynthesis.speak(utt);
    }

    try {
      const bc = new BroadcastChannel('kiosk_staff_sync_channel');
      bc.postMessage({
        type: 'STAFF_REPLY_BROADCAST',
        payload: { replyText, timestamp: now },
      });
    } catch {
      // ignore
    }

    try {
      supabase.channel('kiosk_staff_sync_room').send({
        type: 'broadcast',
        event: 'STAFF_REPLY_BROADCAST',
        payload: { replyText, timestamp: now },
      });
    } catch {
      // ignore
    }
  }

  function handleAddSupervisorNote() {
    if (!supervisorNoteInput.trim()) return;
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const newNote: LogEntry = {
      id: `sup-${Date.now()}`,
      timestamp: now,
      type: 'SUPERVISOR_NOTE',
      content: supervisorNoteInput.trim(),
    };
    setLogs((prev) => [newNote, ...prev]);
    setSupervisorNoteInput('');
    setShowNoteModal(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100vw', minHeight: '100vh', backgroundColor: '#F4F3F0', color: '#0F172A' }}>
      {/* ── Citizen-Style Access Header ────────────────────────────── */}
      <header style={{ backgroundColor: '#002D62', color: '#FFFFFF', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#008080', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            <Shield style={{ width: '26px', height: '26px', color: '#FFFFFF' }} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.3px', margin: 0, color: '#FFFFFF' }}>
                STAFF COUNTER CONSOLE
              </h1>
              <span style={{ backgroundColor: '#008080', color: '#FFFFFF', fontSize: '11px', fontWeight: '700', padding: '3px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                Employee Portal
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#93C5FD', margin: '2px 0 0 0' }}>
              Multimodal Accessibility Assistant • Institutional Counter #03
            </p>
          </div>
        </div>

        {/* Header Right Status Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '999px', backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10B981', color: '#6EE7B7', fontSize: '12px', fontWeight: '700' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>
            Citizen Kiosk Synced
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: '10px', backgroundColor: '#001F47', border: '1px solid #1E40AF', color: '#E0F2FE', fontSize: '13px', fontWeight: '600' }}>
            <UserCheck style={{ width: '16px', height: '16px', color: '#38BDF8' }} />
            Officer: STF-9042
          </div>
        </div>
      </header>

      {/* ── Sub Navigation Bar ─────────────────────────────────────── */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '12px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setActiveTab('live')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: activeTab === 'live' ? '2px solid #002D62' : '1px solid #CBD5E1',
              backgroundColor: activeTab === 'live' ? '#002D62' : '#FFFFFF',
              color: activeTab === 'live' ? '#FFFFFF' : '#475569',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: activeTab === 'live' ? '0 2px 8px rgba(0, 45, 98, 0.2)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Activity style={{ width: '18px', height: '18px' }} />
            Live Translation Stream
          </button>

          <button
            onClick={() => setActiveTab('session')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '10px',
              border: activeTab === 'session' ? '2px solid #002D62' : '1px solid #CBD5E1',
              backgroundColor: activeTab === 'session' ? '#002D62' : '#FFFFFF',
              color: activeTab === 'session' ? '#FFFFFF' : '#475569',
              fontSize: '14px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: activeTab === 'session' ? '0 2px 8px rgba(0, 45, 98, 0.2)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Clock style={{ width: '18px', height: '18px' }} />
            Session Timeline & Handoff Log
          </button>
        </div>

        <button
          onClick={() => setShowNoteModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: '#008080',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 128, 128, 0.25)',
          }}
        >
          <Plus style={{ width: '18px', height: '18px' }} />
          Add Shift Handoff Note
        </button>
      </div>

      {/* ── Main Body Container ────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '32px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
        {activeTab === 'live' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', gap: '32px' }}>
            {/* Left Column: Real-Time Input Stream & Response Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              {/* Live Citizen Output Card */}
              <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#E0F2FE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <MessageSquare style={{ width: '20px', height: '20px', color: '#0284C7' }} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#002D62', margin: 0 }}>
                        Real-Time Citizen Text Stream
                      </h2>
                      <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
                        Converted output from citizen's ISL gestures, speech, text, or assisted touch
                      </p>
                    </div>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#008080', backgroundColor: '#E6F4F4', padding: '4px 12px', borderRadius: '999px' }}>
                    ● LIVE MONITORING
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {translations.map((item) => (
                    <div key={item.id} style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1.5px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ padding: '4px 12px', borderRadius: '6px', backgroundColor: '#002D62', color: '#FFFFFF', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {item.modeLabel}
                          </span>
                          {item.confidence && (
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#16A34A', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                              {(item.confidence * 100).toFixed(0)}% Match
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>{item.timestamp}</span>
                      </div>

                      <p style={{ fontSize: '17px', lineHeight: '1.6', color: '#0F172A', margin: '0 0 16px 0', fontWeight: '600' }}>
                        "{item.text}"
                      </p>

                      <button
                        onClick={() => broadcastStaffReply(item.text)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '8px', border: '1px solid #008080', backgroundColor: '#E6F4F4', color: '#008080', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                      >
                        <Volume2 style={{ width: '16px', height: '16px' }} />
                        Replay Kiosk Audio Announcement
                      </button>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Counter Staff Broadcast Response */}
              <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#002D62', margin: '0 0 16px 0' }}>
                  Quick Staff Counter Broadcast & Responses
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  {QUICK_REPLIES.map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => broadcastStaffReply(chip.text)}
                      style={{ padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#0F172A', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                {/* Custom Message Input */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    value={customReply}
                    onChange={(e) => setCustomReply(e.target.value)}
                    placeholder="Type custom reply to speak aloud on citizen kiosk..."
                    style={{ flex: 1, padding: '14px 18px', borderRadius: '12px', border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: '14px', outline: 'none', fontWeight: '500' }}
                  />
                  <button
                    onClick={() => broadcastStaffReply(customReply)}
                    style={{ padding: '14px 24px', borderRadius: '12px', border: 'none', backgroundColor: '#002D62', color: '#FFFFFF', fontSize: '14px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(0, 45, 98, 0.2)' }}
                  >
                    <Send style={{ width: '16px', height: '16px' }} />
                    Broadcast Audio
                  </button>
                </div>

                {latestStaffBroadcast && (
                  <div style={{ marginTop: '16px', padding: '12px 16px', borderRadius: '10px', backgroundColor: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', fontSize: '13px', fontWeight: '600' }}>
                    📢 Broadcasted Audio to Kiosk: "{latestStaffBroadcast}"
                  </div>
                )}
              </section>
            </div>

            {/* Right Column: Matched Eligibility Schemes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
              <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Award style={{ width: '20px', height: '20px', color: '#D97706' }} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#002D62', margin: 0 }}>
                      Matched Scheme Results
                    </h2>
                    <p style={{ fontSize: '13px', color: '#64748B', margin: '2px 0 0 0' }}>
                      Identified qualifications & recommended staff actions
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {eligibility.map((scheme) => (
                    <div key={scheme.id} style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '20px', border: '1.5px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#002D62', margin: 0 }}>{scheme.schemeName}</h3>
                        <span style={{ padding: '3px 10px', borderRadius: '6px', backgroundColor: '#DCFCE7', color: '#15803D', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase' }}>
                          QUALIFIED
                        </span>
                      </div>

                      <p style={{ fontSize: '13px', color: '#008080', margin: '0 0 14px 0', fontWeight: '700' }}>
                        {scheme.benefitText}
                      </p>

                      <div style={{ padding: '12px 14px', borderRadius: '10px', backgroundColor: '#FFFBEB', borderLeft: '4px solid #F59E0B', border: '1px solid #FCD34D' }}>
                        <p style={{ fontSize: '11px', fontWeight: '800', color: '#B45309', margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          RECOMMENDED STAFF ACTION
                        </p>
                        <p style={{ fontSize: '13px', color: '#78350F', margin: 0, fontWeight: '600' }}>
                          {scheme.actionRequired}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        ) : (
          /* Session Timeline & Shift Handoff View */
          <div style={{ width: '100%' }}>
            <section style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '32px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #F1F5F9', paddingBottom: '16px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#002D62', margin: 0 }}>
                    Session Timeline & Shift Handoff Log
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
                    Complete timestamped audit trail for staff transfers and supervisor reviews
                  </p>
                </div>
                <button
                  onClick={() => setShowNoteModal(true)}
                  style={{ padding: '10px 18px', borderRadius: '10px', border: 'none', backgroundColor: '#002D62', color: '#FFFFFF', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                >
                  + Add Handoff Note
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {logs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      gap: '20px',
                      padding: '18px 20px',
                      borderRadius: '12px',
                      backgroundColor: log.type === 'SUPERVISOR_NOTE' ? '#F0F9FF' : '#F8FAFC',
                      border: log.type === 'SUPERVISOR_NOTE' ? '1.5px solid #0284C7' : '1px solid #E2E8F0',
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '700', minWidth: '75px' }}>
                      {log.timestamp}
                    </span>
                    <div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: '800',
                          color: log.type === 'SUPERVISOR_NOTE' ? '#0284C7' : '#002D62',
                          textTransform: 'uppercase',
                          marginRight: '10px',
                          letterSpacing: '0.5px',
                        }}
                      >
                        [{log.type}]
                      </span>
                      <span style={{ fontSize: '14px', color: '#0F172A', fontWeight: '500' }}>
                        {log.content}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Supervisor Handoff Note Modal */}
      {showNoteModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '28px', width: '480px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#002D62', marginBottom: '8px' }}>
              Add Supervisor Shift Handoff Note
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '16px' }}>
              Enter important interaction context or instructions for the next staff member taking over counter.
            </p>
            <textarea
              rows={4}
              value={supervisorNoteInput}
              onChange={(e) => setSupervisorNoteInput(e.target.value)}
              placeholder="Type handoff instructions or notes..."
              style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1.5px solid #CBD5E1', backgroundColor: '#F8FAFC', color: '#0F172A', outline: 'none', marginBottom: '20px', fontFamily: 'inherit', fontSize: '14px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowNoteModal(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleAddSupervisorNote} style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', backgroundColor: '#002D62', color: '#FFFFFF', fontWeight: '800', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0, 45, 98, 0.2)' }}>
                Save & Broadcast Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
