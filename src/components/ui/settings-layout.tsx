/**
 * A settings screen (docs/RULES.md R4.2), so every app's preferences look and
 * read the same:
 *
 *   <SettingsLayout nav={<SidebarNav …/>}>
 *     <SettingsPage title="Appearance" description="…">
 *       <SettingsGroup title="Theme">
 *         <SettingRow label="Mode" description="…"><Segmented …/></SettingRow>
 *       </SettingsGroup>
 *     </SettingsPage>
 *   </SettingsLayout>
 *
 * The page is left-aligned beside the nav, never centred in the window:
 * centring made a wide window look empty and put the settings far from the
 * nav they belong to. It's 760px wide at 100% and grows with the interface
 * scale. Rows are label and description on the left, the control in a fixed
 * column on the right, separated by hairlines rather than boxed in cards.
 */

import * as React from "react";
import { cn } from "../../lib/utils";

export function SettingsLayout({
  nav,
  footer,
  children,
  className,
}: {
  /** The section nav: a `SidebarNav`, 224px. */
  nav: React.ReactNode;
  /** Pinned under the page, e.g. a save / discard bar for a draft. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div data-slot="settings-layout" className={cn("flex min-h-0 flex-1", className)}>
      {nav}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto nexis-scrollbar">{children}</div>
        {footer}
      </div>
    </div>
  );
}

export function SettingsPage({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Beside the title, right-aligned: rarely more than one quiet button. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section data-slot="settings-page" className={cn("nexis-scene-enter flex w-full max-w-190 flex-col gap-section p-page", className)}>
      <header className="flex items-start gap-group">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-lg font-semibold">{title}</h1>
          {description && <p className="max-w-prose text-body text-muted-foreground">{description}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function SettingsGroup({
  title,
  children,
  className,
}: {
  /** The group's overline; leave it out for a page with one group. */
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section data-slot="settings-group" className={cn("flex flex-col", className)}>
      {title && <h2 className="pb-2 text-micro font-medium tracking-[0.06em] text-muted-foreground uppercase">{title}</h2>}
      <div className="flex flex-col divide-y divide-border/60 border-y border-border/60">{children}</div>
    </section>
  );
}

export function SettingRow({
  label,
  description,
  htmlFor,
  align = "end",
  children,
  className,
}: {
  label: React.ReactNode;
  /** One sentence: what the setting does. */
  description?: React.ReactNode;
  /** The control's id, so clicking the label focuses it. */
  htmlFor?: string;
  /**
   * "end" (default) right-aligns a switch or a segmented control in its
   * column; "stretch" gives an input or a select the column's full width.
   */
  align?: "end" | "stretch";
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      data-slot="setting-row"
      className={cn("grid grid-cols-[minmax(0,1fr)_minmax(0,17.5rem)] items-center gap-x-section gap-y-2 py-4 max-sm:grid-cols-1", className)}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      <div className={cn("flex min-w-0 items-center", align === "end" ? "justify-end max-sm:justify-start" : "*:w-full")}>{children}</div>
    </div>
  );
}
