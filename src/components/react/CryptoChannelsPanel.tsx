import React from 'react';
import { Panel } from './Panel';

interface CoinMarketItem {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
}

interface CryptoChannelsData {
  timestamp: string;
  coins: CoinMarketItem[];
  stablecoinMarketCap: number;
}

interface CryptoChannelsPanelProps {
  data?: CryptoChannelsData | null;
  loading?: boolean;
  error?: string | null;
}


function formatCompactUsd(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleRad: number) {
  return { x: cx + radius * Math.cos(angleRad), y: cy + radius * Math.sin(angleRad) };
}

function arcPath(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

export const CryptoChannelsPanel = React.memo(function CryptoChannelsPanel({
  data,
  loading,
  error,
}: CryptoChannelsPanelProps) {
  if (!data || !data.coins.length) {
    return (
      <Panel id="crypto-channels" title="Crypto Channels" className="col-span-2" loading={loading} error={error || undefined}>
        <div className="panel-loading-text">No data</div>
      </Panel>
    );
  }

  const byMarketCap = [...data.coins].sort((a, b) => b.marketCap - a.marketCap);
  const byVolume = [...data.coins].sort((a, b) => b.volume24h - a.volume24h);
  const topVolume = byVolume.slice(0, 6);
  const trackedMarketCap = byMarketCap.reduce((sum, c) => sum + c.marketCap, 0);
  const avgMove = data.coins.reduce((sum, c) => sum + c.change24h, 0) / data.coins.length;
  const advancers = data.coins.filter((c) => c.change24h > 0).length;
  const decliners = data.coins.filter((c) => c.change24h < 0).length;
  const leader = byVolume[0];
  const btcCap = byMarketCap.find((c) => c.id === 'bitcoin')?.marketCap || 0;
  const ethCap = byMarketCap.find((c) => c.id === 'ethereum')?.marketCap || 0;
  const stableCap = data.stablecoinMarketCap;
  const otherTrackedCap = Math.max(trackedMarketCap - btcCap - ethCap, 0);
  const trackedPlusStable = trackedMarketCap + Math.max(stableCap, 0);
  const stableShare = trackedPlusStable > 0 ? (stableCap / trackedPlusStable) * 100 : 0;

  const pieSlices = [
    { label: 'BTC', value: btcCap, color: '#f7931a' },
    { label: 'ETH', value: ethCap, color: '#627eea' },
    { label: 'Stablecoins', value: stableCap, color: '#00bfa5' },
    { label: 'Others', value: otherTrackedCap, color: '#8c9eff' },
  ];

  // Bar chart
  const barW = 420, barH = 190, pT = 16, pR = 12, pB = 42, pL = 12;
  const plotW = barW - pL - pR, plotH = barH - pT - pB;
  const maxVol = Math.max(...topVolume.map((i) => i.volume24h), 1);
  const step = plotW / topVolume.length;
  const barWidth = Math.max(18, step * 0.62);

  // Pie chart
  const pieTotal = pieSlices.reduce((s, sl) => s + Math.max(0, sl.value), 0);
  let pieStart = -Math.PI / 2;

  return (
    <Panel id="crypto-channels" title="Crypto Channels" className="col-span-2" loading={loading} error={error || undefined}>
      <div className="crypto-channels-container">
        <div className="crypto-channels-summary">
          <div className="crypto-summary-item">
            <span className="crypto-summary-label">Tracked MCap</span>
            <span className="crypto-summary-value">{formatCompactUsd(trackedMarketCap)}</span>
          </div>
          <div className="crypto-summary-item">
            <span className="crypto-summary-label">Breadth</span>
            <span className="crypto-summary-value">{advancers}↑ / {decliners}↓</span>
          </div>
          <div className="crypto-summary-item">
            <span className="crypto-summary-label">Avg Move</span>
            <span className={`crypto-summary-value ${avgMove >= 0 ? 'change-positive' : 'change-negative'}`}>
              {formatPercent(avgMove)}
            </span>
          </div>
          <div className="crypto-summary-item">
            <span className="crypto-summary-label">Leader Volume</span>
            <span className="crypto-summary-value">
              {leader?.symbol || 'N/A'} · {formatCompactUsd(leader?.volume24h || 0)}
            </span>
          </div>
        </div>

        <div className="crypto-chart-grid">
          <div className="crypto-chart-card">
            <div className="crypto-chart-title">Volume Channel</div>
            <svg viewBox={`0 0 ${barW} ${barH}`} className="crypto-volume-chart" role="img" aria-label="Volume Channel">
              <line x1={pL} y1={pT + plotH} x2={barW - pR} y2={pT + plotH} stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              {topVolume.map((item, index) => {
                const vol = Math.max(item.volume24h, 0);
                const bH = (vol / maxVol) * plotH;
                const x = pL + step * index + (step - barWidth) / 2;
                const y = pT + plotH - bH;
                const color = item.change24h >= 0 ? '#02bd75' : '#e0345c';
                return (
                  <React.Fragment key={item.id}>
                    <rect x={x} y={y} width={barWidth} height={bH} rx="4" fill={color} fillOpacity="0.86" />
                    <text x={x + barWidth / 2} y={barH - 20} textAnchor="middle" className="crypto-bar-label">
                      {item.symbol.toUpperCase()}
                    </text>
                  </React.Fragment>
                );
              })}
            </svg>
          </div>

          <div className="crypto-chart-card">
            <div className="crypto-chart-title">MCap Channel</div>
            <svg viewBox="0 0 220 220" className="crypto-share-chart" role="img" aria-label="MCap Channel">
              {pieTotal > 0 &&
                pieSlices
                  .filter((sl) => sl.value > 0)
                  .map((sl, i) => {
                    const angle = (sl.value / pieTotal) * Math.PI * 2;
                    const end = pieStart + angle;
                    const d = arcPath(110, 110, 82, pieStart, end);
                    pieStart = end;
                    return <path key={i} d={d} fill={sl.color} fillOpacity="0.88" />;
                  })}
              <circle cx="110" cy="110" r="43" fill="rgba(5,10,15,0.9)" />
              <text x="110" y="106" textAnchor="middle" className="crypto-pie-center">
                {formatCompactUsd(trackedPlusStable)}
              </text>
              <text x="110" y="126" textAnchor="middle" className="crypto-pie-sub">
                shares
              </text>
            </svg>
            <div className="crypto-legend">
              {pieSlices
                .filter((sl) => sl.value > 0)
                .map((sl) => {
                  const ratio = trackedPlusStable > 0 ? (sl.value / trackedPlusStable) * 100 : 0;
                  return (
                    <div className="crypto-legend-item" key={sl.label}>
                      <span className="crypto-legend-dot" style={{ background: sl.color }} />
                      <span className="crypto-legend-name">{sl.label}</span>
                      <span className="crypto-legend-value">{ratio.toFixed(1)}%</span>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="crypto-channels-footer">
          <span>Stable Share: {stableShare.toFixed(1)}%</span>
          <span>Updated: {new Date(data.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </Panel>
  );
});
