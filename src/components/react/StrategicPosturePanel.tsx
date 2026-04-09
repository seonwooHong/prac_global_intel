import React, { useCallback, useMemo } from 'react';
import { Panel } from './Panel';

interface TheaterPostureSummary {
  theaterId: string;
  theaterName: string;
  shortName: string;
  postureLevel: 'critical' | 'elevated' | 'normal';
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
  totalAircraft: number;
  totalVessels: number;
  fighters: number;
  tankers: number;
  awacs: number;
  reconnaissance: number;
  transport: number;
  bombers: number;
  drones: number;
  carriers: number;
  destroyers: number;
  frigates: number;
  submarines: number;
  patrol: number;
  auxiliaryVessels: number;
  strikeCapable: boolean;
  targetNation?: string;
  centerLat: number;
  centerLon: number;
  byOperator: Record<string, number>;
}

interface StrategicPosturePanelProps {
  postures?: TheaterPostureSummary[];
  loading?: boolean;
  isStale?: boolean;
  lastTimestamp?: string;
  onRefresh?: () => void;
  onLocationClick?: (lat: number, lon: number) => void;
}

function getPostureBadge(level: string) {
  switch (level) {
    case 'critical': return <span className="posture-badge posture-critical">CRIT</span>;
    case 'elevated': return <span className="posture-badge posture-elevated">ELEV</span>;
    default: return <span className="posture-badge posture-normal">NORM</span>;
  }
}

function getTrendIcon(trend: string, change: number) {
  switch (trend) {
    case 'increasing': return <span className="posture-trend trend-up">{'\u2197'} +{change}%</span>;
    case 'decreasing': return <span className="posture-trend trend-down">{'\u2198'} {change}%</span>;
    default: return <span className="posture-trend trend-stable">{'\u2192'} stable</span>;
  }
}

export const StrategicPosturePanel = React.memo(function StrategicPosturePanel({
  postures = [],
  loading,
  isStale,
  lastTimestamp,
  onRefresh,
  onLocationClick,
}: StrategicPosturePanelProps) {

  const handleTheaterClick = useCallback((lat: number, lon: number) => {
    onLocationClick?.(lat, lon);
  }, [onLocationClick]);

  const sorted = useMemo(() => {
    const order: Record<string, number> = { critical: 0, elevated: 1, normal: 2 };
    return [...postures].sort((a, b) => (order[a.postureLevel] ?? 2) - (order[b.postureLevel] ?? 2));
  }, [postures]);

  const updatedTime = lastTimestamp
    ? new Date(lastTimestamp).toLocaleTimeString()
    : new Date().toLocaleTimeString();

  if (postures.length === 0) {
    return (
      <Panel id="strategic-posture" title="Strategic Posture" loading={loading} infoTooltip="Military theater posture assessment from ADS-B and AIS data.">
        <div className="posture-panel">
          <div className="posture-no-data">
            <div className="posture-no-data-icon pulse">{'\uD83D\uDCE1'}</div>
            <div className="posture-no-data-title">Acquiring Data</div>
            <div className="posture-no-data-desc">Connecting to ADS-B network for military flight data.</div>
            <button className="posture-retry-btn" onClick={onRefresh}>{'\u21BB'} Retry Now</button>
          </div>
        </div>
      </Panel>
    );
  }

  const renderTheater = (p: TheaterPostureSummary) => {
    const isExpanded = p.postureLevel !== 'normal';

    if (!isExpanded) {
      const chips: React.ReactNode[] = [];
      if (p.totalAircraft > 0) chips.push(<span key="air" className="posture-chip air">{'\u2708\uFE0F'} {p.totalAircraft}</span>);
      if (p.totalVessels > 0) chips.push(<span key="sea" className="posture-chip naval">{'\u2693'} {p.totalVessels}</span>);

      return (
        <div key={p.theaterId} className="posture-theater posture-compact" onClick={() => handleTheaterClick(p.centerLat, p.centerLon)} title={`Click to view ${p.theaterName}`}>
          <span className="posture-name">{p.shortName}</span>
          <div className="posture-chips">{chips}</div>
          {getPostureBadge(p.postureLevel)}
        </div>
      );
    }

    const airChips: React.ReactNode[] = [];
    if (p.fighters > 0) airChips.push(<span key="f" className="posture-stat" title="Fighters">{'\u2708\uFE0F'} {p.fighters}</span>);
    if (p.tankers > 0) airChips.push(<span key="t" className="posture-stat" title="Tankers">{'\u26FD'} {p.tankers}</span>);
    if (p.awacs > 0) airChips.push(<span key="a" className="posture-stat" title="AWACS">{'\uD83D\uDCE1'} {p.awacs}</span>);
    if (p.reconnaissance > 0) airChips.push(<span key="r" className="posture-stat" title="Recon">{'\uD83D\uDD0D'} {p.reconnaissance}</span>);
    if (p.transport > 0) airChips.push(<span key="tr" className="posture-stat" title="Transport">{'\uD83D\uDCE6'} {p.transport}</span>);
    if (p.bombers > 0) airChips.push(<span key="b" className="posture-stat" title="Bombers">{'\uD83D\uDCA3'} {p.bombers}</span>);
    if (p.drones > 0) airChips.push(<span key="d" className="posture-stat" title="Drones">{'\uD83D\uDEF8'} {p.drones}</span>);
    if (airChips.length === 0 && p.totalAircraft > 0) airChips.push(<span key="total-air" className="posture-stat" title="Aircraft">{'\u2708\uFE0F'} {p.totalAircraft}</span>);

    const navalChips: React.ReactNode[] = [];
    if (p.carriers > 0) navalChips.push(<span key="c" className="posture-stat carrier" title="Carriers">{'\uD83D\uDEA2'} {p.carriers}</span>);
    if (p.destroyers > 0) navalChips.push(<span key="dd" className="posture-stat" title="Destroyers">{'\u2693'} {p.destroyers}</span>);
    if (p.frigates > 0) navalChips.push(<span key="ff" className="posture-stat" title="Frigates">{'\uD83D\uDEE5\uFE0F'} {p.frigates}</span>);
    if (p.submarines > 0) navalChips.push(<span key="ss" className="posture-stat" title="Submarines">{'\uD83E\uDD88'} {p.submarines}</span>);
    if (p.patrol > 0) navalChips.push(<span key="pt" className="posture-stat" title="Patrol">{'\uD83D\uDEA4'} {p.patrol}</span>);
    if (p.auxiliaryVessels > 0) navalChips.push(<span key="ax" className="posture-stat" title="Auxiliary">{'\u2693'} {p.auxiliaryVessels}</span>);
    if (navalChips.length === 0 && p.totalVessels > 0) navalChips.push(<span key="total-sea" className="posture-stat" title="Naval Vessels">{'\u2693'} {p.totalVessels}</span>);

    return (
      <div key={p.theaterId} className={`posture-theater posture-expanded ${p.postureLevel}`} onClick={() => handleTheaterClick(p.centerLat, p.centerLon)} title="Click to view on map">
        <div className="posture-theater-header">
          <span className="posture-name">{p.theaterName}</span>
          {getPostureBadge(p.postureLevel)}
        </div>
        <div className="posture-forces">
          {airChips.length > 0 && (
            <div className="posture-force-row">
              <span className="posture-domain">AIR</span>
              <div className="posture-stats">{airChips}</div>
            </div>
          )}
          {navalChips.length > 0 && (
            <div className="posture-force-row">
              <span className="posture-domain">SEA</span>
              <div className="posture-stats">{navalChips}</div>
            </div>
          )}
        </div>
        <div className="posture-footer">
          {p.strikeCapable && <span className="posture-strike">{'\u26A1'} STRIKE</span>}
          {getTrendIcon(p.trend, p.changePercent)}
          {p.targetNation && <span className="posture-focus">{'\u2192'} {p.targetNation}</span>}
        </div>
      </div>
    );
  };

  return (
    <Panel id="strategic-posture" title="Strategic Posture" infoTooltip="Military theater posture assessment from ADS-B and AIS data.">
      <div className="posture-panel">
        {isStale && <div className="posture-stale-warning">{'\u26A0\uFE0F'} Using cached data - live feed temporarily unavailable</div>}
        {sorted.map(renderTheater)}
        <div className="posture-footer">
          <span className="posture-updated">{isStale ? '\u26A0\uFE0F ' : ''}Updated: {updatedTime}</span>
          <button className="posture-refresh-btn" onClick={onRefresh} title="Refresh">{'\u21BB'}</button>
        </div>
      </div>
    </Panel>
  );
});
