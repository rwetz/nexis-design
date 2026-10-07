import * as React from "react";
import { cn, Icon, ICON_NAMES, ICON_SIZE, Input, Switch, Label } from "@nexis/design";
import { Demo, Page } from "../kit";

export function IconsPage() {
  const [q, setQ] = React.useState("");
  const [active, setActive] = React.useState(false);
  const names = ICON_NAMES.filter((n) => n.includes(q.toLowerCase().trim()));
  return (
    <Page
      title="Icons"
      lede={`One choke point: <Icon name="…" />. Call sites name an idea, never a vendor export, so one idea is one glyph everywhere and the vendor (Phosphor) is swappable in one file. ${ICON_NAMES.length} names, five sizes, and weight as a state axis: regular rests, fill is active.`}
    >
      <Demo title="Scale" meta="xs 12 · sm 14 (default) · md 16 · lg 20 · xl 24" bodyClassName="flex-row flex-wrap items-end gap-8">
        {(Object.keys(ICON_SIZE) as (keyof typeof ICON_SIZE)[]).map((s) => (
          <div key={s} className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <Icon name="terminal" size={s} />
              <Icon name="terminal" size={s} active />
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              {s} · {ICON_SIZE[s]}
            </span>
          </div>
        ))}
      </Demo>
      <Demo
        title="Registry"
        meta={`${names.length} of ${ICON_NAMES.length}`}
        actions={
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="ic-active" size="sm" checked={active} onCheckedChange={setActive} />
              <Label htmlFor="ic-active" className="text-xs">
                active
              </Label>
            </div>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter…" className="h-7 w-44 text-xs" />
          </div>
        }
      >
        <div className="grid grid-cols-3 gap-1 sm:grid-cols-5 lg:grid-cols-8 xl:grid-cols-10">
          {names.map((n) => (
            <div
              key={n}
              title={n}
              className={cn("flex flex-col items-center gap-2 rounded-xl px-1 py-3 text-foreground/85 hover:bg-muted")}
            >
              <Icon name={n} size="lg" active={active} />
              <span className="w-full truncate text-center font-mono text-[10px] text-muted-foreground">{n}</span>
            </div>
          ))}
        </div>
      </Demo>
    </Page>
  );
}
