import type { NewsItem } from '@/types';
import { FEEDS, INTEL_SOURCES, REFRESH_INTERVALS } from '@/config';
import { fetchCategoryFeeds } from '@/services';
import { usePollingFetch } from './usePollingFetch';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NewsCategoryResult {
  category: string;
  items: NewsItem[];
}

export interface NewsData {
  /** All news items across every category */
  allNews: NewsItem[];
  /** News items grouped by category key (e.g. "politics", "intel") */
  newsByCategory: Record<string, NewsItem[]>;
}

// ---------------------------------------------------------------------------
// Internal: fetch all news categories in batched concurrency
// ---------------------------------------------------------------------------

const MAX_CATEGORY_CONCURRENCY = 5;

async function fetchAllNews(): Promise<NewsData> {
  // Build categories from the FEEDS config (mirrors App.ts loadNews)
  const categories = Object.entries(FEEDS)
    .filter(
      (entry): entry is [string, typeof FEEDS[keyof typeof FEEDS]] =>
        Array.isArray(entry[1]) && entry[1].length > 0,
    )
    .map(([key, feeds]) => ({ key, feeds }));

  const newsByCategory: Record<string, NewsItem[]> = {};
  const collectedNews: NewsItem[] = [];

  // Fetch categories in chunks to avoid burst pressure
  for (let i = 0; i < categories.length; i += MAX_CATEGORY_CONCURRENCY) {
    const chunk = categories.slice(i, i + MAX_CATEGORY_CONCURRENCY);
    const results = await Promise.allSettled(
      chunk.map(({ feeds }) => fetchCategoryFeeds(feeds)),
    );

    results.forEach((result, idx) => {
      const cat = chunk[idx];
      if (!cat) return;
      if (result.status === 'fulfilled') {
        newsByCategory[cat.key] = result.value;
        collectedNews.push(...result.value);
      } else {
        console.error(`[useNewsData] Category "${cat.key}" failed:`, result.reason);
        newsByCategory[cat.key] = [];
      }
    });
  }

  // Intel sources (separate from main categories in the original code)
  try {
    const intel = await fetchCategoryFeeds(INTEL_SOURCES);
    newsByCategory['intel'] = intel;
    collectedNews.push(...intel);
  } catch (err) {
    console.error('[useNewsData] Intel feed failed:', err);
    newsByCategory['intel'] = [];
  }

  return { allNews: collectedNews, newsByCategory };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useNewsData(): {
  data: NewsData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = usePollingFetch<NewsData>(
    'news',
    fetchAllNews,
    REFRESH_INTERVALS.feeds,
  );

  return { data, loading, error, refetch };
}
