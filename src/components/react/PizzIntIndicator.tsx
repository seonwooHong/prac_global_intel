import React, { useState, useCallback } from 'react';

interface PizzIntLocation {
  name: string;
  is_closed_now: boolean;
  is_spike: boolean;
  current_popularity: number;
}

interface PizzIntStatus {
  defconLevel: number;
  defconLabel: string;
  aggregateActivity: number;
  locations: PizzIntLocation[];
  lastUpdate: Date;
}

interface GdeltTensionPair {
  label: string;
  score: number;
  trend: 'rising' | 'falling' | 'stable';
  changePercent: number;
}

interface PizzIntIndicatorProps {
  status?: PizzIntStatus | null;
  tensions?: GdeltTensionPair[];
}

const DEFCON_COLORS: Record<number, string> = {
  1: '#ff0040', 2: '#ff4400', 3: '#ffaa00', 4: '#00aaff', 5: '#2d8a6e',
};

function getStatusClass(loc: PizzIntLocation): string {
  if (loc.is_closed_now) return 'closed';
  if (loc.is_spike) return 'spike';
  if (loc.current_popularity >= 70) return 'high';
  if (loc.current_popularity >= 40) return 'elevated';
  if (loc.current_popularity >= 15) return 'nominal';
  return 'quiet';
}

function getStatusLabel(loc: PizzIntLocation): string {
  if (loc.is_closed_now) return 'Closed';
  if (loc.is_spike) return `Spike ${loc.current_popularity}%`;
  if (loc.current_popularity >= 70) return `High ${loc.current_popularity}%`;
  if (loc.current_popularity >= 40) return `Elevated ${loc.current_popularity}%`;
  if (loc.current_popularity >= 15) return `Nominal ${loc.current_popularity}%`;
  return `Quiet ${loc.current_popularity}%`;
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function getDefconLabel(level: number): string {
  switch (level) {
    case 1: return 'MAXIMUM READINESS';
    case 2: return 'ARMED FORCES READY';
    case 3: return 'INCREASE READINESS';
    case 4: return 'ABOVE NORMAL';
    case 5: return 'NORMAL READINESS';
    default: return '';
  }
}

export const PizzIntIndicator = React.memo(function PizzIntIndicator({
  status,
  tensions = [],
}: PizzIntIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => setIsExpanded(prev => !prev), []);
  const handleClose = useCallback(() => setIsExpanded(false), []);

  const color = status ? (DEFCON_COLORS[status.defconLevel] || '#888') : '#888';

  return (
    <div className="pizzint-indicator">
      <button className="pizzint-toggle" title="Pentagon Pizza Tracker" onClick={handleToggle}>
        <span className="pizzint-icon">{'\uD83C\uDF55'}</span>
        <span className="pizzint-defcon" style={{ background: color, color: status && status.defconLevel <= 3 ? '#000' : '#fff' }}>
          {status ? `D${status.defconLevel}` : '--'}
        </span>
        <span className="pizzint-score">{status ? `${status.aggregateActivity}%` : '--%'}</span>
      </button>
      <div className={`pizzint-panel ${isExpanded ? '' : 'hidden'}`}>
        <div className="pizzint-header">
          <span className="pizzint-title">Pentagon Pizza Tracker</span>
          <button className="pizzint-close" onClick={handleClose}>{'\u00D7'}</button>
        </div>
        <div className="pizzint-status-bar">
          <div className="pizzint-defcon-label" style={{ color }}>
            {status ? getDefconLabel(status.defconLevel) : ''}
          </div>
        </div>
        <div className="pizzint-locations">
          {status?.locations.map((loc, i) => (
            <div key={i} className="pizzint-location">
              <span className="pizzint-location-name">{loc.name}</span>
              <span className={`pizzint-location-status ${getStatusClass(loc)}`}>{getStatusLabel(loc)}</span>
            </div>
          ))}
        </div>
        <div className="pizzint-tensions">
          <div className="pizzint-tensions-title">GEOPOLITICAL TENSIONS</div>
          <div className="pizzint-tensions-list">
            {tensions.map((t, i) => {
              const trendIcon = t.trend === 'rising' ? '\u2191' : t.trend === 'falling' ? '\u2193' : '\u2192';
              const changeText = t.changePercent > 0 ? `+${t.changePercent}%` : `${t.changePercent}%`;
              return (
                <div key={i} className="pizzint-tension-row">
                  <span className="pizzint-tension-label">{t.label}</span>
                  <span className="pizzint-tension-score">
                    <span className="pizzint-tension-value">{t.score.toFixed(1)}</span>
                    <span className={`pizzint-tension-trend ${t.trend}`}>{trendIcon} {changeText}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="pizzint-footer">
          <span className="pizzint-source">Source: <a href="https://pizzint.watch" target="_blank" rel="noopener">PizzINT</a></span>
          <span className="pizzint-updated">{status ? formatTimeAgo(status.lastUpdate) : ''}</span>
        </div>
      </div>
    </div>
  );
});
