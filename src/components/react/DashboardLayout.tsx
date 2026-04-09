import { useState, useEffect, useCallback, type ReactNode } from 'react';

interface DashboardLayoutProps {
  sidebarContent?: ReactNode;
  mapContent?: ReactNode;
  panelsContent?: ReactNode;
  headerClockContent?: ReactNode;
  onSidebarCollapseChange?: (collapsed: boolean) => void;
}

const STORAGE_KEY = 'sidebar-collapsed';
const PIN_STORAGE_KEY = 'map-pinned';

export function DashboardLayout({
  sidebarContent,
  mapContent,
  panelsContent,
  headerClockContent,
  onSidebarCollapseChange,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const [mapPinned, setMapPinned] = useState(() => {
    return localStorage.getItem(PIN_STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false');
    onSidebarCollapseChange?.(collapsed);
  }, [collapsed, onSidebarCollapseChange]);

  useEffect(() => {
    localStorage.setItem(PIN_STORAGE_KEY, mapPinned ? 'true' : 'false');
  }, [mapPinned]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const toggleMapPin = useCallback(() => {
    setMapPinned((prev) => !prev);
  }, []);

  return (
    <div
      className={`dashboard-layout${collapsed ? ' sidebar-collapsed' : ''}${mapPinned ? ' map-pinned' : ''}`}
      id="dashboardLayout"
    >
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-content" id="colLeft">
          {sidebarContent}
        </div>
        <button className="sidebar-collapse-btn" title="Toggle sidebar" onClick={toggleSidebar}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>
      <main className="main-area" id="mainArea">
        <div className="map-section" id="mapSection">
          <div className="panel-header">
            <div className="panel-header-left">
              <span className="panel-title">GLOBAL SITUATION</span>
            </div>
            <span className="header-clock" id="headerClock">{headerClockContent}</span>
            <button
              className={`map-pin-btn${mapPinned ? ' pinned' : ''}`}
              title={mapPinned ? 'Unpin map' : 'Pin map'}
              onClick={toggleMapPin}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16a1 1 0 001 1h12a1 1 0 001-1v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 011-1 1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v1a1 1 0 001 1 1 1 0 011 1v3.76z" />
              </svg>
            </button>
          </div>
          <div className="map-container" id="mapContainer">{mapContent}</div>
        </div>
        <div className="right-scroll-column" id="rightScrollColumn">
          <div className="panels-grid" id="panelsGrid">
            {panelsContent}
          </div>
        </div>
      </main>
    </div>
  );
}
