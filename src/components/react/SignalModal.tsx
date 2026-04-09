import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { CorrelationSignal } from '@/services/correlation';
import type { UnifiedAlert } from '@/services/cross-module-integration';
import { escapeHtml } from '@/utils/sanitize';
import { getCSSColor } from '@/utils';
import { getSignalContext, type SignalType } from '@/utils/analysis-constants';
import { t } from '@/services/i18n';

interface SignalModalProps {
  isOpen: boolean;
  signals: CorrelationSignal[];
  alert?: UnifiedAlert | null;
  audioEnabled?: boolean;
  onClose: () => void;
  onLocationClick?: (lat: number, lon: number) => void;
  onSuppressKeyword?: (term: string) => void;
  onAudioToggle?: (enabled: boolean) => void;
}

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  prediction_leads_news: '\u{1F52E}',
  news_leads_markets: '\u{1F4F0}',
  silent_divergence: '\u{1F507}',
  velocity_spike: '\u{1F525}',
  keyword_spike: '\u{1F4CA}',
  convergence: '\u25C9',
  triangulation: '\u25B3',
  flow_drop: '\u{1F6E2}\uFE0F',
  flow_price_divergence: '\u{1F4C8}',
  geo_convergence: '\u{1F310}',
  explained_market_move: '\u2713',
  sector_cascade: '\u{1F4CA}',
  military_surge: '\u{1F6E9}\uFE0F',
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function getSignalTypeLabel(type: string): string {
  const icon = SIGNAL_TYPE_LABELS[type] || '';
  const labelKey = `modals.signal.${type.replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`;
  return `${icon} ${t(labelKey) || type}`;
}

export const SignalModal: React.FC<SignalModalProps> = ({
  isOpen,
  signals,
  alert,
  audioEnabled = true,
  onClose,
  onLocationClick,
  onSuppressKeyword,
  onAudioToggle,
}) => {
  const [localAudio, setLocalAudio] = useState(audioEnabled);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQYjfKapmWswEjCJvuPQfSoXZZ+3qqBJESSP0unGaxMJVYiytrFeLhR6p8znrFUXRW+bs7V3Qx1hn8Xjp1cYPnegprhkMCFmoLi1k0sZTYGlqqlUIA==');
    audioRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    if (isOpen && signals.length > 0 && localAudio && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [isOpen, signals.length, localAudio]);

  const handleAudioToggle = useCallback((checked: boolean) => {
    setLocalAudio(checked);
    onAudioToggle?.(checked);
  }, [onAudioToggle]);

  if (!isOpen) return null;

  const renderAlertContent = () => {
    if (!alert) return null;
    const priorityColors: Record<string, string> = {
      critical: getCSSColor('--semantic-critical'),
      high: getCSSColor('--semantic-high'),
      medium: getCSSColor('--semantic-low'),
      low: getCSSColor('--text-dim'),
    };
    const typeIcons: Record<string, string> = {
      cii_spike: '\u{1F4CA}',
      convergence: '\u{1F30D}',
      cascade: '\u26A1',
      composite: '\u{1F517}',
    };
    const icon = typeIcons[alert.type] || '\u26A0\uFE0F';
    const color = priorityColors[alert.priority] || '#ff9944';

    return (
      <div className="signal-item" style={{ borderLeftColor: color }}>
        <div className="signal-type">{icon} {alert.type.toUpperCase().replace('_', ' ')}</div>
        <div className="signal-title">{escapeHtml(alert.title)}</div>
        <div className="signal-description">{escapeHtml(alert.summary)}</div>
        <div className="signal-meta">
          <span className="signal-confidence" style={{ background: `${color}22`, color }}>{alert.priority.toUpperCase()}</span>
          <span className="signal-time">{formatTime(alert.timestamp)}</span>
        </div>
        <div className="signal-context">
          {alert.components.ciiChange && (() => {
            const cii = alert.components.ciiChange;
            const changeSign = cii.change > 0 ? '+' : '';
            return (
              <>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.country')}</span>
                  <span className="context-value">{escapeHtml(cii.countryName)}</span>
                </div>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.scoreChange')}</span>
                  <span className="context-value">{cii.previousScore} → {cii.currentScore} ({changeSign}{cii.change})</span>
                </div>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.instabilityLevel')}</span>
                  <span className="context-value" style={{ textTransform: 'uppercase', color }}>{cii.level}</span>
                </div>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.primaryDriver')}</span>
                  <span className="context-value">{escapeHtml(cii.driver)}</span>
                </div>
              </>
            );
          })()}
          {alert.components.convergence && (() => {
            const conv = alert.components.convergence;
            return (
              <>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.location')}</span>
                  <button className="location-link" onClick={() => onLocationClick?.(conv.lat, conv.lon)}>
                    {conv.lat.toFixed(2)}{'\u00B0'}, {conv.lon.toFixed(2)}{'\u00B0'} {'\u2197'}
                  </button>
                </div>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.eventTypes')}</span>
                  <span className="context-value">{conv.types.join(', ')}</span>
                </div>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.eventCount')}</span>
                  <span className="context-value">{t('modals.signal.eventCountValue', { count: conv.totalEvents })}</span>
                </div>
              </>
            );
          })()}
          {alert.components.cascade && (() => {
            const cascade = alert.components.cascade;
            return (
              <>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.source')}</span>
                  <span className="context-value">{escapeHtml(cascade.sourceName)} ({cascade.sourceType})</span>
                </div>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.countriesAffected')}</span>
                  <span className="context-value">{cascade.countriesAffected}</span>
                </div>
                <div className="signal-context-item">
                  <span className="context-label">{t('modals.signal.impactLevel')}</span>
                  <span className="context-value">{escapeHtml(cascade.highestImpact)}</span>
                </div>
              </>
            );
          })()}
        </div>
        {alert.countries.length > 0 && (
          <div className="signal-topics">
            {alert.countries.map((c, i) => <span key={i} className="signal-topic">{escapeHtml(c)}</span>)}
          </div>
        )}
      </div>
    );
  };

  const renderSignals = () => {
    return signals.map((signal, idx) => {
      const context = getSignalContext(signal.type as SignalType);
      const data = signal.data as Record<string, unknown>;
      const newsCorrelation = data?.newsCorrelation as string | null;
      const focalPoints = data?.focalPointContext as string[] | null;
      const locationData = {
        lat: data?.lat as number | undefined,
        lon: data?.lon as number | undefined,
        regionName: data?.regionName as string | undefined,
      };

      return (
        <div key={signal.id || idx} className={`signal-item ${escapeHtml(signal.type)}`}>
          <div className="signal-type">{getSignalTypeLabel(signal.type)}</div>
          <div className="signal-title">{escapeHtml(signal.title)}</div>
          <div className="signal-description">{escapeHtml(signal.description)}</div>
          <div className="signal-meta">
            <span className="signal-confidence">{t('modals.signal.confidence')}: {Math.round(signal.confidence * 100)}%</span>
            <span className="signal-time">{formatTime(signal.timestamp)}</span>
          </div>
          {signal.data.explanation && (
            <div className="signal-explanation">{escapeHtml(signal.data.explanation)}</div>
          )}
          {focalPoints && focalPoints.length > 0 && (
            <div className="signal-focal-points">
              <div className="focal-points-header">{'\u{1F4E1}'} {t('modals.signal.focalPoints')}</div>
              {focalPoints.map((fp, i) => <div key={i} className="focal-point-item">{escapeHtml(fp)}</div>)}
            </div>
          )}
          {newsCorrelation && (
            <div className="signal-news-correlation">
              <div className="news-correlation-header">{'\u{1F4F0}'} {t('modals.signal.newsCorrelation')}</div>
              <pre className="news-correlation-text">{escapeHtml(newsCorrelation)}</pre>
            </div>
          )}
          {locationData.lat && locationData.lon && (
            <div className="signal-location">
              <button
                className="location-link"
                onClick={() => onLocationClick?.(locationData.lat!, locationData.lon!)}
              >
                {'\u{1F4CD}'} {t('modals.signal.viewOnMap')}: {locationData.regionName || `${locationData.lat!.toFixed(2)}\u00B0, ${locationData.lon!.toFixed(2)}\u00B0`}
              </button>
            </div>
          )}
          <div className="signal-context">
            <div className="signal-context-item why-matters">
              <span className="context-label">{t('modals.signal.whyItMatters')}</span>
              <span className="context-value">{escapeHtml(context.whyItMatters)}</span>
            </div>
            <div className="signal-context-item actionable">
              <span className="context-label">{t('modals.signal.action')}</span>
              <span className="context-value">{escapeHtml(context.actionableInsight)}</span>
            </div>
            <div className="signal-context-item confidence-note">
              <span className="context-label">{t('modals.signal.note')}</span>
              <span className="context-value">{escapeHtml(context.confidenceNote)}</span>
            </div>
          </div>
          {(signal.data.relatedTopics?.length ?? 0) > 0 && (
            <div className="signal-topics">
              {signal.data.relatedTopics?.map((topic: string, i: number) => (
                <span key={i} className="signal-topic">{escapeHtml(topic)}</span>
              ))}
            </div>
          )}
          {signal.type === 'keyword_spike' && typeof data?.term === 'string' && (
            <div className="signal-actions">
              <button
                className="suppress-keyword-btn"
                onClick={() => onSuppressKeyword?.(data.term as string)}
              >
                {t('modals.signal.suppress')}
              </button>
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div
      className={`signal-modal-overlay${isOpen ? ' active' : ''}`}
      onClick={(e) => {
        if ((e.target as HTMLElement).classList.contains('signal-modal-overlay')) onClose();
      }}
    >
      <div className="signal-modal">
        <div className="signal-modal-header">
          <span className="signal-modal-title">{'\u{1F3AF}'} {t('modals.signal.title')}</span>
          <button className="signal-modal-close" onClick={onClose}>{'\u00D7'}</button>
        </div>
        <div className="signal-modal-content">
          {alert ? renderAlertContent() : renderSignals()}
        </div>
        <div className="signal-modal-footer">
          <label className="signal-audio-toggle">
            <input
              type="checkbox"
              checked={localAudio}
              onChange={(e) => handleAudioToggle(e.target.checked)}
            />
            <span>{t('modals.signal.soundAlerts')}</span>
          </label>
          <button className="signal-dismiss-btn" onClick={onClose}>{t('modals.signal.dismiss')}</button>
        </div>
      </div>
    </div>
  );
};
