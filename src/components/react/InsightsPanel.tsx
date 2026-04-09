import React from 'react';
import { Panel } from './Panel';
import type { ClusteredEvent, FocalPoint } from '@/types';
import type { RegionalConvergence } from '@/services/signal-aggregator';
import type { AnalyzedHeadline } from '@/services/parallel-analysis';

interface InsightsPanelProps {
  clusters: ClusteredEvent[];
  sentiments?: Array<{ label: string; score: number }> | null;
  worldBrief?: string | null;
  convergenceZones?: RegionalConvergence[];
  focalPoints?: FocalPoint[];
  missedStories?: AnalyzedHeadline[];
  dataBadge?: 'live' | 'cached' | 'unavailable' | null;
  loading?: boolean;
  progressStep?: number;
  progressTotal?: number;
  progressMessage?: string;
  siteVariant?: 'full' | 'tech';
}

export const InsightsPanel = React.memo(function InsightsPanel({
  clusters,
  sentiments,
  worldBrief,
  convergenceZones = [],
  focalPoints = [],
  missedStories = [],
  dataBadge,
  loading,
  progressStep,
  progressTotal,
  progressMessage,
  siteVariant = 'full',
}: InsightsPanelProps) {
  const badgeProp = dataBadge ? { state: dataBadge as 'live' | 'cached' | 'unavailable' } : null;

  if (loading && progressStep && progressTotal) {
    const percent = Math.round((progressStep / progressTotal) * 100);
    return (
      <Panel id="insights" title="Insights" dataBadge={badgeProp} infoTooltip="AI-powered analysis combining multi-source confirmation, sentiment analysis, and geographic signal correlation.">
        <div className="insights-progress">
          <div className="insights-progress-bar">
            <div className="insights-progress-fill" style={{ width: `${percent}%` }} />
          </div>
          <div className="insights-progress-info">
            <span className="insights-progress-step">Step {progressStep}/{progressTotal}</span>
            <span className="insights-progress-message">{progressMessage}</span>
          </div>
        </div>
      </Panel>
    );
  }

  if (clusters.length === 0) {
    return (
      <Panel id="insights" title="Insights" dataBadge={badgeProp} loading={loading}>
        <div className="insights-empty">Waiting for news data...</div>
      </Panel>
    );
  }

  // Sentiment overview
  const negative = sentiments?.filter((s) => s.label === 'negative').length || 0;
  const positive = sentiments?.filter((s) => s.label === 'positive').length || 0;
  const neutral = (sentiments?.length || 0) - negative - positive;
  const total = sentiments?.length || 0;
  const negPct = total > 0 ? Math.round((negative / total) * 100) : 0;
  const neuPct = total > 0 ? Math.round((neutral / total) * 100) : 0;
  const posPct = 100 - negPct - neuPct;
  let toneLabel = 'Mixed', toneClass = 'neutral';
  if (negative > positive + neutral) { toneLabel = 'Negative'; toneClass = 'negative'; }
  else if (positive > negative + neutral) { toneLabel = 'Positive'; toneClass = 'positive'; }

  const multiSource = clusters.filter((c) => c.sourceCount >= 2).length;
  const fastMoving = clusters.filter((c) => c.velocity && c.velocity.level !== 'normal').length;
  const alerts = clusters.filter((c) => c.isAlert).length;

  const signalIcons: Record<string, string> = {
    internet_outage: '🌐', military_flight: '✈️', military_vessel: '🚢', protest: '🪧', ais_disruption: '⚓',
  };
  const fpIcons: Record<string, string> = {
    internet_outage: '🌐', military_flight: '✈️', military_vessel: '⚓', protest: '📢', ais_disruption: '🚢',
  };

  const correlatedFPs = focalPoints.filter((fp) => fp.newsMentions > 0 && fp.signalCount > 0).slice(0, 5);

  return (
    <Panel id="insights" title="Insights" dataBadge={badgeProp}>
      {worldBrief && (
        <div className="insights-brief">
          <div className="insights-section-title">{siteVariant === 'tech' ? '🚀 TECH BRIEF' : '🌍 WORLD BRIEF'}</div>
          <div className="insights-brief-text">{worldBrief}</div>
        </div>
      )}

      {correlatedFPs.length > 0 && (
        <div className="insights-section insights-focal">
          <div className="insights-section-title">🎯 FOCAL POINTS</div>
          {correlatedFPs.map((fp, i) => {
            const icons = fp.signalTypes.map((t) => fpIcons[t] || '').join(' ');
            const headline = fp.topHeadlines[0];
            return (
              <div className={`focal-point ${fp.urgency}`} key={i}>
                <div className="focal-point-header">
                  <span className="focal-point-name">{fp.displayName}</span>
                  <span className={`focal-point-urgency ${fp.urgency}`}>{fp.urgency.toUpperCase()}</span>
                </div>
                <div className="focal-point-signals">{icons}</div>
                <div className="focal-point-stats">{fp.newsMentions} news · {fp.signalCount} signals</div>
                {headline?.title && headline?.url && (
                  <a href={headline.url} target="_blank" rel="noopener" className="focal-point-headline">
                    &ldquo;{headline.title.slice(0, 60)}...&rdquo;
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      {convergenceZones.length > 0 && (
        <div className="insights-section insights-convergence">
          <div className="insights-section-title">📍 GEOGRAPHIC CONVERGENCE</div>
          {convergenceZones.slice(0, 3).map((zone, i) => {
            const icons = zone.signalTypes.map((t) => signalIcons[t] || '📍').join('');
            return (
              <div className="convergence-zone" key={i}>
                <div className="convergence-region">{icons} {zone.region}</div>
                <div className="convergence-description">{zone.description}</div>
                <div className="convergence-stats">{zone.signalTypes.length} signal types · {zone.totalSignals} events</div>
              </div>
            );
          })}
        </div>
      )}

      {sentiments && sentiments.length > 0 && (
        <div className="insights-sentiment-bar">
          <div className="sentiment-bar-track">
            <div className="sentiment-bar-negative" style={{ width: `${negPct}%` }} />
            <div className="sentiment-bar-neutral" style={{ width: `${neuPct}%` }} />
            <div className="sentiment-bar-positive" style={{ width: `${posPct}%` }} />
          </div>
          <div className="sentiment-bar-labels">
            <span className="sentiment-label negative">{negative}</span>
            <span className="sentiment-label neutral">{neutral}</span>
            <span className="sentiment-label positive">{positive}</span>
          </div>
          <div className={`sentiment-tone ${toneClass}`}>Overall: {toneLabel}</div>
        </div>
      )}

      <div className="insights-stats">
        <div className="insight-stat">
          <span className="insight-stat-value">{multiSource}</span>
          <span className="insight-stat-label">Multi-source</span>
        </div>
        <div className="insight-stat">
          <span className="insight-stat-value">{fastMoving}</span>
          <span className="insight-stat-label">Fast-moving</span>
        </div>
        {alerts > 0 && (
          <div className="insight-stat alert">
            <span className="insight-stat-value">{alerts}</span>
            <span className="insight-stat-label">Alerts</span>
          </div>
        )}
      </div>

      <div className="insights-section">
        <div className="insights-section-title">BREAKING & CONFIRMED</div>
        {clusters.map((cluster, i) => {
          const sentiment = sentiments?.[i];
          const sentimentClass = sentiment?.label === 'negative' ? 'negative' : sentiment?.label === 'positive' ? 'positive' : 'neutral';
          const badges: React.ReactNode[] = [];
          if (cluster.sourceCount >= 3) badges.push(<span key="src" className="insight-badge confirmed">✓ {cluster.sourceCount} sources</span>);
          else if (cluster.sourceCount >= 2) badges.push(<span key="src" className="insight-badge multi">{cluster.sourceCount} sources</span>);
          if (cluster.velocity && cluster.velocity.level !== 'normal') {
            const velIcon = cluster.velocity.trend === 'rising' ? '↑' : '';
            badges.push(<span key="vel" className={`insight-badge velocity ${cluster.velocity.level}`}>{velIcon}+{cluster.velocity.sourcesPerHour}/hr</span>);
          }
          if (cluster.isAlert) badges.push(<span key="alert" className="insight-badge alert">⚠ ALERT</span>);
          return (
            <div className="insight-story" key={i}>
              <div className="insight-story-header">
                <span className={`insight-sentiment-dot ${sentimentClass}`} />
                <span className="insight-story-title">{cluster.primaryTitle.slice(0, 100)}{cluster.primaryTitle.length > 100 ? '...' : ''}</span>
              </div>
              {badges.length > 0 && <div className="insight-badges">{badges}</div>}
            </div>
          );
        })}
      </div>

      {missedStories.length > 0 && (
        <div className="insights-section insights-missed">
          <div className="insights-section-title">🎯 ML DETECTED</div>
          {missedStories.slice(0, 3).map((story, i) => {
            const topPerspective = story.perspectives.filter((p) => p.name !== 'keywords').sort((a, b) => b.score - a.score)[0];
            return (
              <div className="insight-story missed" key={i}>
                <div className="insight-story-header">
                  <span className="insight-sentiment-dot ml-flagged" />
                  <span className="insight-story-title">{story.title.slice(0, 80)}{story.title.length > 80 ? '...' : ''}</span>
                </div>
                <div className="insight-badges">
                  <span className="insight-badge ml-detected">🔬 {topPerspective?.name ?? 'ml'}: {((topPerspective?.score ?? 0) * 100).toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
});
