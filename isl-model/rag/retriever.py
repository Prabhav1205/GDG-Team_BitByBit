from __future__ import annotations
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from rag.eligibility import check_basic_eligibility

ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = ROOT / "data" / "schemes.json"


class SchemeRetriever:
    def __init__(self, data_path: Path = DATA_PATH):
        with open(data_path, encoding="utf-8") as source:
            self.schemes = json.load(source)

    def search_schemes(self, query: str, top_k: int = 5, threshold: float = 0.01, user_details: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query_str = (query or "").strip().lower()
        if not query_str:
            # Return all top schemes if query is empty
            return [{
                **{key: s.get(key) for key in ("id", "name", "category", "description", "eligibility", "benefits", "documents_required", "source_url")},
                "relevance": 1.0,
                "potential_match_reason": "Featured national welfare scheme.",
                "eligibility_result": check_basic_eligibility(s, user_details),
            } for s in self.schemes[:max(1, min(top_k, 10))]]

        tokens = set(re.findall(r"[a-z0-9]{2,}", query_str))
        matches = []
        for scheme in self.schemes:
            searchable = f"{scheme.get('name', '')} {scheme.get('category', '')} {scheme.get('description', '')} {scheme.get('benefits', '')} {scheme.get('searchable_text', '')}".lower()
            scheme_words = set(re.findall(r"[a-z0-9]{2,}", searchable))
            
            # Direct token overlap
            common = tokens & scheme_words
            
            # Substring matching
            substring_matches = sum(1 for t in tokens if t in searchable)
            
            score = (len(common) * 2 + substring_matches) / max(1, len(tokens) * 3)
            
            if score >= threshold or any(t in searchable for t in tokens):
                final_rel = max(round(min(score, 1.0), 3), 0.35)
                item = {key: scheme.get(key) for key in ("id", "name", "category", "description", "eligibility", "benefits", "documents_required", "source_url")}
                item["relevance"] = final_rel
                item["potential_match_reason"] = "Matches your request; check the official criteria."
                item["eligibility_result"] = check_basic_eligibility(scheme, user_details)
                matches.append(item)
                
        # If no strict matches found, return default top schemes with lower relevance
        if not matches:
            for s in self.schemes:
                item = {key: s.get(key) for key in ("id", "name", "category", "description", "eligibility", "benefits", "documents_required", "source_url")}
                item["relevance"] = 0.40
                item["potential_match_reason"] = "Explore related national welfare programs."
                item["eligibility_result"] = check_basic_eligibility(s, user_details)
                matches.append(item)

        return sorted(matches, key=lambda item: item["relevance"], reverse=True)[:max(1, min(top_k, 10))]
