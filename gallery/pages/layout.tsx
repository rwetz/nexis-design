import * as React from "react";
import {
  Button,
  ColorPicker,
  ControlRow,
  ListPresence,
  PanelSection,
  PresenceItem,
  Segmented,
  SettingRow,
  SettingsGroup,
  SettingsPage,
  Slider,
  Strip,
  Switch,
  ThumbnailCard,
  ThumbnailGrid,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Icon,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ScrollArea,
  Separator,
  SectionLabel,
} from "@nexis/design";
import { logLine } from "../data";
import { Demo, Grid, Page } from "../kit";

export function LayoutPage() {
  return (
    <Page
      title="Layout"
      lede="Resizable splits, scroll regions and cards. Native scrollbars are off everywhere (they break the chrome on Linux and flash on macOS); scroll affordance comes from ScrollArea or the thin .nexis-scrollbar."
    >
      <Demo title="Resizable" meta="drag the handles · custom resize cursors" flush>
        <ResizablePanelGroup orientation="horizontal" className="h-[280px]">
          <ResizablePanel defaultSize="24%" minSize="15%">
            <div className="flex h-full flex-col gap-1 p-3 text-sm">
              <SectionLabel>Explorer</SectionLabel>
              {["src", "docs", "gallery", "templates", "assets"].map((f) => (
                <span key={f} className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="folder" className="text-brand/80" /> {f}
                </span>
              ))}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="52%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="65%">
                <div className="h-full p-4 font-mono text-ui leading-6 text-muted-foreground">
                  <div>
                    <span className="text-info">export function</span> <span className="text-foreground">Panel</span>(props) {"{"}
                  </div>
                  <div className="pl-4">return &lt;section data-slot="panel" … /&gt;</div>
                  <div>{"}"}</div>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="35%">
                <div className="h-full p-3 font-mono text-caption text-muted-foreground">$ pnpm test: 41 passed</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="24%" minSize="15%">
            <div className="p-3 text-sm text-muted-foreground">Inspector</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </Demo>

      <Grid cols={3}>
        <Demo title="Scroll area" meta="themed thumb, no native bar" flush>
          <ScrollArea className="h-[220px]">
            <div className="flex flex-col p-3 font-mono text-ui">
              {Array.from({ length: 60 }, (_, i) => logLine(i)).map((l) => (
                <span key={l.i} className="truncate leading-6 text-muted-foreground">
                  {l.t} {l.msg}
                </span>
              ))}
            </div>
          </ScrollArea>
        </Demo>
        <Card>
          <CardHeader>
            <CardTitle>Card</CardTitle>
            <CardDescription>For content that is a unit: a plan, a preset, a result.</CardDescription>
            <CardAction>
              <Button variant="ghost" size="icon-sm" aria-label="More">
                <Icon name="more" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Panels frame regions of a screen; cards are things on it. If it has a title bar and lives in a grid of tiles, it is a Panel.
          </CardContent>
          <CardFooter className="gap-2">
            <Button variant="brand" size="sm">
              Choose
            </Button>
            <Button variant="ghost" size="sm">
              Details
            </Button>
          </CardFooter>
        </Card>
        <Demo title="Collapsible & separator" meta="">
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="group/c -ml-2">
                <Icon name="chevron-right" className="transition-transform group-data-[state=open]/c:rotate-90" />
                Advanced
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="nexis-collapsible-content">
              <p className="py-2 text-sm text-muted-foreground">Proxy, TLS and retry policy live here.</p>
            </CollapsibleContent>
          </Collapsible>
          <Separator />
          <div className="flex h-5 items-center gap-3 text-sm">
            <span>Blog</span>
            <Separator orientation="vertical" />
            <span>Docs</span>
            <Separator orientation="vertical" />
            <span>Source</span>
          </div>
        </Demo>
      </Grid>

      <Grid>
        <Demo title="Panel section · control row" meta="RULES R4.3, R4.4: label clamp(7rem, 38%, 10rem), value slot 3.5rem" flush>
          <PanelPatterns />
        </Demo>
        <Demo title="List presence" meta="R8.1: rows enter and leave">
          <PresenceDemo />
        </Demo>
      </Grid>

      <Demo title="Thumbnail grid" meta="R4.5: at least 9rem, at most 6 columns; selection is neutral">
        <ThumbnailDemo />
      </Demo>

      <Demo title="Settings page" meta="R4.2: left-aligned, label and description left, control in a 280px column" flush>
        <SettingsPage title="Appearance" description="How the app looks. Changes apply immediately.">
          <SettingsGroup title="Theme">
            <SettingRow label="Mode" description="Follow the system, or always light or dark.">
              <Segmented label="Mode" value="system" onChange={() => {}} segments={[{ id: "light", label: "Light" }, { id: "dark", label: "Dark" }, { id: "system", label: "System" }]} />
            </SettingRow>
            <SettingRow label="Reduce motion" description="Turns off entrances and travelling highlights.">
              <Switch aria-label="Reduce motion" />
            </SettingRow>
          </SettingsGroup>
        </SettingsPage>
      </Demo>
    </Page>
  );
}

const SWATCHES = ["oklch(0.62 0.12 250)", "oklch(0.7 0.13 35)", "oklch(0.68 0.11 150)", "oklch(0.6 0.12 320)", "oklch(0.75 0.1 90)", "oklch(0.55 0.08 200)", "oklch(0.65 0.14 10)", "oklch(0.7 0.09 280)"];

function PanelPatterns() {
  const [spacing, setSpacing] = React.useState(3.4);
  const [weight, setWeight] = React.useState(94);
  const [ink, setInk] = React.useState("#163a70");
  const [preset, setPreset] = React.useState(0);
  return (
    <div className="w-80 max-w-full border-r border-border/60">
      <PanelSection title="Presets" actions={<Button variant="ghost" size="icon-sm" aria-label="Save preset"><Icon name="add" /></Button>}>
        <Strip>
          {SWATCHES.map((c, i) => (
            <ThumbnailCard key={c} className="w-20 shrink-0" title={`Preset ${i + 1}`} selected={i === preset} onClick={() => setPreset(i)} placeholder={<span className="size-full" style={{ background: c }} />} />
          ))}
        </Strip>
      </PanelSection>
      <PanelSection title="Engraving">
        <ControlRow label="Engraving spacing" edited={spacing !== 3} onReset={() => setSpacing(3)} value={spacing.toFixed(1)}>
          <Slider aria-label="Engraving spacing" value={[spacing]} min={1} max={8} step={0.1} onValueChange={([v]) => setSpacing(v)} />
        </ControlRow>
        <ControlRow label="Line weight" value={weight}>
          <Slider aria-label="Line weight" value={[weight]} min={0} max={100} step={1} onValueChange={([v]) => setWeight(v)} />
        </ControlRow>
        <ControlRow label="Main ink">
          <ColorPicker label="Main ink" value={ink} onChange={setInk} swatches={["#efece4", "#c23b22"]} />
        </ControlRow>
      </PanelSection>
    </div>
  );
}

function PresenceDemo() {
  const [rows, setRows] = React.useState([1, 2, 3]);
  const next = React.useRef(4);
  return (
    <div className="flex flex-col gap-group">
      <div className="flex gap-inline">
        <Button variant="secondary" size="sm" onClick={() => setRows((r) => [next.current++, ...r])}>
          <Icon name="add" /> Add
        </Button>
        <Button variant="ghost" size="sm" disabled={!rows.length} onClick={() => setRows((r) => r.slice(1))}>
          Remove first
        </Button>
      </div>
      <div className="flex flex-col">
        <ListPresence>
          {rows.map((n) => (
            <PresenceItem key={n}>
              <div className="flex h-8 items-center rounded-lg px-2 text-ui hover:bg-muted/60">Layer {n}</div>
            </PresenceItem>
          ))}
        </ListPresence>
      </div>
    </div>
  );
}

function ThumbnailDemo() {
  const [on, setOn] = React.useState(1);
  return (
    <ThumbnailGrid>
      {SWATCHES.map((c, i) => (
        <ThumbnailCard key={c} title={`Swatch ${i + 1}`} meta="Print" selected={i === on} onClick={() => setOn(i)} placeholder={<span className="size-full" style={{ background: c }} />} />
      ))}
    </ThumbnailGrid>
  );
}
