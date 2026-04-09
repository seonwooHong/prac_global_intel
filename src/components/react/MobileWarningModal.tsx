import React, { useState, useCallback } from 'react';
import { t } from '@/services/i18n';

const STORAGE_KEY = 'mobile-warning-dismissed';

interface MobileWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function shouldShowMobileWarning(): boolean {
  if (localStorage.getItem(STORAGE_KEY) === 'true') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export const MobileWarningModal: React.FC<MobileWarningModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [remember, setRemember] = useState(false);

  const handleDismiss = useCallback(() => {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onClose();
  }, [remember, onClose]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('mobile-warning-overlay')) {
      handleDismiss();
    }
  }, [handleDismiss]);

  if (!isOpen) return null;

  return (
    <div className={`mobile-warning-overlay${isOpen ? ' active' : ''}`} onClick={handleOverlayClick}>
      <div className="mobile-warning-modal">
        <div className="mobile-warning-header">
          <span className="mobile-warning-icon">{'\u{1F4F1}'}</span>
          <span className="mobile-warning-title">{t('modals.mobileWarning.title')}</span>
        </div>
        <div className="mobile-warning-content">
          <p>{t('modals.mobileWarning.description')}</p>
          <p>{t('modals.mobileWarning.tip')}</p>
        </div>
        <div className="mobile-warning-footer">
          <label className="mobile-warning-remember">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <span>{t('modals.mobileWarning.dontShowAgain')}</span>
          </label>
          <button className="mobile-warning-btn" onClick={handleDismiss}>
            {t('modals.mobileWarning.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
};
