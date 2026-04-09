import React from 'react';
import { Panel } from './Panel';
import type { ClimateAnomaly } from '@/types';
import { getSeverityIcon, formatDelta } from '@/services/climate';

interface ClimateAnomalyPanelProps {
  anomalies: ClimateAnomaly[];
  loading?: boolean;
  onZoneClick?: (lat: number, lon: number) => void;
}

export const ClimateAnomalyPanel = React.memo(function ClimateAnomalyPanel({
  anomalies,
  loading,
  onZoneClick,
}: ClimateAnomalyPanelProps) {
  if (anomalies.length === 0) {
    return (
      <Panel id="climate" title="Climate Anomalies" showCount count={0} loading={loading} infoTooltip="Temperature and precipitation anomalies compared to 30-year climate normals.">
        <div className="panel-empty">No anomalies detected</div>
      </Panel>
    );
  }

  const sorted = [...anomalies].sort((a, b) => {
    const severityOrder: Record<string, number> = { extreme: 0, moderate: 1, normal: 2 };
    return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
  });

  return (
    <Panel id="climate" title="Climate Anomalies" showCount count={anomalies.length} infoTooltip="Temperature and precipitation anomalies compared to 30-year climate normals.">
      <div className="climate-panel-content">
        <table className="climate-table">
          <thead>
            <tr>
              <th>Zone</th>
              <th>Temp</th>
              <th>Precip</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => {
              const icon = getSeverityIcon(a);
              const tempClass = a.tempDelta > 0 ? 'climate-warm' : 'climate-cold';
              const precipClass = a.precipDelta > 0 ? 'climate-wet' : 'climate-dry';
              const sevClass = `severity-${a.severity}`;
              const rowClass = a.severity === 'extreme' ? ' climate-extreme-row' : '';

              return (
                <tr
                  key={i}
                  className={`climate-row${rowClass}`}
                  onClick={() => {
                    if (Number.isFinite(a.lat) && Number.isFinite(a.lon)) onZoneClick?.(a.lat, a.lon);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <td className="climate-zone"><span className="climate-icon">{icon}</span>{a.zone}</td>
                  <td className={`climate-num ${tempClass}`}>{formatDelta(a.tempDelta, '°C')}</td>
                  <td className={`climate-num ${precipClass}`}>{formatDelta(a.precipDelta, 'mm')}</td>
                  <td><span className={`climate-badge ${sevClass}`}>{a.severity}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
});
