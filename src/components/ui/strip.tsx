/**
 * A row of cards that scrolls sideways (docs/RULES.md R4.6), from Press's
 * shader and preset strips.
 *
 * It has no scrollbar: Chrome on Windows draws arrow buttons on a thin one,
 * which look broken under a strip. A vertical wheel scrolls it sideways until
 * it reaches an end, then the panel takes over, and the edges fade where
 * there's more to see. It bleeds into its panel's gutter (-mx-gutter
 * px-gutter), so the first card lines up with the content above and the
 * fade sits in the gutter.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

export function Strip({ className, style, children, ...props }: React.ComponentProps<"div">) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [more, setMore] = React.useState({ before: false, after: false });
  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const before = el.scrollLeft > 1;
    const after = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
    setMore((m) => (m.before === before && m.after === after ? m : { before, after }));
  }, []);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      const atEnd = e.deltaY > 0 ? el.scrollLeft + el.clientWidth >= el.scrollWidth - 1 : el.scrollLeft <= 0;
      if (atEnd) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      ro.disconnect();
      el.removeEventListener("wheel", wheel);
    };
  }, [measure]);
  const fade = `linear-gradient(to right, ${more.before ? "transparent" : "black"}, black var(--spacing-gutter), black calc(100% - var(--spacing-gutter)), ${more.after ? "transparent" : "black"})`;
  return (
    <div
      ref={ref}
      data-slot="strip"
      onScroll={measure}
      className={cn("-mx-gutter flex gap-3 overflow-x-auto px-gutter py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
      style={{ maskImage: fade, WebkitMaskImage: fade, ...style }}
      {...props}
    >
      {children}
    </div>
  );
}
