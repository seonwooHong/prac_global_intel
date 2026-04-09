import React, { useMemo } from 'react';
import { Panel } from './Panel';

interface PizzaHistoryPoint {
  current_popularity: number | null;
}

interface PizzaPlace {
  place_id: string;
  name: string;
  address: string;
  current_popularity: number | null;
  percentage_of_usual: number | null;
  is_spike: boolean;
  data_freshness: string;
  sparkline_24h?: PizzaHistoryPoint[];
}

interface PizzaApiData {
  data: PizzaPlace[];
  overall_index: number;
  defcon_level: number;
  active_spikes: number;
  timestamp: string;
  data_freshness: string;
  defcon_details?: {
    open_places?: number;
    total_places?: number;
  };
}

interface PentagonPizzaPanelProps {
  data?: PizzaApiData | null;
  loading?: boolean;
  error?: string;
}

function statusClass(place: PizzaPlace): string {
  if (place.current_popularity === null) return 'pizza-status-closed';
  if (place.is_spike) return 'pizza-status-spike';
  if (place.current_popularity >= 70) return 'pizza-status-high';
  if (place.current_popularity >= 40) return 'pizza-status-elevated';
  return 'pizza-status-normal';
}

function statusLabel(place: PizzaPlace): string {
  if (place.current_popularity === null) return 'Closed';
  if (place.is_spike) return `Spike ${place.current_popularity}%`;
  return `${place.current_popularity}%`;
}

function sparklineSvg(points: PizzaHistoryPoint[] | undefined): React.ReactNode {
  if (!points || points.length < 2) return null;
  const values = points
    .map(p => typeof p.current_popularity === 'number' && !Number.isNaN(p.current_popularity) ? p.current_popularity : null)
    .filter((v): v is number => v !== null);
  if (values.length < 2) return null;
  const width = 90;
  const height = 22;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(1, max - min);
  const step = width / Math.max(1, values.length - 1);
  const d = values
    .map((value, index) => {
      const x = index * step;
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg className="pizza-sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={d} />
    </svg>
  );
}

function formatUpdatedAt(isoTime: string): string {
  const date = new Date(isoTime);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString();
}

export const PentagonPizzaPanel = React.memo(function PentagonPizzaPanel({
  data,
  loading,
  error,
}: PentagonPizzaPanelProps) {
  const topPlaces = useMemo(() => {
    if (!data) return [];
    return [...data.data]
      .sort((a, b) => ((b.current_popularity ?? -1) - (a.current_popularity ?? -1)))
      .slice(0, 10);
  }, [data]);

  const openPlaces = data?.defcon_details?.open_places ?? data?.data.filter(p => p.current_popularity !== null).length ?? 0;
  const totalPlaces = data?.defcon_details?.total_places ?? data?.data.length ?? 0;

  return (
    <Panel id="pentagon-pizza" title="Pentagon Pizza Index" showCount count={data?.data.length ?? 0} loading={loading} error={error}>
      {data && (
        <div className="pizza-panel-wrap">
          <div className="pizza-summary-grid">
            <div className="pizza-summary-card">
              <span className="pizza-summary-label">DEFCON</span>
              <span className={`pizza-summary-value pizza-defcon-${Math.min(5, Math.max(1, data.defcon_level))}`}>{data.defcon_level}</span>
            </div>
            <div className="pizza-summary-card">
              <span className="pizza-summary-label">Index</span>
              <span className="pizza-summary-value">{data.overall_index}</span>
            </div>
            <div className="pizza-summary-card">
              <span className="pizza-summary-label">Active Spikes</span>
              <span className="pizza-summary-value">{data.active_spikes}</span>
            </div>
            <div className="pizza-summary-card">
              <span className="pizza-summary-label">Open / Total</span>
              <span className="pizza-summary-value">{openPlaces}/{totalPlaces}</span>
            </div>
          </div>
          <div className="pizza-meta-row">
            <span>{data.data_freshness.toUpperCase()}</span>
            <span>{formatUpdatedAt(data.timestamp)}</span>
          </div>
          <div className="pizza-places-list">
            {topPlaces.map(place => (
              <div key={place.place_id} className="pizza-place-row">
                <div className="pizza-place-main">
                  <a className="pizza-place-name" href={place.address} target="_blank" rel="noopener noreferrer">{place.name}</a>
                  <span className={`pizza-place-status ${statusClass(place)}`}>{statusLabel(place)}</span>
                </div>
                <div className="pizza-place-sub">
                  <span className="pizza-place-usual">{place.percentage_of_usual === null ? 'usual N/A' : `usual ${place.percentage_of_usual}%`}</span>
                  {sparklineSvg(place.sparkline_24h)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
});
