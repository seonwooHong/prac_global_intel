import type {
  Earthquake,
  NaturalEvent,
  InternetOutage,
  MilitaryFlight,
  MilitaryFlightCluster,
  MilitaryVessel,
  MilitaryVesselCluster,
} from '@/types';
import {
  fetchEarthquakes,
  fetchInternetOutages,
  fetchProtestEvents,
  fetchMilitaryFlights,
  fetchMilitaryVessels,
} from '@/services';
import { fetchNaturalEvents } from '@/services/eonet';
import type { ProtestData } from '@/services/protests';
import { usePollingFetch } from './usePollingFetch';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MilitaryData {
  flights: MilitaryFlight[];
  flightClusters: MilitaryFlightCluster[];
  vessels: MilitaryVessel[];
  vesselClusters: MilitaryVesselCluster[];
}

export interface IntelData {
  /** USGS earthquake events */
  earthquakes: Earthquake[];
  /** NASA EONET natural events (volcanoes, wildfires, etc.) */
  naturalEvents: NaturalEvent[];
  /** ACLED + GDELT protest / social unrest events */
  protests: ProtestData;
  /** Internet outages from NetBlocks / IODA */
  outages: InternetOutage[];
  /** Military flights + vessels */
  military: MilitaryData;
}

// ---------------------------------------------------------------------------
// Intelligence refresh interval (matches App.ts setupRefreshIntervals)
// ---------------------------------------------------------------------------

const INTEL_REFRESH_MS = 5 * 60 * 1000; // 5 minutes

// ---------------------------------------------------------------------------
// Internal fetcher — runs all intelligence sources in parallel
// ---------------------------------------------------------------------------

async function fetchAllIntelData(): Promise<IntelData> {
  const [
    earthquakeResult,
    naturalResult,
    protestResult,
    outageResult,
    militaryFlightResult,
    militaryVesselResult,
  ] = await Promise.allSettled([
    fetchEarthquakes(),
    fetchNaturalEvents(30),
    fetchProtestEvents(),
    fetchInternetOutages(),
    fetchMilitaryFlights(),
    fetchMilitaryVessels(),
  ]);

  const earthquakes =
    earthquakeResult.status === 'fulfilled' ? earthquakeResult.value : [];

  const naturalEvents =
    naturalResult.status === 'fulfilled' ? naturalResult.value : [];

  const protests: ProtestData =
    protestResult.status === 'fulfilled'
      ? protestResult.value
      : { events: [], byCountry: new Map(), highSeverityCount: 0, sources: { acled: 0, gdelt: 0 } };

  const outages =
    outageResult.status === 'fulfilled' ? outageResult.value : [];

  const flights =
    militaryFlightResult.status === 'fulfilled'
      ? militaryFlightResult.value.flights
      : [];
  const flightClusters =
    militaryFlightResult.status === 'fulfilled'
      ? militaryFlightResult.value.clusters
      : [];

  const vessels =
    militaryVesselResult.status === 'fulfilled'
      ? militaryVesselResult.value.vessels
      : [];
  const vesselClusters =
    militaryVesselResult.status === 'fulfilled'
      ? militaryVesselResult.value.clusters
      : [];

  // Log failures but do not throw – partial data is better than none
  [
    ['earthquakes', earthquakeResult],
    ['naturalEvents', naturalResult],
    ['protests', protestResult],
    ['outages', outageResult],
    ['militaryFlights', militaryFlightResult],
    ['militaryVessels', militaryVesselResult],
  ].forEach(([name, result]) => {
    if ((result as PromiseSettledResult<unknown>).status === 'rejected') {
      console.error(
        `[useIntelData] ${name} fetch failed:`,
        (result as PromiseRejectedResult).reason,
      );
    }
  });

  return {
    earthquakes,
    naturalEvents,
    protests,
    outages,
    military: { flights, flightClusters, vessels, vesselClusters },
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useIntelData(): {
  data: IntelData | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = usePollingFetch<IntelData>(
    'intelligence',
    fetchAllIntelData,
    INTEL_REFRESH_MS,
  );

  return { data, loading, error, refetch };
}
