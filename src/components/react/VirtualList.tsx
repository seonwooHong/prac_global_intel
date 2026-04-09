import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VirtualListProps<T> {
  /** All items in the list. */
  items: T[];
  /** Fixed height of each item in pixels. */
  itemHeight: number;
  /** Number of extra items to render above/below the viewport. */
  overscan?: number;
  /** Render callback for a single item. */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Optional className for the outer viewport element. */
  className?: string;
  /** Optional style for the outer viewport element. */
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function VirtualList<T>({
  items,
  itemHeight,
  overscan = 3,
  renderItem,
  className,
  style,
}: VirtualListProps<T>): React.ReactElement {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);

  /* -- observe viewport size -- */
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    setViewportHeight(el.clientHeight);

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => setViewportHeight(el.clientHeight));
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, []);

  /* -- scroll handler (rAF throttled) -- */
  const rafId = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (rafId.current !== null) return;
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      if (viewportRef.current) {
        setScrollTop(viewportRef.current.scrollTop);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  /* -- compute visible range -- */
  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan,
  );

  const topSpacerHeight = startIndex * itemHeight;
  const bottomSpacerHeight = Math.max(0, (items.length - endIndex) * itemHeight);

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex],
  );

  return (
    <div
      ref={viewportRef}
      className={`virtual-viewport${className ? ' ' + className : ''}`}
      style={{ overflow: 'auto', position: 'relative', ...style }}
      onScroll={handleScroll}
    >
      <div className="virtual-content" style={{ height: totalHeight, position: 'relative' }}>
        <div className="virtual-spacer virtual-spacer-top" style={{ height: topSpacerHeight }} />
        {visibleItems.map((item, i) => {
          const idx = startIndex + i;
          return (
            <div
              key={idx}
              className="virtual-item"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: itemHeight,
                transform: `translateY(${idx * itemHeight}px)`,
              }}
            >
              {renderItem(item, idx)}
            </div>
          );
        })}
        <div className="virtual-spacer virtual-spacer-bottom" style={{ height: bottomSpacerHeight }} />
      </div>
    </div>
  );
}
