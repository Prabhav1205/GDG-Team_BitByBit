from __future__ import annotations
from typing import Any, Dict, Optional, List


def check_basic_eligibility(scheme: Dict[str, Any], user_details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    user_details = user_details or {}
    matched, unverified = [], []
    status = "potential_match"
    income = user_details.get("annual_income")
    limit = scheme.get("income_limit")
    if income is not None and limit is not None:
        if income <= limit:
            matched.append(f"Reported income is within the listed limit of ₹{limit:,}.")
        else:
            status = "likely_ineligible"
            unverified.append(f"Reported income exceeds the listed limit of ₹{limit:,}.")
    elif limit is not None:
        unverified.append("Income must be verified against the listed limit.")
    age = user_details.get("age")
    age_range = scheme.get("age_requirements") or {}
    if age is not None and (age < age_range.get("min", 0) or age > age_range.get("max", 120)):
        status = "likely_ineligible"
        unverified.append("Reported age is outside the listed range.")
    elif age is not None:
        matched.append("Reported age is within the listed range.")
    else:
        unverified.append("Age and other scheme conditions require verification.")
    return {"status": status, "matched_criteria": matched, "unverified_criteria": unverified, "notice": "Verify on the official source before applying."}
