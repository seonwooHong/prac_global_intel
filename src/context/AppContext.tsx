import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { PanelConfig, MapLayers } from '@/types';
import {
  DEFAULT_PANELS,
  DEFAULT_MAP_LAYERS,
  MOBILE_DEFAULT_MAP_LAYERS,
  STORAGE_KEYS,
  SITE_VARIANT,
} from '@/config';
import { loadFromStorage, saveToStorage, isMobileDevice } from '@/utils';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface AppState {
  panelSettings: Record<string, PanelConfig>;
  mapLayers: MapLayers;
  sidebarCollapsed: boolean;
  isMobile: boolean;
  theme: string;
}

interface AppContextValue extends AppState {
  setPanelSettings: (next: Record<string, PanelConfig>) => void;
  setMapLayers: (next: MapLayers) => void;
  updateMapLayer: (key: keyof MapLayers, value: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers – compute initial state (mirrors App.ts constructor logic)
// ---------------------------------------------------------------------------

function buildInitialState(): AppState {
  const mobile = isMobileDevice();
  const defaultLayers = mobile ? MOBILE_DEFAULT_MAP_LAYERS : DEFAULT_MAP_LAYERS;

  const storedVariant = localStorage.getItem('worldmonitor-variant');
  const currentVariant = SITE_VARIANT;

  let mapLayers: MapLayers;
  let panelSettings: Record<string, PanelConfig>;

  if (storedVariant !== currentVariant) {
    // Variant changed – reset to defaults
    localStorage.setItem('worldmonitor-variant', currentVariant);
    localStorage.removeItem(STORAGE_KEYS.mapLayers);
    localStorage.removeItem(STORAGE_KEYS.panels);
    localStorage.removeItem('panel-order');
    mapLayers = { ...defaultLayers };
    panelSettings = { ...DEFAULT_PANELS };
  } else {
    mapLayers = loadFromStorage<MapLayers>(STORAGE_KEYS.mapLayers, defaultLayers);
    panelSettings = loadFromStorage<Record<string, PanelConfig>>(
      STORAGE_KEYS.panels,
      DEFAULT_PANELS,
    );

    // Prune stale keys and add missing defaults
    let changed = false;
    for (const key of Object.keys(panelSettings)) {
      if (!(key in DEFAULT_PANELS)) {
        delete panelSettings[key];
        changed = true;
      }
    }
    for (const [key, config] of Object.entries(DEFAULT_PANELS)) {
      if (!(key in panelSettings)) {
        panelSettings[key] = { ...config };
        changed = true;
      }
    }
    if (changed) {
      saveToStorage(STORAGE_KEYS.panels, panelSettings);
    }
  }

  const savedTheme = localStorage.getItem('theme') ?? 'dark';

  return {
    panelSettings,
    mapLayers,
    sidebarCollapsed: mobile, // collapse by default on mobile
    isMobile: mobile,
    theme: savedTheme,
  };
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AppContext = createContext<AppContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [initial] = useState(buildInitialState);

  const [panelSettings, _setPanelSettings] = useState(initial.panelSettings);
  const [mapLayers, _setMapLayers] = useState(initial.mapLayers);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(initial.sidebarCollapsed);
  const [isMobile] = useState(initial.isMobile);
  const [theme, _setTheme] = useState(initial.theme);

  // Persist panel settings when changed
  const setPanelSettings = useCallback((next: Record<string, PanelConfig>) => {
    _setPanelSettings(next);
    saveToStorage(STORAGE_KEYS.panels, next);
  }, []);

  // Persist map layers when changed
  const setMapLayers = useCallback((next: MapLayers) => {
    _setMapLayers(next);
    saveToStorage(STORAGE_KEYS.mapLayers, next);
  }, []);

  // Convenience: toggle a single map layer
  const updateMapLayer = useCallback(
    (key: keyof MapLayers, value: boolean) => {
      _setMapLayers((prev) => {
        const next = { ...prev, [key]: value };
        saveToStorage(STORAGE_KEYS.mapLayers, next);
        return next;
      });
    },
    [],
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const setTheme = useCallback((next: string) => {
    _setTheme(next);
    localStorage.setItem('theme', next);
  }, []);

  const value: AppContextValue = {
    panelSettings,
    mapLayers,
    sidebarCollapsed,
    isMobile,
    theme,
    setPanelSettings,
    setMapLayers,
    updateMapLayer,
    setSidebarCollapsed,
    toggleSidebar,
    setTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---------------------------------------------------------------------------
// Consumer hook
// ---------------------------------------------------------------------------

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within an <AppProvider>');
  }
  return ctx;
}
