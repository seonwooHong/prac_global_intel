import React from 'react';
import { Panel } from './Panel';

interface ETFData {
  ticker: string;
  issuer: string;
  price: number;
  priceChange: number;
  volume: number;
  avgVolume: number;
  volumeRatio: number;
  direction: 'inflow' | 'outflow' | 'neutral';
  estFlow: number;
}

interface ETFFlowsResult {
  timestamp: string;
  summary: {
    etfCount: number;
    totalVolume: number;
    totalEstFlow: number;
    netDirection: string;
    inflowCount: number;
    outflowCount: number;
  };
  etfs: ETFData[];
  unavailable?: boolean;
}

interface ETFFlowsPanelProps {
  data?: ETFFlowsResult | null;
  loading?: boolean;
  error?: string | null;
}

function formatVolume(v: number): string {
  if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
  return v.toLocaleString();
}

function flowClass(direction: string): string {
  if (direction === 'inflow') return 'flow-inflow';
  if (direction === 'outflow') return 'flow-outflow';
  return 'flow-neutral';
}

function changeClass(val: number): string {
  if (val > 0.1) return 'change-positive';
  if (val < -0.1) return 'change-negative';
  return 'change-neutral';
}

export const ETFFlowsPanel = React.memo(function ETFFlowsPanel({
  data,
  loading,
  error,
}: ETFFlowsPanelProps) {
  const tradeLink = (
    <a className="panel-trade-now-link" href="https://app.pacifica.fi/trade/BTC" target="_blank" rel="noopener noreferrer">
      Trade Now
    </a>
  );

  if (!data || data.unavailable || !data.etfs.length) {
    return (
      <Panel id="etf-flows" title="ETF Flows" loading={loading} error={error || undefined} headerActions={tradeLink}>
        <div className="panel-loading-text">ETF data temporarily unavailable</div>
      </Panel>
    );
  }

  const s = data.summary;
  const dirClass = s.netDirection.includes('INFLOW')
    ? 'flow-inflow'
    : s.netDirection.includes('OUTFLOW')
      ? 'flow-outflow'
      : 'flow-neutral';

  return (
    <Panel id="etf-flows" title="ETF Flows" headerActions={tradeLink}>
      <div className="etf-flows-container">
        <div className={`etf-summary ${dirClass}`}>
          <div className="etf-summary-item">
            <span className="etf-summary-label">Net Flow</span>
            <span className={`etf-summary-value ${dirClass}`}>{s.netDirection}</span>
          </div>
          <div className="etf-summary-item">
            <span className="etf-summary-label">Est. Flow</span>
            <span className="etf-summary-value">${formatVolume(Math.abs(s.totalEstFlow))}</span>
          </div>
          <div className="etf-summary-item">
            <span className="etf-summary-label">Total Vol</span>
            <span className="etf-summary-value">{formatVolume(s.totalVolume)}</span>
          </div>
          <div className="etf-summary-item">
            <span className="etf-summary-label">ETFs</span>
            <span className="etf-summary-value">{s.inflowCount}↑ {s.outflowCount}↓</span>
          </div>
        </div>
        <div className="etf-table-wrap">
          <table className="etf-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Issuer</th>
                <th>Est. Flow</th>
                <th>Volume</th>
                <th>Change</th>
              </tr>
            </thead>
            <tbody>
              {data.etfs.map((etf) => (
                <tr key={etf.ticker} className={`etf-row ${flowClass(etf.direction)}`}>
                  <td className="etf-ticker">{etf.ticker}</td>
                  <td className="etf-issuer">{etf.issuer}</td>
                  <td className={`etf-flow ${flowClass(etf.direction)}`}>
                    {etf.direction === 'inflow' ? '+' : etf.direction === 'outflow' ? '-' : ''}${formatVolume(Math.abs(etf.estFlow))}
                  </td>
                  <td className="etf-volume">{formatVolume(etf.volume)}</td>
                  <td className={`etf-change ${changeClass(etf.priceChange)}`}>
                    {etf.priceChange > 0 ? '+' : ''}{etf.priceChange.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
});
