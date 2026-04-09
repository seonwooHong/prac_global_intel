import React, { useMemo } from 'react';
import { Panel } from './Panel';

interface TechReadinessScore {
  country: string;
  countryName: string;
  rank: number;
  score: number;
  components: {
    internet: number | null;
    mobile: number | null;
    rdSpend: number | null;
  };
}

interface TechReadinessPanelProps {
  rankings?: TechReadinessScore[];
  loading?: boolean;
  lastFetch?: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  'USA': '\uD83C\uDDFA\uD83C\uDDF8', 'CHN': '\uD83C\uDDE8\uD83C\uDDF3', 'JPN': '\uD83C\uDDEF\uD83C\uDDF5', 'DEU': '\uD83C\uDDE9\uD83C\uDDEA', 'KOR': '\uD83C\uDDF0\uD83C\uDDF7',
  'GBR': '\uD83C\uDDEC\uD83C\uDDE7', 'IND': '\uD83C\uDDEE\uD83C\uDDF3', 'ISR': '\uD83C\uDDEE\uD83C\uDDF1', 'SGP': '\uD83C\uDDF8\uD83C\uDDEC', 'TWN': '\uD83C\uDDF9\uD83C\uDDFC',
  'FRA': '\uD83C\uDDEB\uD83C\uDDF7', 'CAN': '\uD83C\uDDE8\uD83C\uDDE6', 'SWE': '\uD83C\uDDF8\uD83C\uDDEA', 'NLD': '\uD83C\uDDF3\uD83C\uDDF1', 'CHE': '\uD83C\uDDE8\uD83C\uDDED',
  'FIN': '\uD83C\uDDEB\uD83C\uDDEE', 'IRL': '\uD83C\uDDEE\uD83C\uDDEA', 'AUS': '\uD83C\uDDE6\uD83C\uDDFA', 'BRA': '\uD83C\uDDE7\uD83C\uDDF7', 'IDN': '\uD83C\uDDEE\uD83C\uDDE9',
};

function getFlag(code: string): string {
  return COUNTRY_FLAGS[code] || '\uD83C\uDF10';
}

function getScoreClass(score: number): string {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function formatComponent(value: number | null): string {
  if (value === null) return '\u2014';
  return Math.round(value).toString();
}

export const TechReadinessPanel = React.memo(function TechReadinessPanel({
  rankings = [],
  loading,
  lastFetch,
}: TechReadinessPanelProps) {
  const top = useMemo(() => rankings.slice(0, 25), [rankings]);

  return (
    <Panel id="tech-readiness" title="Tech Readiness" showCount count={rankings.length} loading={loading} infoTooltip="Technology readiness rankings based on World Bank indicators.">
      {top.length === 0 ? (
        <div className="empty-state">No data available</div>
      ) : (
        <>
          <div className="tech-readiness-list">
            {top.map(country => {
              const scoreClass = getScoreClass(country.score);
              return (
                <div key={country.country} className={`readiness-item ${scoreClass}`} data-country={country.country}>
                  <div className="readiness-rank">#{country.rank}</div>
                  <div className="readiness-flag">{getFlag(country.country)}</div>
                  <div className="readiness-info">
                    <div className="readiness-name">{country.countryName}</div>
                    <div className="readiness-components">
                      <span title="Internet Users">{'\uD83C\uDF10'}{formatComponent(country.components.internet)}</span>
                      <span title="Mobile Subscriptions">{'\uD83D\uDCF1'}{formatComponent(country.components.mobile)}</span>
                      <span title="R&D Spending">{'\uD83D\uDD2C'}{formatComponent(country.components.rdSpend)}</span>
                    </div>
                  </div>
                  <div className={`readiness-score ${scoreClass}`}>{country.score}</div>
                </div>
              );
            })}
          </div>
          <div className="readiness-footer">
            <span className="readiness-source">Source: World Bank</span>
            {lastFetch && <span className="readiness-updated">Updated: {new Date(lastFetch).toLocaleDateString()}</span>}
          </div>
        </>
      )}
    </Panel>
  );
});
