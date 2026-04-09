import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface StoryData {
  countryName: string;
  countryCode: string;
  [key: string]: unknown;
}

export interface StoryModalProps {
  /** Story data – when non-null the modal is shown. */
  data: StoryData | null;
  /** Called to close the modal. */
  onClose: () => void;
  /** Async renderer: given StoryData, returns an HTMLCanvasElement. */
  renderToCanvas?: (data: StoryData) => Promise<HTMLCanvasElement>;
  /** Build share URLs for the story. */
  getShareUrls?: (data: StoryData) => { whatsapp: string; twitter: string; linkedin: string };
  /** Build a deep-link URL for the story. */
  generateDeepLink?: (countryCode: string) => string;
  /** i18n helper */
  t?: (key: string) => string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function defaultT(key: string): string {
  const map: Record<string, string> = {
    'modals.story.close': 'Close',
    'modals.story.generating': 'Generating story...',
    'modals.story.error': 'Failed to generate story.',
    'modals.story.save': 'Save',
    'modals.story.saved': 'Saved!',
    'modals.story.whatsapp': 'WhatsApp',
    'modals.story.twitter': 'Twitter',
    'modals.story.linkedin': 'LinkedIn',
    'modals.story.copyLink': 'Copy Link',
    'modals.story.copied': 'Copied!',
    'modals.story.opening': 'Opening...',
  };
  return map[key] ?? key;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const StoryModal: React.FC<StoryModalProps> = ({
  data,
  onClose,
  renderToCanvas,
  getShareUrls,
  generateDeepLink,
  t: tProp,
}) => {
  const t = tProp ?? defaultT;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [flashMap, setFlashMap] = useState<Record<string, string>>({});
  const blobRef = useRef<Blob | null>(null);

  /* ---------- render canvas on open ---------- */
  useEffect(() => {
    if (!data || !renderToCanvas) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);
    setImageUrl(null);

    renderToCanvas(data)
      .then((canvas) => {
        if (cancelled) return;
        const dataUrl = canvas.toDataURL('image/png');
        setImageUrl(dataUrl);

        // Build blob
        const binStr = atob(dataUrl.split(',')[1] ?? '');
        const bytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
        blobRef.current = new Blob([bytes], { type: 'image/png' });
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [data, renderToCanvas]);

  /* ---------- flash helper ---------- */
  const flash = useCallback((key: string, text: string, original: string) => {
    setFlashMap((m) => ({ ...m, [key]: text }));
    window.setTimeout(() => setFlashMap((m) => ({ ...m, [key]: original })), 2500);
  }, []);

  /* ---------- actions ---------- */
  const download = useCallback(() => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `global-intel-${data?.countryCode.toLowerCase() || 'story'}-${Date.now()}.png`;
    a.click();
    flash('save', t('modals.story.saved'), t('modals.story.save'));
  }, [imageUrl, data, flash, t]);

  const shareWhatsApp = useCallback(async () => {
    if (!data) return;
    const blob = blobRef.current;
    if (!blob) { download(); return; }

    const file = new File([blob], `${data.countryCode.toLowerCase()}-global-intel.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ text: `${data.countryName} Intelligence`, files: [file] }); return; } catch { /* cancelled */ }
    }
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      flash('whatsapp', t('modals.story.copied'), t('modals.story.whatsapp'));
    } catch {
      download();
      flash('whatsapp', t('modals.story.saved'), t('modals.story.whatsapp'));
    }
    const urls = getShareUrls?.(data);
    if (urls) window.open(urls.whatsapp, '_blank');
  }, [data, download, flash, t, getShareUrls]);

  const shareTwitter = useCallback(() => {
    if (!data) return;
    const urls = getShareUrls?.(data);
    if (urls) window.open(urls.twitter, '_blank');
    flash('twitter', t('modals.story.opening'), t('modals.story.twitter'));
  }, [data, flash, t, getShareUrls]);

  const shareLinkedIn = useCallback(() => {
    if (!data) return;
    const urls = getShareUrls?.(data);
    if (urls) window.open(urls.linkedin, '_blank');
    flash('linkedin', t('modals.story.opening'), t('modals.story.linkedin'));
  }, [data, flash, t, getShareUrls]);

  const copyLink = useCallback(async () => {
    if (!data) return;
    const link = generateDeepLink?.(data.countryCode) ?? window.location.href;
    await navigator.clipboard.writeText(link);
    flash('copy', t('modals.story.copied'), t('modals.story.copyLink'));
  }, [data, flash, t, generateDeepLink]);

  /* ---------- render ---------- */
  if (!data) return null;

  return (
    <div className="story-modal-overlay" onClick={(e) => { if ((e.target as HTMLElement).classList.contains('story-modal-overlay')) onClose(); }}>
      <div className="story-modal">
        <button className="story-close-x" aria-label={t('modals.story.close')} onClick={onClose}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <div className="story-modal-content">
          {loading && (
            <div className="story-loading">
              <div className="story-spinner" />
              <span>{t('modals.story.generating')}</span>
            </div>
          )}
          {error && <div className="story-error">{t('modals.story.error')}</div>}
          {imageUrl && (
            <img
              className="story-image"
              src={imageUrl}
              alt={`${data.countryName} Intelligence Story`}
            />
          )}
        </div>

        {imageUrl && (
          <div className="story-share-bar" style={{ display: 'flex' }}>
            <button className="story-share-btn story-save" title={t('modals.story.save')} onClick={download}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>{flashMap.save ?? t('modals.story.save')}</span>
            </button>
            <button className="story-share-btn story-whatsapp" title={t('modals.story.whatsapp')} onClick={shareWhatsApp}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
              </svg>
              <span>{flashMap.whatsapp ?? t('modals.story.whatsapp')}</span>
            </button>
            <button className="story-share-btn story-twitter" title={t('modals.story.twitter')} onClick={shareTwitter}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>{flashMap.twitter ?? t('modals.story.twitter')}</span>
            </button>
            <button className="story-share-btn story-linkedin" title={t('modals.story.linkedin')} onClick={shareLinkedIn}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span>{flashMap.linkedin ?? t('modals.story.linkedin')}</span>
            </button>
            <button className="story-share-btn story-copy" title={t('modals.story.copyLink')} onClick={copyLink}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <span>{flashMap.copy ?? t('modals.story.copyLink')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
