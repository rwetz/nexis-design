// Gallery scaffolding: page and demo frames. Not part of the package.
import type * as React from "react";
import { cn, Panel } from "@nexis/design";

export function Page({
  title,
  lede,
  children,
  className,
}: {
  title: string;
  lede?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto flex w-full max-w-[1320px] flex-col gap-5 px-8 pt-7 pb-12", className)}>
      {title && (
        <header className="flex flex-col gap-1.5">
          <h1 className="font-heading text-[28px] leading-tight font-medium tracking-tight">{title}</h1>
          {lede && <p className="max-w-[72ch] text-sm text-muted-foreground">{lede}</p>}
        </header>
      )}
      {children}
    </div>
  );
}

export function Demo({
  title,
  meta,
  children,
  className,
  bodyClassName,
  flush,
  actions,
}: {
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  flush?: boolean;
  actions?: React.ReactNode;
}) {
  return (
    <Panel title={title} meta={meta} actions={actions} flush={flush} className={className} bodyClassName={cn("flex flex-col gap-4", bodyClassName)}>
      {children}
    </Panel>
  );
}

export function Row({ label, children, className }: { label?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</span>}
      <div className={cn("flex flex-wrap items-center gap-2", className)}>{children}</div>
    </div>
  );
}

export function Grid({ cols = 2, children, className }: { cols?: 1 | 2 | 3 | 4; children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-5",
        cols === 2 && "lg:grid-cols-2",
        cols === 3 && "lg:grid-cols-3",
        cols === 4 && "md:grid-cols-2 xl:grid-cols-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
