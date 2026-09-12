"""Create the local FAISS semantic index from schemes.json.

Run once while online before deployment:
    python scripts/build_scheme_index.py

After this script completes:
- data/scheme_index.faiss   — FAISS IndexFlatIP (cosine similarity)
- data/scheme_metadata.json — model name, count, and full scheme list summary

All subsequent scheme queries run fully offline via the FAISS index.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

DATA_PATH = ROOT / "data" / "schemes.json"
INDEX_PATH = ROOT / "data" / "scheme_index.faiss"
METADATA_PATH = ROOT / "data" / "scheme_metadata.json"

MODEL_NAME = "all-MiniLM-L6-v2"


def build_searchable_text(scheme: dict) -> str:
    """Combine all scheme fields into a rich embedding-ready text."""
    parts = [
        scheme.get("name", ""),
        scheme.get("category", ""),
        scheme.get("description", ""),
        " ".join(scheme.get("eligibility", [])),
        scheme.get("benefits", ""),
        " ".join(scheme.get("documents_required", [])),
        scheme.get("searchable_text", ""),
    ]
    return " ".join(filter(None, parts))


def main() -> None:
    print(f"[Build] Loading schemes from {DATA_PATH}...")
    if not DATA_PATH.exists():
        print(f"[ERROR] schemes.json not found at {DATA_PATH}")
        sys.exit(1)

    schemes = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    print(f"[Build] Loaded {len(schemes)} schemes.")

    texts = []
    for scheme in schemes:
        text = scheme.get("searchable_text") or build_searchable_text(scheme)
        texts.append(text)

    print(f"[Build] Loading sentence-transformer model: {MODEL_NAME} ...")
    from sentence_transformers import SentenceTransformer  # type: ignore
    import faiss  # type: ignore
    import numpy as np  # type: ignore

    model = SentenceTransformer(MODEL_NAME)
    print("[Build] Encoding scheme texts (this may take a minute on first run)...")
    vectors = model.encode(texts, normalize_embeddings=True, show_progress_bar=True).astype("float32")

    dim = vectors.shape[1]
    print(f"[Build] Building FAISS IndexFlatIP (dim={dim}, n={len(schemes)})...")
    index = faiss.IndexFlatIP(dim)
    index.add(vectors)

    faiss.write_index(index, str(INDEX_PATH))
    print(f"[Build] FAISS index saved to {INDEX_PATH}")

    metadata = {
        "model": MODEL_NAME,
        "count": len(schemes),
        "dim": dim,
        "index_type": "IndexFlatIP",
        "schemes_summary": [
            {"id": s.get("id"), "name": s.get("name"), "category": s.get("category")}
            for s in schemes
        ],
    }
    METADATA_PATH.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"[Build] Metadata saved to {METADATA_PATH}")

    # Quick sanity check
    print("[Build] Running sanity check...")
    test_query = "financial help for education scholarship"
    vec = model.encode([test_query], normalize_embeddings=True).astype("float32")
    scores, indices = index.search(vec, 3)
    print(f"[Build] Query: '{test_query}'")
    for score, idx in zip(scores[0], indices[0]):
        print(f"         -> [{score:.3f}] {schemes[idx]['name']}")

    print(f"\n[Build] ✓ FAISS index built for {len(schemes)} schemes. Ready for offline use.")


if __name__ == "__main__":
    main()
