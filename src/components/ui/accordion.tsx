// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Stacked disclosure sections. Radix Accordion underneath; the open/close
 * uses the same `.nexis-collapsible-content` keyframes as `Collapsible`, so
 * there is one height animation in the family, on the house curve.
 */

import type * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex flex-col divide-y divide-border/60", className)}
      {...props}
    />
  );
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn(className)} {...props} />;
}

function AccordionTrigger({
  className,
  children,
  meta,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & { meta?: React.ReactNode }) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/acc flex flex-1 items-center gap-2 py-2.5 text-left text-sm font-medium outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md",
          className,
        )}
        {...props}
      >
        <Icon
          name="chevron-right"
          className="text-muted-foreground transition-transform group-data-[state=open]/acc:rotate-90"
        />
        <span className="flex-1">{children}</span>
        {meta !== undefined && <span className="text-xs font-normal text-muted-foreground">{meta}</span>}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="nexis-collapsible-content"
      style={{ ["--radix-collapsible-content-height" as string]: "var(--radix-accordion-content-height)" }}
      {...props}
    >
      <div className={cn("pb-3 pl-6 text-sm text-muted-foreground", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
