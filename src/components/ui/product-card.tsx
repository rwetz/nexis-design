// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Catalogue building blocks, promoted from Vitrine's storefront
 * (SCAFFOLD-ISSUES 19): a portrait `ProductCard` with a price line and slots
 * over the picture, `PriceTag` for a price and what it was, `CardBadge` for
 * those slots, and `Shelf`, a titled row of cards that scrolls sideways.
 *
 * Badges sit on artwork, so they are solid `bg-background` chips rather
 * than tinted badges, which would vanish on a busy cover. Selection and
 * hover stay neutral (R6.3); the one accent is left for the app's primary
 * action.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Skeleton } from "./skeleton";
import { Strip } from "./strip";
import type { ThumbnailAspect } from "./thumbnail";

const ASPECT: Record<ThumbnailAspect, string> = {
  square: "aspect-square",
  portrait: "aspect-[4/5]",
  landscape: "aspect-[4/3]",
};

/** A solid chip for the corner of a picture: "-20%", "Sold out", "New". */
export function CardBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="card-badge"
      className={cn("rounded-full bg-background px-2 py-0.5 text-caption font-medium text-foreground shadow-sm", className)}
      {...props}
    />
  );
}

/** A price, with the former price struck through when it has dropped. Pass formatted strings. */
export function PriceTag({
  price,
  was,
  prefix,
  size = "sm",
  className,
}: {
  /** The price as shown, e.g. "$24.00", or "See store" when unknown. */
  price?: React.ReactNode;
  /** The former price, struck through. */
  was?: React.ReactNode;
  /** A quiet word before the price: "From". */
  prefix?: React.ReactNode;
  size?: "sm" | "lg";
  className?: string;
}) {
  const quiet = size === "lg" ? "text-body" : "text-caption";
  return (
    <span data-slot="price-tag" className={cn("flex flex-wrap items-baseline gap-x-2 tabular-nums", className)}>
      {prefix && <span className={cn("text-muted-foreground", quiet)}>{prefix}</span>}
      <span className={cn("font-semibold", size === "lg" ? "text-2xl" : "text-sm")}>{price}</span>
      {was && <span className={cn("text-muted-foreground line-through", quiet)}>{was}</span>}
    </span>
  );
}

export function ProductCard({
  image,
  title,
  eyebrow,
  price,
  aside,
  badges,
  action,
  aspect = "portrait",
  dimmed = false,
  loading = false,
  placeholder,
  tilt = false,
  foil = false,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "title"> & {
  image?: string | null;
  title: React.ReactNode;
  /** A short line above the title: a brand, an author, a seller. */
  eyebrow?: React.ReactNode;
  /** Under the title, usually a `PriceTag`. */
  price?: React.ReactNode;
  /** Right of the price: a `Sparkline`, a rating. */
  aside?: React.ReactNode;
  /** `CardBadge`s over the picture's bottom-left corner. */
  badges?: React.ReactNode;
  /**
   * One button over the picture's top-right corner, e.g. add to cart. It is
   * rendered outside the card's own button, so it can be clicked on its own.
   */
  action?: React.ReactNode;
  aspect?: ThumbnailAspect;
  /** Fades the picture: sold out, unavailable. */
  dimmed?: boolean;
  loading?: boolean;
  /** Shown with no picture and not loading. Defaults to an image icon. */
  placeholder?: React.ReactNode;
  /** Lean toward the pointer, lift, and catch a light (RULES R8.3). Needs `<CardTilt />` mounted once. */
  tilt?: boolean;
  /** A faint foil under the pointer, for the one special card on a shelf. Implies `tilt`. */
  foil?: boolean;
}) {
  // What fills the picture, in order of precedence: the image once there
  // is one, else a skeleton while loading, else the placeholder (RULES R14.4).
  const face: { kind: "image"; src: string } | { kind: "loading" } | { kind: "empty" } = image ? { kind: "image", src: image } : loading ? { kind: "loading" } : { kind: "empty" };
  return (
    <div
      data-slot="product-card"
      data-tilt={tilt || foil ? "9" : undefined}
      data-foil={foil || undefined}
      className={cn("group/product relative flex min-w-0 flex-col", className)}
    >
      <button type="button" className="flex min-w-0 flex-col gap-2 text-left outline-none" {...props}>
        <div
          className={cn(
            "relative w-full overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/8 group-hover/product:ring-foreground/25 group-has-[:focus-visible]/product:ring-2 group-has-[:focus-visible]/product:ring-ring",
            // A tilting card lifts on the spring (.nexis-face); a plain one lifts 2px (R8.1).
            tilt || foil ? "nexis-face" : "transition-[translate,box-shadow] group-hover/product:-translate-y-0.5",
            ASPECT[aspect],
          )}
        >
          {face.kind === "image" ? (
            <img src={face.src} alt="" loading="lazy" decoding="async" draggable={false} className={cn("size-full object-cover", dimmed && "opacity-50")} />
          ) : face.kind === "loading" ? (
            <Skeleton className="size-full rounded-none" />
          ) : (
            <div className="grid size-full place-items-center text-muted-foreground">{placeholder ?? <Icon name="image" size="xl" />}</div>
          )}
          {badges && <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">{badges}</div>}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="min-w-0">
            {eyebrow && <div className="truncate text-caption text-muted-foreground">{eyebrow}</div>}
            <div className="line-clamp-2 text-body leading-snug">{title}</div>
          </div>
          {(price || aside) && (
            <span className="flex items-center justify-between gap-2">
              {price}
              {aside}
            </span>
          )}
        </div>
      </button>
      {action && <div className="absolute top-2 right-2">{action}</div>}
    </div>
  );
}

/**
 * A titled row of cards that scrolls sideways, with arrow buttons. Give each
 * child a fixed width and `shrink-0` (`w-44 shrink-0` for a `ProductCard`).
 *
 * `wheel="page"` (the default) lets a vertical wheel keep scrolling the page
 * over the shelf: a page of stacked shelves should never trap the reader
 * halfway down. Shift+wheel, a trackpad and the arrows still go sideways.
 * `wheel="sideways"` keeps `Strip`'s behaviour, for a lone strip in a panel.
 */
export function Shelf({
  title,
  meta,
  action,
  wheel = "page",
  enter = false,
  children,
  className,
}: {
  title: React.ReactNode;
  /** Beside the title: a count. */
  meta?: React.ReactNode;
  /** Right-aligned before the arrows: "See all". */
  action?: React.ReactNode;
  wheel?: "page" | "sideways";
  /** The cards' pictures hop into place, one after another, the first time the shelf scrolls into view (R8.3). */
  enter?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const holder = React.useRef<HTMLDivElement>(null);
  const section = React.useRef<HTMLElement>(null);
  const label = typeof title === "string" ? title : "shelf";
  React.useEffect(() => {
    const el = section.current;
    if (!el || !enter || typeof IntersectionObserver === "undefined") return undefined;
    const seen = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          el.dataset.seen = "";
          seen.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    seen.observe(el);
    return () => seen.disconnect();
  }, [enter]);
  React.useEffect(() => {
    const el = holder.current;
    if (!el || wheel !== "page") return undefined;
    // Capture on the holder runs before Strip's own listener on its child.
    const keepVertical = (e: WheelEvent) => {
      if (!e.shiftKey && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) e.stopPropagation();
    };
    el.addEventListener("wheel", keepVertical, { capture: true, passive: true });
    return () => el.removeEventListener("wheel", keepVertical, { capture: true });
  }, [wheel]);
  const slide = (direction: 1 | -1) => {
    const strip = holder.current?.firstElementChild;
    if (!strip) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollBy({ left: direction * Math.max(320, strip.clientWidth * 0.8), behavior: reduce ? "auto" : "smooth" });
  };
  return (
    <section ref={section} data-slot="shelf" className={cn("flex min-w-0 flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{title}</h2>
        {meta !== undefined && <span className="text-ui text-muted-foreground tabular-nums">{meta}</span>}
        <span className="flex-1" />
        {action}
        <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={`Scroll ${label} back`} onClick={() => slide(-1)}>
          <Icon name="chevron-left" />
        </Button>
        <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={`Scroll ${label} on`} onClick={() => slide(1)}>
          <Icon name="chevron-right" />
        </Button>
      </div>
      <div ref={holder}>
        {/* Room above and below for a card that lifts on hover. */}
        <Strip className="-my-6 snap-x scroll-px-gutter gap-group py-6 *:snap-start">
          {React.Children.map(children, (child, i) =>
            React.isValidElement<{ style?: React.CSSProperties }>(child)
              ? React.cloneElement(child, { style: { ...child.props.style, ["--i" as string]: i } })
              : child,
          )}
        </Strip>
      </div>
    </section>
  );
}
