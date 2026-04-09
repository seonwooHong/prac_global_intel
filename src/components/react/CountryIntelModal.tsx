import React, { useCallback } from 'react';
import { escapeHtml, sanitizeUrl } from '@/utils/sanitize';
import { t } from '@/services/i18n';
import { getCSSColor } from '@/utils';
import type { CountryScore } from '@/services/country-instability';
import type { PredictionMarket } from '@/types';

interface CountryIntelData {
  brief: string;
  country: string;
  code: string;
  cached?: boolean;
  generatedAt?: string;
  error?: string;
  skipped?: boolean;
  reason?: string;
  fallback?: boolean;
}

export interface StockIndexData {
  available: boolean;
  code: string;
  symbol: string;
  indexName: string;
  price: string;
  weekChangePercent: string;
  currency: string;
  cached?: boolean;
}

interface ActiveSignals {
  protests: number;
  militaryFlights: number;
  militaryVessels: number;
  outages: number;
  earthquakes: number;
}

interface CountryIntelModalProps {
  isOpen: boolean;
  country: string;
  code: string;
  score: CountryScore | null;
  signals?: ActiveSignals;
  briefData?: CountryIntelData | null;
  markets?: PredictionMarket[];
  stockData?: StockIndexData | null;
  isLoading?: boolean;
  onClose: () => void;
  onShareStory?: (code: string, name: string) => void;
}

function countryFlag(code: string): string {
  try {
    return code
      .toUpperCase()
      .split('')
      .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
      .join('');
  } catch {
    return '\u{1F30D}';
  }
}

function levelBadge(level: string): React.ReactNode {
  const varMap: Record<string, string> = {
    critical: '--semantic-critical',
    high: '--semantic-high',
    elevated: '--semantic-elevated',
    normal: '--semantic-normal',
    low: '--semantic-low',
  };
  const color = getCSSColor(varMap[level] || '--text-dim');
  return (
    <span
      className="cii-badge"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {level.toUpperCase()}
    </span>
  );
}

function scoreBar(score: number): React.ReactNode {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? getCSSColor('--semantic-critical') : pct >= 50 ? getCSSColor('--semantic-high') : pct >= 30 ? getCSSColor('--semantic-elevated') : getCSSColor('--semantic-normal');
  return (
    <>
      <div className="cii-score-bar">
        <div className="cii-score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="cii-score-value">{score}/100</span>
    </>
  );
}

function formatBrief(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

export const CountryIntelModal: React.FC<CountryIntelModalProps> = ({
  isOpen,
  country,
  code,
  score,
  signals,
  briefData,
  markets,
  stockData,
  isLoading,
  onClose,
  onShareStory,
}) => {
  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('country-intel-overlay')) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const flag = isLoading ? '\u{1F30D}' : countryFlag(code);

  const renderSignalChips = () => {
    if (!signals) return null;
    const chips: React.ReactNode[] = [];
    if (signals.protests > 0) chips.push(<span key="p" className="signal-chip protest">{'\u{1F4E2}'} {signals.protests} {t('modals.countryIntel.protests')}</span>);
    if (signals.militaryFlights > 0) chips.push(<span key="mf" className="signal-chip military">{'\u2708\uFE0F'} {signals.militaryFlights} {t('modals.countryIntel.militaryAircraft')}</span>);
    if (signals.militaryVessels > 0) chips.push(<span key="mv" className="signal-chip military">{'\u2693'} {signals.militaryVessels} {t('modals.countryIntel.militaryVessels')}</span>);
    if (signals.outages > 0) chips.push(<span key="o" className="signal-chip outage">{'\u{1F310}'} {signals.outages} {t('modals.countryIntel.outages')}</span>);
    if (signals.earthquakes > 0) chips.push(<span key="e" className="signal-chip quake">{'\u{1F30D}'} {signals.earthquakes} {t('modals.countryIntel.earthquakes')}</span>);

    if (stockData?.available) {
      const pct = parseFloat(stockData.weekChangePercent);
      const sign = pct >= 0 ? '+' : '';
      const cls = pct >= 0 ? 'stock-up' : 'stock-down';
      const arrow = pct >= 0 ? '\u{1F4C8}' : '\u{1F4C9}';
      chips.push(<span key="stock" className={`signal-chip stock ${cls}`}>{arrow} {escapeHtml(stockData.indexName)}: {sign}{stockData.weekChangePercent}% (1W)</span>);
    } else if (!stockData) {
      chips.push(<span key="stock-load" className="signal-chip stock-loading">{'\u{1F4C8}'} {t('modals.countryIntel.loadingIndex')}</span>);
    }

    return <div className="active-signals">{chips}</div>;
  };

  const renderBrief = () => {
    if (isLoading || !briefData) {
      return (
        <div className="intel-brief-section">
          <div className="intel-brief-loading">
            <div className="intel-skeleton" />
            <div className="intel-skeleton short" />
            <div className="intel-skeleton" />
            <div className="intel-skeleton short" />
            <span className="intel-loading-text">{t(isLoading ? 'modals.countryIntel.locating' : 'modals.countryIntel.generatingBrief')}</span>
          </div>
        </div>
      );
    }
    if (briefData.error || briefData.skipped || !briefData.brief) {
      const msg = briefData.error || briefData.reason || t('modals.countryIntel.unavailable');
      return <div className="intel-brief-section"><div className="intel-error">{escapeHtml(msg)}</div></div>;
    }
    return (
      <div className="intel-brief-section">
        <div className="intel-brief" dangerouslySetInnerHTML={{ __html: formatBrief(briefData.brief) }} />
        <div className="intel-footer">
          {briefData.cached
            ? <span className="intel-cached">{'\u{1F4CB}'} {t('modals.countryIntel.cached')}</span>
            : <span className="intel-fresh">{'\u2728'} {t('modals.countryIntel.fresh')}</span>}
          <span className="intel-timestamp">{briefData.generatedAt ? new Date(briefData.generatedAt).toLocaleTimeString() : ''}</span>
        </div>
      </div>
    );
  };

  const renderMarkets = () => {
    if (!markets) {
      return <div className="country-markets-section"><span className="intel-loading-text">{t('modals.countryIntel.loadingMarkets')}</span></div>;
    }
    if (markets.length === 0) {
      return <div className="country-markets-section"><span className="intel-loading-text" style={{ opacity: 0.5 }}>{t('modals.countryIntel.noMarkets')}</span></div>;
    }
    return (
      <div className="country-markets-section">
        <div className="markets-label">{'\u{1F4CA}'} {t('modals.countryIntel.predictionMarkets')}</div>
        {markets.map((market, i) => {
          const href = sanitizeUrl(market.url || '#') || '#';
          return (
            <div key={i} className="market-item">
              <a href={href} target="_blank" rel="noopener noreferrer" className="prediction-market-card">
                <div className="market-provider">Polymarket</div>
                <div className="market-question">{escapeHtml(market.title)}</div>
                <div className="market-prob">{(market.yesPrice * 100).toFixed(1)}%</div>
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`country-intel-overlay${isOpen ? ' active' : ''}`} onClick={handleOverlayClick}>
      <div className="country-intel-modal">
        <div className="country-intel-header">
          <div className="country-intel-title">
            <span className="country-flag">{flag}</span>
            <span className="country-name">{isLoading ? t('modals.countryIntel.identifying') : escapeHtml(country)}</span>
            {score && levelBadge(score.level)}
            {!isLoading && (
              <button
                className="country-intel-share-btn"
                title={t('modals.story.shareTitle')}
                onClick={(e) => {
                  e.stopPropagation();
                  onShareStory?.(code, country);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            )}
          </div>
          <button className="country-intel-close" onClick={onClose}>{'\u00D7'}</button>
        </div>
        <div className="country-intel-content">
          {score && (
            <div className="cii-section">
              <div className="cii-label">{t('modals.countryIntel.instabilityIndex')} {scoreBar(score.score)}</div>
              <div className="cii-components">
                <span title={t('common.unrest')}>{'\u{1F4E2}'} {score.components.unrest.toFixed(0)}</span>
                <span title={t('common.conflict')}>{'\u2694'} {score.components.conflict.toFixed(0)}</span>
                <span title={t('common.security')}>{'\u{1F6E1}\uFE0F'} {score.components.security.toFixed(0)}</span>
                <span title={t('common.information')}>{'\u{1F4E1}'} {score.components.information.toFixed(0)}</span>
                <span className={`cii-trend ${score.trend}`}>
                  {score.trend === 'rising' ? '\u2197' : score.trend === 'falling' ? '\u2198' : '\u2192'} {score.trend}
                </span>
              </div>
            </div>
          )}
          {renderSignalChips()}
          {renderMarkets()}
          {renderBrief()}
        </div>
      </div>
    </div>
  );
};
