import React, { useState, useMemo, useCallback } from 'react';
import { Panel } from './Panel';

type UcdpEventType = 'state-based' | 'non-state' | 'one-sided';

interface UcdpGeoEvent {
  type_of_violence: UcdpEventType;
  country: string;
  deaths_best: number;
  deaths_low: number;
  deaths_high: number;
  date_start: string;
  side_a: string;
  side_b: string;
  latitude: number;
  longitude: number;
}

interface UcdpEventsPanelProps {
  events?: UcdpGeoEvent[];
  loading?: boolean;
  onEventClick?: (lat: number, lon: number) => void;
}

export const UcdpEventsPanel = React.memo(function UcdpEventsPanel({
  events = [],
  loading,
  onEventClick,
}: UcdpEventsPanelProps) {
  const [activeTab, setActiveTab] = useState<UcdpEventType>('state-based');

  const tabCounts = useMemo(() => {
    const counts: Record<UcdpEventType, number> = { 'state-based': 0, 'non-state': 0, 'one-sided': 0 };
    for (const event of events) {
      counts[event.type_of_violence] += 1;
    }
    return counts;
  }, [events]);

  const filtered = useMemo(() => events.filter(e => e.type_of_violence === activeTab), [events, activeTab]);
  const totalDeaths = useMemo(() => filtered.reduce((sum, e) => sum + e.deaths_best, 0), [filtered]);
  const displayed = useMemo(() => filtered.slice(0, 50), [filtered]);

  const handleTabClick = useCallback((tab: UcdpEventType) => setActiveTab(tab), []);
  const handleRowClick = useCallback((lat: number, lon: number) => {
    if (Number.isFinite(lat) && Number.isFinite(lon)) onEventClick?.(lat, lon);
  }, [onEventClick]);

  const tabs: { key: UcdpEventType; label: string }[] = [
    { key: 'state-based', label: 'State-based' },
    { key: 'non-state', label: 'Non-state' },
    { key: 'one-sided', label: 'One-sided' },
  ];

  return (
    <Panel id="ucdp-events" title="UCDP Events" showCount count={events.length} loading={loading} infoTooltip="Armed conflict events from the Uppsala Conflict Data Program.">
      <div className="ucdp-panel-content">
        <div className="ucdp-header">
          <div className="ucdp-tabs">
            {tabs.map(t => (
              <button
                key={t.key}
                className={`ucdp-tab ${t.key === activeTab ? 'ucdp-tab-active' : ''}`}
                onClick={() => handleTabClick(t.key)}
              >
                {t.label} <span className="ucdp-tab-count">{tabCounts[t.key]}</span>
              </button>
            ))}
          </div>
          {totalDeaths > 0 && <span className="ucdp-total-deaths">{totalDeaths.toLocaleString()} deaths</span>}
        </div>

        {displayed.length === 0 ? (
          <div className="panel-empty">No events in this category</div>
        ) : (
          <table className="ucdp-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Deaths</th>
                <th>Date</th>
                <th>Actors</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((e, i) => {
                const deathsClass = e.type_of_violence === 'state-based' ? 'ucdp-deaths-state'
                  : e.type_of_violence === 'non-state' ? 'ucdp-deaths-nonstate'
                    : 'ucdp-deaths-onesided';
                return (
                  <tr key={i} className="ucdp-row" onClick={() => handleRowClick(e.latitude, e.longitude)}>
                    <td className="ucdp-country">{e.country}</td>
                    <td className="ucdp-deaths">
                      {e.deaths_best > 0 ? (
                        <>
                          <span className={deathsClass}>{e.deaths_best}</span>
                          {' '}<small className="ucdp-range">({e.deaths_low}-{e.deaths_high})</small>
                        </>
                      ) : (
                        <span className="ucdp-deaths-zero">0</span>
                      )}
                    </td>
                    <td className="ucdp-date">{e.date_start}</td>
                    <td className="ucdp-actors">{e.side_a} vs {e.side_b}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {filtered.length > 50 && (
          <div className="panel-more">{filtered.length - 50} more not shown</div>
        )}
      </div>
    </Panel>
  );
});
