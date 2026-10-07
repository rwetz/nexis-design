// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The window's top edge: drag region, brand, an optional centre slot (search,
 * a workspace switcher), actions, and the window controls.
 *
 * Every pixel of it is a drag region except the controls you put in it —
 * `data-tauri-drag-region` is set on the bar and on the empty slots, and
 * Tauri ignores it on interactive children. On macOS the left 80px are left
 * clear for the native traffic lights (the overlay title bar style); on
 * Windows/Linux `WindowControls` draws min/max/close on the right.
 */

import * as React from "react";
import { IN_TAURI, IS_MAC } from "../lib/platform";
import { cn } from "../lib/utils";
import { WindowControls } from "./WindowControls";

/**
 * Set to true around an app rendered outside Tauri (a gallery, a storybook,
 * a screenshot run) to make `controls="auto"` draw inert preview controls
 * instead of nothing. Never set in a shipped window.
 */
export const ChromePreviewContext = React.createContext(false);

type TitleBarProps = {
  /** A mark: the app's logo at 18px, usually. */
  brand?: React.ReactNode;
  title?: React.ReactNode;
  /** Centred content — a search trigger, a workspace switcher. */
  center?: React.ReactNode;
  /** Right-aligned actions, before the window controls. */
  actions?: React.ReactNode;
  /**
   * "auto": real controls in Tauri on Windows/Linux, nothing elsewhere.
   * "preview": inert controls everywhere (gallery, screenshots).
   */
  controls?: "auto" | "preview" | "none";
  className?: string;
};

export function TitleBar({ brand, title, center, actions, controls = "auto", className }: TitleBarProps) {
  const macInset = IN_TAURI && IS_MAC;
  const preview = React.useContext(ChromePreviewContext);
  const mode = controls === "auto" && preview && !IN_TAURI ? "preview" : controls;
  return (
    <header
      data-tauri-drag-region
      data-slot="title-bar"
      className={cn(
        "relative flex h-10 shrink-0 items-center gap-2 border-b border-border/60 bg-sidebar/60 select-none",
        macInset ? "pl-20" : "pl-3",
        className,
      )}
    >
      {brand}
      {title !== undefined && (
        <span data-tauri-drag-region className="truncate text-[13px] font-medium text-foreground/90">
          {title}
        </span>
      )}
      <div data-tauri-drag-region className="flex min-w-0 flex-1 justify-center">
        {center}
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
      {mode !== "none" ? <WindowControls preview={mode === "preview"} /> : <span className="w-2" />}
    </header>
  );
}
