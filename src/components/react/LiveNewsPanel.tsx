import React, { useState, useCallback, useRef, useEffect } from 'react';
import { t } from '@/services/i18n';

interface LiveChannel {
  id: string;
  name: string;
  fallbackVideoId: string;
}

const LIVE_CHANNELS: LiveChannel[] = [
  { id: 'bloomberg', name: 'BLOOMBERG', fallbackVideoId: 'iEpJwprxDdk' },
  { id: 'sky', name: 'SKYNEWS', fallbackVideoId: 'YDvsBbKfLPA' },
  { id: 'euronews', name: 'EURONEWS', fallbackVideoId: 'pykpO5kQJ98' },
  { id: 'dw', name: 'DW', fallbackVideoId: 'LuKwFajn37U' },
  { id: 'cnbc', name: 'CNBC', fallbackVideoId: '9NyxcX3rhQs' },
  { id: 'france24', name: 'FRANCE24', fallbackVideoId: 'Ap-UM1O9RBU' },
  { id: 'alarabiya', name: 'ALARABIYA', fallbackVideoId: 'n7eQejkXbnM' },
  { id: 'aljazeera', name: 'ALJAZEERA', fallbackVideoId: 'gCNeDWCI0vo' },
];

export const LiveNewsPanel = React.memo(function LiveNewsPanel() {
  const [activeChannel, setActiveChannel] = useState(LIVE_CHANNELS[0]!);
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const switchChannel = useCallback((ch: LiveChannel) => {
    setActiveChannel(ch);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const iframeSrc = `https://www.youtube.com/embed/${activeChannel.fallbackVideoId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1`;

  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc;
    }
  }, [iframeSrc]);

  return (
    <div className="panel panel-live-news" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="panel-header">
        <div className="panel-header-left">
          <span className="panel-title">{t('panels.liveNews')}</span>
          <span className="live-indicator-btn">
            <span className="live-dot" /> LIVE
          </span>
        </div>
        <div className="panel-header-actions" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <button
            className={`live-mute-btn ${!isMuted ? 'unmuted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 5L6 9H2v6h4l5 4V5z" />
                <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Channel switcher toolbar */}
      <div className="live-news-toolbar">
        <div className="live-news-switcher">
          {LIVE_CHANNELS.map((ch) => (
            <button
              key={ch.id}
              className={`live-channel-btn ${ch.id === activeChannel.id ? 'active' : ''}`}
              onClick={() => switchChannel(ch)}
            >
              {ch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Player */}
      <div className="panel-content" style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          allow="autoplay; encrypted-media"
          allowFullScreen
          style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
        />
      </div>
      <div style={{ height: '20px', flexShrink: 0 }} />
    </div>
  );
});
