import { fetchUnhcrPopulation } from '@/services/unhcr';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function useDisplacementData(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'displacement',
    fetchUnhcrPopulation,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
