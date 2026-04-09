import { fetchPizzIntStatus } from '@/services';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function usePizzInt(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'pizzint',
    fetchPizzIntStatus,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
