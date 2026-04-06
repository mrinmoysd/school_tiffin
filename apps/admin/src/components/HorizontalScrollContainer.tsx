/* global HTMLDivElement, HTMLInputElement, MutationObserver, ResizeObserver, cancelAnimationFrame, performance, requestAnimationFrame */
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import {
  ChangeEvent,
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface HorizontalScrollContainerProps {
  children: ReactNode;
  className?: string;
}

const SCROLL_STEP = 240;
const MIN_THUMB_SIZE = 72;
const MAX_THUMB_SIZE = 200;
const BASE_TRACK_WIDTH = 420;

const HorizontalScrollContainer = ({ children, className }: HorizontalScrollContainerProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const activeScrollerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScrollLeft, setMaxScrollLeft] = useState(0);
  const [thumbSize, setThumbSize] = useState(52);

  const resolveScroller = useCallback(() => {
    const host = hostRef.current;
    if (!host) return null;

    const tableContent = host.querySelector<HTMLDivElement>('.ant-table-content');
    const tableBody = host.querySelector<HTMLDivElement>('.ant-table-body');
    const nextScroller = tableContent || tableBody || host;

    activeScrollerRef.current = nextScroller;
    return nextScroller;
  }, []);

  const updateMetrics = useCallback(() => {
    const scroller = activeScrollerRef.current || resolveScroller();
    if (!scroller) return;

    const maxScroll = Math.max(scroller.scrollWidth - scroller.clientWidth, 0);
    setMaxScrollLeft(maxScroll);
    setScrollLeft(scroller.scrollLeft > maxScroll ? maxScroll : scroller.scrollLeft);

    const ratio = scroller.scrollWidth > 0 ? scroller.clientWidth / scroller.scrollWidth : 1;
    const nextThumbSize = Math.round(
      Math.max(MIN_THUMB_SIZE, Math.min(MAX_THUMB_SIZE, ratio * BASE_TRACK_WIDTH)),
    );
    setThumbSize(nextThumbSize);
  }, [resolveScroller]);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      stopAnimation();
    },
    [stopAnimation],
  );

  useEffect(() => {
    const refresh = () => {
      resolveScroller();
      updateMetrics();
    };

    const rafId = requestAnimationFrame(refresh);
    const host = hostRef.current;
    if (!host || typeof MutationObserver === 'undefined') {
      return () => cancelAnimationFrame(rafId);
    }

    const observer = new MutationObserver(() => {
      requestAnimationFrame(refresh);
    });
    observer.observe(host, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
    };
  }, [children, resolveScroller, updateMetrics]);

  useEffect(() => {
    const scroller = resolveScroller();
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
  }, [children, resolveScroller, updateMetrics]);

  const sliderValue = useMemo(
    () => Math.min(scrollLeft, maxScrollLeft),
    [maxScrollLeft, scrollLeft],
  );

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value) || 0;
    const scroller = activeScrollerRef.current || resolveScroller();
    if (!scroller) return;
    stopAnimation();
    scroller.scrollLeft = next;
    setScrollLeft(next);
  };

  const animateScrollTo = (target: number) => {
    const scroller = activeScrollerRef.current || resolveScroller();
    if (!scroller) return;

    stopAnimation();

    const start = scroller.scrollLeft;
    const distance = target - start;
    if (Math.abs(distance) < 1) {
      scroller.scrollLeft = target;
      setScrollLeft(target);
      return;
    }

    const duration = Math.max(220, Math.min(520, Math.abs(distance) * 0.9));
    const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const next = start + distance * eased;
      scroller.scrollLeft = next;
      setScrollLeft(next);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const scrollBy = (delta: number) => {
    const scroller = activeScrollerRef.current || resolveScroller();
    if (!scroller) return;

    const next = Math.max(0, Math.min(scroller.scrollLeft + delta, maxScrollLeft));
    animateScrollTo(next);
  };

  const hasHorizontalOverflow = maxScrollLeft > 0;
  const canScrollLeft = sliderValue > 0;
  const canScrollRight = sliderValue < maxScrollLeft - 1;
  const sliderMax = hasHorizontalOverflow ? maxScrollLeft : 1;
  const sliderDisplayValue = hasHorizontalOverflow ? sliderValue : 0;
  const sliderStyle = {
    '--st-scroll-thumb-size': `${thumbSize}px`,
  } as CSSProperties;

  return (
    <div className={className}>
      <div ref={hostRef} className="table-scrollbar">
        {children}
      </div>

      <div
        className="st-horizontal-scrollbar"
        style={{ opacity: hasHorizontalOverflow ? 1 : 0.55 }}
      >
        <button
          type="button"
          className="st-horizontal-scrollbar-arrow"
          aria-label="Scroll left"
          disabled={!hasHorizontalOverflow || !canScrollLeft}
          onClick={() => scrollBy(-SCROLL_STEP)}
        >
          <LeftOutlined />
        </button>
        <input
          type="range"
          className="st-horizontal-scrollbar-range"
          min={0}
          max={sliderMax}
          step={1}
          value={sliderDisplayValue}
          onChange={handleSliderChange}
          disabled={!hasHorizontalOverflow}
          style={sliderStyle}
          aria-label="Horizontal scroll position"
        />
        <button
          type="button"
          className="st-horizontal-scrollbar-arrow"
          aria-label="Scroll right"
          disabled={!hasHorizontalOverflow || !canScrollRight}
          onClick={() => scrollBy(SCROLL_STEP)}
        >
          <RightOutlined />
        </button>
      </div>
    </div>
  );
};

export default HorizontalScrollContainer;
