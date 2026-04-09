import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PopupType =
  | 'conflict' | 'hotspot' | 'earthquake' | 'weather' | 'base'
  | 'waterway' | 'apt' | 'cyberThreat' | 'nuclear' | 'economic'
  | 'irradiator' | 'pipeline' | 'cable' | 'cable-advisory'
  | 'repair-ship' | 'outage' | 'datacenter' | 'datacenterCluster'
  | 'ais' | 'protest' | 'protestCluster' | 'flight'
  | 'militaryFlight' | 'militaryVessel' | 'militaryFlightCluster'
  | 'militaryVesselCluster' | 'natEvent' | 'port' | 'spaceport'
  | 'mineral' | 'startupHub' | 'cloudRegion' | 'techHQ'
  | 'accelerator' | 'techEvent' | 'techHQCluster' | 'techEventCluster'
  | 'techActivity' | 'geoActivity' | 'stockExchange'
  | 'financialCenter' | 'centralBank' | 'commodityHub';

export interface PopupData {
  type: PopupType;
  /** The entity-specific data object (conflict, hotspot, earthquake, etc.) */
  data: Record<string, unknown>;
  relatedNews?: Array<Record<string, unknown>>;
  x: number;
  y: number;
}

export interface MapPopupProps {
  /** When non-null the popup is shown; set to null to hide. */
  popupData: PopupData | null;
  /** Pre-rendered HTML string produced by the vanilla MapPopup.renderContent */
  contentHtml?: string;
  /** Called when the popup requests closing (click-outside / Escape / close btn). */
  onClose: () => void;
  /** Bounding rect of the map container – used for positioning. */
  containerRect?: DOMRect;
  /** Whether the device is mobile (switches to bottom-sheet mode). */
  isMobile?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const MapPopup: React.FC<MapPopupProps> = ({
  popupData,
  contentHtml,
  onClose,
  containerRect,
  isMobile = false,
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const currentOffset = useRef(0);
  const DISMISS_THRESHOLD = 96;

  /* ---------- position (desktop) ---------- */
  const getStyle = useCallback((): React.CSSProperties => {
    if (isMobile || !popupData || !containerRect) return {};

    const popupWidth = 380;
    const bottomBuffer = 50;
    const topBuffer = 60;

    const viewportX = containerRect.left + popupData.x;
    const viewportY = containerRect.top + popupData.y;

    const maxX = window.innerWidth - popupWidth - 20;
    let left = viewportX + 20;
    if (left > maxX) {
      left = Math.max(10, viewportX - popupWidth - 20);
    }

    const estimatedHeight = 300;
    const availableBelow = window.innerHeight - viewportY - bottomBuffer;
    const availableAbove = viewportY - topBuffer;

    let top: number;
    if (availableBelow >= estimatedHeight) {
      top = viewportY + 10;
    } else if (availableAbove >= estimatedHeight) {
      top = viewportY - estimatedHeight - 10;
    } else {
      top = topBuffer;
    }

    top = Math.max(topBuffer, top);
    const maxTop = window.innerHeight - estimatedHeight - bottomBuffer;
    if (maxTop > topBuffer) {
      top = Math.min(top, maxTop);
    }

    return { position: 'fixed', left, top };
  }, [popupData, containerRect, isMobile]);

  /* ---------- click-outside & Escape ---------- */
  useEffect(() => {
    if (!popupData) return;

    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const timerId = window.setTimeout(() => {
      document.addEventListener('click', handleOutside);
      document.addEventListener('touchstart', handleOutside);
      document.addEventListener('keydown', handleEsc);
    }, 0);

    return () => {
      window.clearTimeout(timerId);
      document.removeEventListener('click', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [popupData, onClose]);

  /* ---------- mobile sheet animation ---------- */
  useEffect(() => {
    if (popupData && isMobile) {
      requestAnimationFrame(() => setSheetOpen(true));
    } else {
      setSheetOpen(false);
    }
  }, [popupData, isMobile]);

  /* ---------- touch-to-dismiss (mobile) ---------- */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile || e.touches.length !== 1) return;
    touchStartY.current = e.touches[0]?.clientY ?? null;
    currentOffset.current = 0;
    popupRef.current?.classList.add('dragging');
  }, [isMobile]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || touchStartY.current === null) return;
    const currentY = e.touches[0]?.clientY;
    if (currentY == null) return;
    const delta = Math.max(0, currentY - touchStartY.current);
    if (delta <= 0) return;
    currentOffset.current = delta;
    if (popupRef.current) {
      popupRef.current.style.transform = `translate3d(0, ${delta}px, 0)`;
    }
    e.preventDefault();
  }, [isMobile]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || touchStartY.current === null) return;
    const shouldDismiss = currentOffset.current >= DISMISS_THRESHOLD;
    popupRef.current?.classList.remove('dragging');
    touchStartY.current = null;

    if (shouldDismiss) {
      onClose();
      return;
    }
    currentOffset.current = 0;
    if (popupRef.current) {
      popupRef.current.style.transform = '';
      popupRef.current.classList.add('open');
    }
  }, [isMobile, onClose]);

  /* ---------- render ---------- */
  if (!popupData) return null;

  const className = isMobile
    ? `map-popup map-popup-sheet${sheetOpen ? ' open' : ''}`
    : 'map-popup';

  return (
    <div
      ref={popupRef}
      className={className}
      style={isMobile ? undefined : getStyle()}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      onTouchCancel={isMobile ? handleTouchEnd : undefined}
    >
      {isMobile && (
        <button
          className="map-popup-sheet-handle"
          aria-label="Close"
          onClick={onClose}
        />
      )}

      {contentHtml ? (
        <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
      ) : (
        <div className="popup-body">
          <button className="popup-close" onClick={onClose}>
            &times;
          </button>
          <div className="popup-placeholder">
            <span>{popupData.type}</span>
          </div>
        </div>
      )}
    </div>
  );
};
