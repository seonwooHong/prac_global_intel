import { useCallback, type ReactNode } from 'react';
import { t } from '@/services/i18n';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  /** Panel toggle grid content rendered by parent */
  children?: ReactNode;
}

export function SettingsModal({ open, onClose, children }: SettingsModalProps) {
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      id="settingsModal"
      style={{ display: 'flex' }}
      onClick={handleOverlayClick}
    >
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{t('header.settings')}</span>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="panel-toggle-grid" id="panelToggles">
          {children}
        </div>
      </div>
    </div>
  );
}
