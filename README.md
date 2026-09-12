# 🌐 AbleLink — Universal Institutional Accessibility Kiosk

> **Empowering every citizen to access public services independently through Indian Sign Language (ISL), Voice AI, Assisted Touch, and Multilingual RAG-driven Government Scheme Matching.**

[![Expo](https://img.shields.io/badge/Expo-v57.0.0-blue.svg?logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.74+-61DAFB.svg?logo=react)](https://reactnative.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-1.16+-005CED.svg?logo=onnx)](https://onnxruntime.ai/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Hands_3D-FF6F00.svg?logo=google)](https://mediapipe.dev/)
[![WCAG](https://img.shields.io/badge/Accessibility-WCAG_2.1_AA-success.svg)](https://www.w3.org/WAI/WCAG21/quickref/)

---

## 📌 Table of Contents

1. [Overview & Problem Statement](#-overview--problem-statement)
2. [Key Modalities & Features](#-key-modalities--features)
   - [1. Indian Sign Language (ISL) Recognition](#1-indian-sign-language-isl-recognition)
   - [2. Multilingual Voice Assistant](#2-multilingual-voice-assistant)
   - [3. Text & Quick Assist](#3-text--quick-assist)
   - [4. Assisted Touch & Motor Controls](#4-assisted-touch--motor-controls)
   - [5. Government Scheme Matching & Eligibility Calculator (RAG)](#5-government-scheme-matching--eligibility-calculator-rag)
   - [6. Real-Time Staff Assistance Pipeline](#6-real-time-staff-assistance-pipeline)
3. [System Architecture](#-system-architecture)
4. [Repository Structure](#-repository-structure)
5. [Prerequisites & Getting Started](#-prerequisites--getting-started)
   - [Kiosk Mobile / Web App (Expo)](#1-kiosk-app-expo)
   - [ISL Model & RAG Backend (FastAPI)](#2-isl--rag-backend-fastapi)
   - [Staff Assistance Dashboard (React + Vite)](#3-staff-dashboard-react--vite)
6. [Environment Configuration](#-environment-configuration)
7. [Verification & Test Suite](#-verification--test-suite)
8. [Privacy, Accessibility & Offline Resilience](#-privacy-accessibility--offline-resilience)
9. [Team BitByBit](#-team-bitbybit)

---

## 📖 Overview & Problem Statement

Public service centers (government counters, hospitals, municipal offices, banks, and universities) are often inaccessible to millions of citizens with disabilities or language barriers. Traditional kiosks rely heavily on standard touchscreens, dense text forms, and single-language interfaces.

**AbleLink** is an institutional accessibility kiosk platform engineered to bridge this divide. It provides four synchronized, multimodal interaction paths that enable visitors to interact using **Indian Sign Language gestures**, **voice conversations in regional languages**, **assistive motor scanning**, or **accessible text**.

---

## ✨ Key Modalities & Features

### 1. Indian Sign Language (ISL) Recognition
* **Real-time 3D Landmark Tracking**: Captures 21 3D hand joints per frame using MediaPipe Hands at 30+ FPS.
* **Dual Inference Pipeline**:
  * **Primary ONNX / RandomForest Backend**: Invariant translation and scale normalization with margin-based rejection gating and temporal smoothing.
  * **Offline Rule-Based Classifier**: Fallback finger-extension heuristics operating instantly if the backend is offline.
* **Instant Text-to-Speech (TTS)**: Translates recognized signs (e.g. `HELP`, `APPOINTMENT`, `FORM`, `ID`, `MONEY`, `WHERE`) into natural synthesized speech in English, Hindi, or Marathi.
* **Gesture-to-Scheme Deep Query**: Maps recognized sign intents directly into relevant welfare benefit queries.

### 2. Multilingual Voice Assistant
* **Conversational AI**: Full trilingual voice assistance supporting **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.
* **Live Audio Visualizer**: Real-time waveform feedback with distinct listening, transcribing, and speaking FSM states.
* **Groq Llama 3 / Whisper Integration**: Ultra-low latency query understanding and institutional responses.

### 3. Text & Quick Assist
* **Institutional Quick Tiles**: Instant access to frequently needed services (Application status, counter directions, token numbers, fee counters).
* **Smart Suggestion Engine**: Context-aware phrase suggestions updated as the user types.
* **TTS Broadcast**: Speaks typed or selected sentences aloud to counter staff with visual feedback.

### 4. Assisted Touch & Motor Controls
* **Dwell Click Mode**: Automatically triggers button activations when a user hovers over an interactive element for a configurable duration (0.5s – 4.0s) with animated radial progress rings.
* **Switch Access Scanner**: Automated linear/grid scanning across screen elements with customizable step intervals (1.0s – 5.0s), allowing single-switch or keyboard spacebar selection.
* **Motor-Optimized Target Sizing**: Conforms to WCAG AAA touch targets (minimum 48x48dp up to 72x72dp) with high-contrast outlines and clear focus rings.

### 5. Government Scheme Matching & Eligibility Calculator (RAG)
* **30+ Institutional Schemes**: Curated catalog across Education, Healthcare, Disability, Housing, Financial Inclusion, and Women/Child Welfare.
* **Hybrid Semantic Retrieval**:
  * **FAISS Vector Index**: Dense vector cosine similarity via `all-MiniLM-L6-v2` embeddings.
  * **Token-Overlap Fallback**: Lexical keyword matching if vector index is regenerating.
* **Candidate Profile Calculator**: Evaluates age, annual income, caste/category, disability percentage, and student status to provide real-time eligibility scores and actionable application requirements.
* **Audio Scheme Walkthrough**: Synthesizes structured scheme details with highlighted sentence playback.

### 6. Real-Time Staff Assistance Pipeline
* **Instant Kiosk Dispatch**: Citizens can summon human assistance with one tap or sign gesture from any screen.
* **Dual Channel Sync**:
  * **Supabase Realtime**: Broadcasts assistance alerts across local and wide-area networks.
  * **BroadcastChannel API**: Instant sub-millisecond tab-to-tab synchronization for local kiosk-to-desk setups.
* **Staff Dashboard Web App**: Real-time triage view with audible chimes, priority badges, kiosk location IDs, citizen profile context, and resolution logs.

---

## 🏗️ System Architecture

```
                                 ┌──────────────────────────────────────────────┐
                                 │              CITIZEN KIOSK                   │
                                 │   (Expo / React Native Universal App)        │
                                 └──────┬──────────────┬──────────────┬─────────┘
                                        │              │              │
                   ┌────────────────────┘              │              └───────────────────┐
                   ▼                                   ▼                                  ▼
      ┌──────────────────────────┐       ┌──────────────────────────┐       ┌──────────────────────────┐
      │   MediaPipe Vision Pipe  │       │  Audio / Speech Engine   │       │ Motor Assistance Engine  │
      │  21 3D Hand Landmarks    │       │  STT + Groq LLM + TTS    │       │ Dwell Click + Switch Scan│
      └────────────┬─────────────┘       └─────────────┬────────────┘       └─────────────┬────────────┘
                   │                                   │                                  │
                   ▼                                   ▼                                  │
      ┌──────────────────────────┐       ┌──────────────────────────┐                     │
      │ FastAPI Inference Server │       │ RAG Scheme Matcher       │                     │
      │  • ONNX Runtime Model    │       │  • FAISS Vector Store    │                     │
      │  • Rejection Gating      │       │  • Sentence-Transformers │                     │
      │  • Temporal Smoother     │       │  • Eligibility Engine    │                     │
      └──────────────────────────┘       └──────────────────────────┘                     │
                                                       │                                  │
                                                       ▼                                  │
                                 ┌──────────────────────────────────────────────┐         │
                                 │  Supabase Realtime + Broadcast Channel Bus   │◄────────┘
                                 └─────────────────────┬────────────────────────┘
                                                       │
                                                       ▼
                                 ┌──────────────────────────────────────────────┐
                                 │          STAFF ASSISTANCE DASHBOARD          │
                                 │         (Vite + React + TypeScript)          │
                                 └──────────────────────────────────────────────┘
```

---

## 📂 Repository Structure

```
GDG-Team_BitByBit/
├── app.json                     # Expo configuration (App name: AbleLink, permissions, plugins)
├── package.json                 # Core dependencies and scripts
├── tsconfig.json                # TypeScript configuration
├── .env.example                 # Template environment variables
│
├── src/                         # Kiosk Application Source
│   ├── app/                     # Expo Router file-based screens
│   │   ├── _layout.tsx          # Root navigation, safe-area wrapper & providers
│   │   ├── index.tsx            # Main Kiosk landing & mode selector hub
│   │   ├── sign.tsx             # Indian Sign Language recognition module
│   │   ├── voice.tsx            # Multilingual voice conversation assistant
│   │   ├── text.tsx             # Accessible text & quick communication
│   │   ├── assisted-touch.tsx   # Motor disability controls (Dwell/Switch)
│   │   ├── eligibility.tsx      # RAG government scheme hub & eligibility calculator
│   │   └── settings.tsx         # High-contrast, text scaling, speech & haptic settings
│   │
│   ├── components/access/       # Institutional design system components
│   │   ├── AccessHeader.tsx     # Persistent header with status, time, language & staff trigger
│   │   ├── AssistanceBar.tsx    # Bottom assistance trigger and navigation
│   │   ├── AudioNavControl.tsx  # Screen reader audio narration controller
│   │   ├── ConnectivityStatus.tsx# Live API, staff backend, and offline status indicator
│   │   ├── DwellClickOverlay.tsx# Dwell timer tracking and visual target feedback
│   │   ├── LanguageSelectorModal.tsx # Accessible modal for en / hi / mr language selection
│   │   ├── ModeCard.tsx         # Tactile animated kiosk mode tiles with haptic feedback
│   │   ├── SchemeResultsPanel.tsx # RAG search results and audio readout viewer
│   │   └── SwitchScanOverlay.tsx# Visual scanning cursor for single-switch accessibility
│   │
│   ├── constants/               # Design tokens, internationalization & configs
│   │   ├── access-theme.ts      # WCAG AA/AAA colors, typography scales, spacing & shadows
│   │   ├── api-config.ts        # Dynamic endpoint resolver (localhost/tunnel/LAN)
│   │   ├── i18n.ts              # Trilingual string dictionary (English, Hindi, Marathi)
│   │   ├── gesture-query-map.ts # Mapping ISL gestures to scheme search queries
│   │   └── sample-gestures.json # Fallback landmark vectors for test/simulation
│   │
│   ├── context/                 # Application state providers
│   │   ├── AccessThemeContext.tsx # High-contrast mode & font scale provider
│   │   └── SessionContext.tsx   # Global session state & staff broadcast dispatcher
│   │
│   └── services/                # Device & network services
│       ├── speech-engine.ts     # Cross-platform TTS (Expo Speech / Web Speech API)
│       └── supabase.ts          # Supabase client initialization & channel management
│
├── isl-model/                   # Indian Sign Language & RAG Backend
│   ├── api/
│   │   └── main.py              # FastAPI server (/predict, /health, /api/schemes/search)
│   ├── config/
│   │   └── gestures.json        # Gesture vocabulary definitions and metadata
│   ├── data/
│   │   └── schemes.json         # 30 verified Indian welfare schemes dataset
│   ├── models/
│   │   ├── isl_model.onnx       # Production ONNX gesture classifier
│   │   └── isl_model.pkl        # Scikit-learn model artifact
│   ├── rag/
│   │   ├── retriever.py         # FAISS vector retriever + keyword fallback
│   │   └── eligibility.py       # Rule-based scheme eligibility engine
│   ├── scripts/
│   │   ├── build_scheme_index.py# Generates FAISS vector embeddings index
│   │   ├── collect_dataset.py   # Webcam landmark data collection utility
│   │   └── augment_and_retrain.py# Landmark augmentation and model retraining
│   ├── src/
│   │   ├── feature_extractor.py # Geometric translation & scale invariant normalizer
│   │   ├── onnx_predictor.py    # ONNX Runtime inference engine with margin gating
│   │   ├── predictor.py         # Scikit-learn predictor fallback
│   │   └── temporal_smoother.py # Sliding-window gesture stabilizer
│   └── tests/
│       └── test_rejection_gating.py # Tests for noise rejection and threshold gating
│
└── staff-dashboard/             # Staff Assistance Portal
    ├── src/
    │   ├── App.tsx              # Live queue, audio notifications & triage dashboard
    │   ├── lib/supabase.ts      # Realtime subscription client
    │   └── main.tsx             # Dashboard entrypoint
    ├── index.html               # Staff web application shell
    └── vite.config.ts           # Vite development and build configuration
```

---

## 🚀 Prerequisites & Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **Python**: 3.9 – 3.11
* **npm** or **yarn**
* Camera & Microphone access

---

### 1. Kiosk App (Expo)

```bash
# Navigate to workspace root
cd GDG-Team_BitByBit

# Install dependencies
npm install

# Start Expo development server (Tunnel mode recommended for phone testing)
npx expo start --tunnel
```
* Press `w` to run in Web browser.
* Scan the QR code using **Expo Go** on iOS or Android.

---

### 2. ISL & RAG Backend (FastAPI)

```bash
cd isl-model

# Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Build FAISS semantic vector index
python scripts/build_scheme_index.py

# Start FastAPI server on port 8000
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```
* API Health Check: `http://localhost:8000/health`
* Interactive Swagger Docs: `http://localhost:8000/docs`

---

### 3. Staff Dashboard (React + Vite)

```bash
cd staff-dashboard

# Install dependencies
npm install

# Start development server on port 5173
npm run dev
```
* Open `http://localhost:5173` in your browser.

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory (based on `.env.example`):

```env
# Kiosk Backend URL (Points to FastAPI service)
EXPO_PUBLIC_API_URL=http://localhost:8000

# Groq Cloud API Key (For Voice conversation LLM)
EXPO_PUBLIC_GROQ_API_KEY=your_groq_api_key_here

# Supabase Realtime Assistance Alerts
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## 🧪 Verification & Test Suite

### TypeScript Typecheck (Zero Errors)
```bash
npx tsc --noEmit
```

### Staff Dashboard Production Build
```bash
cd staff-dashboard && npm run build
```

### ISL Model & Gating Test Suite
```bash
cd isl-model
source venv/bin/activate
PYTHONPATH=. python test_predictor.py
PYTHONPATH=. python tests/test_rejection_gating.py
```

---

## 🛡️ Privacy, Accessibility & Offline Resilience

* **Zero Frame Retention**: Video frames are processed entirely in memory by MediaPipe. No biometric images or video streams are stored or transmitted.
* **Offline-First Resilience**:
  * If the FastAPI model server is unavailable, the kiosk automatically switches to local landmark heuristics and keyword-based scheme search.
  * Audio navigation and TTS work natively on-device via the platform's speech synthesis engine.
* **Accessibility Adherence**:
  * **WCAG 2.1 AA+** compliant color contrast ratios across light and dark modes.
  * Full screen-reader semantic trees and live region announcements for state changes.
  * Switch access scanning and customizable dwell click to ensure independence for users with severe motor impairments.

---

## 👥 Team BitByBit

Developed with ❤️ for the Google Developer Groups (GDG) Accessibility Hackathon.

* **Siya Kolwalkar**
* **Prabhav Sharma**
* **Harsh Sharma**
* **Mayur**

---

*AbleLink — Accessibility is not a feature; it is a fundamental right.*
