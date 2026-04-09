import React, { useState, useEffect, useRef } from 'react';

export default function VirtualScrollList({ items = [], itemHeight = 100, renderItem, containerHeight = '80vh' }) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
      const end = Math.min(items.length, Math.ceil((scrollTop + container.clientHeight) / itemHeight) + 2);
      setVisibleRange({ start, end });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length, itemHeight]);

  const visibleItems = items.slice(visibleRange.start, visibleRange.end);
  const offsetY = visibleRange.start * itemHeight;

  return (
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, idx) => (
            <div key={visibleRange.start + idx} style={{ height: itemHeight }}>
              {renderItem(item, visibleRange.start + idx)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}