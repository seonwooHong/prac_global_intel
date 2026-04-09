import React, { useState, useMemo, useCallback } from 'react';
import { Panel } from './Panel';

type ViewMode = 'timeline' | 'deadlines' | 'regulations' | 'countries';

interface RegulatoryAction {
  title: string;
  description: string;
  date: string;
  country: string;
  type: 'law-passed' | 'executive-order' | 'guideline' | 'enforcement' | 'consultation';
  impact: 'high' | 'medium' | 'low';
  source?: string;
}

interface AIRegulation {
  name: string;
  shortName: string;
  country: string;
  type: 'comprehensive' | 'sectoral' | 'voluntary' | 'proposed';
  status: 'active' | 'proposed';
  effectiveDate?: string;
  complianceDeadline?: string;
  description?: string;
  keyProvisions: string[];
  scope: string[];
  penalties?: string;
  link?: string;
}

interface CountryRegulationProfile {
  country: string;
  stance: 'strict' | 'moderate' | 'permissive' | 'undefined';
  summary: string;
  activeRegulations: string[];
  proposedRegulations: string[];
  lastUpdated: string;
}

interface RegulationPanelProps {
  recentActions?: RegulatoryAction[];
  upcomingDeadlines?: AIRegulation[];
  regulations?: AIRegulation[];
  countryProfiles?: CountryRegulationProfile[];
  loading?: boolean;
}

const TYPE_ICONS: Record<RegulatoryAction['type'], string> = {
  'law-passed': '\uD83D\uDCDC',
  'executive-order': '\uD83C\uDFDB\uFE0F',
  'guideline': '\uD83D\uDCCB',
  'enforcement': '\u2696\uFE0F',
  'consultation': '\uD83D\uDCAC',
};

export const RegulationPanel = React.memo(function RegulationPanel({
  recentActions = [],
  upcomingDeadlines = [],
  regulations = [],
  countryProfiles = [],
  loading,
}: RegulationPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');

  const activeRegulations = useMemo(() => regulations.filter(r => r.status === 'active'), [regulations]);
  const proposedRegulations = useMemo(() => regulations.filter(r => r.status === 'proposed'), [regulations]);

  const sortedProfiles = useMemo(() => {
    const stanceOrder: Record<string, number> = { strict: 0, moderate: 1, permissive: 2, undefined: 3 };
    return [...countryProfiles].sort((a, b) => (stanceOrder[a.stance] ?? 3) - (stanceOrder[b.stance] ?? 3));
  }, [countryProfiles]);

  const handleTabClick = useCallback((view: ViewMode) => {
    setViewMode(view);
  }, []);

  const renderTimeline = () => {
    if (recentActions.length === 0) {
      return <div className="empty-state">No recent regulatory actions</div>;
    }
    return (
      <div className="timeline-view">
        <div className="timeline-header">
          <h4>Recent Regulatory Actions (Last 12 Months)</h4>
          <span className="count">{recentActions.length} actions</span>
        </div>
        <div className="timeline-list">
          {recentActions.map((action, i) => {
            const date = new Date(action.date);
            const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            return (
              <div key={i} className={`timeline-item impact-${action.impact}`}>
                <div className="timeline-marker">
                  <span className="timeline-icon">{TYPE_ICONS[action.type]}</span>
                  <div className="timeline-line" />
                </div>
                <div className="timeline-content">
                  <div className="timeline-header-row">
                    <span className="timeline-date">{formattedDate}</span>
                    <span className="timeline-country">{action.country}</span>
                    <span className="timeline-impact">{action.impact.toUpperCase()}</span>
                  </div>
                  <h5>{action.title}</h5>
                  <p>{action.description}</p>
                  {action.source && <span className="timeline-source">Source: {action.source}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDeadlines = () => {
    if (upcomingDeadlines.length === 0) {
      return <div className="empty-state">No upcoming compliance deadlines in the next 12 months</div>;
    }
    return (
      <div className="deadlines-view">
        <div className="deadlines-header">
          <h4>Upcoming Compliance Deadlines</h4>
          <span className="count">{upcomingDeadlines.length} deadlines</span>
        </div>
        <div className="deadlines-list">
          {upcomingDeadlines.map((reg, i) => {
            const deadline = new Date(reg.complianceDeadline!);
            const daysUntil = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const formattedDate = deadline.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
            const urgencyClass = daysUntil < 90 ? 'urgent' : daysUntil < 180 ? 'warning' : 'normal';
            return (
              <div key={i} className={`deadline-item ${urgencyClass}`}>
                <div className="deadline-countdown">
                  <div className="days-until">{daysUntil}</div>
                  <div className="days-label">days</div>
                </div>
                <div className="deadline-content">
                  <h5>{reg.shortName}</h5>
                  <p className="deadline-name">{reg.name}</p>
                  <div className="deadline-meta">
                    <span className="deadline-date">{formattedDate}</span>
                    <span className="deadline-country">{reg.country}</span>
                  </div>
                  {reg.penalties && <p className="deadline-penalties">Penalties: {reg.penalties}</p>}
                  <div className="deadline-scope">
                    {reg.scope.map((s, j) => <span key={j} className="scope-tag">{s}</span>)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderRegulations = () => (
    <div className="regulations-view">
      <div className="regulations-section">
        <h4>Active Regulations ({activeRegulations.length})</h4>
        <div className="regulations-list">
          {activeRegulations.map((reg, i) => (
            <div key={i} className="regulation-card">
              <div className="regulation-card-header">
                <h5>{reg.shortName}</h5>
                <span className="regulation-type">{reg.type}</span>
              </div>
              <p className="regulation-full-name">{reg.name}</p>
              <div className="regulation-meta">
                <span>{reg.country}</span>
                <span>{reg.effectiveDate ? new Date(reg.effectiveDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : 'TBD'}</span>
                <span className={`status-badge status-${reg.status}`}>{reg.status}</span>
              </div>
              {reg.description && <p className="regulation-description">{reg.description}</p>}
              <div className="regulation-provisions">
                <strong>Key Provisions:</strong>
                <ul>
                  {reg.keyProvisions.slice(0, 3).map((p, j) => <li key={j}>{p}</li>)}
                  {reg.keyProvisions.length > 3 && <li className="more-provisions">+{reg.keyProvisions.length - 3} more...</li>}
                </ul>
              </div>
              <div className="regulation-scope">
                {reg.scope.map((s, j) => <span key={j} className="scope-tag">{s}</span>)}
              </div>
              {reg.link && <a href={reg.link} target="_blank" rel="noopener noreferrer" className="regulation-link">Learn More &rarr;</a>}
            </div>
          ))}
        </div>
      </div>
      <div className="regulations-section">
        <h4>Proposed Regulations ({proposedRegulations.length})</h4>
        <div className="regulations-list">
          {proposedRegulations.map((reg, i) => (
            <div key={i} className="regulation-card">
              <div className="regulation-card-header">
                <h5>{reg.shortName}</h5>
                <span className="regulation-type">{reg.type}</span>
              </div>
              <p className="regulation-full-name">{reg.name}</p>
              <div className="regulation-meta">
                <span>{reg.country}</span>
                <span className={`status-badge status-${reg.status}`}>{reg.status}</span>
              </div>
              <div className="regulation-scope">
                {reg.scope.map((s, j) => <span key={j} className="scope-tag">{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderCountries = () => (
    <div className="countries-view">
      <div className="countries-header">
        <h4>Global Regulatory Landscape</h4>
        <div className="stance-legend">
          <span className="legend-item"><span className="color-box strict" /> Strict</span>
          <span className="legend-item"><span className="color-box moderate" /> Moderate</span>
          <span className="legend-item"><span className="color-box permissive" /> Permissive</span>
          <span className="legend-item"><span className="color-box undefined" /> Undefined</span>
        </div>
      </div>
      <div className="countries-list">
        {sortedProfiles.map((profile, i) => (
          <div key={i} className={`country-card stance-${profile.stance}`}>
            <div className="country-card-header">
              <h5>{profile.country}</h5>
              <span className="stance-badge">{profile.stance.toUpperCase()}</span>
            </div>
            <p className="country-summary">{profile.summary}</p>
            <div className="country-stats">
              <div className="stat">
                <span className="stat-value">{profile.activeRegulations.length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat">
                <span className="stat-value">{profile.proposedRegulations.length}</span>
                <span className="stat-label">Proposed</span>
              </div>
              <div className="stat">
                <span className="stat-value">{new Date(profile.lastUpdated).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                <span className="stat-label">Updated</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (viewMode) {
      case 'timeline': return renderTimeline();
      case 'deadlines': return renderDeadlines();
      case 'regulations': return renderRegulations();
      case 'countries': return renderCountries();
    }
  };

  return (
    <Panel id="regulation" title="AI Regulation" loading={loading}>
      <div className="regulation-panel">
        <div className="regulation-header">
          <h3>AI Regulation Dashboard</h3>
          <div className="regulation-tabs">
            {(['timeline', 'deadlines', 'regulations', 'countries'] as ViewMode[]).map(view => (
              <button key={view} className={`tab ${viewMode === view ? 'active' : ''}`} onClick={() => handleTabClick(view)}>
                {view.charAt(0).toUpperCase() + view.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="regulation-content">
          {renderContent()}
        </div>
      </div>
    </Panel>
  );
});
