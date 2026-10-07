// ╔══════════════════════════════════════╗
// ║  @nexis/design — app template        ║
// ║  wizard                              ║
// ╚══════════════════════════════════════╝
//
// Shape: a fixed, centred window · steps · validated pages · progress ·
// a done screen.
// Start here for: installers, onboarding, setup and export flows.
//
// Next is disabled until the page is valid, and the reason is shown under
// the field that blocks it — never a toast after the click. Back is always
// allowed and never loses what was typed.

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
} from "@nexis/design";

const STEPS = ["Workspace", "Preset", "Theme", "Install"];

const PRESETS: { id: string; name: string; icon: IconName; blurb: string }[] = [
  { id: "bare", name: "Bare bones", icon: "terminal", blurb: "Terminal and editor. Nothing else." },
  { id: "standard", name: "Standard", icon: "code", blurb: "Plus git, search and the AI panel." },
  { id: "everything", name: "Everything", icon: "layers", blurb: "Every pack: ML Lab, Atlas, Documents." },
];

export default function App() {
  const theme = useTheme();
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState("");
  const [path, setPath] = React.useState("~/code");
  const [preset, setPreset] = React.useState("standard");
  const [git, setGit] = React.useState(true);
  const [progress, setProgress] = React.useState(0);

  const nameError = name.length === 0 ? null : /^[a-z][a-z0-9-]{1,30}$/.test(name) ? null : "2–31 lowercase letters, digits or dashes.";
  const valid = [name.length > 0 && !nameError && path.length > 0, !!preset, true, progress >= 100][step];

  React.useEffect(() => {
    if (step !== 3 || progress >= 100) return;
    const id = setTimeout(() => setProgress((p) => Math.min(100, p + 7)), 120);
    return () => clearTimeout(id);
  }, [step, progress]);

  const done = step === 4;

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <TitleBar title="Set up Nexis" brand={<img src="./brand/nexis-logo.png" alt="" className="size-[18px]" />} />
      <div className="grid min-h-0 flex-1 place-items-center overflow-y-auto p-8">
        <div className="flex w-full max-w-xl flex-col gap-8">
          {!done && <Steps steps={STEPS} current={step} onSelect={(i) => i < step && setStep(i)} />}

          <div key={step} className="nexis-scene-enter flex min-h-[300px] flex-col gap-5">
            {step === 0 && (
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

            {step === 1 && (
              <>
                <Header title="Pick a preset" sub="Packs can be added or removed at any time from Settings." />
                <Stagger className="grid grid-cols-3 gap-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      data-no-rainbow
                      onClick={() => setPreset(p.id)}
                      className={cn(
                        "flex flex-col items-start gap-3 rounded-2xl p-4 text-left ring-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        preset === p.id ? "bg-brand/8 ring-brand" : "ring-border hover:bg-muted/60",
                      )}
                    >
                      <span className={cn("grid size-10 place-items-center rounded-xl", preset === p.id ? "bg-brand text-brand-foreground" : "bg-muted")}>
                        <Icon name={p.icon} size="lg" active={preset === p.id} />
                      </span>
                      <span className="text-sm font-medium">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.blurb}</span>
                    </button>
                  ))}
                </Stagger>
              </>
            )}

            {step === 2 && (
              <>
                <Header title="Choose a theme" sub="It applies now, so you can see it. Seventeen more in Settings." />
                <div className="grid grid-cols-3 gap-2">
                  {listNexisThemes()
                    .slice(0, 9)
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        data-no-rainbow
                        onClick={() => theme.setThemeId(t.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[13px] ring-1",
                          theme.themeId === t.id ? "bg-brand/10 ring-brand" : "ring-border hover:bg-muted",
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

            {step === 3 && (
              <>
                <Header title={progress < 100 ? "Installing…" : "Ready"} sub={`${preset} preset · ${name || "workspace"}`} />
                <Progress value={progress} />
                <div className="font-mono text-xs text-muted-foreground">
                  {progress < 30 ? "creating folders" : progress < 60 ? "fetching packs" : progress < 100 ? "writing settings" : "done"}
                  <span className="tabular-nums"> · {progress}%</span>
                </div>
              </>
            )}

            {done && (
              <ResultArrival className="flex flex-col items-center gap-4 rounded-3xl bg-card p-10 text-center ring-1 ring-border">
                <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
                  <Icon name="check" size="xl" />
                </span>
                <h2 className="font-heading text-2xl font-medium">{name || "Workspace"} is ready</h2>
                <p className="max-w-sm text-sm text-muted-foreground">Open it now, or find it later in the workspace switcher.</p>
                <Button variant="brand">
                  Open workspace <Icon name="arrow-right" />
                </Button>
              </ResultArrival>
            )}
          </div>

          {!done && (
            <div className="flex items-center justify-between">
              <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
                Back
              </Button>
              <Button variant="brand" disabled={!valid} onClick={() => setStep((s) => s + 1)}>
                {step === 3 ? "Finish" : "Next"}
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
      <h1 className="font-heading text-2xl font-medium tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
