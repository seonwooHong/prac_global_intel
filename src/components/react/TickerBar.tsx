import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
  icon?: string;
}

export interface TickerBarProps {
  /** Pre-built ticker items – if provided, fetchUrl is ignored. */
  items?: TickerItem[];
  /** URL to fetch market data from (default "/api/yahoo-finance"). */
  fetchUrl?: string;
  /** Refresh interval in ms (default 60 000). */
  refreshInterval?: number;
  /** Optional className */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatNum(n: number): string {
  if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(2);
  return n.toFixed(5);
}

function getIcon(symbol: string): string {
  const icons: Record<string, string> = {
    BTC: '\u20BF', ETH: '\u039E', SOL: '\u25CE', GOLD: '\u25CF',
    CL: '\u25CF', SILVER: '\u25CF', DOGE: '\u00D0', XRP: '\u2715', BNB: '\u25C6',
  };
  const upper = symbol.toUpperCase();
  for (const [k, v] of Object.entries(icons)) {
    if (upper.includes(k)) return v;
  }
  return '\u25CF';
}

interface RawData {
  markets?: Array<{ symbol: string; name: string; price: number; change: number; display?: string }>;
  crypto?: Array<{ symbol: string; name: string; price: number; change: number }>;
  commodities?: Array<{ symbol: string; name: string; price: number; change: number }>;
}

function mapData(data: RawData): TickerItem[] {
  const items: TickerItem[] = [];
  const crypto = data.crypto ?? [];
  const commodities = data.commodities ?? [];
  const markets = data.markets ?? [];

  for (const c of crypto) {
    items.push({
      symbol: c.symbol,
      price: formatNum(c.price),
      change: (c.change >= 0 ? '+' : '') + c.change.toFixed(2) + '%',
      positive: c.change >= 0,
      icon: getIcon(c.symbol),
    });
  }
  for (const c of commodities) {
    items.push({
      symbol: c.symbol,
      price: formatNum(c.price),
      change: (c.change >= 0 ? '+' : '') + c.change.toFixed(2) + '%',
      positive: c.change >= 0,
      icon: getIcon(c.symbol),
    });
  }
  for (const m of markets) {
    items.push({
      symbol: m.display ?? m.symbol,
      price: formatNum(m.price),
      change: (m.change >= 0 ? '+' : '') + m.change.toFixed(2) + '%',
      positive: m.change >= 0,
    });
  }
  return items;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const TickerBar: React.FC<TickerBarProps> = ({
  items: propItems,
  fetchUrl = '/api/yahoo-finance',
  refreshInterval = 60_000,
  className,
}) => {
  const [fetchedItems, setFetchedItems] = useState<TickerItem[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(fetchUrl);
      if (!res.ok) return;
      const data: RawData = await res.json();
      setFetchedItems(mapData(data));
    } catch {
      // silent
    }
  }, [fetchUrl]);

  useEffect(() => {
    if (propItems) return; // skip fetch if items provided directly
    fetchData();
    intervalRef.current = setInterval(fetchData, refreshInterval);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [propItems, fetchData, refreshInterval]);

  const items = propItems ?? fetchedItems;

  const tickerContent = useMemo(() => {
    if (items.length === 0) return null;
    return items.map((item, i) => (
      <React.Fragment key={`${item.symbol}-${i}`}>
        {i > 0 && <span className="ticker-sep">{'\u2022'}</span>}
        <span className="ticker-item">
          <span className="ticker-icon">{item.icon ?? '\u25CF'}</span>
          <span className="ticker-symbol">{item.symbol}</span>
          <span className="ticker-price">{item.price}</span>
          <span className={`ticker-change ${item.positive ? 'positive' : 'negative'}`}>{item.change}</span>
        </span>
      </React.Fragment>
    ));
  }, [items]);

  return (
    <div className={`ticker-bar${className ? ' ' + className : ''}`}>
      <div className="ticker-track">
        <div className="ticker-scroll">
          {tickerContent}
          {/* duplicated for seamless scroll */}
          {items.length > 0 && <span className="ticker-gap" />}
          {tickerContent}
        </div>
      </div>
    </div>
  );
};
