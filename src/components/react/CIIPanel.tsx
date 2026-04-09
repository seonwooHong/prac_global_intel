import React, { useMemo, useCallback } from 'react';
import { Panel } from './Panel';

interface CountryComponents {
  unrest: number;
  conflict: number;
  security: number;
  information: number;
}

interface CountryScore {
  code: string;
  name: string;
  score: number;
  level: 'critical' | 'high' | 'elevated' | 'normal' | 'low';
  trend: 'rising' | 'falling' | 'stable';
  change24h: number;
  components: CountryComponents;
}

interface CIIPanelProps {
  scores?: CountryScore[];
  loading?: boolean;
  onShareStory?: (code: string, name: string) => void;
}

function getLevelColor(level: CountryScore['level']): string {
  switch (level) {
    case 'critical': return 'var(--semantic-critical)';
    case 'high': return 'var(--semantic-high)';
    case 'elevated': return 'var(--semantic-elevated)';
    case 'normal': return 'var(--semantic-normal)';
    case 'low': return 'var(--semantic-low)';
  }
}

function getLevelEmoji(level: CountryScore['level']): string {
  switch (level) {
    case 'critical': return '\uD83D\uDD34';
    case 'high': return '\uD83D\uDFE0';
    case 'elevated': return '\uD83D\uDFE1';
    case 'normal': return '\uD83D\uDFE2';
    case 'low': return '\u26AA';
  }
}

export const CIIPanel = React.memo(function CIIPanel({
  scores = [],
  loading,
  onShareStory,
}: CIIPanelProps) {

  const withData = useMemo(() => scores.filter(s => s.score > 0), [scores]);

  const handleShare = useCallback((e: React.MouseEvent, code: string, name: string) => {
    e.stopPropagation();
    onShareStory?.(code, name);
  }, [onShareStory]);

  return (
    <Panel id="cii" title="Country Instability Index" showCount count={withData.length} loading={loading} infoTooltip="Composite instability index combining unrest, conflict, security & information signals.">
      {withData.length === 0 ? (
        <div className="empty-state">No instability signals detected</div>
      ) : (
        <div className="cii-list">
          {withData.map(country => {
            const color = getLevelColor(country.level);
            const emoji = getLevelEmoji(country.level);
            const trendArrow = country.trend === 'rising'
              ? <span className="trend-up">{'\u2191'}{country.change24h > 0 ? country.change24h : ''}</span>
              : country.trend === 'falling'
                ? <span className="trend-down">{'\u2193'}{Math.abs(country.change24h)}</span>
                : <span className="trend-stable">{'\u2192'}</span>;

            return (
              <div key={country.code} className="cii-country" data-code={country.code}>
                <div className="cii-header">
                  <span className="cii-emoji">{emoji}</span>
                  <span className="cii-name">{country.name}</span>
                  <span className="cii-score">{country.score}</span>
                  {trendArrow}
                  {onShareStory && (
                    <button className="cii-share-btn" title="Share story" onClick={(e) => handleShare(e, country.code, country.name)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                    </button>
                  )}
                </div>
                <div className="cii-bar-container">
                  <div className="cii-bar" style={{ width: `${country.score}%`, background: color }} />
                </div>
                <div className="cii-components">
                  <span title="Unrest">U:{country.components.unrest}</span>
                  <span title="Conflict">C:{country.components.conflict}</span>
                  <span title="Security">S:{country.components.security}</span>
                  <span title="Information">I:{country.components.information}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
});
