import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { escapeHtml } from '@/utils/sanitize';
import { t } from '@/services/i18n';

export type SearchResultType = 'country' | 'news' | 'hotspot' | 'market' | 'prediction' | 'conflict' | 'base' | 'pipeline' | 'cable' | 'datacenter' | 'earthquake' | 'outage' | 'nuclear' | 'irradiator' | 'techcompany' | 'ailab' | 'startup' | 'techevent' | 'techhq' | 'accelerator' | 'exchange' | 'financialcenter' | 'centralbank' | 'commodityhub';

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle?: string;
  data: unknown;
}

interface SearchableSource {
  type: SearchResultType;
  items: { id: string; title: string; subtitle?: string; data: unknown }[];
}

const RECENT_SEARCHES_KEY = 'worldmonitor_recent_searches';
const MAX_RECENT = 8;
const MAX_RESULTS = 24;

const ICONS: Record<SearchResultType, string> = {
  country: '\u{1F3F3}\uFE0F',
  news: '\u{1F4F0}',
  hotspot: '\u{1F4CD}',
  market: '\u{1F4C8}',
  prediction: '\u{1F3AF}',
  conflict: '\u2694\uFE0F',
  base: '\u{1F3DB}\uFE0F',
  pipeline: '\u{1F6E2}',
  cable: '\u{1F310}',
  datacenter: '\u{1F5A5}\uFE0F',
  earthquake: '\u{1F30D}',
  outage: '\u{1F4E1}',
  nuclear: '\u2622\uFE0F',
  irradiator: '\u269B\uFE0F',
  techcompany: '\u{1F3E2}',
  ailab: '\u{1F9E0}',
  startup: '\u{1F680}',
  techevent: '\u{1F4C5}',
  techhq: '\u{1F984}',
  accelerator: '\u{1F680}',
  exchange: '\u{1F3DB}\uFE0F',
  financialcenter: '\u{1F4B0}',
  centralbank: '\u{1F3E6}',
  commodityhub: '\u{1F4E6}',
};

const PRIORITY: SearchResultType[] = [
  'news', 'prediction', 'market', 'earthquake', 'outage',
  'conflict', 'hotspot', 'country',
  'base', 'pipeline', 'cable', 'datacenter', 'nuclear', 'irradiator',
  'techcompany', 'ailab', 'startup', 'techevent', 'techhq', 'accelerator',
];

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (result: SearchResult) => void;
  sources: SearchableSource[];
  placeholder?: string;
  hint?: string;
}

function loadRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(term: string, recent: string[]): string[] {
  if (!term || term.length < 2) return recent;
  const updated = [term, ...recent.filter(t => t !== term)].slice(0, MAX_RECENT);
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch { /* ignore */ }
  return updated;
}

function highlightMatch(text: string, query: string): string {
  const escapedText = escapeHtml(text);
  if (!query) return escapedText;
  const escapedQuery = escapeHtml(query);
  const regex = new RegExp(`(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return escapedText.replace(regex, '<mark>$1</mark>');
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  sources,
  placeholder,
  hint,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(loadRecentSearches);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const actualPlaceholder = placeholder || t('modals.search.placeholder');
  const actualHint = hint || t('modals.search.hint');

  // Search logic
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const byType = new Map<SearchResultType, (SearchResult & { _score: number })[]>();
    for (const source of sources) {
      for (const item of source.items) {
        const titleLower = item.title.toLowerCase();
        const subtitleLower = item.subtitle?.toLowerCase() || '';
        if (titleLower.includes(q) || subtitleLower.includes(q)) {
          const isPrefix = titleLower.startsWith(q) || subtitleLower.startsWith(q);
          const result = {
            type: source.type,
            id: item.id,
            title: item.title,
            subtitle: item.subtitle,
            data: item.data,
            _score: isPrefix ? 2 : 1,
          };
          if (!byType.has(source.type)) byType.set(source.type, []);
          byType.get(source.type)!.push(result);
        }
      }
    }

    const collected: SearchResult[] = [];
    for (const type of PRIORITY) {
      const matches = byType.get(type) || [];
      matches.sort((a, b) => b._score - a._score);
      const limit = type === 'news' ? 6 : type === 'country' ? 4 : 3;
      collected.push(...matches.slice(0, limit));
      if (collected.length >= MAX_RESULTS) break;
    }
    return collected.slice(0, MAX_RESULTS);
  }, [query, sources]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected into view
  useEffect(() => {
    const selected = resultsRef.current?.querySelector('.selected');
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleSelect = useCallback((index: number) => {
    if (query.trim() === '' && recentSearches.length > 0) {
      const term = recentSearches[index];
      if (term) setQuery(term);
      return;
    }
    const result = results[index];
    if (!result) return;
    setRecentSearches(prev => saveRecentSearch(query.trim(), prev));
    onSelect(result);
    onClose();
  }, [query, results, recentSearches, onSelect, onClose]);

  const handleKeydown = useCallback((e: React.KeyboardEvent) => {
    const max = query.trim() ? results.length : recentSearches.length;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (max || 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + (max || 1)) % (max || 1));
        break;
      case 'Enter':
        e.preventDefault();
        handleSelect(selectedIndex);
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [query, results.length, recentSearches.length, selectedIndex, handleSelect, onClose]);

  if (!isOpen) return null;

  const showRecent = !query.trim() && recentSearches.length > 0;
  const showEmpty = !query.trim() && recentSearches.length === 0;
  const showNoResults = query.trim() && results.length === 0;

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="search-header">
          <span className="search-icon">{'\u2318'}</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder={actualPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeydown}
            autoFocus
          />
          <kbd className="search-kbd">ESC</kbd>
        </div>
        <div className="search-results" ref={resultsRef}>
          {showRecent && (
            <>
              <div className="search-section-header">{t('modals.search.recent')}</div>
              {recentSearches.map((term, i) => (
                <div
                  key={`recent-${i}`}
                  className={`search-result-item recent${i === selectedIndex ? ' selected' : ''}`}
                  onClick={() => { setQuery(term); }}
                >
                  <span className="search-result-icon">{'\u{1F550}'}</span>
                  <span className="search-result-title">{term}</span>
                </div>
              ))}
            </>
          )}
          {showEmpty && (
            <div className="search-empty">
              <div className="search-empty-icon">{'\u{1F50D}'}</div>
              <div>{t('modals.search.empty')}</div>
              <div className="search-empty-hint">{actualHint}</div>
            </div>
          )}
          {showNoResults && (
            <div className="search-empty">
              <div className="search-empty-icon">{'\u2205'}</div>
              <div>{t('modals.search.noResults')}</div>
            </div>
          )}
          {query.trim() && results.length > 0 && results.map((result, i) => (
            <div
              key={`${result.type}-${result.id}-${i}`}
              className={`search-result-item${i === selectedIndex ? ' selected' : ''}`}
              onClick={() => handleSelect(i)}
            >
              <span className="search-result-icon">{ICONS[result.type]}</span>
              <div className="search-result-content">
                <div
                  className="search-result-title"
                  dangerouslySetInnerHTML={{ __html: highlightMatch(result.title, query.trim()) }}
                />
                {result.subtitle && (
                  <div className="search-result-subtitle">{escapeHtml(result.subtitle)}</div>
                )}
              </div>
              <span className="search-result-type">
                {escapeHtml(t(`modals.search.types.${result.type}`) || result.type)}
              </span>
            </div>
          ))}
        </div>
        <div className="search-footer">
          <span><kbd>{'\u2191\u2193'}</kbd> {t('modals.search.navigate')}</span>
          <span><kbd>{'\u21B5'}</kbd> {t('modals.search.select')}</span>
          <span><kbd>esc</kbd> {t('modals.search.close')}</span>
        </div>
      </div>
    </div>
  );
};
