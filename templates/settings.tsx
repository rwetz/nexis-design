// ╔══════════════════════════════════════╗
// ║  @nexis/design — app template        ║
// ║  settings                            ║
// ╚══════════════════════════════════════╝
//
// Shape: sidebar of sections · labelled inline fields · a draft that is
// saved or discarded as a whole · a confirm dialog for the destructive reset.
// Start here for: preferences windows, config tools, admin consoles.
//
// Appearance is wired to the real theme engine, and applies live — that is
// the one setting a user wants to *see* before committing, so it bypasses
// the draft on purpose.

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  cn,
  CommandPalette,
  Field,
  Icon,
  Input,
  Kbd,
  KbdGroup,
  listBuiltinThemes,
  MOD_KEY,
  NumberInput,
  SectionLabel,
  Segmented,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SHIFT_KEY,
  SidebarNav,
  Switch,
  TitleBar,
  toast,
  useCommandPaletteShortcut,
  useTheme,
  WindowResizeEdges,
} from "@nexis/design";

type Prefs = {
  name: string;
  autosave: boolean;
  restore: boolean;
  fontSize: number;
  tabSize: number;
  wrap: boolean;
  vim: boolean;
  shell: string;
  scrollback: number;
};

const DEFAULTS: Prefs = {
  name: "Ryan's MacBook",
  autosave: true,
  restore: true,
  fontSize: 13,
  tabSize: 2,
  wrap: false,
  vim: false,
  shell: "zsh",
  scrollback: 10000,
};

type Section = "general" | "appearance" | "editor" | "terminal" | "keys";

export default function App() {
  const theme = useTheme();
  const [section, setSection] = React.useState<Section>("general");
  const [saved, setSaved] = React.useState<Prefs>(DEFAULTS);
  const [draft, setDraft] = React.useState<Prefs>({ ...DEFAULTS, fontSize: 14, wrap: true });
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  useCommandPaletteShortcut(() => setPaletteOpen((o) => !o));

  const dirty = (Object.keys(draft) as (keyof Prefs)[]).filter((k) => draft[k] !== saved[k]);
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="flex h-full flex-col bg-background text-foreground">
      <WindowResizeEdges />
      <TitleBar title="Settings" brand={<Icon name="settings" className="text-muted-foreground" />} />
      <div className="flex min-h-0 flex-1">
        <SidebarNav
          label="Settings"
          value={section}
          onChange={setSection}
          sections={[
            {
              items: [
                { id: "general", label: "General", icon: "settings" },
                { id: "appearance", label: "Appearance", icon: "theme" },
                { id: "editor", label: "Editor", icon: "code" },
                { id: "terminal", label: "Terminal", icon: "terminal" },
                { id: "keys", label: "Keybindings", icon: "keyboard" },
              ],
            },
          ]}
        />
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto nexis-scrollbar">
            <div key={section} className="nexis-scene-enter mx-auto flex max-w-3xl flex-col gap-6 px-10 py-8">
              <h1 className="font-heading text-2xl font-medium tracking-tight capitalize">{section === "keys" ? "Keybindings" : section}</h1>

              {section === "general" && (
                <>
                  <Field label="Device name" inline hint="Shown to other devices on your network.">
                    <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
                  </Field>
                  <Field label="Autosave" inline hint="Save files when focus leaves the editor.">
                    <div className="pt-1.5">
                      <Switch checked={draft.autosave} onCheckedChange={(v) => set("autosave", v)} />
                    </div>
                  </Field>
                  <Field label="Restore session" inline hint="Reopen tabs and splits from last time.">
                    <div className="pt-1.5">
                      <Switch checked={draft.restore} onCheckedChange={(v) => set("restore", v)} />
                    </div>
                  </Field>
                  <SectionLabel className="mt-4">Danger zone</SectionLabel>
                  <div className="flex items-center justify-between rounded-2xl p-4 ring-1 ring-destructive/30">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">Reset all settings</span>
                      <span className="text-xs text-muted-foreground">Every preference goes back to its default. Themes and keys too.</span>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          Reset…
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reset every setting?</AlertDialogTitle>
                          <AlertDialogDescription>This cannot be undone. Your files are not affected.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep my settings</AlertDialogCancel>
                          <AlertDialogAction
                            variant="destructive"
                            onClick={() => {
                              setSaved(DEFAULTS);
                              setDraft(DEFAULTS);
                              toast("Settings reset");
                            }}
                          >
                            Reset
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}

              {section === "appearance" && (
                <>
                  <Field label="Mode" inline>
                    <Segmented
                      label="Mode"
                      value={theme.mode}
                      onChange={theme.setMode}
                      segments={[
                        { id: "light", label: "Light", icon: "theme-light" },
                        { id: "dark", label: "Dark", icon: "theme-dark" },
                        { id: "system", label: "System", icon: "computer" },
                      ]}
                    />
                  </Field>
                  <Field label="Theme" inline hint="Applies immediately.">
                    <div className="grid grid-cols-3 gap-2">
                      {listBuiltinThemes()
                        .slice(0, 12)
                        .map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            data-no-rainbow
                            onClick={() => theme.setThemeId(t.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] ring-1 transition-colors",
                              theme.themeId === t.id ? "bg-brand/10 ring-brand" : "ring-border hover:bg-muted",
                            )}
                          >
                            <span
                              className="size-3 rounded-full"
                              style={{
                                background:
                                  t.variants[theme.resolvedMode]?.colors?.ring ?? t.variants[theme.resolvedMode]?.colors?.primary ?? "var(--brand)",
                              }}
                            />
                            <span className="truncate">{t.name}</span>
                          </button>
                        ))}
                    </div>
                  </Field>
                  <Field label="High contrast" inline hint="On top of any theme. Follows the OS under System.">
                    <Select value={theme.contrast} onValueChange={(v) => theme.setContrast(v as typeof theme.contrast)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="standard">Off</SelectItem>
                        <SelectItem value="high">On</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                </>
              )}

              {section === "editor" && (
                <>
                  <Field label="Font size" inline>
                    <NumberInput value={draft.fontSize} onChange={(v) => set("fontSize", v)} min={8} max={32} suffix="px" className="w-32" />
                  </Field>
                  <Field label="Tab size" inline>
                    <Segmented
                      label="Tab size"
                      value={String(draft.tabSize) as "2" | "4" | "8"}
                      onChange={(v) => set("tabSize", Number(v))}
                      segments={[
                        { id: "2", label: "2" },
                        { id: "4", label: "4" },
                        { id: "8", label: "8" },
                      ]}
                    />
                  </Field>
                  <Field label="Word wrap" inline>
                    <div className="pt-1.5">
                      <Switch checked={draft.wrap} onCheckedChange={(v) => set("wrap", v)} />
                    </div>
                  </Field>
                  <Field label="Vim mode" inline>
                    <div className="pt-1.5">
                      <Switch checked={draft.vim} onCheckedChange={(v) => set("vim", v)} />
                    </div>
                  </Field>
                </>
              )}

              {section === "terminal" && (
                <>
                  <Field label="Shell" inline>
                    <Select value={draft.shell} onValueChange={(v) => set("shell", v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["zsh", "bash", "fish", "pwsh", "nu"].map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Scrollback" inline hint="Lines kept per terminal.">
                    <NumberInput value={draft.scrollback} onChange={(v) => set("scrollback", v)} min={1000} max={100000} step={1000} className="w-40" />
                  </Field>
                </>
              )}

              {section === "keys" && (
                <div className="flex flex-col divide-y divide-border/60">
                  {[
                    ["Command palette", [MOD_KEY, SHIFT_KEY, "P"]],
                    ["Quick open", [MOD_KEY, "P"]],
                    ["Toggle sidebar", [MOD_KEY, "B"]],
                    ["New terminal", [MOD_KEY, "T"]],
                    ["Split right", [MOD_KEY, "\\"]],
                  ].map(([label, keys]) => (
                    <div key={label as string} className="flex items-center justify-between py-2.5 text-sm">
                      {label}
                      <KbdGroup>
                        {(keys as string[]).map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </KbdGroup>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {dirty.length > 0 && (
            <footer className="nexis-scene-enter flex h-14 shrink-0 items-center gap-3 border-t border-border/60 bg-sidebar/60 px-10">
              <span className="size-2 rounded-full bg-brand" />
              <span className="text-sm">
                {dirty.length} unsaved {dirty.length === 1 ? "change" : "changes"}
              </span>
              <span className="text-xs text-muted-foreground">{dirty.join(", ")}</span>
              <span className="flex-1" />
              <Button variant="ghost" onClick={() => setDraft(saved)}>
                Discard
              </Button>
              <Button
                variant="brand"
                onClick={() => {
                  setSaved(draft);
                  toast.success("Settings saved");
                }}
              >
                Save
              </Button>
            </footer>
          )}
        </main>
      </div>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={(["general", "appearance", "editor", "terminal", "keys"] as Section[]).map((s) => ({
          id: s,
          label: `Settings: ${s}`,
          group: "Sections",
          icon: "settings" as const,
          run: () => setSection(s),
        }))}
      />
    </div>
  );
}
