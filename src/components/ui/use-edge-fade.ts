// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import * as React from "react";

/**
 * Fades a scroller's edges where there is more to see (RULES R4.6): a row of
 * cards, a tab strip, anything that clips content sideways. Only an edge with
 * hidden content fades, so the first item at rest is never dimmed. Spread
 * `style` onto the scroller and pass `ref` to it; it measures on scroll and
 * resize.
 *
 * `size` is the fade's depth: a length (`"var(--spacing-gutter)"`, `"24px"`).
 */
export function useEdgeFade<T extends HTMLElement>(
  axis: "x" | "y" = "x",
  size = "var(--spacing-gutter)",
): { ref: React.RefObject<T | null>; style: React.CSSProperties | undefined; measure: () => void } {
  const ref = React.useRef<T>(null);
  const [more, setMore] = React.useState({ before: false, after: false });
  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = axis === "x" ? el.scrollLeft : el.scrollTop;
    const view = axis === "x" ? el.clientWidth : el.clientHeight;
    const full = axis === "x" ? el.scrollWidth : el.scrollHeight;
    const before = pos > 1;
    const after = pos + view < full - 1;
    setMore((m) => (m.before === before && m.after === after ? m : { before, after }));
  }, [axis]);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, [measure]);
  return { ref, style: edgeFadeStyle(axis, size, more.before, more.after), measure };
}

/** The mask for a scroller with hidden content `before` and/or `after`. */
export function edgeFadeStyle(
  axis: "x" | "y",
  size: string,
  before: boolean,
  after: boolean,
): React.CSSProperties | undefined {
  if (!before && !after) return undefined;
  const dir = axis === "x" ? "to right" : "to bottom";
  const mask = `linear-gradient(${dir}, ${before ? "transparent" : "black"}, black ${size}, black calc(100% - ${size}), ${after ? "transparent" : "black"})`;
  return { maskImage: mask, WebkitMaskImage: mask };
}
