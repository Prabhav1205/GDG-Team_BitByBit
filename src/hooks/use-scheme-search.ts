import { useCallback, useState } from 'react';
import { getApiBaseUrl } from '@/constants/api-config';
import localSchemesData from '@/constants/schemes-data.json';

export type SchemeMatch = {
  id: string;
  name: string;
  category: string;
  description: string;
  benefits: string;
  documents_required: string[];
  source_url: string;
  relevance: number;
  potential_match_reason: string;
  eligibility_result?: { status: string; notice: string };
};

export type UserDetails = {
  age?: number;
  student?: boolean;
  annual_income?: number;
};

// Fallback search over local scheme dataset if API is unreachable
function searchLocalSchemes(query: string, userDetails?: UserDetails): SchemeMatch[] {
  const q = (query || '').toLowerCase().trim();
  const tokens = q.split(/\s+/).filter(t => t.length >= 2);

  return (localSchemesData as any[]).map((scheme) => {
    const searchable = `${scheme.title} ${scheme.category} ${scheme.benefitSummary} ${scheme.provider}`.toLowerCase();
    const tokenMatches = tokens.filter(t => searchable.includes(t)).length;
    const relevance = tokens.length === 0 ? 1.0 : tokenMatches > 0 ? Math.min(1.0, 0.4 + (tokenMatches / tokens.length) * 0.6) : 0.35;

    return {
      id: scheme.id,
      name: scheme.title,
      category: scheme.category,
      description: scheme.benefitSummary || scheme.title,
      benefits: scheme.benefitType || 'Government welfare support and financial assistance.',
      documents_required: scheme.requiredDocuments || ['Identity Proof', 'Income Proof'],
      source_url: scheme.officialLink || 'https://www.myscheme.gov.in',
      relevance: Math.round(relevance * 100) / 100,
      potential_match_reason: 'Matches your query; verify full criteria on official portal.',
      eligibility_result: {
        status: 'potential_match',
        notice: 'Advisory criteria check. Official portal remains authoritative.',
      },
    };
  }).sort((a, b) => b.relevance - a.relevance).slice(0, 5);
}

export function useSchemeSearch() {
  const [results, setResults] = useState<SchemeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string, userDetails?: UserDetails) => {
    setLoading(true);
    setError(null);
    try {
      const baseUrl = getApiBaseUrl();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const response = await fetch(`${baseUrl}/api/schemes/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, user_details: userDetails, top_k: 5 }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const matches = data.matches ?? [];
        if (matches.length > 0) {
          setResults(matches);
          return matches;
        }
      }
      
      // If API returned empty or non-200, use local fallback
      const localMatches = searchLocalSchemes(query, userDetails);
      setResults(localMatches);
      return localMatches;
    } catch {
      // Offline fallback: return curated local schemes
      const fallbackMatches = searchLocalSchemes(query, userDetails);
      setResults(fallbackMatches);
      return fallbackMatches;
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}

