import React, { useState, useMemo, useCallback } from 'react';

type StatusLevel = 'ok' | 'warning' | 'error' | 'disabled';

interface FeedStatus {
  name: string;
  lastUpdate: Date | null;
  status: StatusLevel;
  itemCount: number;
  errorMessage?: string;
}

interface ApiStatus {
  name: string;
  status: StatusLevel;
  latency?: number;
}

interface StatusPanelProps {
  feeds?: Map<string, FeedStatus> | FeedStatus[];
  apis?: Map<string, ApiStatus> | ApiStatus[];
  storageUsedMB?: string;
  storageQuotaMB?: string;
}

function formatTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function toArray<T>(input: Map<string, T> | T[] | undefined): T[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return [...input.values()];
}

export const StatusPanel = React.memo(function StatusPanel({
  feeds,
  apis,
  storageUsedMB,
  storageQuotaMB,
}: StatusPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const feedList = useMemo(() => toArray(feeds), [feeds]);
  const apiList = useMemo(() => toArray(apis), [apis]);

  const enabledFeeds = useMemo(() => feedList.filter(f => f.status !== 'disabled'), [feedList]);
  const enabledApis = useMemo(() => apiList.filter(a => a.status !== 'disabled'), [apiList]);

  const statusClass = useMemo(() => {
    const hasError = enabledFeeds.some(f => f.status === 'error') || enabledApis.some(a => a.status === 'error');
    const hasWarning = enabledFeeds.some(f => f.status === 'warning') || enabledApis.some(a => a.status === 'warning');
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'ok';
  }, [enabledFeeds, enabledApis]);

  const handleToggle = useCallback(() => setIsOpen(prev => !prev), []);
  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <div className="status-panel-container">
      <button className="status-panel-toggle" title="System Status" onClick={handleToggle}>
        <span className={`status-icon ${statusClass}`}>{'\u25C9'}</span>
      </button>
      <div className={`status-panel ${isOpen ? '' : 'hidden'}`}>
        <div className="status-panel-header">
          <span>System Status</span>
          <button className="status-panel-close" onClick={handleClose}>{'\u00D7'}</button>
        </div>
        <div className="status-panel-content">
          <div className="status-section">
            <div className="status-section-title">Data Feeds</div>
            <div className="feeds-list">
              {feedList.map(feed => (
                <div key={feed.name} className="status-row">
                  <span className={`status-dot ${feed.status}`} />
                  <span className="status-name">{feed.name}</span>
                  <span className="status-detail">{feed.itemCount} items</span>
                  <span className="status-time">{feed.lastUpdate ? formatTime(feed.lastUpdate) : 'Never'}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="status-section">
            <div className="status-section-title">API Status</div>
            <div className="apis-list">
              {apiList.map(api => (
                <div key={api.name} className="status-row">
                  <span className={`status-dot ${api.status}`} />
                  <span className="status-name">{api.name}</span>
                  {api.latency !== undefined && <span className="status-detail">{api.latency}ms</span>}
                </div>
              ))}
            </div>
          </div>
          <div className="status-section">
            <div className="status-section-title">Storage</div>
            <div className="storage-info">
              {storageUsedMB ? (
                <div className="status-row">
                  <span className="status-name">IndexedDB</span>
                  <span className="status-detail">{storageUsedMB} MB / {storageQuotaMB ?? 'N/A'} MB</span>
                </div>
              ) : (
                <div className="status-row">Storage info unavailable</div>
              )}
            </div>
          </div>
        </div>
        <div className="status-panel-footer">
          <span className="last-check">Updated: {formatTime(new Date())}</span>
        </div>
      </div>
    </div>
  );
});
