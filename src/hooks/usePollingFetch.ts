import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Generic hook that calls a fetcher function on mount and then on a
 * recurring interval.  Includes automatic cleanup when the component
 * unmounts or when `enabled` flips to false.
 *
 * The `key` parameter is used as a stable identity – changing it will
 * reset the internal state and re-trigger the first fetch.
 */
export function usePollingFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  intervalMs: number,
  enabled = true,
): { data: T | null; loading: boolean; error: Error | null; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(enabled);
  const [error, setError] = useState<Error | null>(null);

  // Keep the latest fetcher in a ref so the interval always calls the
  // current version without needing it in the dependency array.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // Guard against updating state after unmount
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Prevent overlapping in-flight requests
  const inFlightRef = useRef(false);

  const execute = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      inFlightRef.current = false;
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Reset state when key changes
  useEffect(() => {
    setData(null);
    setError(null);
  }, [key]);

  // Initial fetch + interval
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    // Fire immediately
    void execute();

    const id = setInterval(() => {
      void execute();
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, [key, intervalMs, enabled, execute]);

  return { data, loading, error, refetch: execute };
}
