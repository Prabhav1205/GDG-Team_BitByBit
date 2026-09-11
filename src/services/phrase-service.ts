import institutionData from '@/constants/institution-phrases.json';

export interface PhraseCategory {
  name: string;
  phrases: string[];
}

export interface InstitutionConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  categories: PhraseCategory[];
}

export class PhraseService {
  /** Get all available institution phrase configurations */
  public static getInstitutions(): InstitutionConfig[] {
    return institutionData.institutions;
  }

  /** Get specific institution configuration by ID */
  public static getInstitutionById(id: string): InstitutionConfig {
    const found = institutionData.institutions.find((inst) => inst.id === id);
    return found || institutionData.institutions[0];
  }

  /** Search phrases matching query across categories */
  public static searchPhrases(query: string, institutionId?: string): string[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const insts = institutionId
      ? [this.getInstitutionById(institutionId)]
      : this.getInstitutions();

    const matches = new Set<string>();
    for (const inst of insts) {
      for (const cat of inst.categories) {
        for (const phrase of cat.phrases) {
          if (phrase.toLowerCase().includes(q)) {
            matches.add(phrase);
          }
        }
      }
    }
    return Array.from(matches);
  }
}
