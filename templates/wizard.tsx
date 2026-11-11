// ╔══════════════════════════════════════╗
// ║  @nexis/design · app template        ║
// ║  wizard                              ║
// ╚══════════════════════════════════════╝
//
// Shape: a fixed, centred window · steps · validated pages · progress ·
// a done screen.
// Start here for: installers, onboarding, setup and export flows.
//
// Next is disabled until the page is valid, and the reason is shown under
// the field that blocks it, never a toast after the click. Back is allowed
// on every form page and never loses what was typed; once the install
// starts there is no going back (RULES R14.2: the phase is one value).
//
// The flow is one explicit state, `Phase`: a form page, installing (with its
// progress), or done. Which step the `Steps` bar shows, which buttons exist
// and what Next does are all read from it, so "installing on the theme
// page" or "done at 40%" cannot be written down.

import * as React from "react";
import {
  Button,
  cn,
  Field,
  Icon,
  type IconName,
  Input,
  listNexisThemes,
  Progress,
  ResultArrival,
  Stagger,
  Steps,
  Switch,
  TitleBar,
  useTheme,
  NexisMark,
} from "@nexis/design";

const STEPS = ["Workspace", "Preset", "Theme", "Install"];
const PAGES = ["workspace", "preset", "theme"] as const;
type Page = (typeof PAGES)[number];

type Phase =
  | { kind: "form"; page: Page }
  | { kind: "installing"; progress: number }
  | { kind: "done" };

/** The step the `Steps` bar shows for a phase. */
const stepOf = (p: Phase) => (p.kind === "form" ? PAGES.indexOf(p.page) : p.kind === "installing" ? 3 : 4);

const PRESETS: { id: string; name: string; icon: IconName; blurb: string }[] = [
  { id: "bare", name: "Bare bones", icon: "terminal", blurb: "Terminal and editor. Nothing else." },
  { id: "standard", name: "Standard", icon: "code", blurb: "Plus git, search and the AI panel." },
  { id: "everything", name: "Everything", icon: "layers", blurb: "Every pack: ML Lab, Atlas, Documents." },
];

export default function App() {
  const theme = useTheme();
  const [phase, setPhase] = React.useState<Phase>({ kind: "form", page: "workspace" });
  const [name, setName] = React.useState("");
  const [path, setPath] = React.useState("~/code");
  const [preset, setPreset] = React.useState("standard");
  const [git, setGit] = React.useState(true);

  const nameError = name.length === 0 ? null : /^[a-z][a-z0-9-]{1,30}$/.test(name) ? null : "2–31 lowercase letters, digits or dashes.";
  const pageValid: Record<Page, boolean> = { workspace: name.length > 0 && !nameError && path.length > 0, preset: !!preset, theme: true };

  // The fixture install: replace with the real job's progress events.
  const progress = phase.kind === "installing" ? phase.progress : null;
  React.useEffect(() => {
    if (progress === null || progress >= 100) return;
    const id = setTimeout(() => setPhase({ kind: "installing", progress: Math.min(100, progress + 7) }), 120);
    return () => clearTimeout(id);
  }, [progress]);

  // Every transition, in one place.
  const next = () =>
    setPhase((p) => {
      if (p.kind === "form") {
        const i = PAGES.indexOf(p.page);
        return i < PAGES.length - 1 ? { kind: "form", page: PAGES[i + 1] } : { kind: "installing", progress: 0 };
      }
      if (p.kind === "installing" && p.progress >= 100) return { kind: "done" };
      return p;
    });
  const back = () => setPhase((p) => (p.kind === "form" && p.page !== "workspace" ? { kind: "form", page: PAGES[PAGES.indexOf(p.page) - 1] } : p));
  const goTo = (i: number) => setPhase((p) => (p.kind === "form" && i < PAGES.indexOf(p.page) ? { kind: "form", page: PAGES[i] } : p));

  const step = stepOf(phase);
  const canNext = phase.kind === "form" ? pageValid[phase.page] : phase.kind === "installing" && phase.progress >= 100;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <TitleBar title="Set up Nexis" brand={<NexisMark className="size-[18px]" />} />
      <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto p-8">
        <div className="flex w-full max-w-xl flex-col gap-8">
          {phase.kind !== "done" && <Steps steps={STEPS} current={step} onSelect={goTo} />}

          <div key={step} className="nexis-scene-enter flex min-h-[300px] flex-col gap-5">
            {phase.kind === "form" && phase.page === "workspace" && (
              <>
                <Header title="Name your workspace" sub="You can rename it later. It is used for the folder and the window title." />
                <Field label="Name" required error={nameError} hint="Lowercase, digits and dashes.">
                  <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="nexis-pulse" />
                </Field>
                <Field label="Location">
                  <Input value={path} onChange={(e) => setPath(e.target.value)} className="font-mono" />
                </Field>
                <label className="flex items-center gap-3 text-sm">
                  <Switch checked={git} onCheckedChange={setGit} /> Initialise a git repository
                </label>
              </>
            )}

            {phase.kind === "form" && phase.page === "preset" && (
              <>
                <Header title="Pick a preset" sub="Packs can be added or removed at any time from Settings." />
                <Stagger className="grid grid-cols-3 gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPreset(p.id)}
                      className={cn(
                        "flex flex-col items-start gap-3 rounded-2xl p-4 text-left ring-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        preset === p.id ? "bg-muted ring-2 ring-foreground/60" : "ring-border hover:bg-muted/60",
                      )}
                    >
                      <span className={cn("grid size-10 place-items-center rounded-xl", preset === p.id ? "bg-foreground text-background" : "bg-muted")}>
                        <Icon name={p.icon} size="lg" active={preset === p.id} />
                      </span>
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-ui text-muted-foreground">{p.blurb}</span>
                    </button>
                  ))}
                </Stagger>
              </>
            )}

            {phase.kind === "form" && phase.page === "theme" && (
              <>
                <Header title="Choose a theme" sub="It applies now, so you can see it. Seventeen more in Settings." />
                <div className="grid grid-cols-3 gap-2">
                  {listNexisThemes()
                    .slice(0, 9)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => theme.setThemeId(t.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3 py-3 text-left text-body ring-1",
                          theme.themeId === t.id ? "bg-muted ring-2 ring-foreground/60" : "ring-border hover:bg-muted",
                        )}
                      >
                        <span
                          className="size-3.5 rounded-full"
                          style={{ background: t.variants[theme.resolvedMode]?.colors?.ring ?? "oklch(0.72 0.15 35)" }}
                        />
                        {t.name}
                      </button>
                    ))}
                </div>
              </>
            )}

            {phase.kind === "installing" && (
              <>
                <Header title={phase.progress < 100 ? "Installing…" : "Ready"} sub={`${preset} preset · ${name || "workspace"}`} />
                <Progress value={phase.progress} />
                <div className="text-ui text-muted-foreground">
                  {phase.progress < 30 ? "creating folders" : phase.progress < 60 ? "fetching packs" : phase.progress < 100 ? "writing settings" : "done"}
                  <span className="tabular-nums"> · {phase.progress}%</span>
                </div>
              </>
            )}

            {phase.kind === "done" && (
              <ResultArrival className="flex flex-col items-center gap-4 rounded-3xl bg-card p-10 text-center ring-1 ring-border">
                <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
                  <Icon name="check" size="xl" />
                </span>
                <h2 className="text-2xl font-semibold tracking-tight">{name || "Workspace"} is ready</h2>
                <p className="max-w-sm text-sm text-muted-foreground">Open it now, or find it later in the workspace switcher.</p>
                <Button variant="brand">
                  Open workspace <Icon name="arrow-right" />
                </Button>
              </ResultArrival>
            )}
          </div>

          {phase.kind !== "done" && (
            <div className="flex items-center justify-between">
              <Button variant="ghost" disabled={phase.kind !== "form" || phase.page === "workspace"} onClick={back}>
                Back
              </Button>
              <Button variant="brand" disabled={!canNext} onClick={next}>
                {phase.kind === "installing" ? "Finish" : "Next"}
                <Icon name="arrow-right" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
