import { Panel } from './Panel';
import type { PredictionMarket } from '@/types';
import { escapeHtml, sanitizeUrl } from '@/utils/sanitize';
import { t, getCurrentLanguage } from '@/services/i18n';
import { translateText } from '@/services';

export class PredictionPanel extends Panel {
  /** In-memory translation cache keyed by `lang:title` */
  private translationCache = new Map<string, string>();

  constructor() {
    super({
      id: 'polymarket',
      title: t('panels.polymarket'),
      infoTooltip: t('components.prediction.infoTooltip'),
    });
  }

  private formatVolume(volume?: number): string {
    if (!volume) return '';
    if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
    if (volume >= 1_000) return `$${(volume / 1_000).toFixed(0)}K`;
    return `$${volume.toFixed(0)}`;
  }

  public renderPredictions(data: PredictionMarket[]): void {
    if (data.length === 0) {
      this.showError(t('common.failedPredictions'));
      return;
    }

    const html = data
      .map((p) => {
        const yesPercent = Math.round(p.yesPrice);
        const noPercent = 100 - yesPercent;
        const volumeStr = this.formatVolume(p.volume);

        const safeUrl = sanitizeUrl(p.url || '');
        const titleHtml = safeUrl
          ? `<a href="${safeUrl}" target="_blank" rel="noopener" class="prediction-question prediction-link" data-original-title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</a>`
          : `<div class="prediction-question" data-original-title="${escapeHtml(p.title)}">${escapeHtml(p.title)}</div>`;

        return `
      <div class="prediction-item">
        ${titleHtml}
        ${volumeStr ? `<div class="prediction-volume">${t('components.predictions.vol')}: ${volumeStr}</div>` : ''}
        <div class="prediction-bar">
          <div class="prediction-yes" style="width: ${yesPercent}%">
            <span class="prediction-label">${t('components.predictions.yes')} ${yesPercent}%</span>
          </div>
          <div class="prediction-no" style="width: ${noPercent}%">
            <span class="prediction-label">${t('components.predictions.no')} ${noPercent}%</span>
          </div>
        </div>
      </div>
    `;
      })
      .join('');

    this.setContent(html);

    // Auto-translate prediction titles when not in English
    const currentLang = getCurrentLanguage();
    if (currentLang !== 'en') {
      this.translatePredictionTitles(currentLang);
    }
  }

  private async translatePredictionTitles(lang: string): Promise<void> {
    const questionEls = this.content.querySelectorAll<HTMLElement>('.prediction-question');

    const promises = Array.from(questionEls).map(async (el) => {
      const originalTitle = el.dataset.originalTitle;
      if (!originalTitle) return;

      const cacheKey = `${lang}:${originalTitle}`;
      const cached = this.translationCache.get(cacheKey);
      if (cached) {
        el.textContent = cached;
        return;
      }

      try {
        const translated = await translateText(originalTitle, lang);
        if (translated) {
          this.translationCache.set(cacheKey, translated);
          el.textContent = translated;
        }
      } catch {
        // Translation failed, keep original text
      }
    });

    await Promise.allSettled(promises);
  }
}
