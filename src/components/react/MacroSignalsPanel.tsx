import React from 'react';
import { Panel } from './Panel';

interface MacroSignalData {
  timestamp: string;
  verdict: string;
  bullishCount: number;
  totalCount: number;
  signals: {
    liquidity: { status: string; value: number | null; sparkline: number[] };
    flowStructure: { status: string; btcReturn5: number | null; qqqReturn5: number | null };
    macroRegime: { status: string; qqqRoc20: number | null; xlpRoc20: number | null };
    technicalTrend: { status: string; btcPrice: number | null; sma50: number | null; sma200: number | null; vwap30d: number | null; mayerMultiple: number | null; sparkline: number[] };
    hashRate: { status: string; change30d: number | null };
    miningCost: { status: string };
    fearGreed: { status: string; value: number | null; history: Array<{ value: number; date: string }> };
  };
  meta: { qqqSparkline: number[] };
  unavailable?: boolean;
}

interface MacroSignalsPanelProps {
  data?: MacroSignalData | null;
  loading?: boolean;
  error?: string | null;
}

function sparklinePoints(data: number[], width = 80, height = 24): string {
  if (!data || data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function statusBadgeClass(status: string): string {
  const s = status.toUpperCase();
  if (['BULLISH', 'RISK-ON', 'GROWING', 'PROFITABLE', 'ALIGNED', 'NORMAL', 'EXTREME GREED', 'GREED'].includes(s)) return 'badge-bullish';
  if (['BEARISH', 'DEFENSIVE', 'DECLINING', 'SQUEEZE', 'PASSIVE GAP', 'EXTREME FEAR', 'FEAR'].includes(s)) return 'badge-bearish';
  return 'badge-neutral';
}

function formatNum(v: number | null, suffix = '%'): string {
  if (v === null) return 'N/A';
  const sign = v > 0 ? '+' : '';
  return `${sign}${v.toFixed(1)}${suffix}`;
}

function SignalCard({ name, status, value, sparkline, sparklineColor, detail, link }: {
  name: string; status: string; value: string; sparkline?: number[]; sparklineColor?: string; detail: string; link?: string | null;
}) {
  const badgeClass = statusBadgeClass(status);
  const nameEl = link
    ? <a href={link} target="_blank" rel="noopener" className="signal-name signal-card-link">{name}</a>
    : <span className="signal-name">{name}</span>;

  return (
    <div className={`signal-card${link ? ' signal-card-linked' : ''}`}>
      <div className="signal-header">
        {nameEl}
        <span className={`signal-badge ${badgeClass}`}>{status}</span>
      </div>
      <div className="signal-body">
        {sparkline && sparkline.length >= 2 && (
          <div className="signal-sparkline-wrap">
            <svg width="60" height="20" viewBox="0 0 60 20" className="signal-sparkline">
              <polyline points={sparklinePoints(sparkline, 60, 20)} fill="none" stroke={sparklineColor || '#4fc3f7'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {value && <span className="signal-value">{value}</span>}
      </div>
      {detail && <div className="signal-detail">{detail}</div>}
    </div>
  );
}

function FearGreedCard({ fg }: { fg: MacroSignalData['signals']['fearGreed'] }) {
  const badgeClass = statusBadgeClass(fg.status);
  const v = fg.value !== null ? Math.max(0, Math.min(100, fg.value)) : null;
  const size = 48;
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = v !== null ? circumference - (v / 100) * circumference : circumference;
  let color = '#f44336';
  if (v !== null) {
    if (v >= 75) color = '#4caf50';
    else if (v >= 50) color = '#ff9800';
    else if (v >= 25) color = '#ff5722';
  }

  return (
    <div className="signal-card signal-card-fg">
      <div className="signal-header">
        <span className="signal-name">Fear & Greed</span>
        <span className={`signal-badge ${badgeClass}`}>{fg.status}</span>
      </div>
      <div className="signal-body signal-body-fg">
        {v !== null ? (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="fg-donut">
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="5" />
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="5"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              transform={`rotate(-90 ${size/2} ${size/2})`} />
            <text x={size/2} y={size/2+4} textAnchor="middle" fill={color} fontSize="12" fontWeight="bold">{v}</text>
          </svg>
        ) : (
          <span className="signal-value unknown">N/A</span>
        )}
      </div>
      <div className="signal-detail">
        <a href="https://alternative.me/crypto/fear-and-greed-index/" target="_blank" rel="noopener">alternative.me</a>
      </div>
    </div>
  );
}

export const MacroSignalsPanel = React.memo(function MacroSignalsPanel({
  data,
  loading,
  error,
}: MacroSignalsPanelProps) {
  if (!data || data.unavailable) {
    return (
      <Panel id="macro-signals" title="Macro Signals" loading={loading} error={error || undefined}>
        <div className="panel-loading-text">No data</div>
      </Panel>
    );
  }

  const s = data.signals;
  const verdictClass = data.verdict === 'BUY' ? 'verdict-buy' : data.verdict === 'CASH' ? 'verdict-cash' : 'verdict-unknown';

  return (
    <Panel id="macro-signals" title="Macro Signals">
      <div className="macro-signals-container">
        <div className={`macro-verdict ${verdictClass}`}>
          <span className="verdict-label">Overall</span>
          <span className="verdict-value">{data.verdict}</span>
          <span className="verdict-detail">{data.bullishCount}/{data.totalCount} bullish</span>
        </div>
        <div className="signals-grid">
          <SignalCard name="Liquidity" status={s.liquidity.status} value={formatNum(s.liquidity.value)} sparkline={s.liquidity.sparkline} sparklineColor="#4fc3f7" detail="JPY 30d ROC" link="https://www.tradingview.com/symbols/JPYUSD/" />
          <SignalCard name="Flow" status={s.flowStructure.status} value={`BTC ${formatNum(s.flowStructure.btcReturn5)} / QQQ ${formatNum(s.flowStructure.qqqReturn5)}`} detail="5d returns" />
          <SignalCard name="Regime" status={s.macroRegime.status} value={`QQQ ${formatNum(s.macroRegime.qqqRoc20)} / XLP ${formatNum(s.macroRegime.xlpRoc20)}`} sparkline={data.meta.qqqSparkline} sparklineColor="#ab47bc" detail="20d ROC" link="https://www.tradingview.com/symbols/QQQ/" />
          <SignalCard name="BTC Trend" status={s.technicalTrend.status} value={`$${s.technicalTrend.btcPrice?.toLocaleString() ?? 'N/A'}`} sparkline={s.technicalTrend.sparkline} sparklineColor="#ff9800" detail={`SMA50: $${s.technicalTrend.sma50?.toLocaleString() ?? '-'} | VWAP: $${s.technicalTrend.vwap30d?.toLocaleString() ?? '-'} | Mayer: ${s.technicalTrend.mayerMultiple ?? '-'}`} link="https://www.tradingview.com/symbols/BTCUSD/" />
          <SignalCard name="Hash Rate" status={s.hashRate.status} value={formatNum(s.hashRate.change30d)} detail="30d change" link="https://mempool.space/mining" />
          <SignalCard name="Mining" status={s.miningCost.status} value="" detail="Hashprice model" />
          <FearGreedCard fg={s.fearGreed} />
        </div>
      </div>
    </Panel>
  );
});
