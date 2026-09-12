import { useCallback, useState } from 'react';
import { API_BASE_URL } from '@/constants/api-config';

export type SchemeMatch = { id: string; name: string; category: string; description: string; benefits: string; documents_required: string[]; source_url: string; relevance: number; potential_match_reason: string; eligibility_result?: { status: string; notice: string } };
export type UserDetails = { age?: number; student?: boolean; annual_income?: number };

export function useSchemeSearch() {
  const [results, setResults] = useState<SchemeMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const search = useCallback(async (query: string, userDetails?: UserDetails) => {
    setLoading(true); setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/schemes/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, user_details: userDetails, top_k: 5 }) });
      if (!response.ok) throw new Error('Scheme search service is unavailable.');
      const data = await response.json(); setResults(data.matches ?? []); return data.matches ?? [];
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to search schemes.'); return []; }
    finally { setLoading(false); }
  }, []);
  return { results, loading, error, search };
}
