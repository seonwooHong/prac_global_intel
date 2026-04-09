import React, { useState, useMemo, useCallback } from 'react';
import { Panel } from './Panel';

interface GulfInvestment {
  id: string;
  assetName: string;
  investingCountry: string;
  investingEntity: string;
  targetCountry: string;
  sector: string;
  status: string;
  investmentUSD?: number;
  yearAnnounced?: number;
  yearOperational?: number;
  description: string;
  lat?: number;
  lon?: number;
}

interface InvestmentsPanelProps {
  investments?: GulfInvestment[];
  loading?: boolean;
  onInvestmentClick?: (inv: GulfInvestment) => void;
}

const SECTOR_LABELS: Record<string, string> = {
  ports: 'Ports', pipelines: 'Pipelines', energy: 'Energy', datacenters: 'Data Centers',
  airports: 'Airports', railways: 'Railways', telecoms: 'Telecoms', water: 'Water',
  logistics: 'Logistics', mining: 'Mining', 'real-estate': 'Real Estate', manufacturing: 'Manufacturing',
};

const STATUS_COLORS: Record<string, string> = {
  'operational': '#02bd75', 'under-construction': '#f59e0b', 'announced': '#60a5fa',
  'rumoured': '#a78bfa', 'cancelled': '#e0345c', 'divested': '#6b7280',
};

const FLAG: Record<string, string> = { SA: '\uD83C\uDDF8\uD83C\uDDE6', UAE: '\uD83C\uDDE6\uD83C\uDDEA' };

function formatUSD(usd?: number): string {
  if (usd === undefined) return 'Undisclosed';
  if (usd >= 100000) return `$${(usd / 1000).toFixed(0)}B`;
  if (usd >= 1000) return `$${(usd / 1000).toFixed(1)}B`;
  return `$${usd.toLocaleString()}M`;
}

interface Filters {
  investingCountry: string;
  sector: string;
  entity: string;
  status: string;
  search: string;
}

export const InvestmentsPanel = React.memo(function InvestmentsPanel({
  investments = [],
  loading,
  onInvestmentClick,
}: InvestmentsPanelProps) {
  const [filters, setFilters] = useState<Filters>({
    investingCountry: 'ALL', sector: 'ALL', entity: 'ALL', status: 'ALL', search: '',
  });
  const [sortKey, setSortKey] = useState<string>('assetName');
  const [sortAsc, setSortAsc] = useState(true);

  const entities = useMemo(() => Array.from(new Set(investments.map(i => i.investingEntity))).sort(), [investments]);
  const sectors = useMemo(() => Array.from(new Set(investments.map(i => i.sector))).sort(), [investments]);

  const filtered = useMemo(() => {
    const { investingCountry, sector, entity, status, search } = filters;
    const q = search.toLowerCase();

    return investments
      .filter(inv => {
        if (investingCountry !== 'ALL' && inv.investingCountry !== investingCountry) return false;
        if (sector !== 'ALL' && inv.sector !== sector) return false;
        if (entity !== 'ALL' && inv.investingEntity !== entity) return false;
        if (status !== 'ALL' && inv.status !== status) return false;
        if (q && !inv.assetName.toLowerCase().includes(q)
          && !inv.targetCountry.toLowerCase().includes(q)
          && !inv.description.toLowerCase().includes(q)
          && !inv.investingEntity.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortKey] ?? '';
        const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? '';
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortAsc ? cmp : -cmp;
      });
  }, [investments, filters, sortKey, sortAsc]);

  const handleFilterChange = useCallback((key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSort = useCallback((key: string) => {
    setSortKey(prev => {
      if (prev === key) {
        setSortAsc(a => !a);
        return prev;
      }
      setSortAsc(true);
      return key;
    });
  }, []);

  const sortArrow = (key: string) => sortKey === key ? (sortAsc ? ' \u2191' : ' \u2193') : '';

  return (
    <Panel id="gcc-investments" title="GCC Investments" showCount count={filtered.length} loading={loading} infoTooltip="Gulf Cooperation Council foreign direct investments in critical infrastructure.">
      <div className="fdi-toolbar">
        <input
          className="fdi-search"
          type="text"
          placeholder="Search assets, countries, entities..."
          value={filters.search}
          onChange={e => handleFilterChange('search', e.target.value)}
        />
        <select className="fdi-filter" value={filters.investingCountry} onChange={e => handleFilterChange('investingCountry', e.target.value)}>
          <option value="ALL">{'\uD83C\uDF10'} All Countries</option>
          <option value="SA">{'\uD83C\uDDF8\uD83C\uDDE6'} Saudi Arabia</option>
          <option value="UAE">{'\uD83C\uDDE6\uD83C\uDDEA'} UAE</option>
        </select>
        <select className="fdi-filter" value={filters.sector} onChange={e => handleFilterChange('sector', e.target.value)}>
          <option value="ALL">All Sectors</option>
          {sectors.map(s => <option key={s} value={s}>{SECTOR_LABELS[s] || s}</option>)}
        </select>
        <select className="fdi-filter" value={filters.entity} onChange={e => handleFilterChange('entity', e.target.value)}>
          <option value="ALL">All Entities</option>
          {entities.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
        <select className="fdi-filter" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)}>
          <option value="ALL">All Statuses</option>
          <option value="operational">Operational</option>
          <option value="under-construction">Under Construction</option>
          <option value="announced">Announced</option>
          <option value="rumoured">Rumoured</option>
          <option value="divested">Divested</option>
        </select>
      </div>
      <div className="fdi-table-wrap">
        <table className="fdi-table">
          <thead>
            <tr>
              <th className="fdi-sort" onClick={() => handleSort('assetName')}>Asset{sortArrow('assetName')}</th>
              <th className="fdi-sort" onClick={() => handleSort('targetCountry')}>Country{sortArrow('targetCountry')}</th>
              <th className="fdi-sort" onClick={() => handleSort('sector')}>Sector{sortArrow('sector')}</th>
              <th className="fdi-sort" onClick={() => handleSort('status')}>Status{sortArrow('status')}</th>
              <th className="fdi-sort" onClick={() => handleSort('investmentUSD')}>Investment{sortArrow('investmentUSD')}</th>
              <th className="fdi-sort" onClick={() => handleSort('yearAnnounced')}>Year{sortArrow('yearAnnounced')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map(inv => {
              const statusColor = STATUS_COLORS[inv.status] || '#6b7280';
              const flag = FLAG[inv.investingCountry] || '';
              const sector = SECTOR_LABELS[inv.sector] || inv.sector;
              return (
                <tr key={inv.id} className="fdi-row" style={{ cursor: 'pointer' }} onClick={() => onInvestmentClick?.(inv)}>
                  <td className="fdi-asset">
                    <span className="fdi-flag">{flag}</span>
                    <strong>{inv.assetName}</strong>
                    <div className="fdi-entity-sub">{inv.investingEntity}</div>
                  </td>
                  <td>{inv.targetCountry}</td>
                  <td><span className="fdi-sector-badge">{sector}</span></td>
                  <td><span className="fdi-status-dot" style={{ background: statusColor }} />{inv.status}</td>
                  <td className="fdi-usd">{formatUSD(inv.investmentUSD)}</td>
                  <td>{inv.yearAnnounced ?? inv.yearOperational ?? '\u2014'}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="fdi-empty">No investments match filters</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
});
