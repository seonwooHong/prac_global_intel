import React, { useCallback } from 'react';
import { Panel } from './Panel';

interface TechHubStory {
  title: string;
  link: string;
}

interface TechHubActivity {
  hubId: string;
  city: string;
  country: string;
  score: number;
  newsCount: number;
  trend: 'rising' | 'falling' | 'stable';
  activityLevel: string;
  hasBreaking: boolean;
  tier: string;
  topStories: TechHubStory[];
}

interface TechHubsPanelProps {
  activities?: TechHubActivity[];
  loading?: boolean;
  onHubClick?: (hub: TechHubActivity) => void;
}

const COUNTRY_FLAGS: Record<string, string> = {
  'USA': '\uD83C\uDDFA\uD83C\uDDF8', 'United States': '\uD83C\uDDFA\uD83C\uDDF8',
  'UK': '\uD83C\uDDEC\uD83C\uDDE7', 'United Kingdom': '\uD83C\uDDEC\uD83C\uDDE7',
  'China': '\uD83C\uDDE8\uD83C\uDDF3', 'India': '\uD83C\uDDEE\uD83C\uDDF3',
  'Israel': '\uD83C\uDDEE\uD83C\uDDF1', 'Germany': '\uD83C\uDDE9\uD83C\uDDEA',
  'France': '\uD83C\uDDEB\uD83C\uDDF7', 'Canada': '\uD83C\uDDE8\uD83C\uDDE6',
  'Japan': '\uD83C\uDDEF\uD83C\uDDF5', 'South Korea': '\uD83C\uDDF0\uD83C\uDDF7',
  'Singapore': '\uD83C\uDDF8\uD83C\uDDEC', 'Australia': '\uD83C\uDDE6\uD83C\uDDFA',
  'Netherlands': '\uD83C\uDDF3\uD83C\uDDF1', 'Sweden': '\uD83C\uDDF8\uD83C\uDDEA',
  'Switzerland': '\uD83C\uDDE8\uD83C\uDDED', 'Brazil': '\uD83C\uDDE7\uD83C\uDDF7',
  'Taiwan': '\uD83C\uDDF9\uD83C\uDDFC',
};

function getFlag(country: string): string {
  return COUNTRY_FLAGS[country] || '\uD83C\uDF10';
}

export const TechHubsPanel = React.memo(function TechHubsPanel({
  activities = [],
  loading,
  onHubClick,
}: TechHubsPanelProps) {
  const handleHubClick = useCallback((hub: TechHubActivity) => {
    onHubClick?.(hub);
  }, [onHubClick]);

  if (activities.length === 0 && !loading) {
    return (
      <Panel id="tech-hubs" title="Tech Hubs" showCount count={0} loading={loading} infoTooltip="Top tech hub activity based on news volume and breaking stories.">
        <div className="empty-state">No active tech hubs</div>
      </Panel>
    );
  }

  return (
    <Panel id="tech-hubs" title="Tech Hubs" showCount count={activities.length} loading={loading} infoTooltip="Top tech hub activity based on news volume and breaking stories.">
      {activities.map((hub, index) => {
        const trendIcon = hub.trend === 'rising' ? '\u2191' : hub.trend === 'falling' ? '\u2193' : '';
        const topStory = hub.topStories[0];

        return (
          <React.Fragment key={hub.hubId}>
            <div className={`tech-hub-item ${hub.activityLevel}`} onClick={() => handleHubClick(hub)}>
              <div className="hub-rank">{index + 1}</div>
              <span className={`hub-indicator ${hub.activityLevel}`} />
              <div className="hub-info">
                <div className="hub-header">
                  <span className="hub-name">{hub.city}</span>
                  <span className="hub-flag">{getFlag(hub.country)}</span>
                  {hub.hasBreaking && <span className="hub-breaking">ALERT</span>}
                </div>
                <div className="hub-meta">
                  <span className="hub-news-count">{hub.newsCount} {hub.newsCount === 1 ? 'story' : 'stories'}</span>
                  {trendIcon && <span className={`hub-trend ${hub.trend}`}>{trendIcon}</span>}
                  <span className="hub-tier">{hub.tier}</span>
                </div>
              </div>
              <div className="hub-score">{Math.round(hub.score)}</div>
            </div>
            {topStory && (
              <a className="hub-top-story" href={topStory.link} target="_blank" rel="noopener">
                {topStory.title.length > 80 ? topStory.title.slice(0, 77) + '...' : topStory.title}
              </a>
            )}
          </React.Fragment>
        );
      })}
    </Panel>
  );
});
