// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Cards that answer the pointer, from Vitrine (RULES R8.3, opt-in): the card
 * leans toward the pointer, lifts, and a soft light follows it across the
 * picture (the sheen). A card marked `data-foil` also catches a faint foil
 * shimmer, for the one thing on a shelf that is special (a deal, a rarity).
 *
 *   <CardTilt />                       // once, near the root: one listener for the app
 *   <div data-tilt>                    // the part that stays still (the hit area)
 *     <div className="nexis-face">…    // the part that leans (the picture)
 *
 * `ProductCard tilt` and `CollectionCard` are wired already. One pointer
 * listener for the whole app writes CSS variables on the card under the
 * pointer, once a frame; the motion itself is CSS. Nothing happens on touch,
 * on a coarse pointer, or under reduced motion.
 */

import * as React from "react";

/** The lean, light position and parallax for a pointer at (x, y) in a box. `most` is the largest lean in degrees. */
export function tiltFor(x: number, y: number, width: number, height: number, most = 9) {
  const across = Math.min(1, Math.max(0, x / Math.max(1, width)));
  const down = Math.min(1, Math.max(0, y / Math.max(1, height)));
  const round = (n: number) => Math.round(n * 100) / 100 + 0;
  return {
    rx: round((0.5 - down) * 2 * most),
    ry: round((across - 0.5) * 2 * most),
    mx: round(across * 100),
    my: round(down * 100),
    px: round((across - 0.5) * 2),
    py: round((down - 0.5) * 2),
  };
}

const VARS = ["--rx", "--ry", "--mx", "--my", "--px", "--py"] as const;

/**
 * Installs the one pointer listener that drives every `[data-tilt]` card.
 * Render it once. While it is mounted it marks the root (`data-card-tilt`,
 * and `data-card-foil`, `data-card-enter` per prop), and every effect in
 * R8.3 is gated on those: unmount it, or pass `foil={false}` or
 * `enter={false}`, and that part stops everywhere. An app with levels of
 * showmanship (Vitrine's Calm, Lively, Over the top) maps them onto this.
 */
export function CardTilt({ foil = true, enter = true }: { foil?: boolean; enter?: boolean } = {}) {
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.cardTilt = "";
    if (foil) root.dataset.cardFoil = "";
    else delete root.dataset.cardFoil;
    if (enter) root.dataset.cardEnter = "";
    else delete root.dataset.cardEnter;
    return () => {
      delete root.dataset.cardTilt;
      delete root.dataset.cardFoil;
      delete root.dataset.cardEnter;
    };
  }, [foil, enter]);
  React.useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let card: HTMLElement | null = null;
    let at: { x: number; y: number } | null = null;
    let frame = 0;
    const release = () => {
      if (!card) return;
      card.removeAttribute("data-tilting");
      for (const v of VARS) card.style.removeProperty(v);
      card = null;
    };
    const paint = () => {
      frame = 0;
      if (!card || !at) return;
      const box = card.getBoundingClientRect();
      const t = tiltFor(at.x - box.left, at.y - box.top, box.width, box.height, card.dataset.tilt === "flat" ? 0 : Number(card.dataset.tilt) || 9);
      card.style.setProperty("--rx", `${t.rx}deg`);
      card.style.setProperty("--ry", `${t.ry}deg`);
      card.style.setProperty("--mx", `${t.mx}%`);
      card.style.setProperty("--my", `${t.my}%`);
      card.style.setProperty("--px", `${t.px}`);
      card.style.setProperty("--py", `${t.py}`);
    };
    const move = (e: PointerEvent) => {
      const next = reduce.matches ? null : ((e.target as Element | null)?.closest?.<HTMLElement>("[data-tilt]") ?? null);
      if (next !== card) {
        release();
        card = next;
        card?.setAttribute("data-tilting", "");
      }
      at = { x: e.clientX, y: e.clientY };
      if (card && !frame) frame = requestAnimationFrame(paint);
    };
    document.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", release);
    return () => {
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", release);
      cancelAnimationFrame(frame);
      release();
    };
  }, []);
  return null;
}

/**
 * A titled collection as a hand of cards: up to four covers fanned out over
 * a blurred copy of the first, with the name and count along the bottom.
 * The hand spreads and follows the pointer when `CardTilt` is mounted.
 */
export function CollectionCard({
  name,
  count,
  covers,
  tone,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<"button">, "name"> & {
  name: string;
  count: number;
  /** A colour for the hand's glow (any CSS colour, e.g. `var(--terminal-ansi-cyan)`), so a row of collections is not one grey. Defaults to a neutral light. */
  tone?: string;
  /** Picture URLs, or nodes (a placeholder), first is the backdrop. Four are shown. */
  covers: readonly React.ReactNode[];
}) {
  const shown = covers.slice(0, 4);
  const middle = (shown.length - 1) / 2;
  const gap = shown.length >= 4 ? "34%" : shown.length === 3 ? "46%" : "56%";
  const size = shown.length <= 1 ? "54%" : shown.length === 2 ? "50%" : "42%";
  const face = (c: React.ReactNode) => (typeof c === "string" ? <img src={c} alt="" draggable={false} className="size-full object-cover" /> : c);
  return (
    <button
      type="button"
      data-tilt="flat"
      data-slot="collection-card"
      data-tone={tone ? "" : undefined}
      style={tone ? ({ ...style, "--collection-tone": tone } as React.CSSProperties) : style}
      aria-label={`${name}, ${count} item${count === 1 ? "" : "s"}`}
      className={`group/collection w-72 shrink-0 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring ${className ?? ""}`}
      {...props}
    >
      <span className="nexis-face relative block h-64 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 group-hover/collection:ring-foreground/25">
        {shown[0] !== undefined && (
          <span aria-hidden className="nexis-collection-back">
            {face(shown[0])}
          </span>
        )}
        <span aria-hidden className="nexis-collection-tint" />
        <span aria-hidden className="nexis-fan">
          {shown.map((c, n) => (
            <span
              key={n}
              className="nexis-fan-card"
              style={{ "--n": n - middle, "--k": n, "--gap": gap, "--size": size, "--drop": `${Math.abs(n - middle) * 0.5}rem` } as React.CSSProperties}
            >
              {face(c)}
            </span>
          ))}
        </span>
        <span className="absolute inset-x-0 bottom-0 z-[5] flex items-center gap-2 px-4 py-3">
          <span className="min-w-0 flex-1 truncate text-lg font-semibold">{name}</span>
          <span className="shrink-0 rounded-full bg-background/70 px-2 py-0.5 text-caption font-medium tabular-nums">{count}</span>
        </span>
      </span>
    </button>
  );
}
