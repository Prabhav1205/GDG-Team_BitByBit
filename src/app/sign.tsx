/**
 * /sign — Sign Language communication module.
 *
 * Implements the ISL recognition pipeline:
 *   Camera → MediaPipe Hand Landmarks → FastAPI Backend → Gesture Recognition → UI + TTS
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WebView } from 'react-native-webview';

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
import { getApiBaseUrl } from '@/constants/api-config';
import sampleGesturesData from '@/constants/sample-gestures.json';

function buildMediapipeWebViewHtml(apiBaseUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body, html { width: 100%; height: 100%; overflow: hidden; background: #1A1F2E; }
    #container { position: relative; width: 100%; height: 100%; }
    video { width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
    canvas { position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform: scaleX(-1); pointer-events: none; z-index: 10; }
    #badge { position: absolute; top: 8px; left: 8px; right: 8px; background: rgba(0,0,0,0.88); color: #10B981; font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-size: 11px; font-weight: bold; padding: 6px 10px; border-radius: 6px; z-index: 20; border-left: 3px solid #10B981; }
    #gesture-badge { position: absolute; bottom: 8px; left: 8px; right: 8px; background: rgba(0,245,212,0.15); border: 1.5px solid #00F5D4; color: #00F5D4; font-family: -apple-system, BlinkMacSystemFont, Roboto, sans-serif; font-size: 13px; font-weight: bold; padding: 8px 12px; border-radius: 6px; z-index: 20; text-align: center; display: none; }
  </style>
</head>
<body>
  <div id="container">
    <video id="webcam" playsinline autoplay muted></video>
    <canvas id="output_canvas"></canvas>
    <div id="badge">⏳ INITIALIZING SKELETON ENGINE...</div>
    <div id="gesture-badge"></div>
  </div>
  <script>
    const badge = document.getElementById('badge');
    const gestureBadge = document.getElementById('gesture-badge');
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('output_canvas');
    const ctx = canvas.getContext('2d');
    const API_BASE_URL = '${apiBaseUrl}';

    window.onerror = function(msg) {
      setStatus('⚠️ ' + msg, '#F59E0B');
    };

    function setStatus(text, color) {
      if (badge) {
        badge.innerText = text;
        badge.style.color = color || '#10B981';
        badge.style.borderLeftColor = color || '#10B981';
      }
    }

    function showGesture(label, confidence) {
      if (gestureBadge) {
        gestureBadge.style.display = 'block';
        gestureBadge.innerText = '\u2713 ' + label + ' (' + Math.round(confidence * 100) + '%)';
        clearTimeout(gestureBadge._timer);
        gestureBadge._timer = setTimeout(() => { gestureBadge.style.display = 'none'; }, 3000);
      }
    }

    function loadScriptAsync(src) {
      return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = 'anonymous';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error('Script failed: ' + src));
        document.head.appendChild(s);
      });
    }

    const HAND_CONNECTIONS = [
      [0,1],[1,2],[2,3],[3,4],
      [0,5],[5,6],[6,7],[7,8],
      [0,9],[9,10],[10,11],[11,12],
      [0,13],[13,14],[14,15],[15,16],
      [0,17],[17,18],[18,19],[19,20],
      [5,9],[9,13],[13,17]
    ];


    let lastPredictTime = 0;
    let isPredicting = false;
    let apiOnline = null; // null=unknown, true=online, false=offline

    async function callApi(pts) {
      if (isPredicting) return;
      isPredicting = true;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      try {
        const res = await fetch(API_BASE_URL + '/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landmarks: pts }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          apiOnline = true;
          const data = await res.json();
          const gesture = data.gesture || 'UNKNOWN';
          const confidence = data.confidence || 0;
          const margin = data.margin || 0;
          const accepted = Boolean(data.accepted && gesture !== 'UNKNOWN');

          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'FRAME_PREDICTION',
              gesture: gesture,
              confidence: confidence,
              margin: margin,
              accepted: accepted,
            }));
          }

          if (accepted) {
            showGesture(gesture, confidence);
          }
        } else {
          apiOnline = false;
        }
      } catch(e) {
        clearTimeout(timeoutId);
        apiOnline = false;
      } finally {
        isPredicting = false;
      }
    }

    async function main() {
      try {
        setStatus('⏳ Loading Camera Feed...', '#60A5FA');

        let stream = null;
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
              audio: false,
            });
            video.srcObject = stream;
            await video.play();
          } catch(e) {
            setStatus('⚠️ Camera: ' + e.message, '#F59E0B');
          }
        }

        setStatus('⏳ Loading Hand AI...', '#60A5FA');
        await loadScriptAsync('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js');
        await loadScriptAsync('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js');

        if (!window.Hands) throw new Error('MediaPipe Hands unavailable');

        const hands = new window.Hands({
          locateFile: (file) => 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.50,
        });

        hands.onResults((results) => {
          const w = video.videoWidth || 640;
          const h = video.videoHeight || 480;
          if (canvas.width !== w || canvas.height !== h) {
            canvas.width = w;
            canvas.height = h;
          }
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const lm = results.multiHandLandmarks[0];
            setStatus('\uD83D\uDFE2 HAND DETECTED — Analyzing...', '#00F5D4');

            // Draw connections
            ctx.strokeStyle = '#00F5D4';
            ctx.lineWidth = 3.5;
            ctx.lineCap = 'round';
            for (const [s, e] of HAND_CONNECTIONS) {
              const p1 = lm[s], p2 = lm[e];
              if (p1 && p2) {
                ctx.beginPath();
                ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                ctx.stroke();
              }
            }
            // Draw joints
            for (let i = 0; i < lm.length; i++) {
              const pt = lm[i];
              const cx = pt.x * canvas.width;
              const cy = pt.y * canvas.height;
              const isTip = [4,8,12,16,20].includes(i);
              // Outer glow
              ctx.beginPath();
              ctx.arc(cx, cy, isTip ? 10 : 6, 0, 2 * Math.PI);
              ctx.fillStyle = isTip ? 'rgba(245,158,11,0.25)' : 'rgba(0,245,212,0.20)';
              ctx.fill();
              // Core dot
              ctx.beginPath();
              ctx.arc(cx, cy, isTip ? 6 : 4, 0, 2 * Math.PI);
              ctx.fillStyle = isTip ? '#F59E0B' : '#10B981';
              ctx.fill();
              ctx.strokeStyle = '#FFFFFF';
              ctx.lineWidth = 1.5;
              ctx.stroke();
            }

            const now = Date.now();
            if (now - lastPredictTime > 300) {
              lastPredictTime = now;
              const pts = lm.map(p => ({ x: p.x, y: p.y, z: p.z || 0 }));
              callApi(pts);
            }
          } else {
            setStatus('\uD83D\uDD0D Show your hand to camera...', '#10B981');
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NO_HAND' }));
            }
          }
        });

        if (stream && video) {
          let isProcessing = false;
          const loop = async () => {
            if (video.readyState >= 2 && !isProcessing) {
              isProcessing = true;
              try { await hands.send({ image: video }); } catch(e) {}
              isProcessing = false;
            }
            requestAnimationFrame(loop);
          };
          requestAnimationFrame(loop);
        } else if (window.Camera && video) {
          const cam = new window.Camera(video, {
            onFrame: async () => { await hands.send({ image: video }); },
            width: 640, height: 480,
          });
          await cam.start();
        }

        setStatus('\uD83D\uDD0D Show your hand to camera...', '#10B981');
      } catch(err) {
        setStatus('\u26A0\uFE0F ' + (err.message || String(err)), '#F59E0B');
      }
    }

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      main();
    } else {
      document.addEventListener('DOMContentLoaded', main);
    }
  <\/script>
</body>
</html>`;
}



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

const SAMPLE_GESTURES: Record<string, { confidence: number; features?: number[]; landmarks?: { x: number; y: number; z: number }[] }> = sampleGesturesData as any;


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
  const [stabilizingGesture, setStabilizingGesture] = useState<string | null>(null);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [sentMessage, setSentMessage] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const videoRef = useRef<any>(null);
  const canvasRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const handsRef = useRef<any>(null);
  const lastPredictTime = useRef<number>(0);

  // Check ISL FastAPI Service health on mount
  useEffect(() => {
    let active = true;
    async function checkHealth() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      try {
        const url = getApiBaseUrl();
        const res = await fetch(`${url}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (active) {
          setApiOnline(res.ok);
        }
      } catch {
        if (active) {
          setApiOnline(false);
        }
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // ISL Hand Skeleton Connections
  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],       // Index
    [0, 9], [9, 10], [10, 11], [11, 12],  // Middle
    [0, 13], [13, 14], [14, 15], [15, 16],// Ring
    [0, 17], [17, 18], [18, 19], [19, 20],// Pinky
    [5, 9], [9, 13], [13, 17],            // Palm Base
  ];

  // Web Camera & MediaPipe Hands Landmark Tracking Loop
  useEffect(() => {
    if (Platform.OS !== 'web' || !cameraActive) return;

    let active = true;
    let localStream: any = null;
    let animId: number | null = null;
    let isProcessing = false;

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
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });

        hands.onResults((results: any) => {
          if (!active) return;

          // Draw hand skeleton & joints on canvas
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (canvas) {
            const w = video?.videoWidth || 640;
            const h = video?.videoHeight || 480;
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
                for (const landmarks of results.multiHandLandmarks) {
                  // 1. Draw Skeleton Bones
                  ctx.strokeStyle = '#00F5D4';
                  ctx.lineWidth = 3;
                  ctx.lineCap = 'round';
                  for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
                    const p1 = landmarks[startIdx];
                    const p2 = landmarks[endIdx];
                    if (p1 && p2) {
                      ctx.beginPath();
                      ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                      ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                      ctx.stroke();
                    }
                  }

                  // 2. Draw Landmark Joints
                  for (let i = 0; i < landmarks.length; i++) {
                    const pt = landmarks[i];
                    const cx = pt.x * canvas.width;
                    const cy = pt.y * canvas.height;
                    const isFingertip = [4, 8, 12, 16, 20].includes(i);

                    ctx.beginPath();
                    ctx.arc(cx, cy, isFingertip ? 7 : 4, 0, 2 * Math.PI);
                    ctx.fillStyle = isFingertip ? '#F59E0B' : '#10B981';
                    ctx.fill();
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                  }
                }
              }
            }
          }

          // Send landmarks to FastAPI model backend for inference
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const now = Date.now();
            if (now - lastPredictTime.current > 300) {
              lastPredictTime.current = now;
              const pts = results.multiHandLandmarks[0].map((p: any) => ({
                x: p.x,
                y: p.y,
                z: p.z || 0,
              }));
              sendLandmarksToAPI(pts);
            }
          } else {
            handleNoHand();
          }
        });

        handsRef.current = hands;

        // Try direct getUserMedia first
        if (navigator?.mediaDevices?.getUserMedia && videoRef.current) {
          try {
            localStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'user',
                width: { ideal: 640 },
                height: { ideal: 480 },
              },
              audio: false,
            });

            if (active && videoRef.current) {
              videoRef.current.srcObject = localStream;
              await videoRef.current.play();
              setStatus('scanning');

              const processLoop = async () => {
                if (!active) return;
                const vid = videoRef.current;
                if (vid && vid.readyState >= 2 && handsRef.current && !isProcessing) {
                  isProcessing = true;
                  try {
                    await handsRef.current.send({ image: vid });
                  } catch {
                    // skip frame
                  } finally {
                    isProcessing = false;
                  }
                }
                if (active) {
                  animId = requestAnimationFrame(processLoop);
                }
              };
              animId = requestAnimationFrame(processLoop);
              return;
            }
          } catch (gumErr) {
            console.warn('getUserMedia fallback to Camera helper:', gumErr);
          }
        }

        // Fallback to MediaPipe Camera helper
        if (videoRef.current && Camera) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (active && videoRef.current && handsRef.current && !isProcessing) {
                isProcessing = true;
                try {
                  await handsRef.current.send({ image: videoRef.current });
                } catch {
                  // ignore
                } finally {
                  isProcessing = false;
                }
              }
            },
            width: 640,
            height: 480,
          });
          camera.start();
          cameraRef.current = camera;
          setStatus('scanning');
        }
      } catch (err) {
        console.warn('Failed to start MediaPipe hand tracking:', err);
      }
    }

    startHandTracking();

    return () => {
      active = false;
      if (animId) cancelAnimationFrame(animId);
      if (localStream) {
        localStream.getTracks().forEach((t: any) => t.stop());
      }
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

  async function handleToggleCamera() {
    if (Platform.OS !== 'web' && !cameraActive) {
      if (!permission?.granted) {
        const resp = await requestPermission();
        if (!resp.granted) {
          Alert.alert(
            'Camera Permission Needed',
            'Please enable camera permissions in your device settings to use sign recognition.'
          );
          return;
        }
      }
    }

    setCameraActive((prev) => {
      const next = !prev;
      if (!next) {
        setStatus('idle');
        setConfidence(null);
      } else {
        setStatus('scanning');
      }
      return next;
    });
    setSentMessage(false);
  }

  interface FramePrediction {
    gesture: string;
    confidence: number;
    margin: number;
    accepted: boolean;
    timestamp: number;
  }

  const recentFramesRef = useRef<FramePrediction[]>([]);
  const lastRecognizedGesture = useRef<string | null>(null);
  const lastSpokenTime = useRef<number>(0);

  // Confirms a stabilized gesture, updates UI, and triggers speech & kiosk broadcast (once per gesture)
  function confirmRecognizedGesture(gestureId: string, conf: number) {
    const cleanId = gestureId.replace(/\s*(△|\(offline\)).*$/i, '').trim();
    const gObj = ISL_GESTURES.find((g) => g.id === cleanId || g.id === gestureId);
    const phrase = gObj ? gObj.phrase : cleanId;
    setActiveGesture(cleanId);
    setRecognizedText(phrase);
    setConfidence(conf);
    setStatus('recognized');
    setStabilizingGesture(null);

    const now = Date.now();
    if (cleanId !== lastRecognizedGesture.current || now - lastSpokenTime.current > 3500) {
      lastRecognizedGesture.current = cleanId;
      lastSpokenTime.current = now;
      speechEngine.speak(phrase, { lang: session.language });
      broadcastTranslation(phrase, 'Sign Language', conf);
    }
  }

  // Temporal Smoothing Filter:
  // Requires at least 3 matching frames out of the last 5 frames window (60% agreement)
  // with average confidence >= 0.65 before confirming the gesture.
  function processPredictionFrame(pred: {
    gesture: string;
    confidence: number;
    margin?: number;
    accepted: boolean;
  }) {
    const now = Date.now();
    const margin = pred.margin ?? 0;

    recentFramesRef.current.push({
      gesture: pred.gesture,
      confidence: pred.confidence,
      margin,
      accepted: pred.accepted,
      timestamp: now,
    });

    if (recentFramesRef.current.length > 5) {
      recentFramesRef.current.shift();
    }

    const buffer = recentFramesRef.current;
    // Filter only confident, accepted, non-UNKNOWN predictions
    const validFrames = buffer.filter(
      (f) => f.accepted && f.gesture !== 'UNKNOWN' && f.confidence >= 0.65
    );

    if (validFrames.length === 0) {
      setStabilizingGesture(null);
      return;
    }

    // Group valid frames by gesture
    const counts: Record<string, { count: number; totalConf: number }> = {};
    for (const f of validFrames) {
      if (!counts[f.gesture]) counts[f.gesture] = { count: 0, totalConf: 0 };
      counts[f.gesture].count += 1;
      counts[f.gesture].totalConf += f.confidence;
    }

    const sorted = Object.entries(counts).sort((a, b) => b[1].count - a[1].count);
    const [leadGesture, stats] = sorted[0];
    const avgConf = stats.totalConf / stats.count;

    // Temporal confirmation: at least 3 matching frames in the 5-frame window
    if (stats.count >= 3 && avgConf >= 0.65) {
      confirmRecognizedGesture(leadGesture, avgConf);
    } else if (stats.count >= 1) {
      // Subtle stabilizing state (does NOT speak or broadcast yet)
      setStabilizingGesture(leadGesture);
    }
  }

  function handleNoHand() {
    recentFramesRef.current = [];
    setStabilizingGesture(null);
    lastRecognizedGesture.current = null;
    if (status === 'recognized') {
      setStatus('scanning');
    }
  }

  // Web-only: Predict gesture via FastAPI Model endpoint POST /predict
  const isPredicting = useRef<boolean>(false);
  async function sendLandmarksToAPI(landmarks: { x: number; y: number; z: number }[]) {
    if (isPredicting.current) return;
    isPredicting.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    try {
      const url = getApiBaseUrl();
      const res = await fetch(`${url}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landmarks }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        processPredictionFrame({
          gesture: data.gesture || 'UNKNOWN',
          confidence: data.confidence || 0,
          margin: data.margin || 0,
          accepted: Boolean(data.accepted && data.gesture !== 'UNKNOWN'),
        });
      }
    } catch (err) {
      console.warn('Prediction API call failed:', err);
    } finally {
      isPredicting.current = false;
    }
  }

  // Predict directly using canonical 63-element feature vector (for test buttons)
  async function sendFeaturesToAPI(features: number[]) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const url = getApiBaseUrl();
      const res = await fetch(`${url}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data.accepted && data.gesture !== 'UNKNOWN') {
          confirmRecognizedGesture(data.gesture, data.confidence || 0.95);
        }
      }
    } catch (err) {
      console.warn('Prediction API call failed:', err);
    }
  }

  // Test gesture prediction directly using verified real landmark / feature vectors
  function handleTestGesture(gestureId: string) {
    const sample = SAMPLE_GESTURES[gestureId];
    setSentMessage(false);

    if (sample?.features) {
      sendFeaturesToAPI(sample.features);
    } else if (sample?.landmarks) {
      sendLandmarksToAPI(sample.landmarks);
    } else {
      const gestureObj = ISL_GESTURES.find((g) => g.id === gestureId);
      const phrase = gestureObj ? gestureObj.phrase : 'I need help.';
      setActiveGesture(gestureId);
      setRecognizedText(phrase);
      setStatus('recognized');
      speechEngine.speak(phrase, { lang: session.language });
      broadcastTranslation(phrase, 'Sign Language', 0.98);
    }
  }

  function handleClear() {
    setRecognizedText('');
    setActiveGesture(null);
    setConfidence(null);
    handleNoHand();
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
      ? `✅ ISL Sign Confirmed: ${activeGesture} ${confidence ? `(${(confidence * 100).toFixed(0)}% confidence)` : ''}`
      : stabilizingGesture
        ? `⏳ Stabilizing sign: ${stabilizingGesture}... (hold steady)`
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
                ISL Model API:{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {apiOnline === true
                    ? 'ONLINE (MediaPipe + RandomForest Loaded)'
                    : apiOnline === false
                    ? 'OFFLINE (Tap gestures below or start backend)'
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
                      transform: 'scaleX(-1)',
                      zIndex: 1,
                    }}
                    playsInline
                    autoPlay
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
                      transform: 'scaleX(-1)',
                      zIndex: 10,
                    }}
                  />
                  {status === 'scanning' && (
                    <View style={[styles.scanOverlayBadge, { zIndex: 20 }]}>
                      <Text style={styles.scanOverlayText}>🟢 MEDIAPIPE SKELETON TRACKING ACTIVE</Text>
                    </View>
                  )}
                </View>
              ) : Platform.OS !== 'web' && cameraActive ? (
                <View style={styles.videoWrapper}>
                  <WebView
                    style={{ width: '100%', height: '100%', backgroundColor: '#1A1F2E' }}
                    originWhitelist={['*']}
                    allowsInlineMediaPlayback={true}
                    mediaPlaybackRequiresUserAction={false}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    mediaCapturePermissionGrantType="grant"
                    onPermissionRequest={(request: any) => {
                      request.grant(request.resources);
                    }}
                    source={{
                      html: buildMediapipeWebViewHtml(getApiBaseUrl()),
                      baseUrl: 'https://localhost',
                    }}
                    onMessage={(event) => {
                      try {
                        const msg = JSON.parse(event.nativeEvent.data);
                        // FRAME_PREDICTION: WebView called /predict, result forwarded here
                        if (msg.type === 'FRAME_PREDICTION') {
                          processPredictionFrame({
                            gesture: msg.gesture,
                            confidence: msg.confidence,
                            margin: msg.margin,
                            accepted: msg.accepted,
                          });
                        } else if (msg.type === 'NO_HAND') {
                          handleNoHand();
                        } else if (msg.type?.toUpperCase() === 'GESTURE' && msg.gesture) {
                          // Legacy/fallback gesture message
                          processPredictionFrame({
                            gesture: msg.gesture,
                            confidence: msg.confidence || 0.70,
                            accepted: true,
                          });
                        } else if (msg.type?.toUpperCase() === 'LANDMARKS' && msg.landmarks) {
                          sendLandmarksToAPI(msg.landmarks);
                        }
                      } catch (err) {
                        console.warn('WebView message error:', err);
                      }
                    }}
                  />
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
