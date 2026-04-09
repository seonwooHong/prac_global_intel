import { flattenFires, fetchAllFires } from '@/services/firms-satellite';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 30 * 60 * 1000; // 30 minutes

async function fetchFlattenedFires() {
  const result = await fetchAllFires();
  return flattenFires(result.regions);
}

export function useFirmsData(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'firms-fires',
    fetchFlattenedFires,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
