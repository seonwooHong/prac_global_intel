import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

export interface PanelProps {
  id: string;
  title: string;
  showCount?: boolean;
  count?: number;
  className?: string;
  infoTooltip?: string;
  loading?: boolean;
  loadingMessage?: string;
  error?: string;
  dataBadge?: { state: 'live' | 'cached' | 'unavailable'; detail?: string } | null;
  newBadgeCount?: number;
  newBadgePulse?: boolean;
  headerError?: boolean;
  headerErrorTooltip?: string;
  hidden?: boolean;
  children?: React.ReactNode;
  headerActions?: React.ReactNode;
}

const PANEL_SPANS_KEY = 'worldmonitor-panel-spans';

function loadPanelSpans(): Record<string, number> {
  try {
    const stored = localStorage.getItem(PANEL_SPANS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function savePanelSpan(panelId: string, span: number): void {
  const spans = loadPanelSpans();
  spans[panelId] = span;
  localStorage.setItem(PANEL_SPANS_KEY, JSON.stringify(spans));
}

function heightToSpan(height: number): number {
  if (height >= 500) return 4;
  if (height >= 350) return 3;
  if (height >= 250) return 2;
  return 1;
}

export const Panel = React.memo(function Panel({
  id,
  title,
  showCount,
  count,
  className,
  infoTooltip,
  loading,
  loadingMessage = 'Loading...',
  error,
  dataBadge,
  newBadgeCount = 0,
  newBadgePulse = false,
  headerError,
  headerErrorTooltip,
  hidden,
  children,
  headerActions,
}: PanelProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [spanClass, setSpanClass] = useState<string>(() => {
    const saved = loadPanelSpans();
    const s = saved[id];
    return s && s > 1 ? `span-${s} resized` : '';
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const isResizingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  // Close tooltip on outside click
  useEffect(() => {
    if (!tooltipVisible) return;
    const handler = () => setTooltipVisible(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [tooltipVisible]);

  // Resize handlers
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = panelRef.current;
    if (!el) return;

    isResizingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = el.getBoundingClientRect().height;
    el.classList.add('resizing');

    const onMouseMove = (ev: MouseEvent) => {
      if (!isResizingRef.current) return;
      const deltaY = ev.clientY - startYRef.current;
      const newHeight = Math.max(200, startHeightRef.current + deltaY);
      const span = heightToSpan(newHeight);
      setSpanClass(`span-${span} resized`);
    };

    const onMouseUp = () => {
      if (!isResizingRef.current) return;
      isResizingRef.current = false;
      el.classList.remove('resizing');
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);

      // Read current span from state and save
      const match = el.className.match(/span-(\d)/);
      const currentSpan = match && match[1] ? parseInt(match[1], 10) : 1;
      savePanelSpan(id, currentSpan);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [id]);

  const onResizeDblClick = useCallback(() => {
    setSpanClass('');
    const spans = loadPanelSpans();
    delete spans[id];
    localStorage.setItem(PANEL_SPANS_KEY, JSON.stringify(spans));
  }, [id]);

  // Data badge labels
  const badgeLabels: Record<string, string> = { live: 'LIVE', cached: 'CACHED', unavailable: 'UNAVAILABLE' };

  const panelClasses = useMemo(() => {
    const parts = ['panel'];
    if (className) parts.push(className);
    if (spanClass) parts.push(spanClass);
    if (hidden) parts.push('hidden');
    if (newBadgeCount > 0) parts.push('has-new');
    return parts.join(' ');
  }, [className, spanClass, hidden, newBadgeCount]);

  const headerClasses = useMemo(() => {
    const parts = ['panel-header'];
    if (headerError) parts.push('panel-header-error');
    return parts.join(' ');
  }, [headerError]);

  return (
    <div
      ref={panelRef}
      className={panelClasses}
      data-panel={id}
      title={headerErrorTooltip || undefined}
    >
      <div className={headerClasses}>
        <div className="panel-header-left">
          <span className="panel-title">{title}</span>

          {infoTooltip && (
            <div className="panel-info-wrapper">
              <button
                className="panel-info-btn"
                aria-label="Show methodology info"
                onClick={(e) => {
                  e.stopPropagation();
                  setTooltipVisible((v) => !v);
                }}
              >
                ?
              </button>
              <div
                className={`panel-info-tooltip${tooltipVisible ? ' visible' : ''}`}
                dangerouslySetInnerHTML={{ __html: infoTooltip }}
              />
            </div>
          )}

          {newBadgeCount > 0 && (
            <span
              className={`panel-new-badge${newBadgePulse ? ' pulse' : ''}`}
              style={{ display: 'inline-flex' }}
            >
              {newBadgeCount > 99 ? '99+' : `${newBadgeCount} new`}
            </span>
          )}
        </div>

        {dataBadge && (
          <span
            className={`panel-data-badge ${dataBadge.state}`}
            style={{ display: 'inline-flex' }}
          >
            {dataBadge.detail
              ? `${badgeLabels[dataBadge.state]} · ${dataBadge.detail}`
              : badgeLabels[dataBadge.state]}
          </span>
        )}

        {headerActions}

        {showCount && (
          <span className="panel-count">{count ?? 0}</span>
        )}
      </div>

      <div className="panel-content" id={`${id}Content`}>
        {loading ? (
          <div className="panel-loading">
            <div className="panel-loading-radar">
              <div className="panel-radar-sweep" />
              <div className="panel-radar-dot" />
            </div>
            <div className="panel-loading-text">{loadingMessage}</div>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          children
        )}
      </div>

      <div
        className="panel-resize-handle"
        title="Drag to resize (double-click to reset)"
        draggable={false}
        onMouseDown={onResizeMouseDown}
        onDoubleClick={onResizeDblClick}
      />
    </div>
  );
});
