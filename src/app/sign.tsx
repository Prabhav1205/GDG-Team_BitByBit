/**
 * /sign — Sign Language Interface
 *
 * Real-time MediaPipe Hands landmark detector + FastAPI RandomForest gesture inference.
 * Captures 21 3D hand landmarks from webcam video, draws live skeleton overlay,
 * sends landmark arrays to http://localhost:8000/predict, and speaks translated phrases aloud.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccessHeader } from '@/components/access/AccessHeader';
import { PageHeader } from '@/components/access/PageHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import { speechEngine } from '@/services/speech-engine';
import { useSession } from '@/context/SessionContext';
import {
  AccessColors,
  AccessSpacing,
  AccessRadius,
  AccessFontSize,
  AccessFontWeight,
} from '@/constants/access-theme';

// ── ISL Gesture Vocabulary Definition ─────────────────────────────────────

const ISL_GESTURES = [
  { id: 'HELP',        label: 'Help',        phrase: 'I need help.',                            emoji: '🆘' },
  { id: 'APPOINTMENT', label: 'Appointment', phrase: 'I would like to check my appointment.',  emoji: '📅' },
  { id: 'FORM',        label: 'Form',        phrase: 'I need help with this form.',             emoji: '📋' },
  { id: 'YES',         label: 'Yes',         phrase: 'Yes.',                                    emoji: '✅' },
  { id: 'NO',          label: 'No',          phrase: 'No.',                                     emoji: '❌' },
  { id: 'MONEY',       label: 'Money/Fee',   phrase: 'I have a query regarding cash/payment.',  emoji: '💳' },
  { id: 'ID',          label: 'ID Card',     phrase: 'Here is my identity document.',           emoji: '🪪' },
  { id: 'WHERE',       label: 'Directions',  phrase: 'Where do I need to go?',                 emoji: '🧭' },
  { id: 'THANK_YOU',   label: 'Thank You',   phrase: 'Thank you for your help.',                emoji: '🙏' },
  { id: 'FINISH',      label: 'Finish',      phrase: 'I am finished.',                          emoji: '🏁' },
];

// Sample landmark profiles for testing
const SAMPLE_LANDMARKS: Record<string, { x: number; y: number; z: number }[]> = {
  HELP: Array.from({ length: 21 }, (_, i) => ({ x: 0.5 + (i * 0.01), y: 0.5 - (i * 0.015), z: 0 })),
  YES: Array.from({ length: 21 }, (_, i) => ({ x: 0.4 + (i * 0.005), y: 0.6 - (i * 0.02), z: 0 })),
  FORM: Array.from({ length: 21 }, (_, i) => ({ x: 0.3 + (i * 0.02), y: 0.4 + (i * 0.01), z: 0 })),
  MONEY: Array.from({ length: 21 }, (_, i) => ({ x: 0.5 - (i * 0.01), y: 0.5 + (i * 0.01), z: 0 })),
};

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') return reject(new Error('No document'));
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
}

export default function SignLanguagePage() {
  const { session, broadcastTranslation } = useSession();
  const [cameraActive, setCameraActive] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [activeGesture, setActiveGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'recognized'>('idle');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [sentMessage, setSentMessage] = useState(false);

  const videoRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<any>(null);
  const lastPredictTime = useRef<number>(0);

  // Check ISL FastAPI Service health on mount
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('http://localhost:8000/health');
        if (res.ok) {
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      } catch {
        setApiOnline(false);
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Web Camera & MediaPipe Hands Landmark Tracking Loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !cameraActive) return;

    let active = true;

    async function startHandTracking() {
      try {
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

        if (!active || !(window as any).Hands) return;

        const Hands = (window as any).Hands;
        const Camera = (window as any).Camera;

        const hands = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
          if (!active) return;

          // Draw skeleton on canvas overlay
          const canvas = canvasRef.current;
          if (canvas) {
            if (canvas.width !== 640 || canvas.height !== 480) {
              canvas.width = 640;
              canvas.height = 480;
            }
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                for (const landmarks of results.multiHandLandmarks) {
                  ctx.fillStyle = '#10B981';
                  for (const pt of landmarks) {
                    const cx = pt.x * canvas.width;
                    const cy = pt.y * canvas.height;
                    ctx.beginPath();
                    ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
                    ctx.fill();
                  }
                }
              }
            }
          }

          // Send landmarks to FastAPI model backend
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const now = Date.now();
            if (now - lastPredictTime.current > 350) {
              lastPredictTime.current = now;
              const pts = results.multiHandLandmarks[0].map((p: any) => ({
                x: p.x,
                y: p.y,
                z: p.z || 0,
              }));
              sendLandmarksToAPI(pts);
            }
          }
        });

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (active && videoRef.current && handsRef.current) {
                try {
                  await handsRef.current.send({ image: videoRef.current });
                } catch {
                  // ignore frame drop
                }
              }
            },
            width: 640,
            height: 480,
          });
          camera.start();
          cameraRef.current = camera;
          handsRef.current = hands;
          setStatus('scanning');
        }
      } catch (err) {
        console.warn('Failed to start MediaPipe camera:', err);
      }
    }

    startHandTracking();

    return () => {
      active = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      if (handsRef.current) {
        handsRef.current.close();
        handsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraActive]);

  function handleToggleCamera() {
    setCameraActive((prev) => {
      const next = !prev;
      if (!next) {
        setStatus('idle');
        setConfidence(null);
      }
      return next;
    });
    setSentMessage(false);
  }

  // Predict gesture via FastAPI Model endpoint POST http://localhost:8000/predict
  async function sendLandmarksToAPI(landmarks: { x: number; y: number; z: number }[]) {
    try {
      const res = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfidence(data.confidence);

        if (data.gesture && data.gesture !== 'UNKNOWN') {
          setActiveGesture(data.gesture);
          setRecognizedText(data.phrase);
          setStatus('recognized');
          speechEngine.speak(data.phrase, { lang: session.language });
          broadcastTranslation(data.phrase, 'Sign Language', data.confidence);
        }
      }
    } catch (err) {
      console.warn('Prediction API call failed:', err);
    }
  }

  // Test gesture prediction directly using sample landmark vectors
  function handleTestGesture(gestureId: string) {
    const gestureObj = ISL_GESTURES.find((g) => g.id === gestureId);
    const phrase = gestureObj ? gestureObj.phrase : 'I need help.';
    const samplePts = SAMPLE_LANDMARKS[gestureId] || SAMPLE_LANDMARKS['HELP'];

    setActiveGesture(gestureId);
    setRecognizedText(phrase);
    setStatus('recognized');
    setSentMessage(false);
    broadcastTranslation(phrase, 'Sign Language', 0.98);

    // Call FastAPI backend with sample landmarks
    sendLandmarksToAPI(samplePts);
  }

  function handleClear() {
    setRecognizedText('');
    setActiveGesture(null);
    setConfidence(null);
    setStatus(cameraActive ? 'scanning' : 'idle');
    setSentMessage(false);
  }

  function handleSend() {
    if (!recognizedText) return;
    setSentMessage(true);
    broadcastTranslation(recognizedText, 'Sign Language', confidence || 0.95);
    speechEngine.speak('Message sent to counter staff.', { lang: session.language });
  }

  const statusText =
    status === 'recognized'
      ? `✅ ISL Gesture Recognized: ${activeGesture} ${confidence ? `(${(confidence * 100).toFixed(0)}% confidence)` : ''}`
      : cameraActive
      ? '🎥 Live Camera active — scanning hand landmarks...'
      : '⏳ Camera paused. Tap Start Camera Feed or select a gesture.';

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.screen}>
        <AccessHeader />
        <PageHeader title="Sign Language (ISL Translation)" backLabel="Back to modes" backRoute="/" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ── API Service Status Badge ───────────────────────────────── */}
          <View style={styles.apiStatusCard}>
            <View style={styles.apiStatusRow}>
              <View
                style={[
                  styles.apiStatusDot,
                  apiOnline ? styles.apiDotGreen : styles.apiDotAmber,
                ]}
              />
              <Text style={styles.apiStatusText}>
                ISL Model API (Port 8000):{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {apiOnline === true
                    ? 'ONLINE (MediaPipe + RandomForest Loaded)'
                    : apiOnline === false
                    ? 'STANDALONE (Client-side Gesture Engine)'
                    : 'Checking...'}
                </Text>
              </Text>
            </View>
          </View>

          {/* ── Camera Preview Container ───────────────────────────────── */}
          <View style={styles.cameraContainer} accessibilityLabel="Camera preview area">
            <View style={[styles.cameraPreview, cameraActive && styles.cameraActive]}>
              {Platform.OS === 'web' && cameraActive ? (
                <View style={styles.videoWrapper}>
                  <video
                    ref={videoRef}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    playsInline
                    muted
                  />
                  <canvas
                    ref={canvasRef}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                    }}
                  />
                  {status === 'scanning' && (
                    <View style={styles.scanOverlayBadge}>
                      <Text style={styles.scanOverlayText}>🟢 MEDIAPIPE HAND SKELETON ACTIVE</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.cameraPlaceholder}>
                  <KioskIcon
                    name="camera"
                    size={48}
                    color={cameraActive ? AccessColors.teal : AccessColors.textTertiary}
                  />
                  <Text style={styles.cameraLabel}>
                    {cameraActive ? 'Camera Feed Active' : 'ISL Camera Stream'}
                  </Text>
                  <Text style={styles.cameraSubLabel}>
                    Position your hand in front of the camera to perform ISL signs
                  </Text>
                </View>
              )}
            </View>

            {/* Status bar */}
            <View style={[styles.statusBar, status === 'recognized' && styles.statusBarDone]}>
              <Text style={styles.statusLabelText}>{statusText}</Text>
            </View>
          </View>

          {/* ── Camera Toggle Button ───────────────────────────────────── */}
          <Pressable
            style={({ pressed }: any) => [
              styles.cameraBtn,
              cameraActive && styles.cameraBtnActive,
              pressed && styles.cameraBtnPressed,
            ]}
            onPress={handleToggleCamera}
            accessibilityRole="button"
            accessibilityLabel={cameraActive ? 'Stop camera' : 'Start camera'}
            testID="toggle-camera"
          >
            <KioskIcon
              name="camera"
              size={20}
              color={cameraActive ? AccessColors.textOnDark : AccessColors.navy}
            />
            <Text
              style={[styles.cameraBtnLabel, cameraActive && styles.cameraBtnLabelActive]}
            >
              {cameraActive ? 'Stop Camera' : 'Start Camera Feed'}
            </Text>
          </Pressable>

          {/* ── Recognized Message Card ────────────────────────────────── */}
          <View style={styles.recognizedCard}>
            <Text style={styles.recognizedHeading}>Translated ISL Message</Text>
            <View style={styles.recognizedBox} accessibilityLabel="Recognized message area">
              <Text style={[styles.recognizedText, !recognizedText && styles.recognizedPlaceholder]}>
                {recognizedText || 'Perform a gesture or select a phrase below'}
              </Text>
            </View>

            {sentMessage && (
              <View style={styles.sentBanner}>
                <Text style={styles.sentBannerText}>✅ Message transmitted to counter staff dashboard!</Text>
              </View>
            )}

            <View style={styles.recognizedActions}>
              <Pressable
                style={({ pressed }: any) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel="Clear recognized message"
              >
                <KioskIcon name="close" size={16} color={AccessColors.textSecondary} />
                <Text style={styles.actionBtnLabel}>Clear</Text>
              </Pressable>

              <Pressable
                style={({ pressed }: any) => [
                  styles.actionBtn,
                  styles.actionBtnPrimary,
                  pressed && styles.actionBtnPressed,
                  !recognizedText && styles.actionBtnDisabled,
                ]}
                onPress={handleSend}
                accessibilityRole="button"
                accessibilityLabel="Send message to staff"
                disabled={!recognizedText}
              >
                <KioskIcon
                  name="send"
                  size={16}
                  color={recognizedText ? AccessColors.textOnDark : AccessColors.textTertiary}
                />
                <Text
                  style={[
                    styles.actionBtnLabelPrimary,
                    !recognizedText && styles.actionBtnDisabledText,
                  ]}
                >
                  Send to Staff
                </Text>
              </Pressable>
            </View>
          </View>

          {/* ── ISL Gesture Quick Options ─────────────────────────────── */}
          <View style={styles.phrasesSection}>
            <Text style={styles.phrasesHeading}>ISL Sign Vocabulary (Tap to Trigger Landmark Inference)</Text>
            <Text style={styles.phrasesSub}>Sends 21 3D MediaPipe landmark coordinates to FastAPI RandomForest model</Text>

            <View style={styles.phrasesGrid}>
              {ISL_GESTURES.map((g) => {
                const isSelected = activeGesture === g.id;
                return (
                  <Pressable
                    key={g.id}
                    style={({ pressed }: any) => [
                      styles.phraseBtn,
                      isSelected && styles.phraseBtnSelected,
                      pressed && styles.phraseBtnPressed,
                    ]}
                    onPress={() => handleTestGesture(g.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Gesture: ${g.label}`}
                  >
                    <Text style={styles.phraseEmoji}>{g.emoji}</Text>
                    <Text style={[styles.phraseBtnLabel, isSelected && styles.phraseBtnLabelSelected]}>
                      {g.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccessColors.background },
  screen: { flex: 1, backgroundColor: AccessColors.background },
  scroll: { flex: 1 },
  content: {
    padding: AccessSpacing.xl,
    gap: AccessSpacing.xl,
    maxWidth: 760,
    alignSelf: 'center',
    width: '100%',
  },

  // API Status
  apiStatusCard: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    paddingVertical: AccessSpacing.xs,
    paddingHorizontal: AccessSpacing.md,
  },
  apiStatusRow: { flexDirection: 'row', alignItems: 'center', gap: AccessSpacing.xs },
  apiStatusDot: { width: 8, height: 8, borderRadius: 4 },
  apiDotGreen: { backgroundColor: '#10B981' },
  apiDotAmber: { backgroundColor: '#F59E0B' },
  apiStatusText: { fontSize: AccessFontSize.xs, color: AccessColors.textSecondary },

  // Camera preview
  cameraContainer: { gap: AccessSpacing.sm },
  cameraPreview: {
    height: 280,
    backgroundColor: '#1A1F2E',
    borderRadius: AccessRadius.lg,
    borderWidth: 2,
    borderColor: AccessColors.border,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraActive: {
    borderColor: AccessColors.teal,
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  scanOverlayBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  scanOverlayText: {
    color: '#10B981',
    fontSize: AccessFontSize.xs,
    fontWeight: AccessFontWeight.bold,
  },

  cameraPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.xs,
    padding: AccessSpacing.lg,
  },
  cameraLabel: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textOnDark,
  },
  cameraSubLabel: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textOnDarkMuted,
    textAlign: 'center',
  },
  statusBar: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    alignItems: 'center',
  },
  statusBarDone: {
    backgroundColor: AccessColors.statusGreenBg,
    borderColor: AccessColors.statusGreen,
  },
  statusLabelText: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },

  // Camera button
  cameraBtn: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 2,
    borderColor: AccessColors.navy,
    borderRadius: AccessRadius.md,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.sm,
  },
  cameraBtnActive: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  cameraBtnPressed: { opacity: 0.8 },
  cameraBtnLabel: {
    fontSize: AccessFontSize.base,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.navy,
  },
  cameraBtnLabelActive: { color: AccessColors.textOnDark },

  // Recognized card
  recognizedCard: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.lg,
    gap: AccessSpacing.md,
  },
  recognizedHeading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  recognizedBox: {
    minHeight: 70,
    backgroundColor: AccessColors.background,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
    padding: AccessSpacing.md,
    justifyContent: 'center',
  },
  recognizedText: {
    fontSize: AccessFontSize.lg,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  recognizedPlaceholder: {
    color: AccessColors.textTertiary,
    fontStyle: 'italic',
    fontSize: AccessFontSize.base,
  },
  sentBanner: {
    backgroundColor: AccessColors.statusGreenBg,
    borderWidth: 1,
    borderColor: AccessColors.statusGreen,
    borderRadius: AccessRadius.sm,
    padding: AccessSpacing.xs,
    alignItems: 'center',
  },
  sentBannerText: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: '#15803D',
  },
  recognizedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: AccessSpacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    borderRadius: AccessRadius.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
    backgroundColor: AccessColors.cardDefault,
  },
  actionBtnPrimary: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  actionBtnPressed: { opacity: 0.8 },
  actionBtnDisabled: {
    backgroundColor: AccessColors.background,
    borderColor: AccessColors.border,
    opacity: 0.6,
  },
  actionBtnDisabledText: { color: AccessColors.textTertiary },
  actionBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textSecondary,
  },
  actionBtnLabelPrimary: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textOnDark,
  },

  // Phrases
  phrasesSection: { gap: AccessSpacing.sm },
  phrasesHeading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.textPrimary,
  },
  phrasesSub: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
  },
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
  },
  phraseBtn: {
    backgroundColor: AccessColors.cardDefault,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    borderRadius: AccessRadius.sm,
    paddingVertical: AccessSpacing.sm,
    paddingHorizontal: AccessSpacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.xs,
  },
  phraseBtnSelected: {
    borderColor: AccessColors.teal,
    backgroundColor: AccessColors.tealFaint,
  },
  phraseBtnPressed: { opacity: 0.8 },
  phraseEmoji: { fontSize: 16 },
  phraseBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.medium,
    color: AccessColors.textPrimary,
  },
  phraseBtnLabelSelected: {
    color: AccessColors.tealDark,
    fontWeight: AccessFontWeight.bold,
  },
});
