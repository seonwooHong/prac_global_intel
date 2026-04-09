import { fetchEarthquakes, fetchNaturalEvents } from '@/services';
import { usePollingFetch } from './usePollingFetch';

const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface NaturalEventsData {
  earthquakes: Awaited<ReturnType<typeof fetchEarthquakes>>;
  naturalEvents: Awaited<ReturnType<typeof fetchNaturalEvents>>;
}

async function fetchAllNaturalEvents(): Promise<NaturalEventsData> {
  const [earthquakes, naturalEvents] = await Promise.all([
    fetchEarthquakes(),
    fetchNaturalEvents(),
  ]);
  return { earthquakes, naturalEvents };
}

export function useNaturalEvents(enabled = true) {
  const { data, loading, error } = usePollingFetch<NaturalEventsData>(
    'natural-events',
    fetchAllNaturalEvents,
    INTERVAL_MS,
    enabled,
  );

  return { data, loading, error };
}
