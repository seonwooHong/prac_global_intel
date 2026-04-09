import React, { useState } from 'react';
import { Panel } from './Panel';
import type { UnhcrSummary, CountryDisplacement } from '@/types';
import { formatPopulation } from '@/services/unhcr';

type DisplacementTab = 'origins' | 'hosts';

interface DisplacementPanelProps {
  data?: UnhcrSummary | null;
  loading?: boolean;
  onCountryClick?: (lat: number, lon: number) => void;
}

export const DisplacementPanel = React.memo(function DisplacementPanel({
  data,
  loading,
  onCountryClick,
}: DisplacementPanelProps) {
  const [activeTab, setActiveTab] = useState<DisplacementTab>('origins');

  if (!data) {
    return (
      <Panel id="displacement" title="Displacement" showCount count={0} loading={loading} infoTooltip="Global displacement data from UNHCR.">
        <div className="panel-empty">No data</div>
      </Panel>
    );
  }

  const g = data.globalTotals;
  const stats = [
    { label: 'Refugees', value: formatPopulation(g.refugees), cls: 'disp-stat-refugees' },
    { label: 'Asylum Seekers', value: formatPopulation(g.asylumSeekers), cls: 'disp-stat-asylum' },
    { label: 'IDPs', value: formatPopulation(g.idps), cls: 'disp-stat-idps' },
    { label: 'Total', value: formatPopulation(g.total), cls: 'disp-stat-total' },
  ];

  let countries: CountryDisplacement[];
  if (activeTab === 'origins') {
    countries = [...data.countries].filter((c) => c.refugees + c.asylumSeekers > 0).sort((a, b) => (b.refugees + b.asylumSeekers) - (a.refugees + a.asylumSeekers));
  } else {
    countries = [...data.countries].filter((c) => (c.hostTotal || 0) > 0).sort((a, b) => (b.hostTotal || 0) - (a.hostTotal || 0));
  }
  const displayed = countries.slice(0, 30);

  return (
    <Panel id="displacement" title="Displacement" showCount count={data.countries.length} infoTooltip="Global displacement data from UNHCR.">
      <div className="disp-panel-content">
        <div className="disp-stats-grid">
          {stats.map((s) => (
            <div className={`disp-stat-box ${s.cls}`} key={s.label}>
              <span className="disp-stat-value">{s.value}</span>
              <span className="disp-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="disp-tabs">
          <button className={`disp-tab ${activeTab === 'origins' ? 'disp-tab-active' : ''}`} onClick={() => setActiveTab('origins')}>Origins</button>
          <button className={`disp-tab ${activeTab === 'hosts' ? 'disp-tab-active' : ''}`} onClick={() => setActiveTab('hosts')}>Hosts</button>
        </div>

        {displayed.length === 0 ? (
          <div className="panel-empty">No data</div>
        ) : (
          <table className="disp-table">
            <thead>
              <tr>
                <th>Country</th>
                <th>Status</th>
                <th>Count</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((c, i) => {
                const hostTotal = c.hostTotal || 0;
                const count = activeTab === 'origins' ? c.refugees + c.asylumSeekers : hostTotal;
                const total = activeTab === 'origins' ? c.totalDisplaced : hostTotal;
                const badgeCls = total >= 1_000_000 ? 'disp-crisis' : total >= 500_000 ? 'disp-high' : total >= 100_000 ? 'disp-elevated' : '';
                const badgeLabel = total >= 1_000_000 ? 'CRISIS' : total >= 500_000 ? 'HIGH' : total >= 100_000 ? 'ELEVATED' : '';
                return (
                  <tr
                    key={i}
                    className="disp-row"
                    onClick={() => {
                      if (c.lat && c.lon && Number.isFinite(c.lat) && Number.isFinite(c.lon)) onCountryClick?.(c.lat, c.lon);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="disp-name">{c.name}</td>
                    <td className="disp-status">{badgeLabel && <span className={`disp-badge ${badgeCls}`}>{badgeLabel}</span>}</td>
                    <td className="disp-count">{formatPopulation(count)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Panel>
  );
});
