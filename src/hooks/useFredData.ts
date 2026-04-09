import { fetchFredData } from '@/services';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

export function useFredData(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'fred',
    fetchFredData,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
