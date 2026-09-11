import { Scheme } from './supabase-schemes';

export interface CandidateProfile {
  age: number;
  disabilityType: 'visual' | 'hearing' | 'speech' | 'locomotor' | 'intellectual' | 'any';
  annualIncome: number;
  state: string;
}

export interface MatchedSchemeResult {
  scheme: Scheme;
  matchScore: number; // 0 to 100%
  isEligible: boolean;
  matchReasons: string[];
  unmetCriteria: string[];
}

export class EligibilityEngine {
  /**
   * Evaluate candidate profile against candidate schemes list
   */
  public static evaluate(
    candidate: CandidateProfile,
    schemes: Scheme[]
  ): MatchedSchemeResult[] {
    const results: MatchedSchemeResult[] = [];

    for (const scheme of schemes) {
      const matchReasons: string[] = [];
      const unmetCriteria: string[] = [];
      let scorePoints = 0;

      // 1. Age check
      if (candidate.age >= scheme.minAge && candidate.age <= scheme.maxAge) {
        matchReasons.push(`Age ${candidate.age} is within eligible range (${scheme.minAge}–${scheme.maxAge} yrs)`);
        scorePoints += 30;
      } else {
        unmetCriteria.push(`Age ${candidate.age} is outside eligible range (${scheme.minAge}–${scheme.maxAge} yrs)`);
      }

      // 2. Disability type check
      const disList = scheme.eligibleDisabilities.map((d) => d.toLowerCase());
      if (
        disList.includes('any') ||
        disList.includes(candidate.disabilityType.toLowerCase()) ||
        candidate.disabilityType === 'any'
      ) {
        matchReasons.push(`Eligible for ${candidate.disabilityType} disability type`);
        scorePoints += 35;
      } else {
        unmetCriteria.push(`Scheme specifies: ${scheme.eligibleDisabilities.join(', ')}`);
      }

      // 3. Income check
      if (candidate.annualIncome <= scheme.maxAnnualIncome) {
        matchReasons.push(`Annual income (₹${candidate.annualIncome.toLocaleString()}) is below maximum limit (₹${scheme.maxAnnualIncome.toLocaleString()})`);
        scorePoints += 25;
      } else {
        unmetCriteria.push(`Income exceeds max limit of ₹${scheme.maxAnnualIncome.toLocaleString()}`);
      }

      // 4. State / Location check
      const stateList = scheme.eligibleStates.map((s) => s.toLowerCase());
      if (
        stateList.includes('all') ||
        stateList.includes(candidate.state.toLowerCase())
      ) {
        matchReasons.push(`Available in ${candidate.state}`);
        scorePoints += 10;
      } else {
        unmetCriteria.push(`Scheme restricted to: ${scheme.eligibleStates.join(', ')}`);
      }

      const isEligible = unmetCriteria.length === 0;

      results.push({
        scheme,
        matchScore: Math.min(100, scorePoints),
        isEligible,
        matchReasons,
        unmetCriteria,
      });
    }

    // Sort: Fully eligible first, then by matchScore descending
    return results.sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.matchScore - a.matchScore;
    });
  }
}
