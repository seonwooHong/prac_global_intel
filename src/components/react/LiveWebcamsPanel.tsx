import React, { useState, useMemo, useCallback } from 'react';
import { Panel } from './Panel';

type WebcamRegion = 'middle-east' | 'europe' | 'asia' | 'americas';
type ViewMode = 'grid' | 'single';
type RegionFilter = 'all' | WebcamRegion;

interface WebcamFeed {
  id: string;
  city: string;
  country: string;
  region: WebcamRegion;
  channelHandle: string;
  fallbackVideoId: string;
}

const WEBCAM_FEEDS: WebcamFeed[] = [
  { id: 'jerusalem', city: 'Jerusalem', country: 'Israel', region: 'middle-east', channelHandle: '@TheWesternWall', fallbackVideoId: 'UyduhBUpO7Q' },
  { id: 'tehran', city: 'Tehran', country: 'Iran', region: 'middle-east', channelHandle: '@IranHDCams', fallbackVideoId: '-zGuR1qVKrU' },
  { id: 'tel-aviv', city: 'Tel Aviv', country: 'Israel', region: 'middle-east', channelHandle: '@IsraelLiveCam', fallbackVideoId: '-VLcYT5QBrY' },
  { id: 'mecca', city: 'Mecca', country: 'Saudi Arabia', region: 'middle-east', channelHandle: '@MakkahLive', fallbackVideoId: 'DEcpmPUbkDQ' },
  { id: 'kyiv', city: 'Kyiv', country: 'Ukraine', region: 'europe', channelHandle: '@DWNews', fallbackVideoId: '-Q7FuPINDjA' },
  { id: 'odessa', city: 'Odessa', country: 'Ukraine', region: 'europe', channelHandle: '@UkraineLiveCam', fallbackVideoId: 'e2gC37ILQmk' },
  { id: 'paris', city: 'Paris', country: 'France', region: 'europe', channelHandle: '@PalaisIena', fallbackVideoId: 'OzYp4NRZlwQ' },
  { id: 'st-petersburg', city: 'St. Petersburg', country: 'Russia', region: 'europe', channelHandle: '@SPBLiveCam', fallbackVideoId: 'CjtIYbmVfck' },
  { id: 'london', city: 'London', country: 'UK', region: 'europe', channelHandle: '@EarthCam', fallbackVideoId: 'Lxqcg1qt0XU' },
  { id: 'washington', city: 'Washington DC', country: 'USA', region: 'americas', channelHandle: '@AxisCommunications', fallbackVideoId: '1wV9lLe14aU' },
  { id: 'new-york', city: 'New York', country: 'USA', region: 'americas', channelHandle: '@EarthCam', fallbackVideoId: '4qyZLflp-sI' },
  { id: 'los-angeles', city: 'Los Angeles', country: 'USA', region: 'americas', channelHandle: '@VeniceVHotel', fallbackVideoId: 'EO_1LWqsCNE' },
  { id: 'miami', city: 'Miami', country: 'USA', region: 'americas', channelHandle: '@FloridaLiveCams', fallbackVideoId: '5YCajRjvWCg' },
  { id: 'taipei', city: 'Taipei', country: 'Taiwan', region: 'asia', channelHandle: '@JackyWuTaipei', fallbackVideoId: 'z_fY1pj1VBw' },
  { id: 'shanghai', city: 'Shanghai', country: 'China', region: 'asia', channelHandle: '@SkylineWebcams', fallbackVideoId: '76EwqI5XZIc' },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', region: 'asia', channelHandle: '@TokyoLiveCam4K', fallbackVideoId: '4pu9sF5Qssw' },
  { id: 'seoul', city: 'Seoul', country: 'South Korea', region: 'asia', channelHandle: '@UNvillage_live', fallbackVideoId: '-JhoMGoAfFc' },
  { id: 'sydney', city: 'Sydney', country: 'Australia', region: 'asia', channelHandle: '@WebcamSydney', fallbackVideoId: '7pcL-0Wo77U' },
];

const ALL_GRID_IDS = ['jerusalem', 'tehran', 'kyiv', 'washington'];
const MAX_GRID_CELLS = 4;

interface LiveWebcamsPanelProps {
  paused?: boolean;
}

function buildEmbedUrl(videoId: string): string {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&controls=0&modestbranding=1&playsinline=1&rel=0`;
}

export const LiveWebcamsPanel = React.memo(function LiveWebcamsPanel({
  paused,
}: LiveWebcamsPanelProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [regionFilter, setRegionFilter] = useState<RegionFilter>('all');
  const [activeFeedId, setActiveFeedId] = useState<string>(WEBCAM_FEEDS[0]!.id);

  const filteredFeeds = useMemo(() => {
    if (regionFilter === 'all') return WEBCAM_FEEDS;
    return WEBCAM_FEEDS.filter(f => f.region === regionFilter);
  }, [regionFilter]);

  const gridFeeds = useMemo(() => {
    if (regionFilter === 'all') {
      return ALL_GRID_IDS.map(id => WEBCAM_FEEDS.find(f => f.id === id)!).filter(Boolean);
    }
    return filteredFeeds.slice(0, MAX_GRID_CELLS);
  }, [regionFilter, filteredFeeds]);

  const activeFeed = useMemo(() => WEBCAM_FEEDS.find(f => f.id === activeFeedId) ?? WEBCAM_FEEDS[0]!, [activeFeedId]);

  const handleRegionChange = useCallback((filter: RegionFilter) => {
    setRegionFilter(filter);
    const feeds = filter === 'all' ? WEBCAM_FEEDS : WEBCAM_FEEDS.filter(f => f.region === filter);
    if (feeds.length > 0 && !feeds.find(f => f.id === activeFeedId)) {
      setActiveFeedId(feeds[0]!.id);
    }
  }, [activeFeedId]);

  const handleCellClick = useCallback((feedId: string) => {
    setActiveFeedId(feedId);
    setViewMode('single');
  }, []);

  const regions: { key: RegionFilter; label: string }[] = [
    { key: 'all', label: 'ALL' },
    { key: 'middle-east', label: 'MIDEAST' },
    { key: 'europe', label: 'EUROPE' },
    { key: 'americas', label: 'AMERICAS' },
    { key: 'asia', label: 'ASIA' },
  ];

  return (
    <Panel id="live-webcams" title="Live Webcams" className="panel-wide">
      <div className="webcam-toolbar">
        <div className="webcam-toolbar-group">
          {regions.map(({ key, label }) => (
            <button key={key} className={`webcam-region-btn${regionFilter === key ? ' active' : ''}`} onClick={() => handleRegionChange(key)}>
              {label}
            </button>
          ))}
        </div>
        <div className="webcam-toolbar-group">
          <button className={`webcam-view-btn${viewMode === 'grid' ? ' active' : ''}`} onClick={() => setViewMode('grid')} title="Grid view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
              <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
            </svg>
          </button>
          <button className={`webcam-view-btn${viewMode === 'single' ? ' active' : ''}`} onClick={() => setViewMode('single')} title="Single view">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <rect x="3" y="3" width="18" height="14" rx="2" /><rect x="3" y="19" width="18" height="2" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {paused ? (
        <div className="webcam-placeholder">Webcams paused</div>
      ) : viewMode === 'grid' ? (
        <div className="webcam-content">
          <div className="webcam-grid">
            {gridFeeds.map(feed => (
              <div key={feed.id} className="webcam-cell" onClick={() => handleCellClick(feed.id)}>
                <iframe
                  className="webcam-iframe"
                  src={buildEmbedUrl(feed.fallbackVideoId)}
                  title={`${feed.city} live webcam`}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                />
                <div className="webcam-cell-label">
                  <span className="webcam-live-dot" />
                  <span className="webcam-city">{feed.city.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="webcam-content">
          <div className="webcam-single">
            <iframe
              className="webcam-iframe"
              src={buildEmbedUrl(activeFeed.fallbackVideoId)}
              title={`${activeFeed.city} live webcam`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-presentation"
            />
          </div>
          <div className="webcam-switcher">
            <button className="webcam-feed-btn webcam-back-btn" onClick={() => setViewMode('grid')}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" />
                <rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" />
              </svg>{' '}Grid
            </button>
            {filteredFeeds.map(feed => (
              <button key={feed.id} className={`webcam-feed-btn${feed.id === activeFeedId ? ' active' : ''}`} onClick={() => setActiveFeedId(feed.id)}>
                {feed.city}
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
});
