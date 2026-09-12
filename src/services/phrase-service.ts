import institutionData from '@/constants/institution-phrases.json';
import { type LangCode } from '@/constants/i18n';

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

// ── Internal types matching the updated JSON structure ─────────────────────

interface RawPhraseCategory {
  name: Record<string, string>;
  phrases: Record<string, string[]>;
}

interface RawInstitution {
  id: string;
  name: Record<string, string>;
  icon: string;
  description: string;
  categories: RawPhraseCategory[];
}

// ── Service ────────────────────────────────────────────────────────────────

export class PhraseService {
  /** Get all available institution phrase configurations for a given language */
  public static getInstitutions(lang: LangCode = 'en'): InstitutionConfig[] {
    return (institutionData.institutions as RawInstitution[]).map((inst) =>
      PhraseService.toConfig(inst, lang)
    );
  }

  /** Get specific institution configuration by ID, localized to the given language */
  public static getInstitutionById(
    id: string,
    lang: LangCode = 'en'
  ): InstitutionConfig {
    const raw = (institutionData.institutions as RawInstitution[]).find(
      (inst) => inst.id === id
    );
    const source = raw || (institutionData.institutions[0] as RawInstitution);
    return PhraseService.toConfig(source, lang);
  }

  /** Search phrases matching query across categories (language-aware) */
  public static searchPhrases(
    query: string,
    institutionId?: string,
    lang: LangCode = 'en'
  ): string[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const insts = institutionId
      ? [this.getInstitutionById(institutionId, lang)]
      : this.getInstitutions(lang);

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

  // ── Private ──────────────────────────────────────────────────────────────

  private static toConfig(raw: RawInstitution, lang: LangCode): InstitutionConfig {
    const safeLang = (raw.name[lang] ? lang : 'en') as LangCode;
    return {
      id: raw.id,
      name: raw.name[safeLang] ?? raw.name['en'] ?? raw.id,
      icon: raw.icon,
      description: raw.description,
      categories: raw.categories.map((cat) => ({
        name: cat.name[safeLang] ?? cat.name['en'] ?? '',
        phrases: cat.phrases[safeLang] ?? cat.phrases['en'] ?? [],
      })),
    };
  }
}
