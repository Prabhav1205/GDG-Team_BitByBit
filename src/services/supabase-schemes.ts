import { createClient } from '@supabase/supabase-js';
import localSchemes from '@/constants/schemes-data.json';

export interface Scheme {
  id: string;
  title: string;
  category: string;
  provider: string;
  benefitType: string;
  benefitSummary: string;
  minAge: number;
  maxAge: number;
  eligibleDisabilities: string[];
  maxAnnualIncome: number;
  eligibleStates: string[];
  requiredDocuments: string[];
  applicationSteps: string[];
  officialLink?: string;
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Fetch schemes from Supabase database with automatic fallback to local dataset.
 */
export async function fetchSchemes(): Promise<Scheme[]> {
  if (!supabase) {
    console.log('[Supabase Service]: Using local schemes fallback (no Supabase env key).');
    return localSchemes as Scheme[];
  }

  try {
    const { data, error } = await supabase.from('schemes').select('*');

    if (error || !data || data.length === 0) {
      console.warn('[Supabase Service]: Query failed or empty, using fallback:', error);
      return localSchemes as Scheme[];
    }

    // Map DB snake_case columns to Scheme interface
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      provider: item.provider,
      benefitType: item.benefit_type || item.benefitType,
      benefitSummary: item.benefit_summary || item.benefitSummary,
      minAge: item.min_age ?? item.minAge ?? 0,
      maxAge: item.max_age ?? item.maxAge ?? 120,
      eligibleDisabilities: item.eligible_disabilities || item.eligibleDisabilities || ['any'],
      maxAnnualIncome: item.max_annual_income ?? item.maxAnnualIncome ?? 1000000,
      eligibleStates: item.eligible_states || item.eligibleStates || ['All'],
      requiredDocuments: item.required_documents || item.requiredDocuments || [],
      applicationSteps: item.application_steps || item.applicationSteps || [],
      officialLink: item.official_link || item.officialLink,
    }));
  } catch (err) {
    console.warn('[Supabase Service Error]:', err);
    return localSchemes as Scheme[];
  }
}
