import React from 'react';
import { Panel } from './Panel';
import type { GdeltArticle, IntelTopic } from '@/services/gdelt-intel';
import { getIntelTopics, extractDomain, formatArticleDate } from '@/services/gdelt-intel';

interface GdeltIntelPanelProps {
  articles: GdeltArticle[];
  activeTopic?: IntelTopic;
  loading?: boolean;
  error?: string | null;
  onTopicChange?: (topic: IntelTopic) => void;
}

export const GdeltIntelPanel = React.memo(function GdeltIntelPanel({
  articles,
  activeTopic,
  loading,
  error,
  onTopicChange,
}: GdeltIntelPanelProps) {
  const topics = getIntelTopics();
  const currentTopic = activeTopic || topics[0]!;

  return (
    <Panel
      id="gdelt-intel"
      title="GDELT Intel"
      showCount
      count={articles.length}
      loading={loading}
      error={error || undefined}
      infoTooltip="Real-time intelligence from GDELT project covering global news in multiple languages."
    >
      <div className="gdelt-intel-tabs">
        {topics.map((topic) => (
          <button
            key={topic.id}
            className={`gdelt-intel-tab ${topic.id === currentTopic.id ? 'active' : ''}`}
            title={topic.description}
            onClick={() => onTopicChange?.(topic)}
          >
            <span className="tab-icon">{topic.icon}</span>
            <span className="tab-label">{topic.name}</span>
          </button>
        ))}
      </div>

      {articles.length === 0 ? (
        <div className="empty-state">No intelligence articles available</div>
      ) : (
        <div className="gdelt-intel-articles">
          {articles.map((article, i) => {
            const domain = article.source || extractDomain(article.url);
            const timeAgo = formatArticleDate(article.date);
            const toneClass = article.tone ? (article.tone < -2 ? 'tone-negative' : article.tone > 2 ? 'tone-positive' : '') : '';
            return (
              <a key={i} href={article.url} target="_blank" rel="noopener" className={`gdelt-intel-article ${toneClass}`}>
                <div className="article-header">
                  <span className="article-source">{domain}</span>
                  <span className="article-time">{timeAgo}</span>
                </div>
                <div className="article-title">{article.title}</div>
              </a>
            );
          })}
        </div>
      )}
    </Panel>
  );
});
