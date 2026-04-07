export class ExpertChat {
  private el: HTMLElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'expert-chat';
    this.render();
  }

  getElement(): HTMLElement {
    return this.el;
  }

  private render(): void {
    this.el.innerHTML = `
      <div class="expert-header">
        <span class="expert-icon">⚙</span>
        <span class="expert-title">Expert Mode</span>
        <span class="expert-chevron">▾</span>
      </div>
      <div class="expert-body">
        <div class="expert-messages" id="expertMessages"></div>
        <div class="expert-actions">
          <button class="expert-action-btn" id="analyzeMarketBtn">
            <span class="expert-action-icon">📊</span> Analyze Market
          </button>
          <button class="expert-action-btn" id="planTradeBtn">
            <span class="expert-action-icon">✨</span> Plan a trade
          </button>
        </div>
        <div class="expert-input-row">
          <input type="text" class="expert-input" id="expertInput" placeholder="Ask a question..." />
          <button class="expert-send-btn" id="expertSendBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
      <div class="expert-footer">
        <span class="expert-status-dot"></span>
        <span class="expert-status-text">Operational</span>
      </div>
    `;
  }

  destroy(): void {
    this.el.innerHTML = '';
  }
}
