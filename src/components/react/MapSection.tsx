import React, { useRef, useEffect } from 'react';
import {
  MapContainer,
  type MapContainerState,
  type TimeRange,
  type MapView,
} from '../MapContainer';
import type { MapLayers } from '@/types';

export interface MapSectionProps {
  initialState: MapContainerState;
  mapLayers?: MapLayers;
  timeRange?: TimeRange;
  view?: MapView;
  className?: string;
  onStateChange?: (state: MapContainerState) => void;
  onTimeRangeChange?: (range: TimeRange) => void;
  onLayerChange?: (layer: keyof MapLayers, enabled: boolean) => void;
  /** Ref callback to expose the MapContainer instance for imperative data pushes */
  mapRef?: React.MutableRefObject<MapContainer | null>;
}

export const MapSection = React.memo(function MapSection({
  initialState,
  mapLayers,
  timeRange,
  view,
  className,
  onStateChange,
  onTimeRangeChange,
  onLayerChange,
  mapRef,
}: MapSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapContainer | null>(null);

  // Initialize MapContainer once
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const instance = new MapContainer(el, initialState);
    mapInstanceRef.current = instance;

    if (mapRef) {
      mapRef.current = instance;
    }

    // Bind callbacks
    if (onStateChange) {
      instance.onStateChanged(onStateChange);
    }
    if (onTimeRangeChange) {
      instance.onTimeRangeChanged(onTimeRangeChange);
    }
    if (onLayerChange) {
      instance.setOnLayerChange(onLayerChange);
    }

    instance.render();

    return () => {
      instance.destroy();
      mapInstanceRef.current = null;
      if (mapRef) {
        mapRef.current = null;
      }
    };
    // Only run on mount/unmount - initialState is consumed once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push layer changes
  useEffect(() => {
    if (mapLayers && mapInstanceRef.current) {
      mapInstanceRef.current.setLayers(mapLayers);
    }
  }, [mapLayers]);

  // Push time range changes
  useEffect(() => {
    if (timeRange && mapInstanceRef.current) {
      mapInstanceRef.current.setTimeRange(timeRange);
    }
  }, [timeRange]);

  // Push view changes
  useEffect(() => {
    if (view && mapInstanceRef.current) {
      mapInstanceRef.current.setView(view);
    }
  }, [view]);

  return (
    <div
      ref={containerRef}
      className={className || 'map-container'}
      style={{ width: '100%', height: '100%' }}
    />
  );
});
