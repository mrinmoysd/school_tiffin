/* global HTMLDivElement, ResizeObserver */
import { Slider } from 'antd';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface HorizontalScrollContainerProps {
  children: ReactNode;
  className?: string;
}

const HorizontalScrollContainer = ({ children, className }: HorizontalScrollContainerProps) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScrollLeft, setMaxScrollLeft] = useState(0);

  const updateMetrics = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const maxScroll = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
    setMaxScrollLeft(maxScroll);
    setScrollLeft(scroller.scrollLeft > maxScroll ? maxScroll : scroller.scrollLeft);
  }, []);

  useEffect(() => {
    updateMetrics();
  }, [children, updateMetrics]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const handleScroll = () => {
      setScrollLeft(scroller.scrollLeft);
    };

    scroller.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateMetrics);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateMetrics());
      resizeObserver.observe(scroller);
      Array.from(scroller.children).forEach(child => {
        resizeObserver?.observe(child);
      });
    }

    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateMetrics);
      resizeObserver?.disconnect();
    };
  }, [children, updateMetrics]);

  const sliderValue = useMemo(
    () => Math.min(scrollLeft, maxScrollLeft),
    [maxScrollLeft, scrollLeft],
  );

  const handleSliderChange = (nextValue: number | number[]) => {
    const next = Array.isArray(nextValue) ? nextValue[0] : nextValue;
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollLeft = next;
    setScrollLeft(next);
  };

  return (
    <div className={className}>
      <div ref={scrollerRef} className="table-scrollbar">
        {children}
      </div>

      {maxScrollLeft > 0 && (
        <div style={{ marginTop: 6, padding: '0 6px' }}>
          <Slider
            min={0}
            max={maxScrollLeft}
            value={sliderValue}
            onChange={handleSliderChange}
            tooltip={{ open: false }}
          />
        </div>
      )}
    </div>
  );
};

export default HorizontalScrollContainer;
