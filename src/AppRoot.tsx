import { useRef, useEffect } from 'react';
import { App } from './App';

/**
 * React root that bridges the existing vanilla TS App class.
 *
 * Phase 1: Mount the entire vanilla app inside React via containerId.
 * Phase 2+: Gradually replace with native React components.
 */
export default function AppRoot() {
  const appRef = useRef<App | null>(null);

  useEffect(() => {
    if (appRef.current) return;

    const app = new App('app-legacy');
    appRef.current = app;
    app.init();
  }, []);

  return <div id="app-legacy" style={{ width: '100%', height: '100%' }} />;
}
