"""Create the local FAISS semantic index. Run once while online before deployment."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def main() -> None:
    from sentence_transformers import SentenceTransformer
    import faiss
    data_path = ROOT / "data" / "schemes.json"
    schemes = json.loads(data_path.read_text(encoding="utf-8"))
    texts = [item.get("searchable_text") or " ".join(map(str, item.values())) for item in schemes]
    model = SentenceTransformer("all-MiniLM-L6-v2")
    vectors = model.encode(texts, normalize_embeddings=True).astype("float32")
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)
    faiss.write_index(index, str(ROOT / "data" / "scheme_index.faiss"))
    (ROOT / "data" / "scheme_metadata.json").write_text(json.dumps({"model": "all-MiniLM-L6-v2", "count": len(schemes)}, indent=2), encoding="utf-8")
    print(f"Built FAISS index for {len(schemes)} schemes")


if __name__ == "__main__":
    main()
