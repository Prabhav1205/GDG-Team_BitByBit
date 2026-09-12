# ISL-to-Text/Speech Recognition Module

> **Institutional Accessibility Kiosk System**  
> Designed for public service counters, hospitals, banks, universities, and government offices to enable intuitive, real-time communication for Indian Sign Language (ISL) users.

---

## 1. Project Overview & Scope

This repository provides the **ISL recognition and inference subsystem** for an institutional accessibility kiosk. The module is engineered to plug directly into the `/sign` route of the kiosk's React frontend.

A visitor communicating in Indian Sign Language stands before the kiosk camera, performs a supported gesture, and the system:
1. Detects hand landmarks in real-time.
2. Applies geometric translation and scale normalization.
3. Classifies the gesture via a Scikit-Learn `RandomForestClassifier`.
4. Filters spurious movements with temporal smoothing.
5. Maps the confirmed sign to a natural English phrase (e.g., `"HELP"` $\rightarrow$ `"I need help."`).
6. Delivers the text and status to the kiosk interface, which can optionally speak the phrase aloud using the browser's native Web Speech API.

> [!IMPORTANT]
> **Scope & Ethics Notice:**
> - This system is a **limited-vocabulary prototype** recognizing a targeted catalog of ~10 institutional gestures. It is **NOT** a full natural-language ISL translator, and should never be represented as understanding all of ISL.
> - Gestures must **never be fabricated or synthetically guessed**. Real training datasets must be recorded from verified ISL signers.

---

## 2. System Architecture

```
[Webcam / Video Feed]
         │
         ▼
[HandTracker (MediaPipe Hands)] ────────► 21 Normalized 3D Landmarks
         │
         ▼
[FeatureExtractor] ────────────────────► Wrist Translation + Scale Normalization ──► 63D Vector
         │
    ┌────┴───────────────────────────┐
    ▼                                ▼
[DataCollector]             [Predictor Engine]
    │                                │
    ▼                                ▼
[dataset/isl_landmarks.csv]   [RandomForest Model] (n_estimators=200)
    │                                │
    ▼                                ▼
[Preprocessing & Validation]   [Confidence Thresholding & UNKNOWN Fallback]
    │                                │
    ▼                                ▼
[Model Trainer]             [TemporalSmoother] (Sliding window majority vote)
    │                                │
    ▼                                ▼
[models/isl_model.pkl]       [Confirmed Gesture + Kiosk Phrase]
                                     │
                                     ▼
                            [FastAPI /predict Endpoint]
                                     │
                                     ▼
                      [React Frontend: /sign Route]
                                     │
                                     ▼
                   [Browser Native Speech Synthesis (TTS)]
```

---

## RAG Government Scheme Matching

The system includes an **offline-first Retrieval-Augmented Generation (RAG)** engine that maps any user query (spoken, typed, or gesture-derived) to relevant Indian government benefit schemes.

### Architecture

```
[User Input: Text / Voice / ISL Gesture]
       │
       ▼
[SchemeRetriever]
       │
       ├──► FAISS IndexFlatIP (cosine similarity, all-MiniLM-L6-v2 embeddings) [if built]
       │         └──► top-k semantic matches
       │
       └──► Keyword Overlap Fallback [if FAISS not yet built]
                 └──► token intersection scoring
       │
       ▼
[BasicEligibilityChecker]  ──► advisory status: potential_match / likely_ineligible
       │
       ▼
[FastAPI /api/schemes/search]  ──►  React SchemeResultsPanel
```

### Dataset

`data/schemes.json` contains **30 real Indian government schemes** across 9 categories:
- 🎓 Education & Scholarship (8 schemes — NSP, PMRF, YASASVI, etc.)
- 🏥 Healthcare (1 scheme — Ayushman Bharat PM-JAY)
- ♿ Disability Support (5 schemes — ADIP, NHFDC, UDID, DDRS, overseas scholarship)
- 💰 Financial Assistance (6 schemes — PMSBY, PMJJBY, APY, Jan Dhan, PDS, IGNDPS)
- 🏠 Housing (2 schemes — PMAY Gramin, PMAY Urban)
- 👩‍👧 Women & Child (3 schemes — Sukanya Samriddhi, BBBP, Ujjwala)
- 👴 Senior Citizens (2 schemes — IGNOAPS, PM Vaya Vandana)
- 🌾 Agriculture (1 scheme — PM Fasal Bima Yojana)
- 💼 Employment & Skills (2 schemes — PMKVY, Stand-Up India)

See `data/SOURCES.md` for official URLs and `data/DEMO_QUERIES.md` for rehearsed demo queries.

### Build FAISS Semantic Index (run once while online)

```bash
cd isl-model
python scripts/build_scheme_index.py
# Output: data/scheme_index.faiss + data/scheme_metadata.json
# Sanity check query printed at end
```

After building, all queries run **fully offline** at ~10ms per search.

---

## ONNX Edge Deployment

The ISL gesture classifier can be exported to ONNX format for faster, dependency-light inference using `onnxruntime` instead of `scikit-learn`.

### Export ONNX Model

```bash
cd isl-model
python scripts/export_onnx.py
# Output: models/isl_model.onnx
```

### How It Works

- At startup, `api/main.py` checks for `models/isl_model.onnx`
- If found: uses `OnnxGesturePredictor` (`src/onnx_predictor.py`) — **onnxruntime inference**
- If not found: falls back to `GesturePredictor` (`src/predictor.py`) — **scikit-learn inference**
- `/health` endpoint reports `inference_backend: "onnx" | "sklearn"` and `onnx_model_loaded: bool`

### Benefits

| | sklearn (pkl) | ONNX |
|---|---|---|
| Runtime dep | scikit-learn | onnxruntime |
| Cold start | ~500ms | ~120ms |
| Inference | ~8ms | ~1ms |
| Edge deploy | Heavy | Lightweight |

---

## Demo Quick-Start (Hackathon)

```bash
# Terminal 1: Start backend
cd isl-model
pip install -r requirements.txt
python scripts/build_scheme_index.py   # build FAISS index
python scripts/export_onnx.py          # export ONNX model (if trained)
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2: Start frontend
cd ..
npm run dev
```

Then open `http://localhost:8081` (or expo URL). Navigate to:
- **Text mode** → type "disability support" → scheme results appear
- **Sign mode** → select HELP gesture → tap "🔍 Find Government Schemes"
- **Assisted Touch** → tap 🏥 Healthcare category → scheme results appear
- **Voice mode** → speak or tap a preset → results auto-appear

---

### Feature Normalization Pipeline (63 Dimensions)
To ensure the model is invariant to camera distance and hand position:
1. **Wrist Origin (Translation Invariance):** Landmark 0 (wrist) is subtracted from all 21 points:
   $$\vec{p}'_i = \vec{p}_i - \vec{p}_0 \quad \forall i \in [0, 20]$$
2. **Scale Invariance:** All translated points are divided by the maximum Euclidean distance from the wrist to any landmark:
   $$s = \max_{i=1..20} \|\vec{p}'_i\|, \quad \vec{p}''_i = \frac{\vec{p}'_i}{s}$$
3. **Canonical Consistency:** The exact same function (`src/feature_extractor.py`) is used across dataset collection, model training, CLI prediction, and API serving.

---

## 3. Project Structure

```
isl-model/
├── README.md                 # System documentation & setup manual
├── requirements.txt          # Python dependencies
├── .gitignore                # Git exclusions
├── config/
│   └── gestures.json         # Configurable gesture dictionary & phrases
├── dataset/
│   └── .gitkeep              # CSV dataset directory (isl_landmarks.csv)
├── models/
│   └── .gitkeep              # Serialized models & metadata (.pkl & .json)
├── src/
│   ├── __init__.py
│   ├── hand_tracker.py       # Reusable MediaPipe wrapper & drawing
│   ├── feature_extractor.py  # 63D translation & scale normalization
│   ├── data_collector.py     # Sampling pace controller & CSV logger
│   ├── preprocess.py         # Dataset validator & summary generator
│   ├── train_model.py        # Stratified trainer, evaluator, & exporter
│   ├── predictor.py          # Probability gating & phrase lookup
│   └── smoothing.py          # Temporal sliding window majority filter
├── scripts/
│   ├── test_camera.py        # Camera & MediaPipe sanity test
│   ├── collect_dataset.py    # Teammate interactive dataset capture CLI
│   ├── train.py              # CLI training and evaluation runner
│   └── predict.py            # Real-time webcam inference HUD
├── api/
│   ├── __init__.py
│   └── main.py               # FastAPI service with CORS for React
└── tests/
    ├── __init__.py
    ├── test_config.py        # Config schema & phrase tests
    ├── test_feature_extractor.py # Normalization math & invariance tests
    ├── test_smoothing.py     # Temporal window & noise rejection tests
    ├── test_preprocess.py    # Dataset validation tests
    ├── test_api.py           # FastAPI endpoints test
    └── test_pipeline_synthetic.py # End-to-end synthetic software test
```

---

## 4. Installation (Windows)

Ensure **Python 3.10 or higher** is installed.

### Step 1: Open PowerShell / Command Prompt
```powershell
cd isl-model
```

### Step 2: Create Virtual Environment
```powershell
python -m venv venv
```

### Step 3: Activate Virtual Environment
```powershell
# In PowerShell:
.\venv\Scripts\Activate.ps1

# Or in classic Command Prompt:
.\venv\Scripts\activate.bat
```

### Step 4: Install Dependencies
```powershell
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 5. Teammate Step-by-Step Workflow

This workflow allows a teammate without ML background to collect verified signs, train the model, and launch the service.

### Step 1: Sanity Check Camera & Hand Tracking
```powershell
python scripts/test_camera.py
```
- A window opens with your mirrored webcam feed.
- Hold your hand in front of the lens; you will see green skeleton points on your hand and `Hand Detected (21 landmarks)`.
- Press `Q` to close.

---

### Step 2: Collect Verified ISL Gestures
```powershell
python scripts/collect_dataset.py
```
1. The tool prints an interactive menu of all 11 gestures configured in `config/gestures.json`:
   ```
   1  | HELP         | [0/150]    | I need help.
   2  | YES          | [0/150]    | Yes.
   3  | NO           | [0/150]    | No.
   4  | FORM         | [0/150]    | I need help with this form.
   ...
   11 | UNKNOWN      | [0/150]    | Gesture not recognized.
   ```
2. Enter the number corresponding to the gesture you wish to record.
3. Hold the verified ISL sign in view. The HUD will show:
   - Live sample progress (e.g. `RECORDING (87/150)`).
   - Press `SPACE` to pause/resume recording.
   - Slightly adjust distance and tilt to teach the model natural variations.
   - Press `Q` at any time to return to the menu. Progress is auto-saved to `dataset/isl_landmarks.csv`.
4. **Collect the UNKNOWN class**: Record casual movements, hands resting, transitions, and waving so the model learns not to force arbitrary hand poses into vocabulary signs.

---

### Step 3: Train & Evaluate the Classifier
```powershell
python scripts/train.py
```
The script will:
1. Run strict validation (checks for missing values, NaN coordinates, feature column count, and class balance).
2. Train a `RandomForestClassifier(n_estimators=200)` with stratified 80/20 train-test split.
3. Output the validation report:
   ```
   ============================================================
   CLASSIFICATION REPORT (Overall Accuracy: 98.25%)
   ============================================================
                  precision    recall  f1-score   support
            HELP       0.97      1.00      0.98        30
             YES       1.00      0.97      0.98        30
         UNKNOWN       0.98      0.98      0.98        30
   ...
   ```
4. Warn if any class has low precision or recall ($< 80\%$) and suggest collecting more samples.
5. Export artifacts:
   - Model: `models/isl_model.pkl`
   - Metadata: `models/model_metadata.json`

---

### Step 4: Test Real-Time Inference
```powershell
python scripts/predict.py
```
- Opens live webcam recognition with temporal smoothing.
- Displays detected sign, confidence percentage, confirmation state, and full kiosk phrase.
- Confirmed signs appear in dark green with `GESTURE CONFIRMED [Ready for Kiosk Action]`.
- Press `Q` to quit.

---

### Step 5: Start the FastAPI Kiosk Service
```powershell
uvicorn api.main:app --reload --port 8000
```
- Server launches at `http://localhost:8000`.
- Interactive Swagger API docs are accessible at `http://localhost:8000/docs`.

---

## 6. Gesture Configuration (`config/gestures.json`)

To add, edit, or adjust vocabulary phrases, modify `config/gestures.json`. No changes to Python code are needed:

```json
{
  "version": "1.0.0",
  "unknown_label": "UNKNOWN",
  "gestures": [
    {
      "id": "HELP",
      "phrase": "I need help.",
      "category": "assistance"
    },
    {
      "id": "FORM",
      "phrase": "I need help with this form.",
      "category": "service"
    }
  ]
}
```

---

## 7. React Integration Contract (`/sign` Route)

The kiosk React application communicates with this service via HTTP JSON payloads.

### Base URL

For local development, the frontend defaults to `http://localhost:8000`.
For a hosted Expo website, create a root `.env` file from `.env.example` and set
`EXPO_PUBLIC_ISL_API_URL` to the public **HTTPS** URL of the FastAPI service.
`localhost` in a browser always means the visitor's own computer, so it cannot
reach a server running only on the development machine. Rebuild/re-export the
Expo website after changing this variable.

### 1. Health Check: `GET /health`
Verify the service and model status prior to starting camera capture.
```json
// Response (200 OK)
{
  "status": "ok",
  "mediapipe_available": true,
  "model_loaded": true,
  "model_version": "1.0.0"
}
```

### 2. Model Introspection: `GET /model`
Fetch supported vocabulary and phrases dynamically.
```json
// Response (200 OK)
{
  "model_loaded": true,
  "model_version": "1.0.0",
  "supported_gestures": ["HELP", "YES", "NO", "FORM", "MONEY", "UNKNOWN"],
  "phrase_mappings": {
    "HELP": "I need help.",
    "YES": "Yes."
  },
  "metadata": { ... }
}
```

### 3. Predict Endpoint: `POST /predict`
The React client runs `@mediapipe/tasks-vision` or `@mediapipe/hands` in the browser and sends the 21 normalized landmarks:

**Request Body:**
```json
{
  "landmarks": [
    { "x": 0.521, "y": 0.612, "z": -0.012 },
    { "x": 0.505, "y": 0.580, "z": -0.024 },
    ... // exactly 21 landmark points
  ],
  "confidence_threshold": 0.75
}
```

**Response Body (200 OK):**
```json
{
  "gesture": "HELP",
  "confidence": 0.9412,
  "accepted": true,
  "phrase": "I need help.",
  "raw_probabilities": {
    "HELP": 0.9412,
    "YES": 0.0210,
    "UNKNOWN": 0.0378
  }
}
```

### React Interaction Flow & Confirmation Pattern
1. **Detection:** User performs sign; client polls or streams landmarks to `POST /predict`.
2. **Kiosk UI Feedback:**
   - Display recognized gesture: **HELP**
   - Confidence: **94%**
   - Phrase: **"I need help."**
3. **User Action:**
   - Two large touch buttons: `[ Confirm ]` and `[ Try Again ]`.
4. **Speech Output (Native Web Speech API):**
   When the user presses `[ Confirm ]`, trigger browser speech synthesis:
   ```javascript
   function speakPhrase(phrase) {
     if ('speechSynthesis' in window) {
       const utterance = new SpeechSynthesisUtterance(phrase);
       utterance.lang = 'en-IN'; // Indian English accent
       utterance.rate = 0.95;
       window.speechSynthesis.speak(utterance);
     }
   }
   ```

---

## 8. Privacy & Ethical Standards

1. **No Image Uploads or Storage:** Camera frames are strictly processed in memory (either within the browser or locally). No images or videos are ever saved to disk or transmitted across the network.
2. **Landmark Data Only:** Only anonymous geometric $(x, y, z)$ coordinates are stored, and only during explicit execution of `scripts/collect_dataset.py`.
3. **No Fabricated Data:** The ML pipeline strictly refuses to ship with fabricated "ISL data". All real production weights must be trained on genuine gestures recorded with the provided collector tool.

---

## 9. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| `MediaPipe is not installed` | Missing package in venv | Run `pip install -r requirements.txt` |
| `Could not open webcam` | Camera in use or missing permissions | Close other apps using camera (Zoom/Teams) and check Windows Privacy Settings |
| `Model file not found` | Training has not been executed | Run `python scripts/train.py` |
| `Dataset must contain at least 2 distinct classes` | Dataset has only 1 sign | Collect samples for at least 2 or more gestures using `scripts/collect_dataset.py` |
| `Class X has only N samples` | Insufficient training samples | Target at least 100-150 samples per class using the collector script |

---

## 10. Future Enhancements

1. **Two-Hand Landmark Support:** The `HandTracker` and `feature_extractor` can be expanded from 63 to 126 dimensions to support bimanual signs.
2. **Dynamic Trajectory / Motion Recognition:** For dynamic ISL signs involving hand paths (e.g., waving motions), integrate a lightweight LSTM or temporal 1D-CNN over landmark sequence windows.
3. **Multi-lingual Institutional Phrases:** Support regional Indian languages (Hindi, Tamil, Marathi, Telugu, Kannada, Bengali) in `gestures.json`.
