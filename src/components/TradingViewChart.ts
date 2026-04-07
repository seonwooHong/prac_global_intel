export class TradingViewChart {
  private el: HTMLElement;
  private currentSymbol = 'BTCUSD';

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'tradingview-container';
    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="tv-header">
        <div class="tv-symbol-row">
          <span class="tv-star">☆</span>
          <span class="tv-symbol-icon">₿</span>
          <select class="tv-symbol-select" id="tvSymbolSelect">
            <option value="BTCUSD">BTC</option>
            <option value="ETHUSD">ETH</option>
            <option value="SOLUSD">SOL</option>
            <option value="COPPER">COPPER</option>
            <option value="XAUUSD">GOLD</option>
            <option value="XAGUSD">SILVER</option>
          </select>
          <div class="tv-price-info" id="tvPriceInfo">
            <span class="tv-label">Mark</span><span class="tv-value" id="tvMark">--</span>
            <span class="tv-label">Oracle</span><span class="tv-value" id="tvOracle">--</span>
            <span class="tv-label">24h Change</span><span class="tv-value tv-change" id="tvChange">--</span>
          </div>
        </div>
        <div class="tv-timeframe-row">
          <button class="tv-tf" data-tf="1">1m</button>
          <button class="tv-tf" data-tf="5">5m</button>
          <button class="tv-tf" data-tf="15">15m</button>
          <button class="tv-tf" data-tf="60">1h</button>
          <button class="tv-tf" data-tf="240">4h</button>
          <button class="tv-tf active" data-tf="D">D</button>
        </div>
      </div>
      <div class="tv-chart-wrapper" id="tvChartWrapper"></div>
    `;

    this.initWidget();
    this.bindEvents();
  }

  private initWidget(interval = 'D'): void {
    const wrapper = this.el.querySelector('#tvChartWrapper') as HTMLElement;
    if (!wrapper) return;

    wrapper.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = `https://s.tradingview.com/widgetembed/?symbol=${this.currentSymbol}&interval=${interval}&theme=dark&style=1&locale=en&hide_top_toolbar=1&hide_legend=1&allow_symbol_change=0&save_image=0&hide_volume=0&support_host=https%3A%2F%2Fwww.tradingview.com`;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frameborder', '0');
    wrapper.appendChild(iframe);
  }

  private bindEvents(): void {
    const select = this.el.querySelector('#tvSymbolSelect') as HTMLSelectElement;
    select?.addEventListener('change', () => {
      this.currentSymbol = select.value;
      this.initWidget();
    });

    this.el.querySelectorAll('.tv-tf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.el.querySelectorAll('.tv-tf').forEach(b => b.classList.remove('active'));
        (e.target as HTMLElement).classList.add('active');
        const tf = (e.target as HTMLElement).dataset.tf ?? 'D';
        this.initWidget(tf);
      });
    });
  }

  destroy(): void {
    this.el.innerHTML = '';
  }
}
