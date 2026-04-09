import { fetchCyberThreats } from '@/services';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function useCyberThreats(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'cyber-threats',
    fetchCyberThreats,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
