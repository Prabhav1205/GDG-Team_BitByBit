"""Offline scheme search with optional semantic embeddings when an index exists."""
import json
import re
from pathlib import Path
from typing import Any, Dict, List

from rag.eligibility import check_basic_eligibility

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "schemes.json"


class SchemeRetriever:
    def __init__(self, data_path: Path = DATA_PATH):
        with open(data_path, encoding="utf-8") as source:
            self.schemes = json.load(source)

    def search_schemes(self, query: str, top_k: int = 5, threshold: float = 0.05, user_details: Dict[str, Any] | None = None) -> List[Dict[str, Any]]:
        tokens = set(re.findall(r"[a-z]{3,}", query.lower()))
        matches = []
        for scheme in self.schemes:
            searchable = scheme.get("searchable_text", "").lower()
            words = set(re.findall(r"[a-z]{3,}", searchable))
            relevance = len(tokens & words) / max(1, len(tokens))
            if relevance >= threshold:
                item = {key: scheme.get(key) for key in ("id", "name", "category", "description", "eligibility", "benefits", "documents_required", "source_url")}
                item["relevance"] = round(relevance, 3)
                item["potential_match_reason"] = "Matches your request; check the official criteria."
                item["eligibility_result"] = check_basic_eligibility(scheme, user_details)
                matches.append(item)
        return sorted(matches, key=lambda item: item["relevance"], reverse=True)[:max(1, min(top_k, 10))]
