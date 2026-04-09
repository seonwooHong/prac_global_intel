import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type FindingSource = 'signal' | 'alert';
type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface UnifiedFinding {
  id: string;
  source: FindingSource;
  type: string;
  title: string;
  description: string;
  confidence: number;
  priority: Priority;
  timestamp: Date;
  original: unknown;
}

export interface IntelligenceGapBadgeProps {
  /** Array of findings to display */
  findings: UnifiedFinding[];
  /** Whether the badge is enabled / visible */
  enabled?: boolean;
  /** Whether audio notifications are enabled */
  audioEnabled?: boolean;
  /** Called when a signal-type finding is clicked */
  onSignalClick?: (original: unknown) => void;
  /** Called when an alert-type finding is clicked */
  onAlertClick?: (original: unknown) => void;
  /** Called when the user requests to hide the badge */
  onToggleEnabled?: (enabled: boolean) => void;
  /** i18n helper – falls back to identity */
  t?: (key: string, vars?: Record<string, string>) => string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const LOW_COUNT_THRESHOLD = 3;
const MAX_VISIBLE_FINDINGS = 10;

const TYPE_ICONS: Record<string, string> = {
  breaking_surge: '\uD83D\uDD25',
  silent_divergence: '\uD83D\uDD07',
  flow_price_divergence: '\uD83D\uDCCA',
  explained_market_move: '\uD83D\uDCA1',
  prediction_leads_news: '\uD83D\uDD2E',
  geo_convergence: '\uD83C\uDF0D',
  hotspot_escalation: '\u26A0\uFE0F',
  news_leads_markets: '\uD83D\uDCF0',
  velocity_spike: '\uD83D\uDCC8',
  keyword_spike: '\uD83D\uDCCA',
  convergence: '\uD83D\uDD00',
  triangulation: '\uD83D\uDD3A',
  flow_drop: '\u2B07\uFE0F',
  sector_cascade: '\uD83C\uDF0A',
  cii_spike: '\uD83D\uDD34',
  cascade: '\u26A1',
  composite: '\uD83D\uDD17',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimeAgo(date: Date): string {
  const ms = Date.now() - date.getTime();
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function getTypeIcon(type: string): string {
  return TYPE_ICONS[type] ?? '\uD83D\uDCCC';
}

function priorityLabel(p: Priority): string {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

const FindingItem: React.FC<{
  finding: UnifiedFinding;
  onClick: () => void;
  className?: string;
}> = ({ finding, onClick, className }) => (
  <div
    className={`finding-item ${finding.priority}${className ? ' ' + className : ''}`}
    data-finding-id={finding.id}
    onClick={onClick}
  >
    <div className="finding-header">
      <span className="finding-type">{getTypeIcon(finding.type)} {finding.title}</span>
      <span className={`finding-confidence ${finding.priority}`}>{priorityLabel(finding.priority)}</span>
    </div>
    <div className="finding-description">{finding.description}</div>
    <div className="finding-meta">
      <span className="finding-insight" />
      <span className="finding-time">{formatTimeAgo(finding.timestamp)}</span>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  All-findings modal                                                 */
/* ------------------------------------------------------------------ */

const AllFindingsModal: React.FC<{
  findings: UnifiedFinding[];
  onClose: () => void;
  onFindingClick: (f: UnifiedFinding) => void;
}> = ({ findings, onClose, onFindingClick }) => (
  <div
    className="findings-modal-overlay"
    onClick={(e) => {
      if ((e.target as HTMLElement).classList.contains('findings-modal-overlay')) onClose();
    }}
  >
    <div className="findings-modal">
      <div className="findings-modal-header">
        <span className="findings-modal-title">
          {'\uD83C\uDFAF'} All Intelligence Findings ({findings.length})
        </span>
        <button className="findings-modal-close" onClick={onClose}>&times;</button>
      </div>
      <div className="findings-modal-content">
        {findings.map((f) => (
          <div
            key={f.id}
            className={`findings-modal-item ${f.priority}`}
            data-finding-id={f.id}
            onClick={() => onFindingClick(f)}
          >
            <div className="findings-modal-item-header">
              <span className="findings-modal-item-type">{getTypeIcon(f.type)} {f.title}</span>
              <span className={`findings-modal-item-priority ${f.priority}`}>{priorityLabel(f.priority)}</span>
            </div>
            <div className="findings-modal-item-desc">{f.description}</div>
            <div className="findings-modal-item-meta">
              <span className="findings-modal-item-insight" />
              <span className="findings-modal-item-time">{formatTimeAgo(f.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export const IntelligenceGapBadge: React.FC<IntelligenceGapBadgeProps> = ({
  findings,
  enabled = true,
  audioEnabled = true,
  onSignalClick,
  onAlertClick,
  onToggleEnabled,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [showContext, setShowContext] = useState<{ x: number; y: number } | null>(null);
  const [pulse, setPulse] = useState(false);
  const prevCount = useRef(findings.length);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  /* audio setup */
  useEffect(() => {
    if (audioEnabled) {
      audioRef.current = new Audio(
        'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQYjfKapmWswEjCJvuPQfSoXZZ+3qqBJESSP0unGaxMJVYiytrFeLhR6p8znrFUXRW+bs7V3Qx1hn8Xjp1cYPnegprhkMCFmoLi1k0sZTYGlqqlUIA==',
      );
      audioRef.current.volume = 0.3;
    }
  }, [audioEnabled]);

  /* pulse on new findings */
  useEffect(() => {
    if (findings.length > prevCount.current && prevCount.current > 0) {
      setPulse(true);
      if (audioEnabled && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
      const id = window.setTimeout(() => setPulse(false), 1000);
      return () => window.clearTimeout(id);
    }
    prevCount.current = findings.length;
  }, [findings.length, audioEnabled]);

  /* close dropdown on outside click */
  useEffect(() => {
    if (!isOpen) return;
    const handler = () => setIsOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isOpen]);

  /* close context menu on click */
  useEffect(() => {
    if (!showContext) return;
    const handler = () => setShowContext(null);
    document.addEventListener('click', handler, { once: true });
    return () => document.removeEventListener('click', handler);
  }, [showContext]);

  /* derived status */
  const count = findings.length;
  const hasCritical = findings.some((f) => f.priority === 'critical');
  const hasHigh = findings.some((f) => f.priority === 'high' || f.confidence >= 0.7);

  const statusClass = useMemo(() => {
    if (count === 0) return 'status-none';
    if (hasCritical || hasHigh || count > LOW_COUNT_THRESHOLD) return 'status-high';
    return 'status-low';
  }, [count, hasCritical, hasHigh]);

  const handleFindingClick = useCallback(
    (f: UnifiedFinding) => {
      if (f.source === 'signal' && onSignalClick) onSignalClick(f.original);
      else if (f.source === 'alert' && onAlertClick) onAlertClick(f.original);
      setIsOpen(false);
      setShowAll(false);
    },
    [onSignalClick, onAlertClick],
  );

  if (!enabled) return null;

  const criticalCount = findings.filter((f) => f.priority === 'critical').length;
  const highCount = findings.filter((f) => f.priority === 'high' || f.confidence >= 70).length;

  let badgeStatusClass = 'moderate';
  let statusText = `${count} detected`;
  if (criticalCount > 0) {
    badgeStatusClass = 'critical';
    statusText = `${criticalCount} critical`;
  } else if (highCount > 0) {
    badgeStatusClass = 'high';
    statusText = `${highCount} high priority`;
  }

  const moreCount = count - MAX_VISIBLE_FINDINGS;

  return (
    <>
      <button
        className={`intel-findings-badge ${statusClass}${pulse ? ' pulse' : ''}${isOpen ? ' active' : ''}`}
        title={
          count === 0
            ? 'No intelligence findings'
            : `${count} intelligence findings — review recommended`
        }
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowContext({ x: e.clientX, y: e.clientY });
        }}
      >
        <span className="findings-icon">{'\uD83C\uDFAF'}</span>
        <span className="findings-count">{count}</span>

        {/* dropdown */}
        <div className={`intel-findings-dropdown${isOpen ? ' open' : ''}`} onClick={(e) => e.stopPropagation()}>
          {count === 0 ? (
            <>
              <div className="findings-header">
                <span className="header-title">Intelligence Findings</span>
                <span className="findings-badge none">Monitoring</span>
              </div>
              <div className="findings-content">
                <div className="findings-empty">
                  <span className="empty-icon">{'\uD83D\uDCE1'}</span>
                  <span className="empty-text">Scanning for intelligence...</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="findings-header">
                <span className="header-title">Intelligence Findings</span>
                <span className={`findings-badge ${badgeStatusClass}`}>{statusText}</span>
              </div>
              <div className="findings-content">
                <div className="findings-list">
                  {findings.slice(0, MAX_VISIBLE_FINDINGS).map((f) => (
                    <FindingItem key={f.id} finding={f} onClick={() => handleFindingClick(f)} />
                  ))}
                </div>
                {moreCount > 0 && (
                  <div
                    className="findings-more"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAll(true);
                      setIsOpen(false);
                    }}
                  >
                    {moreCount} more findings
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </button>

      {/* context menu */}
      {showContext && (
        <div
          className="intel-findings-context-menu"
          style={{ left: showContext.x, top: showContext.y }}
        >
          <div
            className="context-menu-item"
            onClick={(e) => {
              e.stopPropagation();
              onToggleEnabled?.(false);
              setShowContext(null);
            }}
          >
            Hide Intelligence Findings
          </div>
        </div>
      )}

      {/* all-findings modal */}
      {showAll && (
        <AllFindingsModal
          findings={findings}
          onClose={() => setShowAll(false)}
          onFindingClick={handleFindingClick}
        />
      )}
    </>
  );
};
