// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * One accent rail that travels between the items of a nav, instead of each
 * item painting its own indicator.
 *
 * Used by both navs in the app — the horizontal sidebar rail and the vertical
 * Settings nav — because they are the same idea at ninety degrees, and two
 * copies of a measuring hook is how the two stop agreeing about how fast the
 * rail moves.
 *
 * Measure in layout pixels so the mark uses the same coordinate space as
 * the buttons, regardless of ancestor zoom, scrolling, or entrance motion.
 * A positioned wrapper contributes its offset and border to that space.
 *
 * Two rails can share one container (a highlight and a separate mark, as in
 * `SettingsTree`): attach a callback ref that calls both `setContainer`s.
 */

import { useReducedMotion } from "motion/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

/** Offset and extent along the rail's axis, in container-relative pixels. */
export type RailRect = { offset: number; extent: number };

export type GlidingRail<Id> = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** A callback ref for the container, for when two rails share one. */
  setContainer: (el: HTMLDivElement | null) => void;
  registerItem: (id: Id, el: HTMLElement | null) => void;
  activeRect: RailRect | null;
  hoverRect: RailRect | null;
  /** Length the indicator spans along the axis (items' far edge, at least the
   *  visible box). `RailIndicator` clips it down to the selected item. */
  containerExtent: number;
  axis: "horizontal" | "vertical";
  hoverId: Id | null;
  setHoverId: (id: Id | null) => void;
  /** Spring for the travel; collapses to an instant move under reduced motion. */
  transition: { duration: number } | { type: "spring"; stiffness: number; damping: number };
};

/**
 * @param activeId  The item the rail should rest on.
 * @param axis      Which way the nav runs.
 * @param revision  Bump to force a re-measure when the item set changes
 *                  (item count is the usual value).
 */
export function useGlidingRail<Id>(
  activeId: Id,
  axis: "horizontal" | "vertical",
  revision: number,
): GlidingRail<Id> {
  const containerRef = useRef<HTMLDivElement>(null);
  const setContainer = useCallback((el: HTMLDivElement | null) => {
    containerRef.current = el;
  }, []);
  const itemRefs = useRef(new Map<Id, HTMLElement>());
  const [activeRect, setActiveRect] = useState<RailRect | null>(null);
  const [hoverId, setHoverId] = useState<Id | null>(null);
  const [hoverRect, setHoverRect] = useState<RailRect | null>(null);
  const [containerExtent, setContainerExtent] = useState(0);
  const reduceMotion = useReducedMotion();

  const registerItem = useCallback((id: Id, el: HTMLElement | null) => {
    if (el) itemRefs.current.set(id, el);
    else itemRefs.current.delete(id);
  }, []);

  const measure = useCallback((el: HTMLElement): RailRect | null => {
    const container = containerRef.current;
    if (!container || !el.isConnected || el.getClientRects().length === 0) return null;

    let offset = axis === "horizontal" ? el.offsetLeft : el.offsetTop;
    let parent = el.offsetParent;
    while (parent instanceof HTMLElement && parent !== container) {
      offset += axis === "horizontal" ? parent.offsetLeft + parent.clientLeft : parent.offsetTop + parent.clientTop;
      parent = parent.offsetParent;
    }
    if (parent !== container) return null;
    return { offset, extent: axis === "horizontal" ? el.offsetWidth : el.offsetHeight };
  }, [axis]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      let end = axis === "horizontal" ? container.clientWidth : container.clientHeight;
      let active: RailRect | null = null;
      let hover: RailRect | null = null;
      for (const [id, item] of itemRefs.current) {
        const rect = measure(item);
        if (!rect) continue;
        end = Math.max(end, rect.offset + rect.extent);
        if (id === activeId) active = rect;
        if (id === hoverId) hover = rect;
      }
      const keepIfEqual = (previous: RailRect | null, next: RailRect | null) =>
        previous?.offset === next?.offset && previous?.extent === next?.extent ? previous : next;
      setActiveRect((before) => keepIfEqual(before, active));
      setHoverRect((before) => keepIfEqual(before, hover));
      setContainerExtent(end);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    for (const item of itemRefs.current.values()) {
      observer.observe(item);
      for (let parent = item.parentElement; parent && parent !== container; parent = parent.parentElement) {
        observer.observe(parent);
      }
    }
    return () => observer.disconnect();
  }, [activeId, hoverId, revision, axis, measure]);

  return {
    containerRef,
    setContainer,
    registerItem,
    activeRect,
    hoverRect,
    containerExtent,
    axis,
    hoverId,
    setHoverId,
    transition: reduceMotion
      ? { duration: 0 }
      : { type: "spring", stiffness: 520, damping: 40 },
  };
}
