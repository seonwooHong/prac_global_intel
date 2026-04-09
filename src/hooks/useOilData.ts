import { fetchOilAnalytics } from '@/services';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function useOilData(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'oil-analytics',
    fetchOilAnalytics,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
