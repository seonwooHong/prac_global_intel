import React, { useState, useEffect, useCallback } from 'react';
import { getSnapshotTimestamps, getSnapshotAt, type DashboardSnapshot } from '@/services/storage';
import { t } from '@/services/i18n';

interface PlaybackControlProps {
  onSnapshotChange: (snapshot: DashboardSnapshot | null) => void;
}

export const PlaybackControl: React.FC<PlaybackControlProps> = ({ onSnapshotChange }) => {
  const [panelOpen, setPanelOpen] = useState(false);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);

  const loadTimestamps = useCallback(async () => {
    const ts = await getSnapshotTimestamps();
    ts.sort((a, b) => a - b);
    setTimestamps(ts);
    setCurrentIndex(Math.max(0, ts.length - 1));
  }, []);

  useEffect(() => {
    if (panelOpen) {
      loadTimestamps();
    }
  }, [panelOpen, loadTimestamps]);

  const goLive = useCallback(() => {
    setIsPlaybackMode(false);
    setCurrentIndex(timestamps.length - 1);
    onSnapshotChange(null);
    document.body.classList.remove('playback-mode');
  }, [timestamps.length, onSnapshotChange]);

  const loadSnapshot = useCallback(async (index: number) => {
    if (index < 0 || index >= timestamps.length) {
      goLive();
      return;
    }
    const timestamp = timestamps[index];
    if (!timestamp) {
      goLive();
      return;
    }
    setIsPlaybackMode(true);
    setCurrentIndex(index);
    const snapshot = await getSnapshotAt(timestamp);
    onSnapshotChange(snapshot);
    document.body.classList.add('playback-mode');
  }, [timestamps, goLive, onSnapshotChange]);

  const handleAction = useCallback((action: string) => {
    let newIndex = currentIndex;
    switch (action) {
      case 'start': newIndex = 0; break;
      case 'prev': newIndex = Math.max(0, currentIndex - 1); break;
      case 'next': newIndex = Math.min(timestamps.length - 1, currentIndex + 1); break;
      case 'end': newIndex = timestamps.length - 1; break;
      case 'live': goLive(); return;
    }
    loadSnapshot(newIndex);
  }, [currentIndex, timestamps.length, goLive, loadSnapshot]);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const idx = parseInt(e.target.value);
    loadSnapshot(idx);
  }, [loadSnapshot]);

  const timeDisplay = (() => {
    if (!isPlaybackMode || timestamps.length === 0) return t('components.playback.live');
    const ts = timestamps[currentIndex];
    if (!ts) return t('components.playback.live');
    return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  })();

  return (
    <div className="playback-control">
      <button
        className="playback-toggle"
        title={t('components.playback.toggleMode')}
        onClick={() => setPanelOpen(!panelOpen)}
      >
        <span className="playback-icon">{'\u23EA'}</span>
      </button>
      {panelOpen && (
        <div className="playback-panel">
          <div className="playback-header">
            <span>{t('components.playback.historicalPlayback')}</span>
            <button className="playback-close" onClick={() => { setPanelOpen(false); goLive(); }}>{'\u00D7'}</button>
          </div>
          <div className="playback-slider-container">
            <input
              type="range"
              className="playback-slider"
              min="0"
              max={Math.max(0, timestamps.length - 1)}
              value={currentIndex}
              onChange={handleSliderChange}
            />
            <div className={`playback-time${isPlaybackMode ? ' historical' : ''}`}>{timeDisplay}</div>
          </div>
          <div className="playback-controls">
            <button className="playback-btn" onClick={() => handleAction('start')}>{'\u23EE'}</button>
            <button className="playback-btn" onClick={() => handleAction('prev')}>{'\u25C0'}</button>
            <button
              className={`playback-btn playback-live${!isPlaybackMode ? ' active' : ''}`}
              onClick={() => handleAction('live')}
            >
              {t('components.playback.live')}
            </button>
            <button className="playback-btn" onClick={() => handleAction('next')}>{'\u25B6'}</button>
            <button className="playback-btn" onClick={() => handleAction('end')}>{'\u23ED'}</button>
          </div>
        </div>
      )}
    </div>
  );
};
