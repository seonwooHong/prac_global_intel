import React, { useState, useMemo, useCallback } from 'react';
import { Panel } from './Panel';

interface ServiceStatus {
  id: string;
  name: string;
  category: string;
  status: 'operational' | 'degraded' | 'outage' | 'unknown';
  description: string;
}

type CategoryFilter = 'all' | 'cloud' | 'dev' | 'comm' | 'ai' | 'saas';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  cloud: 'Cloud',
  dev: 'Dev Tools',
  comm: 'Comms',
  ai: 'AI',
  saas: 'SaaS',
};

interface ServiceStatusPanelProps {
  services?: ServiceStatus[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

function getStatusIcon(status: string): string {
  switch (status) {
    case 'operational': return '\u25CF';
    case 'degraded': return '\u25D0';
    case 'outage': return '\u25CB';
    default: return '?';
  }
}

export const ServiceStatusPanel = React.memo(function ServiceStatusPanel({
  services = [],
  loading,
  error,
  onRetry,
}: ServiceStatusPanelProps) {
  const [filter, setFilter] = useState<CategoryFilter>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return services;
    return services.filter(s => s.category === filter);
  }, [services, filter]);

  const summary = useMemo(() => ({
    operational: filtered.filter(s => s.status === 'operational').length,
    degraded: filtered.filter(s => s.status === 'degraded').length,
    outage: filtered.filter(s => s.status === 'outage').length,
  }), [filtered]);

  const issues = useMemo(() => filtered.filter(s => s.status !== 'operational'), [filtered]);

  const handleFilterClick = useCallback((f: CategoryFilter) => {
    setFilter(f);
  }, []);

  return (
    <Panel id="service-status" title="Service Status" loading={loading} error={error}>
      <div className="service-status-summary">
        <div className="summary-item operational">
          <span className="summary-count">{summary.operational}</span>
          <span className="summary-label">OK</span>
        </div>
        <div className="summary-item degraded">
          <span className="summary-count">{summary.degraded}</span>
          <span className="summary-label">Degraded</span>
        </div>
        <div className="summary-item outage">
          <span className="summary-count">{summary.outage}</span>
          <span className="summary-label">Outage</span>
        </div>
      </div>

      <div className="service-status-filters">
        {(Object.entries(CATEGORY_LABELS) as [CategoryFilter, string][]).map(([key, label]) => (
          <button key={key} className={`status-filter-btn ${filter === key ? 'active' : ''}`} onClick={() => handleFilterClick(key)}>
            {label}
          </button>
        ))}
      </div>

      <div className="service-status-list">
        {filtered.map(service => (
          <div key={service.id} className={`service-status-item ${service.status}`}>
            <span className="status-icon">{getStatusIcon(service.status)}</span>
            <span className="status-name">{service.name}</span>
            <span className={`status-badge ${service.status}`}>{service.status.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {issues.length === 0 && <div className="all-operational">All services operational</div>}

      {error && onRetry && (
        <button className="retry-btn" onClick={onRetry}>Retry</button>
      )}
    </Panel>
  );
});
