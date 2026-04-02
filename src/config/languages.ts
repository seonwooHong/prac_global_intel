/**
 * Language Registry — Single source of truth for all supported languages.
 *
 * To add a new language:
 *   1. Create `src/locales/<code>.json` with translations (copy en.json as template)
 *   2. Add an entry to LANGUAGE_REGISTRY below
 *   3. That's it — i18n, LanguageSelector, and locale loading pick it up automatically.
 */

export interface LanguageDefinition {
  /** ISO 639-1 code, e.g. 'en', 'ko' */
  code: string;
  /** Native label shown in the language selector */
  label: string;
  /** ISO 3166-1 alpha-2 country code for flag display, e.g. 'gb', 'kr' */
  flagCountryCode: string;
  /** True for right-to-left scripts (Arabic, Hebrew, etc.) */
  rtl?: boolean;
  /** BCP 47 locale tag used for Intl APIs, e.g. 'en-US', 'ko-KR' */
  locale?: string;
}

/**
 * All supported languages. Order here determines the order in the UI selector.
 * Adding or removing an entry here is the ONLY change needed to support a new language
 * (plus providing the corresponding locale JSON file).
 */
export const LANGUAGE_REGISTRY: readonly LanguageDefinition[] = [
  { code: 'en', label: 'English',    flagCountryCode: 'gb', locale: 'en-US' },
  { code: 'ko', label: '한국어',      flagCountryCode: 'kr', locale: 'ko-KR' },
  { code: 'zh', label: '中文',        flagCountryCode: 'cn', locale: 'zh-CN' },
  { code: 'ja', label: '日本語',      flagCountryCode: 'jp', locale: 'ja-JP' },
  { code: 'nl', label: 'Nederlands',  flagCountryCode: 'nl', locale: 'nl-NL' },
  { code: 'ar', label: 'العربية',     flagCountryCode: 'sa', rtl: true },
  { code: 'fr', label: 'Français',    flagCountryCode: 'fr' },
  { code: 'de', label: 'Deutsch',     flagCountryCode: 'de' },
  { code: 'es', label: 'Español',     flagCountryCode: 'es' },
  { code: 'it', label: 'Italiano',    flagCountryCode: 'it' },
  { code: 'pl', label: 'Polski',      flagCountryCode: 'pl' },
  { code: 'pt', label: 'Português',   flagCountryCode: 'pt', locale: 'pt-BR' },
  { code: 'sv', label: 'Svenska',     flagCountryCode: 'se' },
  { code: 'ru', label: 'Русский',     flagCountryCode: 'ru' },
] as const;

/** Set of all supported language codes for O(1) lookup */
export const SUPPORTED_LANGUAGE_CODES = new Set(
  LANGUAGE_REGISTRY.map(l => l.code),
);

/** Set of RTL language codes */
export const RTL_LANGUAGE_CODES = new Set(
  LANGUAGE_REGISTRY.filter(l => l.rtl).map(l => l.code),
);

/** Map from language code to its definition for quick access */
export const LANGUAGE_MAP = new Map(
  LANGUAGE_REGISTRY.map(l => [l.code, l]),
);
