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
const MIN_THUMB_SIZE = 44;
const FALLBACK_TRACK_WIDTH = 420;

const getMaxScrollLeft = (element: HTMLDivElement) =>
  Math.max(element.scrollWidth - element.clientWidth, 0);

const HorizontalScrollContainer = ({ children, className }: HorizontalScrollContainerProps) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rangeRef = useRef<HTMLInputElement | null>(null);
  const activeScrollerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const scrollSyncFrameRef = useRef<number | null>(null);
  const latestScrollLeftRef = useRef(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [maxScrollLeft, setMaxScrollLeft] = useState(0);
  const [thumbSize, setThumbSize] = useState(52);

  const resolveScroller = useCallback(() => {
    const host = hostRef.current;
    if (!host) return null;

    const tableBody = host.querySelector<HTMLDivElement>('.ant-table-body');
    const tableContent = host.querySelector<HTMLDivElement>('.ant-table-content');
    const bodyMax = tableBody ? getMaxScrollLeft(tableBody) : 0;
    const contentMax = tableContent ? getMaxScrollLeft(tableContent) : 0;

    // Prefer Ant Table body as primary horizontal scroll owner whenever possible.
    // This keeps behavior closest to native and prevents "scroll then snap back".
    let nextScroller: HTMLDivElement;
    if (tableBody && bodyMax > 0) {
      nextScroller = tableBody;
    } else if (tableContent && contentMax > 0) {
      nextScroller = tableContent;
    } else if (tableBody) {
      nextScroller = tableBody;
    } else if (tableContent) {
      nextScroller = tableContent;
    } else {
      nextScroller = host;
    }

    activeScrollerRef.current = nextScroller;
    return nextScroller;
  }, []);

  const getScrollTargets = useCallback(() => {
    const host = hostRef.current;
    if (!host) return [] as HTMLDivElement[];

    const tableBody = host.querySelector<HTMLDivElement>('.ant-table-body');
    const tableContent = host.querySelector<HTMLDivElement>('.ant-table-content');

    if (tableBody && tableContent) {
      if (tableBody === tableContent) return [tableBody];
      return [tableBody, tableContent];
    }
    if (tableBody) return [tableBody];
    if (tableContent) return [tableContent];

    const fallback = activeScrollerRef.current || resolveScroller();
    return fallback ? [fallback] : [];
  }, [resolveScroller]);

  const getActiveScroller = useCallback(() => {
    // Always resolve fresh: Ant Table internals can switch scroll owner after layout updates.
    return resolveScroller();
  }, [resolveScroller]);

  const updateMetrics = useCallback(() => {
    const scroller = getActiveScroller();
    if (!scroller) return;

    const maxScroll = getMaxScrollLeft(scroller);
    setMaxScrollLeft(maxScroll);
    setScrollLeft(scroller.scrollLeft > maxScroll ? maxScroll : scroller.scrollLeft);

    const ratio = scroller.scrollWidth > 0 ? scroller.clientWidth / scroller.scrollWidth : 1;
    const trackWidth = rangeRef.current?.clientWidth || FALLBACK_TRACK_WIDTH;
    const nextThumbSize = Math.round(
      Math.max(MIN_THUMB_SIZE, Math.min(trackWidth, ratio * trackWidth)),
    );
    setThumbSize(nextThumbSize);
  }, [getActiveScroller]);

  const stopAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(
    () => () => {
      stopAnimation();
      if (scrollSyncFrameRef.current !== null) {
        cancelAnimationFrame(scrollSyncFrameRef.current);
        scrollSyncFrameRef.current = null;
      }
    },
    [stopAnimation, scrollSyncFrameRef],
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
    const targets = getScrollTargets();

    const handleScroll = () => {
      latestScrollLeftRef.current = scroller.scrollLeft;
      if (scrollSyncFrameRef.current !== null) return;

      scrollSyncFrameRef.current = requestAnimationFrame(() => {
        scrollSyncFrameRef.current = null;
        const next = latestScrollLeftRef.current;
        setScrollLeft(prev => (Math.abs(prev - next) < 0.5 ? prev : next));
      });
    };

    targets.forEach(target => {
      target.addEventListener('scroll', handleScroll, { passive: true });
    });
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
      targets.forEach(target => {
        target.removeEventListener('scroll', handleScroll);
      });
      window.removeEventListener('resize', updateMetrics);
      resizeObserver?.disconnect();
    };
  }, [children, getScrollTargets, resolveScroller, updateMetrics]);

  const sliderValue = useMemo(
    () => Math.min(scrollLeft, maxScrollLeft),
    [maxScrollLeft, scrollLeft],
  );

  const handleSliderChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number(event.target.value) || 0;
    const targets = getScrollTargets();
    const scroller = targets[0] || getActiveScroller();
    if (!scroller) return;
    const boundedTarget = Math.max(0, Math.min(next, getMaxScrollLeft(scroller)));
    animateScrollTo(boundedTarget);
  };

  const animateScrollTo = (target: number) => {
    const targets = getScrollTargets();
    const scroller = targets[0] || getActiveScroller();
    if (!scroller) return;

    stopAnimation();

    const initialMax = getMaxScrollLeft(scroller);
    const safeTarget = Math.max(0, Math.min(target, initialMax));
    const start = scroller.scrollLeft;
    const distance = safeTarget - start;
    if (Math.abs(distance) < 1) {
      targets.forEach(node => {
        node.scrollLeft = safeTarget;
      });
      setScrollLeft(scroller.scrollLeft);
      return;
    }

    const distanceRatio = Math.abs(distance) / Math.max(scroller.clientWidth, 1);
    const duration = Math.max(460, Math.min(1400, 420 + distanceRatio * 460));
    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
    const startedAt = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutSine(progress);
      const liveMax = getMaxScrollLeft(scroller);
      const desired = start + distance * eased;
      const boundedNext = Math.max(0, Math.min(desired, liveMax));
      targets.forEach(node => {
        node.scrollLeft = boundedNext;
      });

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(tick);
      } else {
        animationFrameRef.current = null;
        setScrollLeft(scroller.scrollLeft);
      }
    };

    animationFrameRef.current = requestAnimationFrame(tick);
  };

  const scrollBy = (delta: number) => {
    const targets = getScrollTargets();
    const scroller = targets[0] || getActiveScroller();
    if (!scroller) return;

    const maxScroll = getMaxScrollLeft(scroller);
    const next = Math.max(0, Math.min(scroller.scrollLeft + delta, maxScroll));
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
          ref={rangeRef}
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
