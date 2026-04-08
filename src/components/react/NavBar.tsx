import { t } from '@/services/i18n';

interface NavBarProps {
  onSettingsClick: () => void;
  onSourcesClick: () => void;
}

export function NavBar({ onSettingsClick, onSourcesClick }: NavBarProps) {
  return (
    <div className="nav-bar">
      <div className="nav-left">
        <span className="nav-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M12 6v12M8 8l4-2 4 2M8 16l4 2 4-2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          Pacifica
        </span>
        <nav className="nav-links">
          <a className="nav-link active">Trade</a>
          <a className="nav-link">Portfolio</a>
          <a className="nav-link">Points</a>
          <a className="nav-link">Leaderboard</a>
          <a className="nav-link">Referral</a>
          <a className="nav-link nav-link-ai">AI</a>
          <a className="nav-link">More &#9662;</a>
        </nav>
      </div>
      <div className="nav-right">
        <button
          className="header-btn"
          title={t('header.settings')}
          onClick={onSettingsClick}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
        <button
          className="header-btn"
          title={t('header.sources')}
          onClick={onSourcesClick}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
            <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
          </svg>
        </button>
        <button className="nav-connect-btn">Connect</button>
      </div>
    </div>
  );
}
