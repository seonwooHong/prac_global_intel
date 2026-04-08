import { useState, useCallback, type ReactNode } from 'react';
import { t } from '@/services/i18n';

interface SourcesModalProps {
  open: boolean;
  onClose: () => void;
  /** Number string for sources counter badge */
  sourcesCount?: string;
  /** Source toggle grid content rendered by parent */
  children?: ReactNode;
  onSelectAll?: () => void;
  onSelectNone?: () => void;
  onSearchChange?: (query: string) => void;
}

export function SourcesModal({
  open,
  onClose,
  sourcesCount,
  children,
  onSelectAll,
  onSelectNone,
  onSearchChange,
}: SourcesModalProps) {
  const [search, setSearch] = useState('');

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleSearchInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setSearch(val);
      onSearchChange?.(val);
    },
    [onSearchChange],
  );

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      id="sourcesModal"
      style={{ display: 'flex' }}
      onClick={handleOverlayClick}
    >
      <div className="modal sources-modal">
        <div className="modal-header">
          <span className="modal-title">{t('header.sources')}</span>
          <span className="sources-counter" id="sourcesCounter">
            {sourcesCount}
          </span>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="sources-search">
          <input
            type="text"
            placeholder={t('header.filterSources')}
            value={search}
            onChange={handleSearchInput}
          />
        </div>
        <div className="sources-toggle-grid" id="sourceToggles">
          {children}
        </div>
        <div className="sources-footer">
          <button className="sources-select-all" onClick={onSelectAll}>
            {t('common.selectAll')}
          </button>
          <button className="sources-select-none" onClick={onSelectNone}>
            {t('common.selectNone')}
          </button>
        </div>
      </div>
    </div>
  );
}
