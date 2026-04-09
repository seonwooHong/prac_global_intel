import { fetchTopTechStories } from '@/services/hackernews';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function useTechEvents(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'tech-events',
    fetchTopTechStories,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
