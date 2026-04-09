import type { MarketData, CryptoData } from '@/types';
import {
  MARKET_SYMBOLS,
  SECTORS,
  COMMODITIES,
  REFRESH_INTERVALS,
} from '@/config';
import { fetchMultipleStocks, fetchCrypto } from '@/services';
import { usePollingFetch } from './usePollingFetch';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SectorHeatmapItem {
  name: string;
  change: number | null;
}

export interface CommodityItem {
  display: string;
  price: number | null;
  change: number | null;
  sparkline?: number[];
}

export interface MarketDataBundle {
  stocks: MarketData[];
  sectors: SectorHeatmapItem[];
  commodities: CommodityItem[];
  crypto: CryptoData[];
  /** True when Finnhub was skipped (key not configured) */
  finnhubSkipped: boolean;
}

// ---------------------------------------------------------------------------
// Internal fetcher
// ---------------------------------------------------------------------------

async function fetchAllMarketData(): Promise<MarketDataBundle> {
  let stocks: MarketData[] = [];
  let sectors: SectorHeatmapItem[] = [];
  let commodities: CommodityItem[] = [];
  let crypto: CryptoData[] = [];
  let finnhubSkipped = false;

  // Stocks
  try {
    const stocksResult = await fetchMultipleStocks(MARKET_SYMBOLS);
    stocks = stocksResult.data;
    finnhubSkipped = !!stocksResult.skipped;

    // Only fetch sectors if Finnhub is configured
    if (!stocksResult.skipped) {
      try {
        const sectorsResult = await fetchMultipleStocks(
          SECTORS.map((s) => ({ ...s, display: s.name })),
        );
        sectors = sectorsResult.data.map((s) => ({
          name: s.name,
          change: s.change,
        }));
      } catch {
        // Sector fetch is non-critical
      }
    }

    // Commodities
    try {
      const commoditiesResult = await fetchMultipleStocks(COMMODITIES);
      commodities = commoditiesResult.data.map((c) => ({
        display: c.display,
        price: c.price,
        change: c.change,
        sparkline: c.sparkline,
      }));
    } catch {
      // Commodities fetch is non-critical
    }
  } catch {
    // Finnhub entirely unavailable
    finnhubSkipped = true;
  }

  // Crypto (independent from Finnhub)
  try {
    crypto = await fetchCrypto();
  } catch {
    // CoinGecko unavailable
  }

  return { stocks, sectors, commodities, crypto, finnhubSkipped };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMarketData(): {
  data: MarketDataBundle | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { data, loading, error, refetch } = usePollingFetch<MarketDataBundle>(
    'markets',
    fetchAllMarketData,
    REFRESH_INTERVALS.markets,
  );

  return { data, loading, error, refetch };
}
