import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
import { AppProvider, useAppContext } from "@/context/AppContext";

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
import { useNewsData, useMarketData, useIntelData } from "@/hooks";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
import { DEFAULT_PANELS, STORAGE_KEYS } from "@/config";
import { loadFromStorage, saveToStorage } from "@/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
import type { Monitor, NewsItem } from "@/types";
import type { MapContainerState } from "@/components/MapContainer";
import type { NewsCluster } from "@/components/react/NewsPanel";

// ---------------------------------------------------------------------------
// React components
// ---------------------------------------------------------------------------
import { NavBar } from "@/components/react/NavBar";
import { Footer } from "@/components/react/Footer";
import { SettingsModal } from "@/components/react/SettingsModal";
import { SourcesModal } from "@/components/react/SourcesModal";
import { DashboardLayout } from "@/components/react/DashboardLayout";
import { TickerBar } from "@/components/react/TickerBar";
import { TradingViewChart } from "@/components/react/TradingViewChart";
import { ExpertChat } from "@/components/react/ExpertChat";
import { MapSection } from "@/components/react/MapSection";
import { NewsPanel } from "@/components/react/NewsPanel";
import { MarketPanel } from "@/components/react/MarketPanel";
import { EconomicPanel } from "@/components/react/EconomicPanel";
import { Panel } from "@/components/react/Panel";
import { LiveNewsPanel } from "@/components/react/LiveNewsPanel";
import { ETFFlowsPanel } from "@/components/react/ETFFlowsPanel";
import { StablecoinPanel } from "@/components/react/StablecoinPanel";
import { CryptoChannelsPanel } from "@/components/react/CryptoChannelsPanel";
import { MacroSignalsPanel } from "@/components/react/MacroSignalsPanel";
import { MonitorPanel } from "@/components/react/MonitorPanel";
import { GdeltIntelPanel } from "@/components/react/GdeltIntelPanel";
import { CIIPanel } from "@/components/react/CIIPanel";
import { CascadePanel } from "@/components/react/CascadePanel";
import { StrategicRiskPanel } from "@/components/react/StrategicRiskPanel";
import { StrategicPosturePanel } from "@/components/react/StrategicPosturePanel";
import { DisplacementPanel } from "@/components/react/DisplacementPanel";
import { ClimateAnomalyPanel } from "@/components/react/ClimateAnomalyPanel";
import { InvestmentsPanel } from "@/components/react/InvestmentsPanel";
import { InsightsPanel } from "@/components/react/InsightsPanel";
import { TechEventsPanel } from "@/components/react/TechEventsPanel";
import { ServiceStatusPanel } from "@/components/react/ServiceStatusPanel";
import { TechReadinessPanel } from "@/components/react/TechReadinessPanel";
import { PentagonPizzaPanel } from "@/components/react/PentagonPizzaPanel";
import { MapContainer } from "@/components/MapContainer";

// ============================================================================
// Helpers
// ============================================================================

/** Convert flat NewsItem[] to NewsCluster[] for the NewsPanel component. */
function newsItemsToClusters(items: NewsItem[]): NewsCluster[] {
  return items.map((item, idx) => ({
    id: `${item.source}-${idx}-${item.pubDate.getTime()}`,
    primaryTitle: item.title,
    primarySource: item.source,
    primaryLink: item.link,
    sourceCount: 1,
    lastUpdated: item.pubDate,
    isAlert: item.isAlert,
    monitorColor: item.monitorColor,
    lang: item.lang,
    threat: item.threat
      ? { level: item.threat.level, category: item.threat.category }
      : undefined,
    topSources: [{ name: item.source, tier: item.tier ?? 3 }],
  }));
}

/** Format UTC clock string. */
function formatUTCClock(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())} UTC`;
}

// ============================================================================
// Panel registry — maps panel IDs to their React components & prop builders
// ============================================================================

/**
 * News panel categories — every panel ID that uses NewsPanel with data from
 * newsByCategory[id].
 */
const NEWS_PANEL_IDS: Array<{ id: string; titleKey: string }> = [
  { id: "politics", titleKey: "panels.politics" },
  { id: "tech", titleKey: "panels.tech" },
  { id: "finance", titleKey: "panels.finance" },
  { id: "gov", titleKey: "panels.gov" },
  { id: "intel", titleKey: "panels.intel" },
  { id: "middleeast", titleKey: "panels.middleeast" },
  { id: "layoffs", titleKey: "panels.layoffs" },
  { id: "ai", titleKey: "panels.ai" },
  { id: "startups", titleKey: "panels.startups" },
  { id: "vcblogs", titleKey: "panels.vcblogs" },
  { id: "regionalStartups", titleKey: "panels.regionalStartups" },
  { id: "unicorns", titleKey: "panels.unicorns" },
  { id: "accelerators", titleKey: "panels.accelerators" },
  { id: "funding", titleKey: "panels.funding" },
  { id: "producthunt", titleKey: "panels.producthunt" },
  { id: "security", titleKey: "panels.security" },
  { id: "policy", titleKey: "panels.policy" },
  { id: "hardware", titleKey: "panels.hardware" },
  { id: "cloud", titleKey: "panels.cloud" },
  { id: "dev", titleKey: "panels.dev" },
  { id: "github", titleKey: "panels.github" },
  { id: "ipo", titleKey: "panels.ipo" },
  { id: "thinktanks", titleKey: "panels.thinktanks" },
  { id: "africa", titleKey: "panels.africa" },
  { id: "latam", titleKey: "panels.latam" },
  { id: "asia", titleKey: "panels.asia" },
  { id: "energy", titleKey: "panels.energy" },
  { id: "us", titleKey: "panels.us" },
  { id: "europe", titleKey: "panels.europe" },
  { id: "markets-news", titleKey: "panels.markets-news" },
  { id: "forex", titleKey: "panels.forex" },
  { id: "bonds", titleKey: "panels.bonds" },
  { id: "commodities-news", titleKey: "panels.commodities-news" },
  { id: "centralbanks", titleKey: "panels.centralbanks" },
  { id: "economic-news", titleKey: "panels.economic-news" },
  { id: "derivatives", titleKey: "panels.derivatives" },
  { id: "fintech", titleKey: "panels.fintech" },
  { id: "regulation", titleKey: "panels.regulation" },
  { id: "institutional", titleKey: "panels.institutional" },
  { id: "analysis", titleKey: "panels.analysis" },
  { id: "gccNews", titleKey: "panels.gccNews" },
  { id: "supply-chain", titleKey: "panels.supply-chain" },
];

/** Panel IDs that are not rendered in the panels stream (map is separate). */
const EXCLUDED_PANEL_IDS = new Set<string>(["map"]);

// ============================================================================
// Clock hook
// ============================================================================

function useUTCClock(): string {
  const [clock, setClock] = useState(formatUTCClock);
  useEffect(() => {
    const id = setInterval(() => setClock(formatUTCClock()), 1000);
    return () => clearInterval(id);
  }, []);
  return clock;
}

// ============================================================================
// Inner app (requires AppProvider context)
// ============================================================================

function AppInner() {
  // ---- Context ----
  const {
    panelSettings,
    setPanelSettings,
    mapLayers,
    updateMapLayer,
    isMobile,
  } = useAppContext();

  // ---- Modals ----
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const openSettings = useCallback(() => setSettingsOpen(true), []);
  const closeSettings = useCallback(() => setSettingsOpen(false), []);
  const openSources = useCallback(() => setSourcesOpen(true), []);
  const closeSources = useCallback(() => setSourcesOpen(false), []);

  // ---- Clock ----
  const clock = useUTCClock();

  // ---- Data hooks ----
  const {
    data: newsData,
    loading: newsLoading,
    error: newsError,
  } = useNewsData();
  const {
    data: marketData,
    loading: marketLoading,
    error: marketError,
  } = useMarketData();
  // Intel data is fetched but not yet wired to specific panels in this version.
  // Keep the hook active so data is cached and ready when panels are wired up.
  useIntelData();

  // ---- Map ref ----
  const mapRef = useRef<MapContainer | null>(null);

  const initialMapState = useMemo<MapContainerState>(
    () => ({
      zoom: isMobile ? 2.5 : 1.0,
      pan: { x: 0, y: 0 },
      view: isMobile ? "mena" : "global",
      layers: mapLayers,
      timeRange: "7d",
    }),
    [isMobile],
  ); // mapLayers intentionally excluded - only used on first render

  // ---- Monitors (persisted to localStorage) ----
  const [monitors, setMonitors] = useState<Monitor[]>(() =>
    loadFromStorage<Monitor[]>(STORAGE_KEYS.monitors, []),
  );
  const handleMonitorsChange = useCallback((next: Monitor[]) => {
    setMonitors(next);
    saveToStorage(STORAGE_KEYS.monitors, next);
  }, []);

  // ---- Map callbacks ----
  const handleSidebarCollapseChange = useCallback((_collapsed: boolean) => {
    // Allow CSS transition to finish, then re-render the map
    setTimeout(() => mapRef.current?.render(), 350);
  }, []);


  const handleMapLocationClick = useCallback((lat: number, lon: number) => {
    mapRef.current?.setCenter(lat, lon, 4);
  }, []);

  // ---- Build news clusters by category (memoized) ----
  const clustersByCategory = useMemo(() => {
    if (!newsData) return {} as Record<string, NewsCluster[]>;
    const result: Record<string, NewsCluster[]> = {};
    for (const [category, items] of Object.entries(newsData.newsByCategory)) {
      result[category] = newsItemsToClusters(items);
    }
    return result;
  }, [newsData]);

  // ---- Market data mapped to MarketPanel format ----
  const marketItems = useMemo(() => {
    if (!marketData) return [];
    return marketData.stocks.map((s) => ({
      symbol: s.symbol,
      name: s.name,
      display: s.display,
      price: s.price,
      change: s.change,
      sparkline: s.sparkline,
    }));
  }, [marketData]);

  const commodityItems = useMemo(() => {
    if (!marketData) return [];
    return marketData.commodities;
  }, [marketData]);

  const sectorItems = useMemo(() => {
    if (!marketData) return [];
    return marketData.sectors;
  }, [marketData]);

  // ---- Panel visibility helper ----
  const isPanelVisible = useCallback(
    (id: string): boolean => {
      const cfg = panelSettings[id];
      if (!cfg) return false;
      return cfg.enabled !== false;
    },
    [panelSettings],
  );

  // ---- Settings modal: panel toggle grid ----
  const settingsContent = useMemo(() => {
    const keys = Object.keys(DEFAULT_PANELS).filter((k) => k !== "map");
    return (
      <>
        {keys.map((key) => {
          const cfg = panelSettings[key] ?? DEFAULT_PANELS[key];
          if (!cfg) return null;
          return (
            <label key={key} className="panel-toggle-item">
              <input
                type="checkbox"
                checked={cfg.enabled !== false}
                onChange={() => {
                  const next = {
                    ...panelSettings,
                    [key]: { ...cfg, enabled: !cfg.enabled },
                  };
                  setPanelSettings(next);
                }}
              />
              <span>{cfg.name}</span>
            </label>
          );
        })}
      </>
    );
  }, [panelSettings, setPanelSettings]);

  // ======================================================================
  // Render panel grid — all panels not assigned to middle-right or sidebar
  // ======================================================================

  const defaultOrder = useMemo(
    () => Object.keys(DEFAULT_PANELS).filter((k) => k !== "map"),
    [],
  );

  const panelsGridContent = useMemo(() => {
    const elements: React.ReactNode[] = [];

    for (const key of defaultOrder) {
      if (EXCLUDED_PANEL_IDS.has(key)) continue;
      if (!isPanelVisible(key)) continue;

      // Check if it is a news panel
      const newsEntry = NEWS_PANEL_IDS.find((n) => n.id === key);
      if (newsEntry) {
        const clusters = clustersByCategory[key] ?? [];
        elements.push(
          <NewsPanel
            key={key}
            clusters={clusters}
            loading={newsLoading && clusters.length === 0}
            error={newsError?.message}
          />,
        );
        continue;
      }

      // Custom panels
      switch (key) {
        case "live-news":
          elements.push(<LiveNewsPanel key={key} />);
          break;

        case "etf-flows":
          elements.push(<ETFFlowsPanel key={key} loading />);
          break;

        case "stablecoins":
          elements.push(<StablecoinPanel key={key} loading />);
          break;

        case "commodities":
          elements.push(
            <Panel
              key={key}
              id="commodities"
              title={panelSettings["commodities"]?.name ?? "Commodities"}
              loading={marketLoading && commodityItems.length === 0}
              showCount
              count={commodityItems.length}
            >
              {commodityItems.length > 0 ? (
                <div className="commodities-list">
                  {commodityItems.map((c) => (
                    <div key={c.display} className="commodity-row">
                      <span className="commodity-name">{c.display}</span>
                      <span className="commodity-price">
                        {c.price != null ? c.price.toFixed(2) : "--"}
                      </span>
                      <span
                        className={`commodity-change ${
                          (c.change ?? 0) >= 0 ? "positive" : "negative"
                        }`}
                      >
                        {c.change != null
                          ? `${c.change >= 0 ? "+" : ""}${c.change.toFixed(2)}%`
                          : "--"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-loading-text">Loading commodities...</div>
              )}
            </Panel>,
          );
          break;

        case "markets":
          elements.push(
            <MarketPanel
              key={key}
              data={marketItems}
              loading={marketLoading}
              error={marketError?.message}
            />,
          );
          break;

        case "economic":
          elements.push(<EconomicPanel key={key} indicators={[]} loading />);
          break;

        case "crypto-channels":
          elements.push(<CryptoChannelsPanel key={key} loading />);
          break;

        case "heatmap":
          elements.push(
            <Panel
              key={key}
              id="heatmap"
              title={panelSettings[key]?.name ?? "Sector Heatmap"}
              loading={marketLoading}
            >
              {sectorItems.length > 0 ? (
                <div className="heatmap-grid">
                  {sectorItems.map((s) => (
                    <div
                      key={s.name}
                      className={`heatmap-cell ${(s.change ?? 0) >= 0 ? "positive" : "negative"}`}
                    >
                      <span className="heatmap-name">{s.name}</span>
                      <span className="heatmap-change">
                        {s.change != null
                          ? `${s.change >= 0 ? "+" : ""}${s.change.toFixed(2)}%`
                          : "--"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel-loading-text">Loading sector data...</div>
              )}
            </Panel>,
          );
          break;

        case "polymarket":
          elements.push(
            <Panel
              key={key}
              id="polymarket"
              title={panelSettings[key]?.name ?? "Predictions"}
              loading
            >
              <div className="panel-loading-text">Loading predictions...</div>
            </Panel>,
          );
          break;

        case "monitors":
          elements.push(
            <MonitorPanel
              key={key}
              monitors={monitors}
              news={newsData?.allNews ?? []}
              onMonitorsChange={handleMonitorsChange}
            />,
          );
          break;

        case "crypto":
          elements.push(<CryptoChannelsPanel key={key} loading />);
          break;

        case "crypto-channels":
          elements.push(<CryptoChannelsPanel key={key} loading />);
          break;

        case "macro-signals":
          elements.push(<MacroSignalsPanel key={key} loading />);
          break;

        case "gdelt-intel":
          elements.push(<GdeltIntelPanel key={key} articles={[]} loading />);
          break;

        case "cii":
          elements.push(<CIIPanel key={key} loading />);
          break;

        case "cascade":
          elements.push(<CascadePanel key={key} loading />);
          break;

        case "strategic-risk":
          elements.push(
            <StrategicRiskPanel
              key={key}
              loading
              onLocationClick={handleMapLocationClick}
            />,
          );
          break;

        case "strategic-posture":
          elements.push(
            <StrategicPosturePanel
              key={key}
              loading
              onLocationClick={handleMapLocationClick}
            />,
          );
          break;

        case "displacement":
          elements.push(
            <DisplacementPanel
              key={key}
              loading
              onCountryClick={handleMapLocationClick}
            />,
          );
          break;

        case "climate":
          elements.push(
            <ClimateAnomalyPanel
              key={key}
              anomalies={[]}
              loading
              onZoneClick={handleMapLocationClick}
            />,
          );
          break;

        case "gcc-investments":
          elements.push(<InvestmentsPanel key={key} loading />);
          break;

        case "insights":
          elements.push(<InsightsPanel key={key} clusters={[]} loading />);
          break;

        case "events":
          elements.push(
            <TechEventsPanel
              key={key}
              loading
              onMapLocation={handleMapLocationClick}
            />,
          );
          break;

        case "service-status":
          elements.push(<ServiceStatusPanel key={key} loading />);
          break;

        case "tech-readiness":
          elements.push(<TechReadinessPanel key={key} loading />);
          break;

        case "pentagon-pizza":
          elements.push(<PentagonPizzaPanel key={key} loading />);
          break;

        case "world-clock":
          elements.push(
            <Panel
              key={key}
              id="world-clock"
              title={panelSettings[key]?.name ?? "World Clock"}
            >
              <div className="panel-loading-text">Clock widget</div>
            </Panel>,
          );
          break;

        default: {
          // Fallback: render a generic Panel placeholder for any panel ID
          // that exists in DEFAULT_PANELS but has no dedicated component yet
          const cfg = panelSettings[key];
          if (cfg) {
            elements.push(
              <Panel key={key} id={key} title={cfg.name ?? key} loading>
                <div className="panel-loading-text">Loading...</div>
              </Panel>,
            );
          }
          break;
        }
      }
    }

    return elements;
  }, [
    defaultOrder,
    isPanelVisible,
    panelSettings,
    clustersByCategory,
    newsLoading,
    newsError,
    newsData,
    marketLoading,
    sectorItems,
    monitors,
    handleMonitorsChange,
    handleMapLocationClick,
  ]);

  // (middleRightContent and middleLeftContent removed — all panels flow in panelsGridContent)

  // ======================================================================
  // Sidebar
  // ======================================================================

  const sidebarContent = useMemo(
    () => (
      <>
        <TradingViewChart />
        <ExpertChat />
      </>
    ),
    [],
  );

  // ======================================================================
  // Map section
  // ======================================================================

  const mapContent = useMemo(
    () => (
      <MapSection
        initialState={initialMapState}
        mapLayers={mapLayers}
        mapRef={mapRef}
        onLayerChange={(layer, enabled) => updateMapLayer(layer, enabled)}
      />
    ),
    [initialMapState, mapLayers, updateMapLayer],
  );

  // ======================================================================
  // Render
  // ======================================================================

  return (
    <div className="app-wrapper">
      <NavBar onSettingsClick={openSettings} onSourcesClick={openSources} />
      <TickerBar />

      <DashboardLayout
        sidebarContent={sidebarContent}
        mapContent={mapContent}
        panelsContent={panelsGridContent}
        headerClockContent={clock}
        onSidebarCollapseChange={handleSidebarCollapseChange}
      />

      <Footer />

      <SettingsModal open={settingsOpen} onClose={closeSettings}>
        {settingsContent}
      </SettingsModal>

      <SourcesModal open={sourcesOpen} onClose={closeSources} />
    </div>
  );
}

// ============================================================================
// Root export — wraps everything in AppProvider
// ============================================================================

export default function AppRoot() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
