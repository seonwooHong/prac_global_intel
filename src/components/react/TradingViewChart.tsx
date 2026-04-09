import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SymbolOption {
  value: string;
  label: string;
}

interface TimeframeOption {
  value: string;
  label: string;
}

export interface TradingViewChartProps {
  /** Initial symbol (default "BTCUSD") */
  initialSymbol?: string;
  /** Initial timeframe (default "D") */
  initialTimeframe?: string;
  /** Available symbols */
  symbols?: SymbolOption[];
  /** Available timeframes */
  timeframes?: TimeframeOption[];
  /** Mark price display */
  mark?: string;
  /** Oracle price display */
  oracle?: string;
  /** 24h change display */
  change?: string;
  /** Optional className for wrapper */
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Defaults                                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_SYMBOLS: SymbolOption[] = [
  { value: 'BTCUSD', label: 'BTC' },
  { value: 'ETHUSD', label: 'ETH' },
  { value: 'SOLUSD', label: 'SOL' },
  { value: 'COPPER', label: 'COPPER' },
  { value: 'XAUUSD', label: 'GOLD' },
  { value: 'XAGUSD', label: 'SILVER' },
];

const DEFAULT_TIMEFRAMES: TimeframeOption[] = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1h' },
  { value: '240', label: '4h' },
  { value: 'D', label: 'D' },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  initialSymbol = 'BTCUSD',
  initialTimeframe = 'D',
  symbols = DEFAULT_SYMBOLS,
  timeframes = DEFAULT_TIMEFRAMES,
  mark = '--',
  oracle = '--',
  change = '--',
  className,
}) => {
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* -- embed TradingView iframe -- */
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = '';
    const iframe = document.createElement('iframe');
    iframe.src = `https://s.tradingview.com/widgetembed/?symbol=${symbol}&interval=${timeframe}&theme=dark&style=1&locale=en&hide_top_toolbar=1&hide_legend=1&allow_symbol_change=0&save_image=0&hide_volume=0&support_host=https%3A%2F%2Fwww.tradingview.com`;
    iframe.style.cssText = 'width:100%;height:100%;border:none;';
    iframe.setAttribute('allowtransparency', 'true');
    iframe.setAttribute('frameBorder', '0');
    wrapper.appendChild(iframe);

    return () => {
      wrapper.innerHTML = '';
    };
  }, [symbol, timeframe]);

  const handleSymbolChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSymbol(e.target.value);
  }, []);

  const handleTimeframeClick = useCallback((tf: string) => {
    setTimeframe(tf);
  }, []);

  return (
    <div className={`tradingview-container${className ? ' ' + className : ''}`}>
      <div className="tv-header">
        <div className="tv-symbol-row">
          <span className="tv-star">{'\u2606'}</span>
          <span className="tv-symbol-icon">{'\u20BF'}</span>
          <select className="tv-symbol-select" value={symbol} onChange={handleSymbolChange}>
            {symbols.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <div className="tv-price-info">
            <span className="tv-label">Mark</span>
            <span className="tv-value">{mark}</span>
            <span className="tv-label">Oracle</span>
            <span className="tv-value">{oracle}</span>
            <span className="tv-label">24h Change</span>
            <span className="tv-value tv-change">{change}</span>
          </div>
        </div>
        <div className="tv-timeframe-row">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              className={`tv-tf${timeframe === tf.value ? ' active' : ''}`}
              data-tf={tf.value}
              onClick={() => handleTimeframeClick(tf.value)}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>
      <div className="tv-chart-wrapper" ref={wrapperRef} />
    </div>
  );
};
