import React, { useCallback, useEffect, useRef, useState } from 'react';
import { escapeHtml, sanitizeUrl } from '@/utils/sanitize';
import { t } from '@/services/i18n';
import { getCSSColor } from '@/utils';
import type { CountryScore } from '@/services/country-instability';
import type { PredictionMarket, NewsItem } from '@/types';
import type { StockIndexData } from '@/components/CountryIntelModal';

interface CountryBriefSignals {
  protests: number;
  militaryFlights: number;
  militaryVessels: number;
  outages: number;
  earthquakes: number;
  displacementOutflow: number;
  climateStress: number;
  conflictEvents: number;
  isTier1: boolean;
}

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

interface InfraItem {
  name: string;
  distanceKm: number;
}

interface InfraGroup {
  type: string;
  icon: string;
  label: string;
  items: InfraItem[];
}

interface CountryBriefPageProps {
  isOpen: boolean;
  country: string;
  code: string;
  score: CountryScore | null;
  signals: CountryBriefSignals;
  briefData?: CountryIntelData | null;
  markets?: PredictionMarket[];
  stockData?: StockIndexData | null;
  headlines?: NewsItem[];
  infrastructure?: InfraGroup[];
  isLoading?: boolean;
  onClose: () => void;
  onShareStory?: (code: string, name: string) => void;
  onPrint?: () => void;
  onExportImage?: (code: string, name: string) => void;
  onExportJSON?: () => void;
  onExportCSV?: () => void;
  timelineSlot?: React.ReactNode;
}

function countryFlag(code: string): string {
  try {
    return code.toUpperCase().split('').map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65)).join('');
  } catch { return '\u{1F30D}'; }
}

function levelColor(level: string): string {
  const varMap: Record<string, string> = { critical: '--semantic-critical', high: '--semantic-high', elevated: '--semantic-elevated', normal: '--semantic-normal', low: '--semantic-low' };
  return getCSSColor(varMap[level] || '--text-dim');
}

export const CountryBriefPage: React.FC<CountryBriefPageProps> = ({
  isOpen, country, code, score, signals, briefData, markets, stockData,
  headlines, infrastructure, isLoading, onClose, onShareStory, onPrint,
  onExportImage, onExportJSON, onExportCSV, timelineSlot,
}) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('country-brief-overlay')) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="country-brief-overlay active" ref={overlayRef} onClick={handleOverlayClick}>
        <div className="country-brief-page">
          <div className="cb-header">
            <div className="cb-header-left">
              <span className="cb-flag">{'\u{1F30D}'}</span>
              <span className="cb-country-name">{t('modals.countryBrief.identifying')}</span>
            </div>
            <div className="cb-header-right">
              <button className="cb-close" aria-label={t('components.newsPanel.close')} onClick={onClose}>{'\u00D7'}</button>
            </div>
          </div>
          <div className="cb-body">
            <div className="cb-loading-state">
              <div className="intel-skeleton" />
              <div className="intel-skeleton short" />
              <span className="intel-loading-text">{t('modals.countryBrief.locating')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const flag = countryFlag(code);
  const lColor = score ? levelColor(score.level) : '';

  const renderScoreRing = () => {
    if (!score) return null;
    const pct = Math.min(100, Math.max(0, score.score));
    const circumference = 2 * Math.PI * 42;
    const dashOffset = circumference * (1 - pct / 100);
    const color = lColor;
    return (
      <div className="cb-score-ring">
        <svg viewBox="0 0 100 100" width="120" height="120">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${circumference}`} strokeDashoffset={`${dashOffset}`}
            strokeLinecap="round" transform="rotate(-90 50 50)"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="cb-score-value" style={{ color }}>{score.score}</div>
        <div className="cb-score-label">/ 100</div>
      </div>
    );
  };

  const renderComponentBars = () => {
    if (!score) return null;
    const items = [
      { label: t('modals.countryBrief.components.unrest'), value: score.components.unrest, icon: '\u{1F4E2}' },
      { label: t('modals.countryBrief.components.conflict'), value: score.components.conflict, icon: '\u2694' },
      { label: t('modals.countryBrief.components.security'), value: score.components.security, icon: '\u{1F6E1}\uFE0F' },
      { label: t('modals.countryBrief.components.information'), value: score.components.information, icon: '\u{1F4E1}' },
    ];
    return items.map(({ label, value, icon }) => {
      const pct = Math.min(100, Math.max(0, value));
      const color = pct >= 70 ? getCSSColor('--semantic-critical') : pct >= 50 ? getCSSColor('--semantic-high') : pct >= 30 ? getCSSColor('--semantic-elevated') : getCSSColor('--semantic-normal');
      return (
        <div key={label} className="cb-comp-row">
          <span className="cb-comp-icon">{icon}</span>
          <span className="cb-comp-label">{label}</span>
          <div className="cb-comp-bar"><div className="cb-comp-fill" style={{ width: `${pct}%`, background: color }} /></div>
          <span className="cb-comp-val">{Math.round(value)}</span>
        </div>
      );
    });
  };

  const renderSignalChips = () => {
    const chips: React.ReactNode[] = [];
    if (signals.protests > 0) chips.push(<span key="p" className="signal-chip protest">{'\u{1F4E2}'} {signals.protests} {t('modals.countryBrief.signals.protests')}</span>);
    if (signals.militaryFlights > 0) chips.push(<span key="mf" className="signal-chip military">{'\u2708\uFE0F'} {signals.militaryFlights} {t('modals.countryBrief.signals.militaryAir')}</span>);
    if (signals.militaryVessels > 0) chips.push(<span key="mv" className="signal-chip military">{'\u2693'} {signals.militaryVessels} {t('modals.countryBrief.signals.militarySea')}</span>);
    if (signals.outages > 0) chips.push(<span key="o" className="signal-chip outage">{'\u{1F310}'} {signals.outages} {t('modals.countryBrief.signals.outages')}</span>);
    if (signals.earthquakes > 0) chips.push(<span key="eq" className="signal-chip quake">{'\u{1F30D}'} {signals.earthquakes} {t('modals.countryBrief.signals.earthquakes')}</span>);
    if (signals.displacementOutflow > 0) {
      const fmt = signals.displacementOutflow >= 1_000_000
        ? `${(signals.displacementOutflow / 1_000_000).toFixed(1)}M`
        : `${(signals.displacementOutflow / 1000).toFixed(0)}K`;
      chips.push(<span key="disp" className="signal-chip displacement">{'\u{1F30A}'} {fmt} {t('modals.countryBrief.signals.displaced')}</span>);
    }
    if (signals.climateStress > 0) chips.push(<span key="cl" className="signal-chip climate">{'\u{1F321}\uFE0F'} {t('modals.countryBrief.signals.climate')}</span>);
    if (signals.conflictEvents > 0) chips.push(<span key="ce" className="signal-chip conflict">{'\u2694\uFE0F'} {signals.conflictEvents} {t('modals.countryBrief.signals.conflictEvents')}</span>);

    if (stockData?.available) {
      const pct = parseFloat(stockData.weekChangePercent);
      const sign = pct >= 0 ? '+' : '';
      const cls = pct >= 0 ? 'stock-up' : 'stock-down';
      const arrow = pct >= 0 ? '\u{1F4C8}' : '\u{1F4C9}';
      chips.push(<span key="stock" className={`signal-chip stock ${cls}`}>{arrow} {escapeHtml(stockData.indexName)}: {sign}{stockData.weekChangePercent}% (1W)</span>);
    } else if (!stockData) {
      chips.push(<span key="stockload" className="signal-chip stock-loading">{'\u{1F4C8}'} {t('modals.countryBrief.loadingIndex')}</span>);
    }
    return chips;
  };

  const timeAgo = (date: Date): string => {
    const ms = Date.now() - new Date(date).getTime();
    const hours = Math.floor(ms / 3600000);
    if (hours < 1) return t('modals.countryBrief.timeAgo.m', { count: Math.floor(ms / 60000) });
    if (hours < 24) return t('modals.countryBrief.timeAgo.h', { count: hours });
    return t('modals.countryBrief.timeAgo.d', { count: Math.floor(hours / 24) });
  };

  const formatBrief = (text: string, headlineCount = 0): string => {
    let html = escapeHtml(text)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
    if (headlineCount > 0) {
      html = html.replace(/\[(\d{1,2})\]/g, (_match, numStr) => {
        const n = parseInt(numStr, 10);
        if (n >= 1 && n <= headlineCount) {
          return `<a href="#cb-news-${n}" class="cb-citation" title="${t('components.countryBrief.sourceRef', { n: String(n) })}">[${n}]</a>`;
        }
        return `[${numStr}]`;
      });
    }
    return html;
  };

  const headlineCount = headlines?.length || 0;

  return (
    <div className="country-brief-overlay active" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="country-brief-page">
        <div className="cb-header">
          <div className="cb-header-left">
            <span className="cb-flag">{flag}</span>
            <span className="cb-country-name">{escapeHtml(country)}</span>
            {score && <span className="cb-badge" style={{ background: `${lColor}20`, color: lColor, border: `1px solid ${lColor}40` }}>{score.level.toUpperCase()}</span>}
            {score && <span className={`cb-trend ${score.trend === 'rising' ? 'trend-up' : score.trend === 'falling' ? 'trend-down' : 'trend-stable'}`}>{score.trend === 'rising' ? '\u2197' : score.trend === 'falling' ? '\u2198' : '\u2192'} {score.trend}</span>}
            {!signals.isTier1 && <span className="cb-tier-badge">{t('modals.countryBrief.limitedCoverage')}</span>}
          </div>
          <div className="cb-header-right">
            <button className="cb-share-btn" title={t('components.countryBrief.shareStory')} onClick={() => onShareStory?.(code, country)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v7a2 2 0 002 2h12a2 2 0 002-2v-7" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>
            </button>
            <button className="cb-print-btn" title={t('components.countryBrief.printPdf')} onClick={onPrint}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            </button>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <button className="cb-export-btn" title={t('components.countryBrief.exportData')} onClick={(e) => { e.stopPropagation(); setExportMenuOpen(!exportMenuOpen); }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </button>
              {exportMenuOpen && (
                <div className="cb-export-menu">
                  <button className="cb-export-option" onClick={() => { onExportImage?.(code, country); setExportMenuOpen(false); }}>{t('common.exportImage')}</button>
                  <button className="cb-export-option" onClick={() => { onExportJSON?.(); setExportMenuOpen(false); }}>{t('common.exportJson')}</button>
                  <button className="cb-export-option" onClick={() => { onExportCSV?.(); setExportMenuOpen(false); }}>{t('common.exportCsv')}</button>
                </div>
              )}
            </div>
            <button className="cb-close" aria-label={t('components.newsPanel.close')} onClick={onClose}>{'\u00D7'}</button>
          </div>
        </div>
        <div className="cb-body">
          <div className="cb-grid">
            <div className="cb-col-left">
              {score ? (
                <section className="cb-section cb-risk-section">
                  <h3 className="cb-section-title">{t('modals.countryBrief.instabilityIndex')}</h3>
                  <div className="cb-risk-content">
                    {renderScoreRing()}
                    <div className="cb-components">{renderComponentBars()}</div>
                  </div>
                </section>
              ) : !signals.isTier1 ? (
                <section className="cb-section cb-risk-section">
                  <h3 className="cb-section-title">{t('modals.countryBrief.instabilityIndex')}</h3>
                  <div className="cb-not-tracked">
                    <span className="cb-not-tracked-icon">{'\u{1F4CA}'}</span>
                    <span>{t('modals.countryBrief.notTracked', { country: escapeHtml(country) })}</span>
                  </div>
                </section>
              ) : null}

              <section className="cb-section cb-brief-section">
                <h3 className="cb-section-title">{t('modals.countryBrief.intelBrief')}</h3>
                <div className="cb-brief-content">
                  {!briefData ? (
                    <div className="intel-brief-loading">
                      <div className="intel-skeleton" />
                      <div className="intel-skeleton short" />
                      <div className="intel-skeleton" />
                      <div className="intel-skeleton short" />
                      <span className="intel-loading-text">{t('modals.countryBrief.generatingBrief')}</span>
                    </div>
                  ) : briefData.error || briefData.skipped || !briefData.brief ? (
                    <div className="intel-error">{escapeHtml(briefData.error || briefData.reason || t('modals.countryBrief.briefUnavailable'))}</div>
                  ) : (
                    <>
                      <div className="cb-brief-text" dangerouslySetInnerHTML={{ __html: formatBrief(briefData.brief, headlineCount) }} />
                      <div className="cb-brief-footer">
                        {briefData.cached
                          ? <span className="intel-cached">{'\u{1F4CB}'} {t('modals.countryBrief.cached')}</span>
                          : <span className="intel-fresh">{'\u2728'} {t('modals.countryBrief.fresh')}</span>}
                        <span className="intel-timestamp">{briefData.generatedAt ? new Date(briefData.generatedAt).toLocaleTimeString() : ''}</span>
                      </div>
                    </>
                  )}
                </div>
              </section>

              {headlines && headlines.length > 0 && (
                <section className="cb-section cb-news-section">
                  <h3 className="cb-section-title">{t('modals.countryBrief.topNews')}</h3>
                  <div className="cb-news-content">
                    {headlines.slice(0, 8).map((item, i) => {
                      const safeUrl = sanitizeUrl(item.link);
                      const threatColor = item.threat?.level === 'critical' ? getCSSColor('--threat-critical')
                        : item.threat?.level === 'high' ? getCSSColor('--threat-high')
                        : item.threat?.level === 'medium' ? getCSSColor('--threat-medium')
                        : getCSSColor('--threat-info');
                      const cardBody = (
                        <>
                          <span className="cb-news-threat" style={{ background: threatColor }} />
                          <div className="cb-news-body">
                            <div className="cb-news-title">{escapeHtml(item.title)}</div>
                            <div className="cb-news-meta">{escapeHtml(item.source)} {'\u00B7'} {timeAgo(item.pubDate)}</div>
                          </div>
                        </>
                      );
                      if (safeUrl) {
                        return <a key={i} href={safeUrl} target="_blank" rel="noopener" className="cb-news-card" id={`cb-news-${i + 1}`}>{cardBody}</a>;
                      }
                      return <div key={i} className="cb-news-card" id={`cb-news-${i + 1}`}>{cardBody}</div>;
                    })}
                  </div>
                </section>
              )}
            </div>
            <div className="cb-col-right">
              <section className="cb-section cb-signals-section">
                <h3 className="cb-section-title">{t('modals.countryBrief.activeSignals')}</h3>
                <div className="cb-signals-grid">{renderSignalChips()}</div>
              </section>

              <section className="cb-section cb-timeline-section">
                <h3 className="cb-section-title">{t('modals.countryBrief.timeline')}</h3>
                <div className="cb-timeline-mount">{timelineSlot}</div>
              </section>

              <section className="cb-section cb-markets-section">
                <h3 className="cb-section-title">{t('modals.countryBrief.predictionMarkets')}</h3>
                <div className="cb-markets-content">
                  {!markets ? (
                    <span className="intel-loading-text">{t('modals.countryBrief.loadingMarkets')}</span>
                  ) : markets.length === 0 ? (
                    <span className="cb-empty">{t('modals.countryBrief.noMarkets')}</span>
                  ) : markets.slice(0, 3).map((m, i) => {
                    const pct = Math.round(m.yesPrice);
                    const noPct = 100 - pct;
                    const vol = m.volume ? `$${(m.volume / 1000).toFixed(0)}k vol` : '';
                    const safeUrl = sanitizeUrl(m.url || '');
                    const link = safeUrl ? <a href={safeUrl} target="_blank" rel="noopener" className="cb-market-link">{'\u2197'}</a> : null;
                    return (
                      <div key={i} className="cb-market-item">
                        <div className="cb-market-title">{escapeHtml(m.title.slice(0, 100))} {link}</div>
                        <div className="market-bar">
                          <div className="market-yes" style={{ width: `${pct}%` }}>{pct}%</div>
                          <div className="market-no" style={{ width: `${noPct}%` }}>{noPct > 15 ? `${noPct}%` : ''}</div>
                        </div>
                        {vol && <div className="market-vol">{vol}</div>}
                      </div>
                    );
                  })}
                </div>
              </section>

              {infrastructure && infrastructure.length > 0 && (
                <section className="cb-section cb-infra-section">
                  <h3 className="cb-section-title">{t('modals.countryBrief.infrastructure')}</h3>
                  <div className="cb-infra-content">
                    {infrastructure.map((group) => (
                      <div key={group.type} className="cb-infra-group">
                        <div className="cb-infra-type">{group.icon} {group.label}</div>
                        {group.items.map((item, j) => (
                          <div key={j} className="cb-infra-item">
                            <span>{escapeHtml(item.name)}</span>
                            <span className="cb-infra-dist">{Math.round(item.distanceKm)} km</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
