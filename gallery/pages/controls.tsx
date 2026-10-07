import * as React from "react";
import {
  Badge,
  Button,
  ButtonGroup,
  CallChip,
  Checkbox,
  fmtShortcut,
  Icon,
  Kbd,
  KbdGroup,
  KbdHint,
  Label,
  Meter,
  MOD_KEY,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Segmented,
  SHIFT_KEY,
  Slider,
  Spinner,
  StatusDot,
  Switch,
  ThoughtLine,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@nexis/design";
import { Demo, Grid, Page, Row } from "../kit";

const STARTED = Date.now() - (3 * 60 + 12) * 1000;

export function ControlsPage() {
  const [targets, setTargets] = React.useState({ win: true, mac: false, linux: true });
  const all = targets.win && targets.mac && targets.linux;
  const some = targets.win || targets.mac || targets.linux;
  const [mode, setMode] = React.useState("balanced");
  const [range, setRange] = React.useState<"1h" | "24h" | "7d">("24h");
  const [vol, setVol] = React.useState([62]);
  const [busy, setBusy] = React.useState(false);

  return (
    <Page
      title="Controls"
      lede="Buttons, toggles, levels and status marks. One accent: brand marks the one action a surface exists to perform, the active item and live progress — never decoration."
    >
      <Demo title="Button" meta="variant × size">
        <Row label="Variants">
          <Button variant="brand">
            <Icon name="play" /> Run
            <KbdGroup className="ml-1 opacity-80">
              <Kbd className="bg-brand-foreground/15 text-brand-foreground">{fmtShortcut(MOD_KEY, "R")}</Kbd>
            </KbdGroup>
          </Button>
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">
            <Icon name="delete" /> Delete
          </Button>
          <Button variant="link">Link</Button>
          <Button variant="arrow">
            <span>Continue</span>
            <Icon name="arrow-right" data-slot="button-arrow" />
          </Button>
        </Row>
        <Row label="Sizes and icon buttons">
          <Button size="lg" variant="brand">
            Deploy
          </Button>
          <Button size="sm" variant="secondary">
            Small
          </Button>
          <Button size="xs" variant="outline">
            Extra small
          </Button>
          <Button size="icon" variant="ghost" aria-label="Refresh">
            <Icon name="refresh" size="md" />
          </Button>
          <Button size="icon-sm" variant="secondary" aria-label="Add">
            <Icon name="add" />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Search">
            <Icon name="search" />
          </Button>
          <Button size="icon-sm" variant="destructive" aria-label="Delete">
            <Icon name="delete" />
          </Button>
        </Row>
        <Row label="States">
          <Button variant="brand" disabled={busy} onClick={() => { setBusy(true); setTimeout(() => setBusy(false), 2400); }}>
            {busy ? <Spinner /> : <Icon name="upload" />}
            {busy ? "Publishing…" : "Publish"}
          </Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="outline" aria-expanded="true">
            Expanded
          </Button>
          <ButtonGroup>
            <Button variant="outline" size="sm">
              <Icon name="undo" /> Undo
            </Button>
            <Button variant="outline" size="sm">
              <Icon name="redo" /> Redo
            </Button>
          </ButtonGroup>
        </Row>
      </Demo>

      <Grid cols={2}>
        <Demo title="Toggles" meta="checkbox · radio · switch">
          <Row label="Checkbox">
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={all ? true : some ? "indeterminate" : false}
                  onCheckedChange={(v) => setTargets({ win: !!v, mac: !!v, linux: !!v })}
                />
                All targets
              </label>
              {([
                ["win", "x86_64-pc-windows-msvc"],
                ["mac", "aarch64-apple-darwin"],
                ["linux", "x86_64-unknown-linux-gnu"],
              ] as const).map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 pl-6 font-mono text-[12px]">
                  <Checkbox checked={targets[k]} onCheckedChange={(v) => setTargets({ ...targets, [k]: !!v })} />
                  {l}
                </label>
              ))}
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked disabled /> Locked option
              </label>
            </div>
          </Row>
          <Row label="Radio">
            <RadioGroup value={mode} onValueChange={setMode} className="flex gap-5">
              {["fast", "balanced", "thorough"].map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm capitalize">
                  <RadioGroupItem value={m} /> {m}
                </label>
              ))}
            </RadioGroup>
          </Row>
          <Row label="Switch">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <Switch id="sw1" defaultChecked />
                <Label htmlFor="sw1">Format on save</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="sw2" />
                <Label htmlFor="sw2">Telemetry (there is none)</Label>
              </div>
              <div className="flex items-center gap-3">
                <Switch id="sw3" size="sm" defaultChecked disabled />
                <Label htmlFor="sw3" className="text-muted-foreground">
                  Sealed (disabled)
                </Label>
              </div>
            </div>
          </Row>
        </Demo>

        <Demo title="Selection" meta="segmented · toggle group · slider">
          <Row label="Segmented — the pill travels">
            <Segmented
              label="Range"
              value={range}
              onChange={setRange}
              segments={[
                { id: "1h", label: "1H" },
                { id: "24h", label: "24H" },
                { id: "7d", label: "7D" },
              ]}
            />
            <Segmented
              label="View"
              value="grid"
              onChange={() => {}}
              segments={[
                { id: "grid", icon: "grid", label: "Grid" },
                { id: "list", icon: "list-bullet", label: "List" },
              ]}
            />
          </Row>
          <Row label="Toggle group">
            <ToggleGroup type="multiple" defaultValue={["bold"]} variant="outline">
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Icon name="format-bold" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Icon name="format-italic" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Underline">
                <Icon name="format-underline" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Toggle aria-label="Pin" defaultPressed>
              <Icon name="pin" /> Pinned
            </Toggle>
          </Row>
          <Row label={`Slider — ${vol[0]}%`}>
            <Slider value={vol} onValueChange={setVol} max={100} step={1} className="w-72" />
          </Row>
          <Row label="Range slider">
            <Slider defaultValue={[20, 70]} max={100} className="w-72" />
          </Row>
        </Demo>
      </Grid>

      <Grid cols={2}>
        <Demo title="Status" meta="badge · dot · kbd">
          <Row label="Badge tones — theme ANSI, not stock Tailwind">
            <Badge variant="brand">live</Badge>
            <Badge variant="secondary">idle</Badge>
            <Badge variant="success">ok</Badge>
            <Badge variant="warning">degraded</Badge>
            <Badge variant="destructive">fault</Badge>
            <Badge variant="info">queued</Badge>
            <Badge variant="outline">v1.31.0</Badge>
          </Row>
          <Row label="Status dot">
            <span className="flex items-center gap-2 text-sm"><StatusDot tone="success" /> Healthy</span>
            <span className="flex items-center gap-2 text-sm"><StatusDot tone="warning" /> Degraded</span>
            <span className="flex items-center gap-2 text-sm"><StatusDot tone="danger" /> Down</span>
            <span className="flex items-center gap-2 text-sm"><StatusDot tone="brand" live /> Streaming</span>
          </Row>
          <Row label="Keys">
            <KbdGroup>
              <Kbd>{MOD_KEY}</Kbd>
              <Kbd>{SHIFT_KEY}</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
            <span className="text-sm text-muted-foreground">command palette</span>
            <KbdHint label="Open with" keys={[MOD_KEY, "O"]} />
          </Row>
        </Demo>

        <Demo title="Levels" meta="meter · progress · activity">
          <div className="flex flex-col gap-2.5">
            <Meter label="cpu" value={0.49} />
            <Meter label="mem" value={0.76} />
            <Meter label="disk" value={0.14} />
            <Meter label="swap" value={0.97} />
          </div>
          <Row label="Progress">
            <Progress value={64} className="w-72" />
          </Row>
          <Row label="Activity">
            <span className="flex items-center gap-2 text-sm">
              <Spinner /> indexing
            </span>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <ThoughtLine width={36} /> thinking
            </span>
            <CallChip label="cargo build" startedAtMs={STARTED} onEnd={() => {}} />
          </Row>
        </Demo>
      </Grid>
    </Page>
  );
}
