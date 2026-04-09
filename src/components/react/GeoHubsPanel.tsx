import React, { useCallback } from 'react';
import { Panel } from './Panel';

interface GeoHubStory {
  title: string;
  link: string;
}

interface GeoHubActivity {
  hubId: string;
  name: string;
  country: string;
  type: string;
  score: number;
  newsCount: number;
  trend: 'rising' | 'falling' | 'stable';
  activityLevel: string;
  hasBreaking: boolean;
  topStories: GeoHubStory[];
}

interface GeoHubsPanelProps {
  activities?: GeoHubActivity[];
  loading?: boolean;
  onHubClick?: (hub: GeoHubActivity) => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  'USA': '\uD83C\uDDFA\uD83C\uDDF8', 'Russia': '\uD83C\uDDF7\uD83C\uDDFA', 'China': '\uD83C\uDDE8\uD83C\uDDF3',
  'UK': '\uD83C\uDDEC\uD83C\uDDE7', 'Belgium': '\uD83C\uDDE7\uD83C\uDDEA', 'Israel': '\uD83C\uDDEE\uD83C\uDDF1',
  'Iran': '\uD83C\uDDEE\uD83C\uDDF7', 'Ukraine': '\uD83C\uDDFA\uD83C\uDDE6', 'Taiwan': '\uD83C\uDDF9\uD83C\uDDFC',
  'Japan': '\uD83C\uDDEF\uD83C\uDDF5', 'South Korea': '\uD83C\uDDF0\uD83C\uDDF7', 'North Korea': '\uD83C\uDDF0\uD83C\uDDF5',
  'India': '\uD83C\uDDEE\uD83C\uDDF3', 'Saudi Arabia': '\uD83C\uDDF8\uD83C\uDDE6', 'Turkey': '\uD83C\uDDF9\uD83C\uDDF7',
  'France': '\uD83C\uDDEB\uD83C\uDDF7', 'Germany': '\uD83C\uDDE9\uD83C\uDDEA', 'International': '\uD83C\uDF10',
};

const TYPE_ICONS: Record<string, string> = {
  capital: '\uD83C\uDFDB\uFE0F', conflict: '\u2694\uFE0F', strategic: '\u2693', organization: '\uD83C\uDFE2',
};

const TYPE_LABELS: Record<string, string> = {
  capital: 'Capital', conflict: 'Conflict Zone', strategic: 'Strategic', organization: 'Organization',
};

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '\uD83C\uDF10';
}

export const GeoHubsPanel = React.memo(function GeoHubsPanel({
  activities = [],
  loading,
  onHubClick,
}: GeoHubsPanelProps) {
  const handleHubClick = useCallback((hub: GeoHubActivity) => {
    onHubClick?.(hub);
  }, [onHubClick]);

  if (activities.length === 0 && !loading) {
    return (
      <Panel id="geo-hubs" title="Geo Hubs" showCount count={0} loading={loading} infoTooltip="Geopolitical hub activity ranked by news volume and significance.">
        <div className="empty-state">No active geo hubs</div>
      </Panel>
    );
  }

  return (
    <Panel id="geo-hubs" title="Geo Hubs" showCount count={activities.length} loading={loading} infoTooltip="Geopolitical hub activity ranked by news volume and significance.">
      {activities.map((hub, index) => {
        const trendIcon = hub.trend === 'rising' ? '\u2191' : hub.trend === 'falling' ? '\u2193' : '';
        const topStory = hub.topStories[0];

        return (
          <React.Fragment key={hub.hubId}>
            <div className={`geo-hub-item ${hub.activityLevel}`} onClick={() => handleHubClick(hub)}>
              <div className="hub-rank">{index + 1}</div>
              <span className={`geo-hub-indicator ${hub.activityLevel}`} />
              <div className="hub-info">
                <div className="hub-header">
                  <span className="hub-name">{hub.name}</span>
                  <span className="hub-flag">{getFlag(hub.country)}</span>
                  {hub.hasBreaking && <span className="hub-breaking geo">ALERT</span>}
                </div>
                <div className="hub-meta">
                  <span className="hub-news-count">{hub.newsCount} {hub.newsCount === 1 ? 'story' : 'stories'}</span>
                  {trendIcon && <span className={`hub-trend ${hub.trend}`}>{trendIcon}</span>}
                  <span className="geo-hub-type">{TYPE_ICONS[hub.type] || '\uD83D\uDCCD'} {TYPE_LABELS[hub.type] || hub.type}</span>
                </div>
              </div>
              <div className="hub-score geo">{Math.round(hub.score)}</div>
            </div>
            {topStory && (
              <a className="hub-top-story geo" href={topStory.link} target="_blank" rel="noopener">
                {topStory.title.length > 80 ? topStory.title.slice(0, 77) + '...' : topStory.title}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </Panel>
  );
});
