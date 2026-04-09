import React, { useState, useMemo, useCallback } from 'react';
import { Panel } from './Panel';

type NodeFilter = 'all' | 'cable' | 'pipeline' | 'port' | 'chokepoint';

interface InfrastructureNode {
  id: string;
  name: string;
  type: string;
}

interface CascadeCountryImpact {
  countryName: string;
  impactLevel: 'critical' | 'high' | 'medium' | 'low';
  affectedCapacity: number;
}

interface CascadeRedundancy {
  name: string;
  capacityShare: number;
}

interface CascadeResult {
  source: { name: string; type: string };
  countriesAffected: CascadeCountryImpact[];
  redundancies?: CascadeRedundancy[];
}

interface GraphStats {
  nodes: number;
  edges: number;
  cables: number;
  pipelines: number;
  ports: number;
  chokepoints: number;
  countries: number;
}

interface CascadePanelProps {
  nodes?: InfrastructureNode[];
  stats?: GraphStats;
  cascadeResult?: CascadeResult | null;
  loading?: boolean;
  onAnalyze?: (nodeId: string) => void;
  onSelectNode?: (nodeId: string | null) => void;
}

const IMPACT_COLORS: Record<string, string> = {
  critical: 'var(--semantic-critical)',
  high: 'var(--semantic-high)',
  medium: 'var(--semantic-elevated)',
  low: 'var(--semantic-normal)',
};

const IMPACT_EMOJI: Record<string, string> = {
  critical: '\uD83D\uDD34',
  high: '\uD83D\uDFE0',
  medium: '\uD83D\uDFE1',
  low: '\uD83D\uDFE2',
};

const NODE_EMOJI: Record<string, string> = {
  cable: '\uD83D\uDD0C',
  pipeline: '\uD83D\uDEE2\uFE0F',
  port: '\u2693',
  chokepoint: '\uD83D\uDEA2',
  country: '\uD83C\uDFF3\uFE0F',
};

const FILTER_LABELS: Record<string, string> = {
  cable: 'Cables',
  pipeline: 'Pipelines',
  port: 'Ports',
  chokepoint: 'Chokepoints',
};

export const CascadePanel = React.memo(function CascadePanel({
  nodes = [],
  stats,
  cascadeResult,
  loading,
  onAnalyze,
  onSelectNode,
}: CascadePanelProps) {
  const [filter, setFilter] = useState<NodeFilter>('cable');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const filteredNodes = useMemo(() => {
    return nodes
      .filter(n => n.type !== 'country' && (filter === 'all' || n.type === filter))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [nodes, filter]);

  const handleFilterChange = useCallback((f: NodeFilter) => {
    setFilter(f);
    setSelectedNode(null);
    onSelectNode?.(null);
  }, [onSelectNode]);

  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value || null;
    setSelectedNode(value);
    onSelectNode?.(value);
  }, [onSelectNode]);

  const handleAnalyze = useCallback(() => {
    if (selectedNode) onAnalyze?.(selectedNode);
  }, [selectedNode, onAnalyze]);

  return (
    <Panel id="cascade" title="Infrastructure Cascade" showCount count={stats?.nodes ?? 0} loading={loading} infoTooltip="Analyze cascade failure impacts on critical infrastructure.">
      <div className="cascade-panel">
        {stats && (
          <div className="cascade-stats">
            <span>{'\uD83D\uDD0C'} {stats.cables}</span>
            <span>{'\uD83D\uDEE2\uFE0F'} {stats.pipelines}</span>
            <span>{'\u2693'} {stats.ports}</span>
            <span>{'\uD83C\uDF0A'} {stats.chokepoints}</span>
            <span>{'\uD83C\uDFF3\uFE0F'} {stats.countries}</span>
            <span>{'\uD83D\uDCCA'} {stats.edges} links</span>
          </div>
        )}

        <div className="cascade-selector">
          <div className="cascade-filters">
            {(['cable', 'pipeline', 'port', 'chokepoint'] as const).map(f => (
              <button key={f} className={`cascade-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => handleFilterChange(f)}>
                {NODE_EMOJI[f]} {FILTER_LABELS[f]}
              </button>
            ))}
          </div>
          <select className="cascade-select" value={selectedNode ?? ''} onChange={handleSelectChange} disabled={filteredNodes.length === 0}>
            <option value="">Select a {filter}...</option>
            {filteredNodes.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>
          <button className="cascade-analyze-btn" disabled={!selectedNode} onClick={handleAnalyze}>
            Analyze Impact
          </button>
        </div>

        {cascadeResult ? (
          <div className="cascade-result">
            <div className="cascade-source">
              <span className="cascade-emoji">{NODE_EMOJI[cascadeResult.source.type] ?? '\uD83D\uDCCD'}</span>
              <span className="cascade-source-name">{cascadeResult.source.name}</span>
              <span className="cascade-source-type">{cascadeResult.source.type}</span>
            </div>
            <div className="cascade-section">
              <div className="cascade-section-title">Countries Affected ({cascadeResult.countriesAffected.length})</div>
              <div className="cascade-countries">
                {cascadeResult.countriesAffected.length > 0 ? (
                  cascadeResult.countriesAffected.map((c, i) => (
                    <div key={i} className="cascade-country" style={{ borderLeft: `3px solid ${IMPACT_COLORS[c.impactLevel]}` }}>
                      <span className="cascade-emoji">{IMPACT_EMOJI[c.impactLevel]}</span>
                      <span className="cascade-country-name">{c.countryName}</span>
                      <span className="cascade-impact">{c.impactLevel}</span>
                      {c.affectedCapacity > 0 && <span className="cascade-capacity">{Math.round(c.affectedCapacity * 100)}%</span>}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">No country impacts</div>
                )}
              </div>
            </div>
            {cascadeResult.redundancies && cascadeResult.redundancies.length > 0 && (
              <div className="cascade-section">
                <div className="cascade-section-title">Alternative Routes</div>
                {cascadeResult.redundancies.map((r, i) => (
                  <div key={i} className="cascade-redundancy">
                    <span className="cascade-redundancy-name">{r.name}</span>
                    <span className="cascade-redundancy-capacity">{Math.round(r.capacityShare * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="cascade-hint">Select an infrastructure node and click Analyze to see cascade impacts.</div>
        )}
      </div>
    </Panel>
  );
});
