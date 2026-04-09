import React from 'react';
import { Panel } from './Panel';

interface StablecoinData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  deviation: number;
  pegStatus: 'ON PEG' | 'SLIGHT DEPEG' | 'DEPEGGED';
  marketCap: number;
  volume24h: number;
  change24h: number;
  change7d: number;
  image: string;
}

interface StablecoinResult {
  timestamp: string;
  summary: {
    totalMarketCap: number;
    totalVolume24h: number;
    coinCount: number;
    depeggedCount: number;
    healthStatus: string;
  };
  stablecoins: StablecoinData[];
  unavailable?: boolean;
}

interface StablecoinPanelProps {
  data?: StablecoinResult | null;
  loading?: boolean;
  error?: string | null;
}

function formatLargeNum(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
  return `$${v.toLocaleString()}`;
}

function pegClass(status: string): string {
  if (status === 'ON PEG') return 'peg-on';
  if (status === 'SLIGHT DEPEG') return 'peg-slight';
  return 'peg-off';
}

function healthClass(status: string): string {
  if (status === 'HEALTHY') return 'health-good';
  if (status === 'CAUTION') return 'health-caution';
  return 'health-warning';
}

export const StablecoinPanel = React.memo(function StablecoinPanel({
  data,
  loading,
  error,
}: StablecoinPanelProps) {
  if (!data || data.unavailable || !data.stablecoins.length) {
    return (
      <Panel id="stablecoins" title="Stablecoins" loading={loading} error={error || undefined}>
        <div className="panel-loading-text">Stablecoin data temporarily unavailable</div>
      </Panel>
    );
  }

  const s = data.summary;

  return (
    <Panel id="stablecoins" title="Stablecoins">
      <div className="stablecoin-container">
        <div className={`stable-health ${healthClass(s.healthStatus)}`}>
          <span className="health-label">{s.healthStatus}</span>
          <span className="health-detail">MCap: {formatLargeNum(s.totalMarketCap)} | Vol: {formatLargeNum(s.totalVolume24h)}</span>
        </div>

        <div className="stable-section">
          <div className="stable-section-title">Peg Health</div>
          <div className="stable-peg-list">
            {data.stablecoins.map((c) => (
              <div className="stable-row" key={c.id}>
                <div className="stable-info">
                  <span className="stable-symbol">{c.symbol}</span>
                  <span className="stable-name">{c.name}</span>
                </div>
                <div className="stable-price">${c.price.toFixed(4)}</div>
                <div className={`stable-peg ${pegClass(c.pegStatus)}`}>
                  <span className="peg-badge">{c.pegStatus}</span>
                  <span className="peg-dev">{c.deviation.toFixed(2)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stable-section">
          <div className="stable-section-title">Supply & Volume</div>
          <div className="stable-supply-header">
            <span>Token</span><span>MCap</span><span>Vol 24h</span><span>Chg 24h</span>
          </div>
          <div className="stable-supply-list">
            {data.stablecoins.map((c) => (
              <div className="stable-supply-row" key={c.id}>
                <span className="stable-symbol">{c.symbol}</span>
                <span className="stable-mcap">{formatLargeNum(c.marketCap)}</span>
                <span className="stable-vol">{formatLargeNum(c.volume24h)}</span>
                <span className={`stable-change ${c.change24h >= 0 ? 'change-positive' : 'change-negative'}`}>
                  {c.change24h >= 0 ? '+' : ''}{c.change24h.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
});
