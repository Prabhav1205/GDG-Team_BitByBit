"""Semantic scheme retriever with FAISS vector search.

Uses sentence-transformers/all-MiniLM-L6-v2 for embedding queries.
Falls back to keyword matching if the FAISS index has not been built yet
(run ``scripts/build_scheme_index.py`` while online to build it).
"""
from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from rag.eligibility import check_basic_eligibility

logger = logging.getLogger(__name__)

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "schemes.json"
INDEX_PATH = ROOT / "data" / "scheme_index.faiss"
METADATA_PATH = ROOT / "data" / "scheme_metadata.json"

_SENTENCE_MODEL: Any = None
_FAISS_INDEX: Any = None
_FAISS_SCHEMES: Optional[List[Dict[str, Any]]] = None


def _load_faiss_resources() -> bool:
    """Attempt to load the FAISS index and sentence-transformer model.
    Returns True if successful, False if index not built or deps unavailable.
    """
    global _SENTENCE_MODEL, _FAISS_INDEX, _FAISS_SCHEMES

    if _FAISS_INDEX is not None:
        return True

    if not INDEX_PATH.exists():
        logger.warning(
            "FAISS index not found at %s. "
            "Run `python scripts/build_scheme_index.py` to build it. "
            "Falling back to keyword search.",
            INDEX_PATH,
        )
        return False

    try:
        import faiss
        # pyrefly: ignore [missing-import]
        from sentence_transformers import SentenceTransformer

        logger.info("Loading sentence-transformer model for semantic search...")
        _SENTENCE_MODEL = SentenceTransformer("all-MiniLM-L6-v2")
        _FAISS_INDEX = faiss.read_index(str(INDEX_PATH))

        # Load the full schemes list for result hydration
        _FAISS_SCHEMES = json.loads(DATA_PATH.read_text(encoding="utf-8"))
        logger.info(
            "FAISS index loaded: %d vectors, %d schemes",
            _FAISS_INDEX.ntotal,
            len(_FAISS_SCHEMES),
        )
        return True
    except Exception as exc:
        logger.warning("Could not load FAISS resources (%s). Falling back to keyword search.", exc)
        _FAISS_INDEX = None
        _SENTENCE_MODEL = None
        _FAISS_SCHEMES = None
        return False


def _semantic_search(
    query: str,
    top_k: int,
    threshold: float,
    user_details: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Return top_k matches using cosine similarity on FAISS index."""
    import numpy as np

    assert _SENTENCE_MODEL is not None
    assert _FAISS_INDEX is not None
    assert _FAISS_SCHEMES is not None

    vec = _SENTENCE_MODEL.encode([query], normalize_embeddings=True).astype("float32")
    k = min(top_k * 3, _FAISS_INDEX.ntotal)  # Over-fetch to allow filtering
    scores, indices = _FAISS_INDEX.search(vec, k)

    results: List[Dict[str, Any]] = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or float(score) < threshold:
            continue
        scheme = _FAISS_SCHEMES[idx]
        item = {
            key: scheme.get(key)
            for key in (
                "id", "name", "category", "description",
                "eligibility", "benefits", "documents_required", "source_url",
            )
        }
        item["relevance"] = round(float(score), 3)
        item["potential_match_reason"] = (
            "Semantically matches your request; verify eligibility on the official source."
        )
        item["eligibility_result"] = check_basic_eligibility(scheme, user_details)
        results.append(item)
        if len(results) >= top_k:
            break

    return results


def _keyword_search(
    query: str,
    top_k: int,
    threshold: float,
    user_details: Optional[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Fallback keyword overlap search when FAISS index is unavailable."""
    schemes: List[Dict[str, Any]] = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    tokens = set(re.findall(r"[a-z]{3,}", query.lower()))
    matches: List[Dict[str, Any]] = []

    for scheme in schemes:
        searchable = scheme.get("searchable_text", "").lower()
        words = set(re.findall(r"[a-z]{3,}", searchable))
        relevance = len(tokens & words) / max(1, len(tokens))
        if relevance < threshold:
            continue
        item = {
            key: scheme.get(key)
            for key in (
                "id", "name", "category", "description",
                "eligibility", "benefits", "documents_required", "source_url",
            )
        }
        item["relevance"] = round(relevance, 3)
        item["potential_match_reason"] = (
            "Matches your request keywords; verify eligibility on the official source."
        )
        item["eligibility_result"] = check_basic_eligibility(scheme, user_details)
        matches.append(item)

    return sorted(matches, key=lambda x: x["relevance"], reverse=True)[:top_k]


class SchemeRetriever:
    """Offline-first scheme retriever.

    Attempts FAISS semantic search on construction.  If the index is not built
    yet, every call transparently falls back to keyword search until the index
    becomes available on the next process restart.
    """

    def __init__(self, data_path: Path = DATA_PATH) -> None:
        self._data_path = data_path
        self._semantic_available = _load_faiss_resources()
        if self._semantic_available:
            logger.info("SchemeRetriever: FAISS semantic search active.")
        else:
            logger.info("SchemeRetriever: keyword fallback active.")

    def search_schemes(
        self,
        query: str,
        top_k: int = 5,
        threshold: float = 0.30,
        user_details: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Return up to *top_k* matching schemes for *query*.

        Uses FAISS cosine similarity when index is available, otherwise falls
        back to keyword overlap (threshold adjusted accordingly).
        """
        top_k = max(1, min(top_k, 10))

        if self._semantic_available:
            try:
                return _semantic_search(query, top_k, threshold, user_details)
            except Exception as exc:
                logger.warning("FAISS search failed (%s); falling back to keyword search.", exc)

        # Keyword fallback uses a lower threshold since overlap ratios are small
        keyword_threshold = 0.05
        return _keyword_search(query, top_k, keyword_threshold, user_details)

    def get_categories(self) -> List[str]:
        """Return unique scheme categories from the dataset."""
        schemes: List[Dict[str, Any]] = json.loads(
            self._data_path.read_text(encoding="utf-8")
        )
        seen: set[str] = set()
        cats: List[str] = []
        for s in schemes:
            cat = s.get("category", "")
            if cat and cat not in seen:
                seen.add(cat)
                cats.append(cat)
        return cats
