import React, { useState, useMemo, useCallback } from 'react';
import { Panel } from './Panel';

type ViewMode = 'upcoming' | 'conferences' | 'earnings' | 'all';

interface TechEventCoords {
  lat: number;
  lng: number;
  country: string;
  original: string;
  virtual?: boolean;
}

interface TechEvent {
  id: string;
  title: string;
  type: 'conference' | 'earnings' | 'ipo' | 'other';
  location: string | null;
  coords: TechEventCoords | null;
  startDate: string;
  endDate: string;
  url: string | null;
}

interface TechEventsPanelProps {
  events?: TechEvent[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onMapLocation?: (lat: number, lng: number) => void;
}

const TYPE_ICONS: Record<string, string> = {
  conference: '\uD83C\uDFA4',
  earnings: '\uD83D\uDCCA',
  ipo: '\uD83D\uDD14',
  other: '\uD83D\uDCCC',
};

const TYPE_CLASSES: Record<string, string> = {
  conference: 'type-conference',
  earnings: 'type-earnings',
  ipo: 'type-ipo',
  other: 'type-other',
};

export const TechEventsPanel = React.memo(function TechEventsPanel({
  events = [],
  loading,
  error,
  onMapLocation,
}: TechEventsPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    switch (viewMode) {
      case 'upcoming':
        return events.filter(e => {
          const start = new Date(e.startDate);
          return start >= now && start <= thirtyDays;
        }).slice(0, 20);
      case 'conferences':
        return events.filter(e => e.type === 'conference' && new Date(e.startDate) >= now).slice(0, 30);
      case 'earnings':
        return events.filter(e => e.type === 'earnings' && new Date(e.startDate) >= now).slice(0, 30);
      case 'all':
        return events.filter(e => new Date(e.startDate) >= now).slice(0, 50);
      default:
        return [];
    }
  }, [events, viewMode]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcomingConferences = events.filter(e => e.type === 'conference' && new Date(e.startDate) >= now);
    const mappable = upcomingConferences.filter(e => e.coords && !e.coords.virtual).length;
    return { conferences: upcomingConferences.length, mappable };
  }, [events]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    onMapLocation?.(lat, lng);
  }, [onMapLocation]);

  const handleTabClick = useCallback((view: ViewMode) => setViewMode(view), []);

  const renderEvent = (event: TechEvent) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const now = new Date();
    const isToday = startDate.toDateString() === now.toDateString();
    const isSoon = !isToday && startDate <= new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const isThisWeek = startDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const dateStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endDateStr = endDate > startDate && endDate.toDateString() !== startDate.toDateString()
      ? ` - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
      : '';

    return (
      <div key={event.id} className={`tech-event ${TYPE_CLASSES[event.type]} ${isToday ? 'is-today' : ''} ${isSoon ? 'is-soon' : ''} ${isThisWeek ? 'is-this-week' : ''}`}>
        <div className="event-date">
          <span className="event-month">{startDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
          <span className="event-day">{startDate.getDate()}</span>
          {isToday && <span className="today-badge">TODAY</span>}
          {isSoon && <span className="soon-badge">SOON</span>}
        </div>
        <div className="event-content">
          <div className="event-header">
            <span className="event-icon">{TYPE_ICONS[event.type]}</span>
            <span className="event-title">{event.title}</span>
            {event.url && <a href={event.url} target="_blank" rel="noopener" className="event-url" title="More info">{'\u2197'}</a>}
          </div>
          <div className="event-meta">
            <span className="event-dates">{dateStr}{endDateStr}</span>
            {event.location && <span className="event-location">{event.location}</span>}
            {event.coords && !event.coords.virtual && (
              <button className="event-map-link" onClick={() => handleMapClick(event.coords!.lat, event.coords!.lng)} title="Show on map">
                {'\uD83D\uDCCD'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Panel id="tech-events" title="Events" showCount count={stats.conferences} loading={loading} error={error} className="panel-tall">
      <div className="tech-events-panel">
        <div className="tech-events-tabs">
          {(['upcoming', 'conferences', 'earnings', 'all'] as ViewMode[]).map(view => (
            <button key={view} className={`tab ${viewMode === view ? 'active' : ''}`} onClick={() => handleTabClick(view)}>
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </button>
          ))}
        </div>
        <div className="tech-events-stats">
          <span className="stat">{'\uD83D\uDCC5'} {stats.conferences} conferences</span>
          <span className="stat">{'\uD83D\uDCCD'} {stats.mappable} on map</span>
          <a href="https://www.techmeme.com/events" target="_blank" rel="noopener" className="source-link">Techmeme Events {'\u2197'}</a>
        </div>
        <div className="tech-events-list">
          {filteredEvents.length > 0 ? filteredEvents.map(renderEvent) : <div className="empty-state">No events found</div>}
        </div>
      </div>
    </Panel>
  );
});
