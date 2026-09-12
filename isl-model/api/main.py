"""FastAPI Inference Service for ISL Recognition.

Designed to integrate seamlessly with the React kiosk frontend at the `/sign` route.
Provides health monitoring, model introspection, and high-performance landmark inference.
"""

from contextlib import asynccontextmanager
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, field_validator

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("isl-api")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
MODEL_PATH = PROJECT_ROOT / "models" / "isl_model.pkl"
ONNX_MODEL_PATH = PROJECT_ROOT / "models" / "isl_model.onnx"
CONFIG_PATH = PROJECT_ROOT / "config" / "gestures.json"
METADATA_PATH = PROJECT_ROOT / "models" / "model_metadata.json"

# Import domain modules
from src.hand_tracker import MEDIAPIPE_AVAILABLE
from src.predictor import GesturePredictor, ModelNotLoadedError

# Singleton predictor instance — either ONNX or sklearn depending on availability
predictor: Optional[Any] = None
_inference_backend: str = "sklearn"
_onnx_model_loaded: bool = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager to load model and resources on startup."""
    global predictor, _inference_backend, _onnx_model_loaded

    logger.info("Initializing ISL Predictor service...")

    # Attempt ONNX predictor first (preferred for edge deployment)
    if ONNX_MODEL_PATH.exists():
        try:
            import sys as _sys
            _sys.path.insert(0, str(PROJECT_ROOT))
            from src.onnx_predictor import OnnxGesturePredictor

            onnx_pred = OnnxGesturePredictor(
                onnx_path=ONNX_MODEL_PATH,
                gestures_config_path=CONFIG_PATH,
                metadata_path=METADATA_PATH,
            )
            if onnx_pred.is_loaded:
                predictor = onnx_pred
                _inference_backend = "onnx"
                _onnx_model_loaded = True
                logger.info("ONNX gesture model loaded — edge inference active.")
            else:
                logger.warning("ONNX predictor init failed; falling back to sklearn.")
        except Exception as e:
            logger.warning("Failed to init ONNX predictor: %s — falling back to sklearn.", e)

    # Fall back to sklearn GesturePredictor
    if predictor is None:
        try:
            sklearn_pred = GesturePredictor(
                model_path=MODEL_PATH,
                gestures_config_path=CONFIG_PATH,
                metadata_path=METADATA_PATH,
            )
            predictor = sklearn_pred
            _inference_backend = "sklearn"
            _onnx_model_loaded = False
            if sklearn_pred.is_loaded:
                logger.info("sklearn gesture model successfully loaded into memory.")
            else:
                logger.warning(
                    "sklearn Predictor initialized but model file is missing. "
                    "Inference will be disabled until trained."
                )
        except Exception as e:
            logger.error("Failed to initialize sklearn predictor: %s", e)
            predictor = None

    yield
    logger.info("Shutting down ISL Predictor service.")


app = FastAPI(
    title="ISL Institutional Accessibility Kiosk API",
    description="Inference and configuration service for Indian Sign Language recognition module.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS for React frontend (localhost:3000, 5173, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permits institutional local kiosks and dev environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve MediaPipe static helpers (camera_utils.js, hands.js) for the WebView
STATIC_DIR = PROJECT_ROOT / "static"
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

# Lazy-load the scheme retriever (no heavy deps on startup)
try:
    import sys as _sys
    _sys.path.insert(0, str(PROJECT_ROOT))
    from rag.retriever import SchemeRetriever
    _scheme_retriever = SchemeRetriever()
    logger.info("SchemeRetriever loaded successfully.")
except Exception as _rag_err:
    _scheme_retriever = None
    logger.warning(f"SchemeRetriever unavailable: {_rag_err}")


# ---------------------------------------------------------
# Request / Response Schemas
# ---------------------------------------------------------

class LandmarkPoint(BaseModel):
    x: float = Field(..., description="Normalized X coordinate [0.0 - 1.0]")
    y: float = Field(..., description="Normalized Y coordinate [0.0 - 1.0]")
    z: float = Field(..., description="Normalized Z coordinate/depth")


class PredictRequest(BaseModel):
    landmarks: Optional[List[LandmarkPoint]] = Field(
        None,
        description="List of 21 hand landmarks provided by browser MediaPipe hands",
    )
    features: Optional[List[float]] = Field(
        None,
        description="Direct flat 63-element feature array (optional alternative)",
    )
    confidence_threshold: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Optional custom confidence override for this prediction",
    )

    @field_validator("landmarks")
    @classmethod
    def validate_landmarks_count(cls, v):
        if v is not None and len(v) != 21:
            raise ValueError(f"Expected exactly 21 landmarks, received {len(v)}")
        return v

    @field_validator("features")
    @classmethod
    def validate_features_count(cls, v):
        if v is not None and len(v) != 63:
            raise ValueError(f"Expected exactly 63 feature values, received {len(v)}")
        return v

    from pydantic import model_validator

    @model_validator(mode="after")
    def validate_input_present(self):
        if self.landmarks is None and self.features is None:
            raise ValueError("Payload must contain either 'landmarks' (21 points) or 'features' (63 floats).")
        return self


class PredictResponse(BaseModel):
    gesture: str
    confidence: float
    accepted: bool
    phrase: str
    raw_probabilities: Optional[Dict[str, float]] = None


class HealthResponse(BaseModel):
    status: str
    mediapipe_available: bool
    model_loaded: bool
    model_version: str
    inference_backend: str
    onnx_model_loaded: bool


class ModelInfoResponse(BaseModel):
    model_loaded: bool
    model_version: str
    supported_gestures: List[str]
    phrase_mappings: Dict[str, str]
    metadata: Dict[str, Any]


# ---------------------------------------------------------
# Custom Exception Handlers
# ---------------------------------------------------------

@app.exception_handler(ModelNotLoadedError)
async def handle_model_not_loaded(request: Request, exc: ModelNotLoadedError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "MODEL_NOT_READY",
            "message": str(exc),
            "remedy": "Run `python scripts/train.py` to train and export the model.",
        },
    )


# ---------------------------------------------------------
# Endpoints
# ---------------------------------------------------------

@app.get("/health", response_model=HealthResponse, tags=["Monitoring"])
async def get_health():
    """Health check endpoint for React frontend to test service availability."""
    is_loaded = predictor.is_loaded if predictor else False
    version = predictor.metadata.get("model_version", "1.0.0") if predictor else "1.0.0"

    return HealthResponse(
        status="ok",
        mediapipe_available=MEDIAPIPE_AVAILABLE,
        model_loaded=is_loaded,
        model_version=version,
        inference_backend=_inference_backend,
        onnx_model_loaded=_onnx_model_loaded,
    )


@app.get("/model", response_model=ModelInfoResponse, tags=["Introspection"])
async def get_model_info():
    """Returns active model metadata, supported gesture vocabulary, and phrase dictionary."""
    if not predictor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Predictor engine is uninitialized",
        )

    return ModelInfoResponse(
        model_loaded=predictor.is_loaded,
        model_version=predictor.metadata.get("model_version", "1.0.0"),
        supported_gestures=predictor.get_supported_gestures(),
        phrase_mappings=predictor.phrase_map,
        metadata=predictor.metadata,
    )


@app.post("/predict", response_model=PredictResponse, tags=["Inference"])
async def predict_gesture(payload: PredictRequest):
    """Predicts gesture from 21 MediaPipe hand landmarks or 63-element feature vector.

    Used by the React frontend /sign route:
    Pass landmark coordinates captured in the browser.
    Returns the recognized gesture, confidence score, and confirmation phrase.
    """
    if not predictor:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Predictor engine is uninitialized",
        )

    if not predictor.is_loaded:
        raise ModelNotLoadedError(
            "Trained model is not loaded. Please train the model using python scripts/train.py"
        )

    # Validate input presence
    if payload.landmarks is None and payload.features is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Payload must contain either 'landmarks' (21 points) or 'features' (63 floats).",
        )

    # Apply temporary confidence threshold override if supplied
    original_threshold = predictor.confidence_threshold
    if payload.confidence_threshold is not None:
        predictor.confidence_threshold = payload.confidence_threshold

    try:
        if payload.landmarks is not None:
            raw_pts = [p.model_dump() for p in payload.landmarks]
            result = predictor.predict(raw_pts)
        else:
            result = predictor.predict(payload.features)

        return PredictResponse(**result)

    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid landmark data: {str(ve)}",
        )
    except Exception as e:
        logger.error(f"Inference execution error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while evaluating gesture inference.",
        )
    finally:
        predictor.confidence_threshold = original_threshold


# ---------------------------------------------------------
# Scheme / RAG Endpoints
# ---------------------------------------------------------

class SchemeSearchRequest(BaseModel):
    query: str = Field(..., description="Natural-language query from the user.")
    user_details: Optional[Dict[str, Any]] = Field(None, description="Optional user profile for eligibility hints.")
    top_k: int = Field(5, ge=1, le=10, description="Maximum number of matches to return.")


@app.post("/api/schemes/search", tags=["Schemes"])
async def search_schemes(payload: SchemeSearchRequest):
    """Offline semantic search over government schemes database.

    Called by the React frontend (text.tsx, sign.tsx, voice.tsx, assisted-touch.tsx)
    to surface relevant government benefit schemes based on spoken/typed user needs.
    Uses FAISS vector search when index is built, falls back to keyword matching.
    """
    if _scheme_retriever is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Scheme search service is not available. Ensure isl-model/data/schemes.json exists.",
        )
    try:
        matches = _scheme_retriever.search_schemes(
            query=payload.query,
            top_k=payload.top_k,
            user_details=payload.user_details,
        )
        return {
            "query": payload.query,
            "matches": matches,
            "count": len(matches),
            "timestamp": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        }
    except Exception as exc:
        logger.error(f"Scheme search error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Scheme search encountered an unexpected error.",
        )


@app.get("/api/schemes/categories", tags=["Schemes"])
async def get_scheme_categories():
    """Return all available scheme categories in the dataset.

    Used by the Assisted Touch frontend to populate category buttons.
    """
    if _scheme_retriever is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Scheme retriever is not available.",
        )
    try:
        categories = _scheme_retriever.get_categories()
        return {"categories": categories, "count": len(categories)}
    except Exception as exc:
        logger.error(f"Categories fetch error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve scheme categories.",
        )
