import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import {
  LANGUAGE_REGISTRY,
  LANGUAGE_MAP,
  RTL_LANGUAGE_CODES,
  SUPPORTED_LANGUAGE_CODES,
} from '../config/languages';

type TranslationDictionary = Record<string, unknown>;

/** Derived list of codes for i18next supportedLngs */
const SUPPORTED_CODES = LANGUAGE_REGISTRY.map(l => l.code);

const loadedLanguages = new Set<string>();

/**
 * Dynamic locale loader using Vite's glob import.
 * Adding a new JSON file under src/locales/ (+ a LANGUAGE_REGISTRY entry)
 * is all that's needed — no manual import map required.
 */
const localeModules = import.meta.glob<TranslationDictionary>(
  '../locales/*.json',
  { import: 'default' },
);

function localeLoader(code: string): (() => Promise<TranslationDictionary>) | undefined {
  const key = `../locales/${code}.json`;
  return localeModules[key];
}

function normalizeLanguage(lng: string): string {
  const base = (lng || 'en').split('-')[0]?.toLowerCase() || 'en';
  if (SUPPORTED_LANGUAGE_CODES.has(base)) return base;
  return 'en';
}

function applyDocumentDirection(lang: string): void {
  const base = lang.split('-')[0] || lang;
  const def = LANGUAGE_MAP.get(base);
  document.documentElement.setAttribute('lang', def?.locale ?? base);
  if (RTL_LANGUAGE_CODES.has(base)) {
    document.documentElement.setAttribute('dir', 'rtl');
  } else {
    document.documentElement.removeAttribute('dir');
  }
}

async function ensureLanguageLoaded(lng: string): Promise<string> {
  const normalized = normalizeLanguage(lng);
  if (loadedLanguages.has(normalized) && i18next.hasResourceBundle(normalized, 'translation')) {
    return normalized;
  }

  const loader = localeLoader(normalized);
  if (!loader) return 'en';

  const translation = await loader();
  i18next.addResourceBundle(normalized, 'translation', translation, true, true);
  loadedLanguages.add(normalized);
  return normalized;
}

// Initialize i18n
export async function initI18n(): Promise<void> {
  if (i18next.isInitialized) {
    const currentLanguage = normalizeLanguage(i18next.language || 'en');
    await ensureLanguageLoaded(currentLanguage);
    applyDocumentDirection(i18next.language || currentLanguage);
    return;
  }

  const enLoader = localeLoader('en');
  const fallbackTranslation = enLoader ? await enLoader() : {};
  loadedLanguages.add('en');

  await i18next
    .use(LanguageDetector)
    .init({
      resources: {
        en: { translation: fallbackTranslation },
      },
      supportedLngs: SUPPORTED_CODES,
      nonExplicitSupportedLngs: true,
      fallbackLng: 'en',
      debug: import.meta.env.DEV,
      interpolation: {
        escapeValue: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });

  const detectedLanguage = await ensureLanguageLoaded(i18next.language || 'en');
  if (detectedLanguage !== 'en') {
    await i18next.changeLanguage(detectedLanguage);
  }

  applyDocumentDirection(i18next.language || detectedLanguage);
}

// Helper to translate
export function t(key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, options);
}

// Helper to change language
export async function changeLanguage(lng: string): Promise<void> {
  const normalized = await ensureLanguageLoaded(lng);
  await i18next.changeLanguage(normalized);
  applyDocumentDirection(normalized);
  window.location.reload();
}

// Helper to get current language (normalized to short code)
export function getCurrentLanguage(): string {
  const lang = i18next.language || 'en';
  return lang.split('-')[0]!;
}

export function isRTL(): boolean {
  return RTL_LANGUAGE_CODES.has(getCurrentLanguage());
}

export function getLocale(): string {
  const lang = getCurrentLanguage();
  const def = LANGUAGE_MAP.get(lang);
  return def?.locale || lang;
}

/**
 * Re-export LANGUAGES for backward compatibility with components
 * that import { LANGUAGES } from '../services/i18n'.
 */
export const LANGUAGES = LANGUAGE_REGISTRY.map(l => ({
  code: l.code,
  label: l.label,
  flag: '',
}));
