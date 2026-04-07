interface TickerItem {
  symbol: string;
  price: string;
  change: string;
  positive: boolean;
  icon?: string;
}

export class TickerBar {
  private el: HTMLElement;
  private items: TickerItem[] = [];
  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'ticker-bar';
    this.el.innerHTML = '<div class="ticker-track"><div class="ticker-scroll" id="tickerScroll"></div></div>';
    this.fetchData();
    this.refreshInterval = setInterval(() => this.fetchData(), 60_000);
  }

  getElement(): HTMLElement {
    return this.el;
  }

  private async fetchData(): Promise<void> {
    try {
      const res = await fetch('/api/yahoo-finance');
      if (!res.ok) return;
      const data = await res.json();
      this.items = this.mapData(data);
      this.render();
    } catch {
      // silent
    }
  }

  private mapData(data: Record<string, unknown>): TickerItem[] {
    const items: TickerItem[] = [];
    const markets = (data as { markets?: Array<{ symbol: string; name: string; price: number; change: number; display?: string }> }).markets ?? [];
    const crypto = (data as { crypto?: Array<{ symbol: string; name: string; price: number; change: number }> }).crypto ?? [];
    const commodities = (data as { commodities?: Array<{ symbol: string; name: string; price: number; change: number }> }).commodities ?? [];

    for (const c of crypto) {
      items.push({
        symbol: c.symbol,
        price: this.formatNum(c.price),
        change: (c.change >= 0 ? '+' : '') + c.change.toFixed(2) + '%',
        positive: c.change >= 0,
        icon: this.getIcon(c.symbol),
      });
    }
    for (const c of commodities) {
      items.push({
        symbol: c.symbol,
        price: this.formatNum(c.price),
        change: (c.change >= 0 ? '+' : '') + c.change.toFixed(2) + '%',
        positive: c.change >= 0,
        icon: this.getIcon(c.symbol),
      });
    }
    for (const m of markets) {
      items.push({
        symbol: m.display ?? m.symbol,
        price: this.formatNum(m.price),
        change: (m.change >= 0 ? '+' : '') + m.change.toFixed(2) + '%',
        positive: m.change >= 0,
      });
    }
    return items;
  }

  private formatNum(n: number): string {
    if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(2);
    return n.toFixed(5);
  }

  private getIcon(symbol: string): string {
    const icons: Record<string, string> = {
      BTC: '₿', ETH: 'Ξ', SOL: '◎', GOLD: '●', CL: '●', SILVER: '●',
      DOGE: 'Ð', XRP: '✕', BNB: '◆',
    };
    const upper = symbol.toUpperCase();
    for (const [k, v] of Object.entries(icons)) {
      if (upper.includes(k)) return v;
    }
    return '●';
  }

  private render(): void {
    const scroll = this.el.querySelector('#tickerScroll');
    if (!scroll || this.items.length === 0) return;

    const html = this.items.map(item => `
      <span class="ticker-item">
        <span class="ticker-icon">${item.icon ?? '●'}</span>
        <span class="ticker-symbol">${item.symbol}</span>
        <span class="ticker-price">${item.price}</span>
        <span class="ticker-change ${item.positive ? 'positive' : 'negative'}">${item.change}</span>
      </span>
    `).join('<span class="ticker-sep">•</span>');

    // Duplicate for seamless scroll
    scroll.innerHTML = html + '<span class="ticker-gap"></span>' + html;
  }

  destroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }
}
