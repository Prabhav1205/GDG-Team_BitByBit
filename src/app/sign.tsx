/**
 * /sign — Sign Language Interface
 *
 * Real-time MediaPipe Hands landmark detector + FastAPI RandomForest gesture inference.
 * Captures 21 3D hand landmarks from webcam video, draws live skeleton overlay,
 * sends landmark arrays to the ISL FastAPI backend, and speaks translated phrases aloud.
 *
 * Native (Expo Go / iOS / Android):
 *   Uses react-native-webview with an inline MediaPipe HTML page that captures camera,
 *   runs landmark detection, calls the FastAPI /predict endpoint, and posts results back.
 *   Camera permission is requested via expo-camera useCameraPermissions().
 *
 * Web:
 *   Uses the browser getUserMedia + MediaPipe Hands JS SDK directly via canvas overlay.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useCameraPermissions } from 'expo-camera';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { AccessHeader } from '@/components/access/AccessHeader';
import { KioskIcon } from '@/components/access/KioskIcon';
import { PageHeader } from '@/components/access/PageHeader';
import {
  AccessColors,
  AccessFontSize,
  AccessFontWeight,
  AccessRadius,
  AccessSpacing,
} from '@/constants/access-theme';
import { useAccessTheme } from '@/context/AccessThemeContext';
import { UI_STRINGS, LANGUAGES, toSafeLangCode, type LangCode } from '@/constants/i18n';
import { getApiBaseUrl } from '@/constants/api-config';
import sampleGesturesData from '@/constants/sample-gestures.json';
import { useSession } from '@/context/SessionContext';
import { speechEngine } from '@/services/speech-engine';
import { useSchemeSearch } from '@/hooks/use-scheme-search';
import { SchemeResultsPanel } from '@/components/access/SchemeResultsPanel';
import { GESTURE_QUERY_MAP } from '@/constants/gesture-query-map';

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

    // ── Rule-based offline gesture classifier ──────────────────────────────
    // Determines if fingers are extended relative to their MCP joints.
    // Used as fallback when API is unreachable.
    function getExtendedFingers(lm) {
      // Returns array of booleans [thumb, index, middle, ring, pinky]
      // Tips: 4, 8, 12, 16, 20  |  PIP: 3, 7, 11, 15, 19  |  MCP: 2, 6, 10, 14, 18
      const tips = [4, 8, 12, 16, 20];
      const pips = [3, 7, 11, 15, 19];
      const mcps = [2, 6, 10, 14, 18];
      const wrist = lm[0];
      return tips.map((tip, i) => {
        const tipY = lm[tip].y;
        const pipY = lm[pips[i]].y;
        if (i === 0) {
          // Thumb: compare x distance from wrist instead
          return Math.abs(lm[tip].x - lm[mcps[i]].x) > 0.06;
        }
        return tipY < pipY - 0.02;
      });
    }

    function classifyOffline(lm) {
      if (!lm || lm.length < 21) return null;
      const [thumb, idx, mid, ring, pinky] = getExtendedFingers(lm);
      const allFolded = !thumb && !idx && !mid && !ring && !pinky;
      const allExtended = thumb && idx && mid && ring && pinky;
      const peaceSign = !thumb && idx && mid && !ring && !pinky;
      const pointingUp = !thumb && idx && !mid && !ring && !pinky;
      const thumbUp = thumb && !idx && !mid && !ring && !pinky;
      const wristY = lm[0].y;

      if (allExtended) return { gesture: 'WHERE', confidence: 0.72 };       // Open palm
      if (peaceSign) return { gesture: 'YES', confidence: 0.70 };            // Peace/V sign
      if (allFolded) return { gesture: 'NO', confidence: 0.68 };             // Fist
      if (pointingUp && wristY > 0.5) return { gesture: 'HELP', confidence: 0.68 };
      if (thumbUp) return { gesture: 'FINISH', confidence: 0.66 };           // Thumbs up
      if (thumb && idx && !mid && !ring && !pinky) return { gesture: 'MONEY', confidence: 0.65 };
      if (!thumb && !idx && !mid && ring && pinky) return { gesture: 'APPOINTMENT', confidence: 0.64 };
      if (thumb && idx && mid && !ring && !pinky) return { gesture: 'FORM', confidence: 0.63 };
      if (thumb && idx && mid && ring && !pinky) return { gesture: 'THANK_YOU', confidence: 0.62 };
      if (!thumb && idx && !mid && !ring && pinky) return { gesture: 'ID', confidence: 0.61 };
      return null;
    }

    let lastPredictTime = 0;
    let isPredicting = false;
    let apiOnline = null; // null=unknown, true=online, false=offline

    async function callApi(pts) {
      if (isPredicting) return;
      isPredicting = true;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      try {
        const res = await fetch(API_BASE_URL + '/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landmarks: pts, confidence_threshold: 0.30 }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (res.ok) {
          apiOnline = true;
          const data = await res.json();
          let finalGesture = data.gesture;
          let finalConf = data.confidence || 0;

          // If UNKNOWN but raw_probabilities has a decent candidate, use it
          if ((!finalGesture || finalGesture === 'UNKNOWN') && data.raw_probabilities) {
            const entries = Object.entries(data.raw_probabilities)
              .filter(([k]) => k !== 'UNKNOWN')
              .sort((a, b) => b[1] - a[1]);
            if (entries.length > 0 && entries[0][1] >= 0.25) {
              finalGesture = entries[0][0];
              finalConf = entries[0][1];
            }
          }

          if (finalGesture && finalGesture !== 'UNKNOWN' && finalConf > 0.25) {
            showGesture(finalGesture, finalConf);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'gesture',
                gesture: finalGesture,
                confidence: finalConf,
              }));
            }
          } else {
            // Fallback to rule-based when model is uncertain
            const offline = classifyOffline(pts);
            if (offline) {
              showGesture(offline.gesture + ' \u25b3', offline.confidence);
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'gesture',
                  gesture: offline.gesture,
                  confidence: offline.confidence,
                }));
              }
            }
          }
        } else {
          apiOnline = false;
        }
      } catch(e) {
        clearTimeout(timeoutId);
        apiOnline = false;
        // Fallback to rule-based when API is offline
        const offline = classifyOffline(pts);
        if (offline) {
          showGesture(offline.gesture + ' (offline)', offline.confidence);
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'gesture',
              gesture: offline.gesture,
              confidence: offline.confidence,
            }));
          }
        }
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
            if (now - lastPredictTime > 400) {
              lastPredictTime = now;
              const pts = lm.map(p => ({ x: p.x, y: p.y, z: p.z || 0 }));
              callApi(pts);
            }
          } else {
            setStatus('\uD83D\uDD0D Show your hand to camera...', '#10B981');
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
  </script>
</body>
</html>`;
}



// ── ISL Gesture Vocabulary Definition ─────────────────────────────────────

const ISL_GESTURES = [
  { id: 'HELP',        label: 'Help',        phrase: 'I need help.',                           localPhrase: { en: 'I need help.',                           hi: 'मुझे मदद चाहिए।',              mr: 'मला मदत हवी आहे.' },            emoji: '🆘' },
  { id: 'APPOINTMENT', label: 'Appointment', phrase: 'I would like to check my appointment.', localPhrase: { en: 'I would like to check my appointment.',  hi: 'मैं अपनी अपॉइंटमेंट जांचना चाहता हूँ।', mr: 'मला माझी अपॉइंटमेंट तपासायची आहे.' }, emoji: '📅' },
  { id: 'FORM',        label: 'Form',        phrase: 'I need help with this form.',            localPhrase: { en: 'I need help with this form.',             hi: 'मुझे इस फ़ॉर्म में मदद चाहिए।',  mr: 'मला या फॉर्ममध्ये मदत हवी आहे.' }, emoji: '📋' },
  { id: 'YES',         label: 'Yes',         phrase: 'Yes.',                                   localPhrase: { en: 'Yes.',                                   hi: 'हाँ।',                         mr: 'होय.' },                        emoji: '✅' },
  { id: 'NO',          label: 'No',          phrase: 'No.',                                    localPhrase: { en: 'No.',                                    hi: 'नहीं।',                        mr: 'नाही.' },                       emoji: '❌' },
  { id: 'MONEY',       label: 'Money/Fee',   phrase: 'I have a query regarding cash/payment.', localPhrase: { en: 'I have a query regarding cash or payment.', hi: 'मुझे नकद या भुगतान के बारे में प्रश्न है।', mr: 'मला रोख किंवा पेमेंटबद्दल प्रश्न आहे.' }, emoji: '💳' },
  { id: 'ID',          label: 'ID Card',     phrase: 'Here is my identity document.',          localPhrase: { en: 'Here is my identity document.',           hi: 'यह मेरा पहचान दस्तावेज़ है।',    mr: 'हे माझे ओळखपत्र आहे.' },        emoji: '🪪' },
  { id: 'WHERE',       label: 'Directions',  phrase: 'Where do I need to go?',                 localPhrase: { en: 'Where do I need to go?',                  hi: 'मुझे कहाँ जाना है?',           mr: 'मला कुठे जायचे आहे?' },         emoji: '🧭' },
  { id: 'THANK_YOU',   label: 'Thank You',   phrase: 'Thank you for your help.',               localPhrase: { en: 'Thank you for your help.',                hi: 'आपकी मदद के लिए धन्यवाद।',    mr: 'तुमच्या मदतीबद्दल धन्यवाद.' },    emoji: '🙏' },
  { id: 'FINISH',      label: 'Finish',      phrase: 'I am finished.',                         localPhrase: { en: 'I am finished.',                          hi: 'मैं समाप्त हो गया।',          mr: 'मी पूर्ण केले.' },              emoji: '🏁' },
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
  const styles = useStyles();
  const { session, broadcastTranslation } = useSession();
  const lang = toSafeLangCode(session.language);
  const speechCode = LANGUAGES[lang].speechCode;
  const t = UI_STRINGS[lang];
  const [cameraActive, setCameraActive] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [activeGesture, setActiveGesture] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'recognized'>('idle');
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [sentMessage, setSentMessage] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const schemeSearch = useSchemeSearch();

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

  const lastRecognizedGesture = useRef<string | null>(null);
  const lastSpokenTime = useRef<number>(0);

  // Handle recognized gesture (called from both web and mobile paths)
  function handleRecognizedGesture(rawGestureId: string, conf: number) {
    const cleanId = rawGestureId.replace(/\s*(△|\(offline\)).*$/i, '').trim();
    const gObj = ISL_GESTURES.find((g) => g.id === cleanId || g.id === rawGestureId);
    const phrase = gObj ? (gObj.localPhrase[lang] ?? gObj.localPhrase.en) : cleanId;
    setActiveGesture(cleanId);
    setRecognizedText(phrase);
    setConfidence(conf);
    setStatus('recognized');

    const now = Date.now();
    if (cleanId !== lastRecognizedGesture.current || now - lastSpokenTime.current > 4000) {
      lastRecognizedGesture.current = cleanId;
      lastSpokenTime.current = now;
      speechEngine.speak(phrase, { lang: speechCode });
      broadcastTranslation(phrase, 'Sign Language', conf);
    }
  }

  // Web-only: Predict gesture via FastAPI Model endpoint POST /predict
  const isPredicting = useRef<boolean>(false);
  async function sendLandmarksToAPI(landmarks: { x: number; y: number; z: number }[]) {
    if (isPredicting.current) return;
    isPredicting.current = true;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    try {
      const url = getApiBaseUrl();
      const res = await fetch(`${url}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landmarks,
          confidence_threshold: 0.28,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        let finalGesture = data.gesture;
        let finalConf: number = data.confidence || 0;

        if ((!finalGesture || finalGesture === 'UNKNOWN') && data.raw_probabilities) {
          const sorted = Object.entries(data.raw_probabilities)
            .filter(([k]) => k !== 'UNKNOWN')
            .sort((a: any, b: any) => b[1] - a[1]);
          if (sorted.length > 0 && (sorted[0][1] as number) >= 0.22) {
            finalGesture = sorted[0][0];
            finalConf = sorted[0][1] as number;
          }
        }

        if (finalGesture && finalGesture !== 'UNKNOWN') {
          handleRecognizedGesture(finalGesture, finalConf);
        }
      }
    } catch (err) {
      console.warn('Prediction API call failed:', err);
    } finally {
      isPredicting.current = false;
    }
  }

  // Predict directly using canonical 63-element feature vector
  async function sendFeaturesToAPI(features: number[]) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const url = getApiBaseUrl();
      const res = await fetch(`${url}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features, confidence_threshold: 0.28 }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        let finalGesture = data.gesture;
        let finalConf: number = data.confidence || 0;

        if ((!finalGesture || finalGesture === 'UNKNOWN') && data.raw_probabilities) {
          const sorted = Object.entries(data.raw_probabilities)
            .filter(([k]) => k !== 'UNKNOWN')
            .sort((a: any, b: any) => b[1] - a[1]);
          if (sorted.length > 0 && (sorted[0][1] as number) >= 0.22) {
            finalGesture = sorted[0][0];
            finalConf = sorted[0][1] as number;
          }
        }

        if (finalGesture && finalGesture !== 'UNKNOWN') {
          handleRecognizedGesture(finalGesture, finalConf);
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
      const phrase = gestureObj ? (gestureObj.localPhrase[lang] ?? gestureObj.localPhrase.en) : 'I need help.';
      setActiveGesture(gestureId);
      setRecognizedText(phrase);
      setStatus('recognized');
      speechEngine.speak(phrase, { lang: speechCode });
      broadcastTranslation(phrase, 'Sign Language', 0.98);
    }
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
    const sendMsg = lang === 'hi'
      ? 'संदेश काउंटर स्टाफ को भेज दिया गया।'
      : lang === 'mr'
      ? 'संदेश काउंटर कर्मचाऱ्यांना पाठवला गेला.'
      : 'Message sent to counter staff.';
    speechEngine.speak(sendMsg, { lang: speechCode });
  }

  const statusText =
    status === 'recognized'
      ? `✅ ISL Gesture Recognized: ${activeGesture} ${confidence ? `(${(confidence * 100).toFixed(0)}% confidence)` : ''}`
      : cameraActive
        ? (lang === 'hi' ? '🎥 लाइव कैमरा सक्रिय — हाथ के निशान स्कैन हो रहे हैं...' : lang === 'mr' ? '🎥 लाइव कॅमेरा सक्रिय — हाताचे ठिपके स्कॅन होत आहेत...' : '🎥 Live Camera active — scanning hand landmarks...')
        : (lang === 'hi' ? '⏳ कैमरा रुका हुआ है। कैमरा शुरू करें या इशारा चुनें।' : lang === 'mr' ? '⏳ कॅमेरा थांबला आहे. कॅमेरा सुरू करा किंवा खूण निवडा.' : '⏳ Camera paused. Tap Start Camera Feed or select a gesture.');

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
                        // Mobile path: WebView already called API directly,
                        // result arrives as { type: 'GESTURE', gesture, confidence }
                        if (msg.type?.toUpperCase() === 'GESTURE' && msg.gesture) {
                          handleRecognizedGesture(msg.gesture, msg.confidence || 0.65);
                        }
                        // Legacy landmark path (fallback)
                        if (msg.type?.toUpperCase() === 'LANDMARKS' && msg.landmarks) {
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
              color={cameraActive ? '#EF4444' : '#FFFFFF'}
            />
            <Text
              style={[styles.cameraBtnLabel, cameraActive && styles.cameraBtnLabelActive]}
            >
              {cameraActive ? 'Stop Camera' : 'Start Camera Feed'}
            </Text>
          </Pressable>

          {/* ── Recognized Message Card ────────────────────────────────── */}
          <View style={styles.recognizedCard}>
            <Text style={styles.cardTitle}>Translated ISL Message</Text>
            <View style={styles.translationRow} accessibilityLabel="Recognized message area">
              <Text style={[styles.translationText, recognizedText && styles.translationTextActive, !recognizedText && styles.recognizedPlaceholder]}>
                {recognizedText || 'Perform a gesture or select a phrase below'}
              </Text>
            </View>

            {sentMessage && (
              <View style={styles.sentBanner}>
                <Text style={styles.sentBannerText}>{t.messageSent}</Text>
              </View>
            )}

            <View style={styles.recognizedActions}>
              <Pressable
                style={({ pressed }: any) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
                onPress={handleClear}
                accessibilityRole="button"
                accessibilityLabel={t.clear}
              >
                <KioskIcon name="close" size={16} color={AccessColors.textSecondary} />
                <Text style={styles.actionBtnLabel}>{t.clear}</Text>
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
                accessibilityLabel={t.sendToStaff}
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
                  {t.sendToStaff}
                </Text>
              </Pressable>
            </View>

            {/* Find Schemes button — appears when gesture/text is recognized */}
            {Boolean(activeGesture || recognizedText) && (
              <Pressable
                style={({ pressed }: any) => [
                  styles.findSchemesBtn,
                  pressed && styles.findSchemesBtnPressed,
                  schemeSearch.loading && styles.actionBtnDisabled,
                ]}
                onPress={() => {
                  const query = (activeGesture && GESTURE_QUERY_MAP[activeGesture]) ? GESTURE_QUERY_MAP[activeGesture] : (recognizedText || 'government assistance schemes');
                  schemeSearch.search(query);
                }}
                disabled={schemeSearch.loading}
                accessibilityRole="button"
                accessibilityLabel="Find relevant government schemes for this gesture"
                testID="sign-find-schemes-btn"
              >
                <Text style={styles.findSchemesBtnText}>
                  {schemeSearch.loading ? '⏳ Searching Schemes…' : '🔍 Find Government Schemes'}
                </Text>
              </Pressable>
            )}
          </View>

          {/* Scheme results from RAG — shown after Find Schemes is tapped */}
          {(schemeSearch.results.length > 0 || schemeSearch.loading || schemeSearch.error) && (
            <SchemeResultsPanel
              results={schemeSearch.results}
              loading={schemeSearch.loading}
              error={schemeSearch.error}
            />
          )}

          {/* ── ISL Gesture Quick Options ─────────────────────────────── */}
          <View style={styles.phrasesSection}>
            <Text style={styles.phrasesHeading}>{t.signVocabHeading}</Text>
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

function useStyles() {
  const { AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow } = useAccessTheme();
  return React.useMemo(() => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: AccessColors.background },
  screen: { flex: 1, backgroundColor: AccessColors.background },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: AccessSpacing.lg,
    paddingTop: AccessSpacing.md,
    paddingBottom: AccessSpacing.xl,
    gap: AccessSpacing.lg,
  },

  // ── API Status Bar ─────────────────────────────────────────────────────────
  apiStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.sm,
    gap: AccessSpacing.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
  },
  apiStatusRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: AccessSpacing.xs },
  apiStatusDot: { width: 10, height: 10, borderRadius: 5 },
  apiDotGreen: { backgroundColor: '#10B981' },
  apiDotAmber: { backgroundColor: '#F59E0B' },
  apiStatusText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    flexShrink: 1,
  },

  // ── Camera Viewport ────────────────────────────────────────────────────────
  cameraContainer: {
    gap: AccessSpacing.sm,
  },
  cameraPreview: {
    height: 280,
    borderRadius: AccessRadius.lg,
    overflow: 'hidden',
    backgroundColor: AccessColors.navy,
    borderWidth: 2,
    borderColor: AccessColors.border,
    position: 'relative',
  },
  cameraActive: {
    borderColor: AccessColors.teal,
    borderWidth: 2,
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  scanOverlayBadge: {
    position: 'absolute',
    top: AccessSpacing.sm,
    left: AccessSpacing.sm,
    backgroundColor: 'rgba(27, 45, 79, 0.85)',
    borderRadius: AccessRadius.sm,
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: 4,
    borderLeftWidth: 3,
    borderLeftColor: AccessColors.teal,
  },
  scanOverlayText: {
    color: AccessColors.tealLight,
    fontSize: AccessFontSize.xs,
    fontFamily: AccessFontFamily.bold,
    letterSpacing: 0.5,
  },
  cameraPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: AccessSpacing.xl,
    gap: AccessSpacing.md,
  },
  cameraPlaceholderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraLabel: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.semibold,
    color: AccessColors.textOnDark,
    textAlign: 'center',
  },
  cameraSubLabel: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textOnDarkMuted,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  statusBar: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
  },
  statusBarDone: {
    borderColor: AccessColors.teal,
    backgroundColor: AccessColors.tealFaint,
  },
  statusLabelText: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.medium,
    color: AccessColors.textSecondary,
    textAlign: 'center',
  },
  cameraControls: {
    flexDirection: 'row',
    gap: AccessSpacing.sm,
  },
  cameraBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.sm,
    backgroundColor: AccessColors.teal,
    borderRadius: AccessRadius.md,
    paddingVertical: AccessSpacing.md,
    ...AccessShadow.sm,
  },
  cameraBtnActive: {
    backgroundColor: AccessColors.cardHover,
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  cameraBtnPressed: { opacity: 0.8 },
  cameraBtnLabel: {
    fontSize: AccessFontSize.sm,
    fontFamily: AccessFontFamily.bold,
    color: '#FFFFFF',
  },
  cameraBtnLabelActive: {
    color: '#EF4444',
  },

  // ── Recognized Translation Card ───────────────────────────────────────────
  recognizedCard: {
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.lg,
    padding: AccessSpacing.lg,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    gap: AccessSpacing.md,
    ...AccessShadow.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: AccessFontSize.base,
    fontFamily: AccessFontFamily.bold,
    color: AccessColors.navy,
  },
  confidenceBadge: {
    backgroundColor: AccessColors.tealFaint,
    borderRadius: AccessRadius.sm,
    paddingHorizontal: AccessSpacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: AccessColors.teal,
  },
  confidenceText: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.tealDark,
    fontFamily: AccessFontFamily.semibold,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: AccessSpacing.sm,
    backgroundColor: AccessColors.background,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.md,
    borderLeftWidth: 4,
    borderLeftColor: AccessColors.teal,
  },
  translationText: {
    fontSize: AccessFontSize.base,
    color: AccessColors.textPrimary,
    fontFamily: AccessFontFamily.medium,
    flex: 1,
  },
  translationTextActive: {
    color: AccessColors.navy,
    fontFamily: AccessFontFamily.semibold,
  },
  recognizedPlaceholder: {
    color: AccessColors.textTertiary,
    fontFamily: AccessFontFamily.regular,
    fontStyle: 'italic',
  },
  sentBanner: {
    backgroundColor: AccessColors.tealFaint,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.sm,
    borderWidth: 1,
    borderColor: AccessColors.teal,
  },
  sentBannerText: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.tealDark,
    fontFamily: AccessFontFamily.semibold,
    textAlign: 'center',
  },
  recognizedActions: {
    flexDirection: 'row',
    gap: AccessSpacing.sm,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: AccessSpacing.xs,
    backgroundColor: AccessColors.cardHover,
    borderRadius: AccessRadius.md,
    paddingVertical: AccessSpacing.sm,
    borderWidth: 1,
    borderColor: AccessColors.border,
  },
  actionBtnPrimary: {
    backgroundColor: AccessColors.navy,
    borderColor: AccessColors.navy,
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionBtnPressed: { opacity: 0.7 },
  actionBtnLabel: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textSecondary,
    fontWeight: AccessFontWeight.semibold,
  },
  actionBtnLabelPrimary: {
    fontSize: AccessFontSize.sm,
    color: AccessColors.textOnDark,
    fontWeight: AccessFontWeight.semibold,
  },
  actionBtnDisabledText: { color: AccessColors.textTertiary },
  findSchemesBtn: {
    backgroundColor: AccessColors.tealDark,
    borderRadius: AccessRadius.sm,
    paddingVertical: AccessSpacing.md,
    paddingHorizontal: AccessSpacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  findSchemesBtnPressed: { opacity: 0.8 },
  findSchemesBtnText: {
    fontSize: AccessFontSize.sm,
    fontWeight: AccessFontWeight.semibold,
    color: '#FFFFFF',
  },

  // ── Quick Phrase Gestures ──────────────────────────────────────────────────
  phrasesSection: {
    gap: AccessSpacing.sm,
  },
  phrasesHeading: {
    fontSize: AccessFontSize.md,
    fontWeight: AccessFontWeight.semibold,
    color: AccessColors.navy,
  },
  phrasesSub: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textTertiary,
  },
  phrasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: AccessSpacing.sm,
  },
  phraseBtn: {
    alignItems: 'center',
    backgroundColor: AccessColors.cardDefault,
    borderRadius: AccessRadius.md,
    padding: AccessSpacing.sm,
    borderWidth: 1.5,
    borderColor: AccessColors.border,
    width: '30%',
    gap: 4,
  },
  phraseBtnSelected: {
    borderColor: AccessColors.teal,
    backgroundColor: AccessColors.tealFaint,
  },
  phraseBtnPressed: { opacity: 0.7 },
  phraseEmoji: { fontSize: 24 },
  phraseBtnLabel: {
    fontSize: AccessFontSize.xs,
    color: AccessColors.textSecondary,
    textAlign: 'center',
  },
  phraseBtnLabelSelected: {
    color: AccessColors.tealDark,
    fontFamily: AccessFontFamily.bold,
  },
}), [AccessColors, AccessSpacing, AccessFontSize, AccessFontFamily, AccessFontWeight, AccessRadius, AccessShadow]);
}
