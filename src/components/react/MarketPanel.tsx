import React, { useMemo } from 'react';
import { Panel } from './Panel';

export interface MarketItem {
  symbol: string;
  name: string;
  display: string;
  price: number | null;
  change: number | null;
  sparkline?: number[];
}

export interface MarketPanelProps {
  data: MarketItem[];
  loading?: boolean;
  error?: string;
  className?: string;
}

const TRADE_NOW_SYMBOLS = new Set(['TSLA', 'NVDA', 'PLTR', 'GOOGL']);

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(2);
  return price.toFixed(4);
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}%`;
}

function getChangeClass(change: number): string {
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

function hasTradeNow(symbol: string): boolean {
  return TRADE_NOW_SYMBOLS.has(symbol.toUpperCase().replace(/[^A-Z0-9]/g, ''));
}

/** Inline SVG sparkline - no external libs needed */
const MiniSparkline = React.memo(function MiniSparkline({
  data,
  change,
  width = 50,
  height = 16,
}: {
  data: number[];
  change: number | null;
  width?: number;
  height?: number;
}) {
  const points = useMemo(() => {
    if (data.length < 2) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    return data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * (height - 2) - 1;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [data, width, height]);

  if (!points) return null;

  const color = change != null && change >= 0 ? 'var(--green)' : 'var(--red)';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mini-sparkline"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
});

const MarketItemRow = React.memo(function MarketItemRow({
  item,
}: {
  item: MarketItem;
}) {
  const normalized = item.symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const showTrade = hasTradeNow(normalized);
  const tradeUrl = showTrade
    ? `https://app.pacifica.fi/trade/${encodeURIComponent(normalized)}`
    : null;

  return (
    <div className="market-item">
      <div className="market-info">
        <span className="market-name">{item.name}</span>
        <span className="market-symbol">{item.display}</span>
      </div>
      <div className="market-data">
        {item.sparkline && item.sparkline.length >= 2 && (
          <MiniSparkline data={item.sparkline} change={item.change} />
        )}
        {tradeUrl && (
          <a
            className="market-trade-now"
            href={tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Trade Now
          </a>
        )}
        <span className="market-price">
          {item.price != null ? formatPrice(item.price) : 'N/A'}
        </span>
        <span className={`market-change ${getChangeClass(item.change ?? 0)}`}>
          {item.change != null ? formatChange(item.change) : '-'}
        </span>
      </div>
    </div>
  );
});

export const MarketPanel = React.memo(function MarketPanel({
  data,
  loading,
  error,
  className,
}: MarketPanelProps) {
  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aTrade = hasTradeNow(a.symbol) ? 1 : 0;
      const bTrade = hasTradeNow(b.symbol) ? 1 : 0;
      return bTrade - aTrade;
    });
  }, [data]);

  return (
    <Panel
      id="markets"
      title="Markets"
      className={className}
      loading={loading}
      error={error || (data.length === 0 && !loading ? 'Failed to load market data' : undefined)}
    >
      {sortedData.map((item) => (
        <MarketItemRow key={item.symbol} item={item} />
      ))}
    </Panel>
  );
});
