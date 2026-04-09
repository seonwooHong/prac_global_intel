import React, { useState, useCallback, useMemo } from 'react';
import { Panel } from './Panel';

export interface EconomicIndicator {
  id: string;
  name: string;
  value: number | null;
  unit: string;
  change: number | null;
  date: string;
}

export interface OilMetric {
  name: string;
  current: number;
  unit: string;
  changePct: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SpendingAward {
  amount: number;
  recipientName: string;
  agency: string;
  awardType: string;
  description?: string;
}

export interface SpendingData {
  awards: SpendingAward[];
  totalAmount: number;
  periodStart: string;
  periodEnd: string;
}

export interface EconomicPanelProps {
  indicators: EconomicIndicator[];
  oilMetrics?: OilMetric[];
  spending?: SpendingData | null;
  loading?: boolean;
  error?: string;
  className?: string;
  lastUpdate?: Date | null;
}

type TabId = 'indicators' | 'oil' | 'spending';

function getChangeClass(change: number | null): string {
  if (change === null) return '';
  if (change > 0) return 'positive';
  if (change < 0) return 'negative';
  return 'neutral';
}

function formatChange(change: number | null, unit: string): string {
  if (change === null) return 'N/A';
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(2)}${unit}`;
}

function getTrendIndicator(trend: string): string {
  if (trend === 'up') return '\u25B2';
  if (trend === 'down') return '\u25BC';
  return '\u2013';
}

function getTrendColor(trend: string, isProduction: boolean): string {
  // For production, up is green; for prices, up could be red depending on context
  if (trend === 'up') return isProduction ? 'var(--green)' : 'var(--red)';
  if (trend === 'down') return isProduction ? 'var(--red)' : 'var(--green)';
  return 'var(--text-dim)';
}

function formatAwardAmount(amount: number): string {
  if (amount >= 1e9) return `$${(amount / 1e9).toFixed(1)}B`;
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function getAwardTypeIcon(awardType: string): string {
  const map: Record<string, string> = {
    contract: '\uD83D\uDCC4',
    grant: '\uD83C\uDFE6',
    loan: '\uD83D\uDCB3',
    other: '\uD83D\uDCCB',
  };
  return map[awardType.toLowerCase()] || '\uD83D\uDCCB';
}

const IndicatorsTab = React.memo(function IndicatorsTab({
  indicators,
}: {
  indicators: EconomicIndicator[];
}) {
  if (indicators.length === 0) {
    return <div className="economic-empty">No indicator data available</div>;
  }

  return (
    <div className="economic-indicators">
      {indicators.map((series) => {
        const changeClass = getChangeClass(series.change);
        const changeStr = formatChange(series.change, series.unit);
        const arrow = series.change !== null
          ? (series.change > 0 ? '\u25B2' : series.change < 0 ? '\u25BC' : '\u2013')
          : '';

        return (
          <div key={series.id} className="economic-indicator" data-series={series.id}>
            <div className="indicator-header">
              <span className="indicator-name">{series.name}</span>
              <span className="indicator-id">{series.id}</span>
            </div>
            <div className="indicator-value">
              <span className="value">
                {series.value !== null ? String(series.value) : 'N/A'}{series.unit}
              </span>
              <span className={`change ${changeClass}`}>
                {arrow} {changeStr}
              </span>
            </div>
            <div className="indicator-date">{series.date}</div>
          </div>
        );
      })}
    </div>
  );
});

const OilTab = React.memo(function OilTab({
  metrics,
}: {
  metrics: OilMetric[];
}) {
  if (metrics.length === 0) {
    return <div className="economic-empty">No oil data available. Retrying...</div>;
  }

  return (
    <div className="economic-indicators oil-metrics">
      {metrics.map((metric, i) => {
        const trendIcon = getTrendIndicator(metric.trend);
        const trendColor = getTrendColor(metric.trend, metric.name.includes('Production'));

        return (
          <div key={i} className="economic-indicator oil-metric">
            <div className="indicator-header">
              <span className="indicator-name">{metric.name}</span>
            </div>
            <div className="indicator-value">
              <span className="value">
                {metric.current.toFixed(2)} {metric.unit}
              </span>
              <span className="change" style={{ color: trendColor }}>
                {trendIcon} {metric.changePct > 0 ? '+' : ''}{metric.changePct}%
              </span>
            </div>
            <div className="indicator-date">vs previous week</div>
          </div>
        );
      })}
    </div>
  );
});

const SpendingTab = React.memo(function SpendingTab({
  spending,
}: {
  spending: SpendingData;
}) {
  if (spending.awards.length === 0) {
    return <div className="economic-empty">No spending data available</div>;
  }

  return (
    <>
      <div className="spending-summary">
        <div className="spending-total">
          {formatAwardAmount(spending.totalAmount)} in {spending.awards.length} awards
          <span className="spending-period">
            {spending.periodStart} &ndash; {spending.periodEnd}
          </span>
        </div>
      </div>
      <div className="spending-list">
        {spending.awards.slice(0, 8).map((award, i) => (
          <div key={i} className="spending-award">
            <div className="award-header">
              <span className="award-icon">{getAwardTypeIcon(award.awardType)}</span>
              <span className="award-amount">{formatAwardAmount(award.amount)}</span>
            </div>
            <div className="award-recipient">{award.recipientName}</div>
            <div className="award-agency">{award.agency}</div>
            {award.description && (
              <div className="award-desc">
                {award.description.length > 100
                  ? `${award.description.slice(0, 100)}...`
                  : award.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
});

export const EconomicPanel = React.memo(function EconomicPanel({
  indicators,
  oilMetrics,
  spending,
  loading,
  error,
  className,
  lastUpdate,
}: EconomicPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('indicators');

  const hasOil = oilMetrics && oilMetrics.length > 0;
  const hasSpending = spending && spending.awards.length > 0;

  const onTabClick = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  const sourceLabel = useMemo(() => {
    switch (activeTab) {
      case 'indicators': return 'FRED';
      case 'oil': return 'EIA';
      case 'spending': return 'USASpending.gov';
    }
  }, [activeTab]);

  const updateTime = lastUpdate
    ? lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <Panel
      id="economic"
      title="Economic"
      className={className}
      loading={loading}
      error={error}
    >
      <div className="economic-tabs">
        <button
          className={`economic-tab ${activeTab === 'indicators' ? 'active' : ''}`}
          data-tab="indicators"
          onClick={() => onTabClick('indicators')}
        >
          {'\uD83D\uDCCA'} Indicators
        </button>
        {hasOil && (
          <button
            className={`economic-tab ${activeTab === 'oil' ? 'active' : ''}`}
            data-tab="oil"
            onClick={() => onTabClick('oil')}
          >
            {'\uD83D\uDEE2\uFE0F'} Oil
          </button>
        )}
        {hasSpending && (
          <button
            className={`economic-tab ${activeTab === 'spending' ? 'active' : ''}`}
            data-tab="spending"
            onClick={() => onTabClick('spending')}
          >
            {'\uD83C\uDFDB\uFE0F'} Gov
          </button>
        )}
      </div>

      <div className="economic-content">
        {activeTab === 'indicators' && (
          <IndicatorsTab indicators={indicators} />
        )}
        {activeTab === 'oil' && oilMetrics && (
          <OilTab metrics={oilMetrics} />
        )}
        {activeTab === 'spending' && spending && (
          <SpendingTab spending={spending} />
        )}
      </div>

      <div className="economic-footer">
        <span className="economic-source">
          {sourceLabel} {updateTime ? `\u2022 ${updateTime}` : ''}
        </span>
      </div>
    </Panel>
  );
});
