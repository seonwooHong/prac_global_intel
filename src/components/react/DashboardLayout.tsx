import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { t } from '@/services/i18n';

interface DashboardLayoutProps {
  /** Content to render inside the sidebar (e.g. TradingViewChart + ExpertChat via VanillaPanelBridge) */
  sidebarContent?: ReactNode;
  /** Map section content */
  mapContent?: ReactNode;
  /** Middle-left slot (live news) */
  middleLeftContent?: ReactNode;
  /** Middle-right slot (2x3 panel grid) */
  middleRightContent?: ReactNode;
  /** Bottom panels grid */
  panelsGridContent?: ReactNode;
  /** Header clock element */
  headerClockContent?: ReactNode;
  /** Callback when sidebar collapse changes (for map resize, etc.) */
  onSidebarCollapseChange?: (collapsed: boolean) => void;
  /** Callback for map pin button */
  onMapPinClick?: () => void;
}

const STORAGE_KEY = 'sidebar-collapsed';

export function DashboardLayout({
  sidebarContent,
  mapContent,
  middleLeftContent,
  middleRightContent,
  panelsGridContent,
  headerClockContent,
  onSidebarCollapseChange,
  onMapPinClick,
}: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, collapsed ? 'true' : 'false');
    onSidebarCollapseChange?.(collapsed);
  }, [collapsed, onSidebarCollapseChange]);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  return (
    <div
      className={`dashboard-layout${collapsed ? ' sidebar-collapsed' : ''}`}
      id="dashboardLayout"
    >
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-content" id="colLeft">
          {sidebarContent}
        </div>
        <button
          className="sidebar-collapse-btn"
          title="Toggle sidebar"
          onClick={toggleSidebar}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </aside>
      <main className="main-area" id="mainArea">
        <div className="map-section" id="mapSection">
          <div className="panel-header">
            <div className="panel-header-left">
              <span className="panel-title">{t('panels.map')}</span>
            </div>
            <span className="header-clock" id="headerClock">
              {headerClockContent}
            </span>
            <button
              className="map-pin-btn"
              title={t('header.pinMap')}
              onClick={onMapPinClick}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 17v5M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16a1 1 0 001 1h12a1 1 0 001-1v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V7a1 1 0 011-1 1 1 0 001-1V4a1 1 0 00-1-1H8a1 1 0 00-1 1v1a1 1 0 001 1 1 1 0 011 1v3.76z" />
              </svg>
            </button>
          </div>
          <div className="map-container" id="mapContainer">
            {mapContent}
          </div>
        </div>
        <div className="content-row-middle" id="contentRowMiddle">
          <div className="middle-left" id="liveNewsMount">
            {middleLeftContent}
          </div>
          <div className="middle-right" id="middleRightPanels">
            {middleRightContent}
          </div>
        </div>
        <div className="panels-grid" id="panelsGrid">
          {panelsGridContent}
        </div>
      </main>
    </div>
  );
}
