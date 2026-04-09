import React, { useMemo } from 'react';
import { Panel } from './Panel';

export interface NewsCluster {
  id: string;
  primaryTitle: string;
  primarySource: string;
  primaryLink: string;
  sourceCount: number;
  lastUpdated: Date;
  isAlert?: boolean;
  monitorColor?: string;
  lang?: string;
  threat?: {
    level: 'critical' | 'high' | 'medium' | 'low' | 'info';
    category: string;
  };
  velocity?: {
    level: string;
    trend: string;
    sourcesPerHour: number;
    sentiment?: string;
    sentimentScore?: number;
  };
  topSources: Array<{ name: string; tier: number }>;
}

export interface NewsPanelProps {
  clusters: NewsCluster[];
  loading?: boolean;
  error?: string;
  className?: string;
  /** Items that should show the "new" highlight */
  newItemIds?: Set<string>;
  /** Items that should show the NEW tag */
  newTagIds?: Set<string>;
  onClusterClick?: (cluster: NewsCluster) => void;
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const THREAT_COLOR_MAP: Record<string, string> = {
  critical: 'var(--threat-critical)',
  high: 'var(--threat-high)',
  medium: 'var(--threat-medium)',
  low: 'var(--threat-low)',
  info: 'var(--threat-info)',
};

const NewsClusterItem = React.memo(function NewsClusterItem({
  cluster,
  isNew,
  showNewTag,
  shouldHighlight,
}: {
  cluster: NewsCluster;
  isNew: boolean;
  showNewTag: boolean;
  shouldHighlight: boolean;
}) {
  const itemClasses = useMemo(() => {
    const parts = ['item', 'clustered'];
    if (cluster.isAlert) parts.push('alert');
    if (shouldHighlight) parts.push('item-new-highlight');
    if (isNew) parts.push('item-new');
    return parts.join(' ');
  }, [cluster.isAlert, shouldHighlight, isNew]);

  const style = cluster.monitorColor
    ? { borderInlineStartColor: cluster.monitorColor }
    : undefined;

  const velocity = cluster.velocity;
  const catLabel = cluster.threat?.category && cluster.threat.category !== 'general'
    ? cluster.threat.category.charAt(0).toUpperCase() + cluster.threat.category.slice(1)
    : null;
  const catColor = cluster.threat ? (THREAT_COLOR_MAP[cluster.threat.level] || 'var(--text-dim)') : '';

  const otherSources = cluster.topSources.filter(s => s.name !== cluster.primarySource);

  return (
    <div
      className={itemClasses}
      style={style}
      data-cluster-id={cluster.id}
      data-news-id={cluster.primaryLink}
    >
      <div className="item-source">
        {cluster.primarySource}
        {cluster.lang && (
          <span className="lang-badge">{cluster.lang.toUpperCase()}</span>
        )}
        {showNewTag && <span className="new-tag">NEW</span>}
        {cluster.sourceCount > 1 && (
          <span className="source-count">{cluster.sourceCount} sources</span>
        )}
        {velocity && velocity.level !== 'normal' && cluster.sourceCount > 1 && (
          <span className={`velocity-badge ${velocity.level}`}>
            {velocity.trend === 'rising' ? '\u2191' : ''}+{velocity.sourcesPerHour}/hr
          </span>
        )}
        {velocity?.sentiment && Math.abs(velocity.sentimentScore || 0) > 2 && (
          <span className={`sentiment-badge ${velocity.sentiment}`}>
            {velocity.sentiment === 'negative' ? '\u26A0' : velocity.sentiment === 'positive' ? '\u2713' : ''}
          </span>
        )}
        {cluster.isAlert && <span className="alert-tag">ALERT</span>}
        {catLabel && (
          <span
            className="category-tag"
            style={{
              color: catColor,
              borderColor: `${catColor}40`,
              background: `${catColor}20`,
            }}
          >
            {catLabel}
          </span>
        )}
      </div>

      <a
        className="item-title"
        href={cluster.primaryLink}
        target="_blank"
        rel="noopener"
      >
        {cluster.primaryTitle}
      </a>

      <div className="cluster-meta">
        <span className="top-sources">
          {otherSources.length > 0 && (
            <>
              <span className="also-reported">Also:</span>
              {otherSources.map((s, i) => (
                <span key={i} className={`top-source tier-${s.tier}`}>
                  {s.name}
                </span>
              ))}
            </>
          )}
        </span>
        <span className="item-time">{formatTimeAgo(cluster.lastUpdated)}</span>
      </div>
    </div>
  );
});

const THREAT_PRIORITY: Record<string, number> = {
  critical: 5,
  high: 4,
  medium: 3,
  low: 2,
  info: 1,
};

export const NewsPanel = React.memo(function NewsPanel({
  clusters,
  loading,
  error,
  className,
  newItemIds,
  newTagIds,
}: NewsPanelProps) {
  const sorted = useMemo(() => {
    return [...clusters].sort((a, b) => {
      const pa = THREAT_PRIORITY[a.threat?.level ?? 'info'] ?? 0;
      const pb = THREAT_PRIORITY[b.threat?.level ?? 'info'] ?? 0;
      if (pb !== pa) return pb - pa;
      return b.lastUpdated.getTime() - a.lastUpdated.getTime();
    });
  }, [clusters]);

  const totalItems = useMemo(
    () => sorted.reduce((sum, c) => sum + c.sourceCount, 0),
    [sorted],
  );

  const dataBadge = useMemo(() => {
    if (loading) return null;
    if (error || clusters.length === 0) return { state: 'unavailable' as const };
    return { state: 'live' as const };
  }, [loading, error, clusters.length]);

  return (
    <Panel
      id="news"
      title="News"
      showCount
      count={totalItems}
      className={className}
      loading={loading}
      error={error}
      dataBadge={dataBadge}
    >
      {sorted.map((cluster) => (
        <NewsClusterItem
          key={cluster.id}
          cluster={cluster}
          isNew={newItemIds?.has(cluster.id) ?? false}
          showNewTag={newTagIds?.has(cluster.id) ?? false}
          shouldHighlight={newItemIds?.has(cluster.id) ?? false}
        />
      ))}
    </Panel>
  );
});
