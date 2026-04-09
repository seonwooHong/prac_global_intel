import React, { useMemo } from 'react';
import { Panel } from './Panel';

interface PopulationExposure {
  eventName: string;
  eventType: string;
  exposedPopulation: number;
  exposureRadiusKm: number;
}

interface PopulationExposurePanelProps {
  exposures?: PopulationExposure[];
  loading?: boolean;
}

function formatPopulation(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function getTypeIcon(type: string): string {
  switch (type) {
    case 'state-based':
    case 'non-state':
    case 'one-sided':
    case 'conflict':
    case 'battle':
      return '\u2694\uFE0F';
    case 'earthquake':
      return '\uD83C\uDF0D';
    case 'flood':
      return '\uD83C\uDF0A';
    case 'fire':
    case 'wildfire':
      return '\uD83D\uDD25';
    default:
      return '\uD83D\uDCCD';
  }
}

export const PopulationExposurePanel = React.memo(function PopulationExposurePanel({
  exposures = [],
  loading,
}: PopulationExposurePanelProps) {
  const totalAffected = useMemo(() => exposures.reduce((sum, e) => sum + e.exposedPopulation, 0), [exposures]);

  return (
    <Panel id="population-exposure" title="Population Exposure" showCount count={exposures.length} loading={loading} infoTooltip="Population within exposure radius of conflict and disaster events.">
      {exposures.length === 0 ? (
        <div className="panel-empty">No data available</div>
      ) : (
        <div className="popexp-panel-content">
          <div className="popexp-summary">
            <span className="popexp-label">TOTAL AFFECTED</span>
            <span className="popexp-total">{formatPopulation(totalAffected)}</span>
          </div>
          <div className="popexp-list">
            {exposures.slice(0, 30).map((e, i) => {
              const popClass = e.exposedPopulation >= 1_000_000 ? ' popexp-pop-large' : '';
              return (
                <div key={i} className="popexp-card">
                  <div className="popexp-card-name">{getTypeIcon(e.eventType)} {e.eventName}</div>
                  <div className="popexp-card-meta">
                    <span className={`popexp-card-pop${popClass}`}>Affected: {formatPopulation(e.exposedPopulation)}</span>
                    <span className="popexp-card-radius">{e.exposureRadiusKm} km</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Panel>
  );
});
