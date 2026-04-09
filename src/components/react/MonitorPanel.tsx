import React, { useState, useCallback } from 'react';
import { Panel } from './Panel';
import type { Monitor, NewsItem } from '@/types';
import { MONITOR_COLORS } from '@/config';
import { generateId, formatTime, getCSSColor } from '@/utils';

interface MonitorPanelProps {
  monitors: Monitor[];
  news: NewsItem[];
  onMonitorsChange?: (monitors: Monitor[]) => void;
}

export const MonitorPanel = React.memo(function MonitorPanel({
  monitors,
  news,
  onMonitorsChange,
}: MonitorPanelProps) {
  const [inputValue, setInputValue] = useState('');

  const addMonitor = useCallback(() => {
    const keywords = inputValue.trim();
    if (!keywords) return;
    const monitor: Monitor = {
      id: generateId(),
      keywords: keywords.split(',').map((k) => k.trim().toLowerCase()),
      color: MONITOR_COLORS[monitors.length % MONITOR_COLORS.length] ?? getCSSColor('--status-live'),
    };
    onMonitorsChange?.([...monitors, monitor]);
    setInputValue('');
  }, [inputValue, monitors, onMonitorsChange]);

  const removeMonitor = useCallback(
    (id: string) => {
      onMonitorsChange?.(monitors.filter((m) => m.id !== id));
    },
    [monitors, onMonitorsChange],
  );

  // Match news against monitors
  const matchedItems: NewsItem[] = [];
  news.forEach((item) => {
    monitors.forEach((monitor) => {
      const searchText = `${item.title} ${(item as unknown as { description?: string }).description || ''}`.toLowerCase();
      const matched = monitor.keywords.some((kw) => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(searchText);
      });
      if (matched) {
        matchedItems.push({ ...item, monitorColor: monitor.color });
      }
    });
  });

  const seen = new Set<string>();
  const unique = matchedItems.filter((item) => {
    if (seen.has(item.link)) return false;
    seen.add(item.link);
    return true;
  });

  return (
    <Panel id="monitors" title="Monitors">
      <div className="monitor-input-container">
        <input
          type="text"
          className="monitor-input"
          placeholder="Enter keywords (comma-separated)"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') addMonitor();
          }}
        />
        <button className="monitor-add-btn" onClick={addMonitor}>
          Add
        </button>
      </div>

      <div id="monitorsList">
        {monitors.map((m) => (
          <span className="monitor-tag" key={m.id}>
            <span className="monitor-tag-color" style={{ background: m.color }} />
            {m.keywords.join(', ')}
            <span className="monitor-tag-remove" onClick={() => removeMonitor(m.id)}>
              x
            </span>
          </span>
        ))}
      </div>

      <div id="monitorsResults">
        {monitors.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 12 }}>
            Add keywords to monitor news
          </div>
        ) : unique.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: 10, marginTop: 12 }}>
            No matches found in {news.length} articles
          </div>
        ) : (
          <>
            <div style={{ color: 'var(--text-dim)', fontSize: 10, margin: '12px 0 8px' }}>
              {unique.length > 10
                ? `Showing 10 of ${unique.length} matches`
                : `${unique.length} ${unique.length === 1 ? 'match' : 'matches'}`}
            </div>
            {unique.slice(0, 10).map((item, i) => (
              <div
                key={i}
                className="item"
                style={{
                  borderLeft: `2px solid ${item.monitorColor || ''}`,
                  paddingLeft: 8,
                  marginLeft: -8,
                }}
              >
                <div className="item-source">{item.source}</div>
                <a className="item-title" href={item.link} target="_blank" rel="noopener">
                  {item.title}
                </a>
                <div className="item-time">{formatTime(item.pubDate)}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </Panel>
  );
});
