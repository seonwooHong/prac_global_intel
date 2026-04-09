import { fetchPredictions } from '@/services';
import { REFRESH_INTERVALS } from '@/config';
import { usePollingFetch } from './usePollingFetch';

export function usePredictions(enabled = true) {
  const { data, loading, error } = usePollingFetch(
    'predictions',
    fetchPredictions,
    REFRESH_INTERVALS.predictions,
    enabled,
  );

  return { data, loading, error };
}
