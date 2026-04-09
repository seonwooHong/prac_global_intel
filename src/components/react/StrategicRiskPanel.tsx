import React, { useCallback } from 'react';
import { Panel } from './Panel';

interface RiskMetrics {
  convergenceAlerts: number;
  avgCIIDeviation: number;
  infrastructureIncidents: number;
  highAlerts: number;
}

interface UnifiedAlert {
  type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  summary: string;
  timestamp: Date;
  location?: { lat: number; lon: number };
}

interface StrategicRiskOverview {
  compositeScore: number;
  trend: 'escalating' | 'de-escalating' | 'stable';
  topRisks: string[];
  topConvergenceZones: Array<{ lat: number; lon: number }>;
  convergenceAlerts: number;
  avgCIIDeviation: number;
  infrastructureIncidents: number;
  timestamp: Date;
}

interface DataSourceState {
  id: string;
  name: string;
  status: 'ok' | 'stale' | 'no_data' | 'disabled';
  requiredForRisk?: boolean;
}

interface StrategicRiskPanelProps {
  overview?: StrategicRiskOverview | null;
  alerts?: UnifiedAlert[];
  metrics?: RiskMetrics;
  dataSources?: DataSourceState[];
  insufficientData?: boolean;
  loading?: boolean;
  usedCachedScores?: boolean;
  learningMode?: boolean;
  learningProgress?: number;
  learningRemainingMinutes?: number;
  dataBadge?: { state: 'live' | 'cached' | 'unavailable'; detail?: string } | null;
  onRefresh?: () => void;
  onLocationClick?: (lat: number, lon: number) => void;
  onEnablePanel?: (panelId: string) => void;
  onEnablePanels?: (panelIds: string[]) => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return 'var(--semantic-critical)';
  if (score >= 50) return 'var(--semantic-high)';
  if (score >= 30) return 'var(--semantic-elevated)';
  return 'var(--semantic-normal)';
}

function getScoreLevel(score: number): string {
  if (score >= 70) return 'Critical';
  if (score >= 50) return 'Elevated';
  if (score >= 30) return 'Moderate';
  return 'Low';
}

function getTrendEmoji(trend: string): string {
  switch (trend) {
    case 'escalating': return '\uD83D\uDCC8';
    case 'de-escalating': return '\uD83D\uDCC9';
    default: return '\u27A1\uFE0F';
  }
}

function getTrendColor(trend: string): string {
  switch (trend) {
    case 'escalating': return 'var(--semantic-critical)';
    case 'de-escalating': return 'var(--semantic-normal)';
    default: return 'var(--text-dim)';
  }
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'var(--semantic-critical)';
    case 'high': return 'var(--semantic-high)';
    case 'medium': return 'var(--semantic-elevated)';
    case 'low': return 'var(--semantic-normal)';
    default: return 'var(--text-dim)';
  }
}

function getPriorityEmoji(priority: string): string {
  switch (priority) {
    case 'critical': return '\uD83D\uDD34';
    case 'high': return '\uD83D\uDFE0';
    case 'medium': return '\uD83D\uDFE1';
    case 'low': return '\uD83D\uDFE2';
    default: return '';
  }
}

function getTypeEmoji(type: string): string {
  switch (type) {
    case 'convergence': return '\uD83C\uDFAF';
    case 'cii_spike': return '\uD83D\uDCCA';
    case 'cascade': return '\uD83D\uDD17';
    case 'composite': return '\u26A0\uFE0F';
    default: return '\uD83D\uDCCD';
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}

export const StrategicRiskPanel = React.memo(function StrategicRiskPanel({
  overview,
  alerts = [],
  dataSources = [],
  insufficientData,
  loading,
  usedCachedScores,
  learningMode,
  learningProgress = 0,
  learningRemainingMinutes = 0,
  dataBadge,
  onRefresh,
  onLocationClick,
  onEnablePanel,
  onEnablePanels,
}: StrategicRiskPanelProps) {

  const handleLocationClick = useCallback((lat: number, lon: number) => {
    onLocationClick?.(lat, lon);
  }, [onLocationClick]);

  if (insufficientData) {
    const riskSources = dataSources.filter(s => s.requiredForRisk);
    const optionalSources = dataSources.filter(s => !s.requiredForRisk).slice(0, 4);

    return (
      <Panel id="strategic-risk" title="Strategic Risk" loading={loading} dataBadge={dataBadge} infoTooltip="Composite risk assessment from multiple data sources.">
        <div className="strategic-risk-panel">
          <div className="risk-no-data">
            <div className="risk-no-data-icon">{'\u26A0\uFE0F'}</div>
            <div className="risk-no-data-title">Insufficient Data</div>
            <div className="risk-no-data-desc">Unable to assess risk level.<br />Enable data sources to begin monitoring.</div>
          </div>
          <div className="risk-section">
            <div className="risk-section-title">Required Data Sources</div>
            <div className="risk-sources">
              {riskSources.map(source => (
                <div key={source.id} className="risk-source-row">
                  <span className="risk-source-name">{source.name}</span>
                  <span className="risk-source-time">{source.status === 'no_data' ? 'no data' : source.status}</span>
                  {(source.status === 'no_data' || source.status === 'disabled') && onEnablePanel && (
                    <button className="risk-source-enable" onClick={() => onEnablePanel(source.id)}>Enable</button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="risk-section">
            <div className="risk-section-title">Optional Sources</div>
            <div className="risk-sources">
              {optionalSources.map(source => (
                <div key={source.id} className="risk-source-row">
                  <span className="risk-source-name">{source.name}</span>
                  <span className="risk-source-time">{source.status === 'no_data' ? 'no data' : source.status}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="risk-actions">
            <button className="risk-action-btn risk-action-primary" onClick={() => onEnablePanels?.(['protests', 'intel', 'live-news'])}>
              Enable Core Feeds
            </button>
          </div>
          <div className="risk-footer">
            <span className="risk-updated">Waiting for data...</span>
            <button className="risk-refresh-btn" onClick={onRefresh}>Refresh</button>
          </div>
        </div>
      </Panel>
    );
  }

  if (!overview) {
    return (
      <Panel id="strategic-risk" title="Strategic Risk" loading={true} dataBadge={dataBadge} infoTooltip="Composite risk assessment from multiple data sources.">
        <div />
      </Panel>
    );
  }

  const score = overview.compositeScore;
  const color = getScoreColor(score);
  const level = getScoreLevel(score);
  const scoreDeg = Math.round((score / 100) * 270);
  const showLearning = learningMode && !usedCachedScores;
  const displayAlerts = alerts.slice(0, 5);
  const topZone = overview.topConvergenceZones[0];

  return (
    <Panel id="strategic-risk" title="Strategic Risk" dataBadge={dataBadge} infoTooltip="Composite risk assessment from multiple data sources.">
      <div className="strategic-risk-panel">
        {showLearning && (
          <div className="risk-status-banner risk-status-learning">
            <span className="risk-status-icon">{'\uD83D\uDCCA'}</span>
            <span className="risk-status-text">Learning Mode - {learningRemainingMinutes}m until reliable</span>
            <div className="learning-progress-mini">
              <div className="learning-bar" style={{ width: `${learningProgress}%` }} />
            </div>
          </div>
        )}

        <div className="risk-gauge">
          <div className="risk-score-container">
            <div className="risk-score-ring" style={{ '--score-color': color, '--score-deg': `${scoreDeg}deg` } as React.CSSProperties}>
              <div className="risk-score-inner">
                <div className="risk-score" style={{ color }}>{score}</div>
                <div className="risk-level" style={{ color }}>{level}</div>
              </div>
            </div>
          </div>
          <div className="risk-trend-container">
            <span className="risk-trend-label">Trend</span>
            <div className="risk-trend" style={{ color: getTrendColor(overview.trend) }}>
              {getTrendEmoji(overview.trend)} {overview.trend.charAt(0).toUpperCase() + overview.trend.slice(1)}
            </div>
          </div>
        </div>

        <div className="risk-metrics">
          <div className="risk-metric">
            <span className="risk-metric-value">{overview.convergenceAlerts}</span>
            <span className="risk-metric-label">Convergence</span>
          </div>
          <div className="risk-metric">
            <span className="risk-metric-value">{overview.avgCIIDeviation.toFixed(1)}</span>
            <span className="risk-metric-label">CII Deviation</span>
          </div>
          <div className="risk-metric">
            <span className="risk-metric-value">{overview.infrastructureIncidents}</span>
            <span className="risk-metric-label">Infra Events</span>
          </div>
        </div>

        {overview.topRisks.length > 0 ? (
          <div className="risk-section">
            <div className="risk-section-title">Top Risks</div>
            <div className="risk-list">
              {overview.topRisks.map((risk, i) => {
                const isConvergence = i === 0 && risk.startsWith('Convergence:') && topZone;
                return (
                  <div
                    key={i}
                    className={`risk-item ${isConvergence ? 'risk-item-clickable' : ''}`}
                    onClick={isConvergence ? () => handleLocationClick(topZone.lat, topZone.lon) : undefined}
                  >
                    <span className="risk-rank">{i + 1}.</span>
                    <span className="risk-text">{risk}</span>
                    {isConvergence && <span className="risk-location-icon">{'\u2197'}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="risk-empty">No significant risks detected</div>
        )}

        {displayAlerts.length > 0 && (
          <div className="risk-section">
            <div className="risk-section-title">Recent Alerts ({alerts.length})</div>
            <div className="risk-alerts">
              {displayAlerts.map((alert, i) => {
                const hasLocation = alert.location && alert.location.lat && alert.location.lon;
                return (
                  <div
                    key={i}
                    className={`risk-alert ${hasLocation ? 'risk-alert-clickable' : ''}`}
                    style={{ borderLeft: `3px solid ${getPriorityColor(alert.priority)}` }}
                    onClick={hasLocation ? () => handleLocationClick(alert.location!.lat, alert.location!.lon) : undefined}
                  >
                    <div className="risk-alert-header">
                      <span className="risk-alert-type">{getTypeEmoji(alert.type)}</span>
                      <span className="risk-alert-priority">{getPriorityEmoji(alert.priority)}</span>
                      <span className="risk-alert-title">{alert.title}</span>
                      {hasLocation && <span className="risk-location-icon">{'\u2197'}</span>}
                    </div>
                    <div className="risk-alert-summary">{alert.summary}</div>
                    <div className="risk-alert-time">{formatTime(alert.timestamp)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="risk-footer">
          <span className="risk-updated">Updated: {overview.timestamp.toLocaleTimeString()}</span>
          <button className="risk-refresh-btn" onClick={onRefresh}>Refresh</button>
        </div>
      </div>
    </Panel>
  );
});
