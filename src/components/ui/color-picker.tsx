/**
 * A colour control that stays in the window (docs/RULES.md §7), from Press:
 * a swatch that opens a popover with a saturation/value square, a hue strip,
 * a hex field (paste works, with or without #, three or six digits), other
 * colours as one-click swatches, and an eyedropper where the platform has
 * one (Chromium and WebView2 do). Replaces `<input type="color">`, which
 * opens a separate OS dialog for every change and can't take a pasted value.
 *
 * The hex values here are the colour being edited, not UI colour, which is
 * why the gradients are written as hsl() and black/white.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

type Hsv = { h: number; s: number; v: number };

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const hex2 = (n: number) => Math.round(clamp(n) * 255).toString(16).padStart(2, "0");

function hexToHsv(hex: string): Hsv {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: ((h * 60) + 360) % 360, s: max ? d / max : 0, v: max };
}

function hsvToHex({ h, s, v }: Hsv): string {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return v - v * s * clamp(Math.min(k, 4 - k));
  };
  return `#${hex2(f(5))}${hex2(f(3))}${hex2(f(1))}`;
}

/** Three or six hex digits, with or without the hash, as a lower-case six-digit hex; null when it isn't a colour. */
export function parseHex(text: string): string | null {
  const t = text.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(t)) return `#${[...t].map((c) => c + c).join("")}`;
  if (/^[0-9a-f]{6}$/.test(t)) return `#${t}`;
  return null;
}

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };
const eyeDropper = () => (globalThis as { EyeDropper?: EyeDropperCtor }).EyeDropper;

/** Drags a pointer over `el`, calling `on` with the position as 0..1 on each axis. */
function useDrag(on: (x: number, y: number) => void) {
  const cb = React.useRef(on);
  cb.current = on;
  return (e: React.PointerEvent<HTMLElement>) => {
    const el = e.currentTarget;
    const at = (ev: PointerEvent | React.PointerEvent) => {
      const r = el.getBoundingClientRect();
      cb.current(clamp((ev.clientX - r.left) / r.width), clamp((ev.clientY - r.top) / r.height));
    };
    el.setPointerCapture(e.pointerId);
    at(e);
    const move = (ev: PointerEvent) => at(ev);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    e.preventDefault();
  };
}

export function ColorPicker({
  id,
  label,
  value,
  onChange,
  swatches = [],
  showValue = true,
}: {
  id?: string;
  /** Names the control for assistive tech: "Main ink". */
  label: string;
  /** "#rrggbb". */
  value: string;
  onChange: (hex: string) => void;
  /** Colours to offer as one-click swatches (e.g. the document's other colours). */
  swatches?: string[];
  /** The hex beside the swatch. */
  showValue?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  // Hue and saturation live here as well as in the hex, so dragging value to black (or
  // saturation to grey) doesn't lose the hue the square was on.
  const [hsv, setHsv] = React.useState(() => hexToHsv(value));
  const [draft, setDraft] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (hsvToHex(hsv) !== value) setHsv(hexToHsv(value));
    // Only an outside change (undo, a preset) should reset the hue, so hsv isn't a dependency.
  }, [value]);

  const set = (next: Hsv) => {
    setHsv(next);
    onChange(hsvToHex(next));
  };
  const sv = useDrag((x, y) => set({ ...hsv, s: x, v: 1 - y }));
  const hue = useDrag((x) => set({ ...hsv, h: x * 360 }));
  const nudge = (e: React.KeyboardEvent, axis: "sv" | "h") => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] }[e.key];
    if (!d) return;
    e.preventDefault();
    if (axis === "h") set({ ...hsv, h: (hsv.h + d[0] * 360 + 360) % 360 });
    else set({ ...hsv, s: clamp(hsv.s + d[0]), v: clamp(hsv.v + d[1]) });
  };
  const commitDraft = () => {
    const hex = draft === null ? null : parseHex(draft);
    if (hex) {
      setHsv(hexToHsv(hex));
      onChange(hex);
    }
    setDraft(null);
  };
  const pick = async () => {
    const Ctor = eyeDropper();
    if (!Ctor) return;
    try {
      const { sRGBHex } = await new Ctor().open();
      const hex = parseHex(sRGBHex);
      if (hex) {
        setHsv(hexToHsv(hex));
        onChange(hex);
      }
    } catch {
      /* cancelled */
    }
  };
  const others = [...new Set(swatches.filter((s) => s !== value))];

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            aria-label={`${label}: ${value}`}
            className="h-6 w-8 shrink-0 cursor-pointer rounded-md ring-1 ring-border transition-shadow outline-none hover:ring-foreground/30 focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: value }}
          />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 gap-3 p-3">
          <div
            role="slider"
            aria-label={`${label}: saturation and brightness`}
            aria-valuetext={`saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
            tabIndex={0}
            onPointerDown={sv}
            onKeyDown={(e) => nudge(e, "sv")}
            className="relative h-36 w-full cursor-crosshair touch-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: `linear-gradient(to top, black, transparent), linear-gradient(to right, white, hsl(${hsv.h} 100% 50%))` }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute size-3.5 -translate-1/2 rounded-full ring-2 ring-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
              style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: value }}
            />
          </div>
          <div
            role="slider"
            aria-label={`${label}: hue`}
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(hsv.h)}
            tabIndex={0}
            onPointerDown={hue}
            onKeyDown={(e) => nudge(e, "h")}
            className="relative h-3 w-full cursor-pointer touch-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ background: "linear-gradient(to right, hsl(0 100% 50%), hsl(60 100% 50%), hsl(120 100% 50%), hsl(180 100% 50%), hsl(240 100% 50%), hsl(300 100% 50%), hsl(360 100% 50%))" }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute top-1/2 size-3.5 -translate-1/2 rounded-full ring-2 ring-white shadow-[0_0_0_1px_rgb(0_0_0/0.4)]"
              style={{ left: `${(hsv.h / 360) * 100}%`, background: `hsl(${hsv.h} 100% 50%)` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              aria-label={`${label}: hex`}
              value={draft ?? value.slice(1).toUpperCase()}
              onChange={(e) => setDraft(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDraft();
                if (e.key === "Escape") setDraft(null);
              }}
              className={cn("h-8 font-mono text-ui uppercase", draft !== null && !parseHex(draft) && "ring-1 ring-destructive")}
            />
            {eyeDropper() && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label="Pick a colour from the screen" onClick={() => void pick()}>
                    <Icon name="cursor" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pick from the screen</TooltipContent>
              </Tooltip>
            )}
          </div>
          {others.length > 0 && (
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Other colours">
              {others.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Use ${c}`}
                  title={c.toUpperCase()}
                  onClick={() => {
                    setHsv(hexToHsv(c));
                    onChange(c);
                  }}
                  className="size-6 rounded-md ring-1 ring-border transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring"
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      {showValue && <span className="font-mono text-caption text-muted-foreground uppercase">{value.slice(1)}</span>}
    </div>
  );
}
