import { fetchClimateAnomalies } from '@/services/climate';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

export function useClimateData(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'climate-anomalies',
    fetchClimateAnomalies,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
