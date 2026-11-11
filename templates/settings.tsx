// ╔══════════════════════════════════════╗
// ║  @nexis/design · app template        ║
// ║  settings                            ║
// ╚══════════════════════════════════════╝
//
// Shape: a nav of sections · settings pages of label-and-description rows
// (docs/RULES.md R4.2) · a draft that is saved or discarded as a whole · a
// confirm dialog for the destructive reset.
// Start here for: preferences windows, config tools, admin consoles.
//
// Appearance is wired to the real theme engine, and applies live: that is
// the one setting a user wants to *see* before committing, so it bypasses
// the draft on purpose. It includes Interface size (RULES R2.3), which every
// app's settings must have.
//
// One registry, `SETTINGS`, drives the nav, the "Find a setting" box and a
// palette command per setting, so the three never disagree (RULES R4.2). A
// search hit or a palette command opens the section and flashes the row.
// Save and Discard both offer Undo in their toast (R16.2); only Reset, which
// cannot be undone, asks first. With more than about eight sections, swap
// `SidebarNav` for `SettingsTree` and `settingsTreeNodes(SETTINGS)`.

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
  CommandPalette,
  Icon,
  cn,
  Input,
  INTERFACE_SCALES,
  interfaceScaleLabel,
  Kbd,
  KbdGroup,
  listBuiltinThemes,
  MOD_KEY,
  NumberInput,
  parseInterfaceSize,
  Segmented,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingRow,
  SettingsGroup,
  SettingsLayout,
  SettingsPage,
  SHIFT_KEY,
  SidebarNav,
  Switch,
  TitleBar,
  toast,
  useCommandPaletteShortcut,
  useTheme,
  WindowResizeEdges,
  findSettings,
  type IconName,
  locateSetting,
  type SettingsChapter,
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

/** What each draft field is called on screen. */
const FIELD_LABEL: Record<keyof Prefs, string> = {
  name: "Device name",
  autosave: "Autosave",
  restore: "Restore session",
  fontSize: "Font size",
  tabSize: "Tab size",
  wrap: "Word wrap",
  vim: "Vim mode",
  shell: "Shell",
  scrollback: "Scrollback",
};

const SECTION_ICON: Record<Section, IconName> = { general: "settings", appearance: "theme", editor: "code", terminal: "terminal", keys: "keyboard" };

/** Every setting, once. The nav, the search and the palette all read this. */
const SETTINGS: (SettingsChapter & { id: Section })[] = [
  {
    id: "general",
    label: "General",
    groups: [
      { id: "device", label: "This device", settings: [{ label: "Device name", keywords: ["computer", "network"] }, { label: "Autosave", keywords: ["save"] }, { label: "Restore session", keywords: ["tabs", "reopen"] }] },
      { id: "reset", label: "Reset", settings: [{ label: "Reset all settings", keywords: ["defaults", "factory"] }] },
    ],
  },
  {
    id: "appearance",
    label: "Appearance",
    groups: [{ id: "look", label: "Look", settings: [{ label: "Mode", keywords: ["dark", "light"] }, { label: "Theme", keywords: ["colours", "palette"] }, { label: "Interface size", keywords: ["zoom", "scale", "bigger"] }, { label: "High contrast", keywords: ["accessibility"] }] }],
  },
  {
    id: "editor",
    label: "Editor",
    groups: [{ id: "text", label: "Text", settings: [{ label: "Font size", keywords: ["zoom"] }, { label: "Tab size", keywords: ["indent", "spaces"] }, { label: "Word wrap", keywords: ["lines"] }, { label: "Vim mode", keywords: ["modal", "keys"] }] }],
  },
  {
    id: "terminal",
    label: "Terminal",
    groups: [{ id: "shell", label: "Shell", settings: [{ label: "Shell", keywords: ["bash", "zsh", "pwsh"] }, { label: "Scrollback", keywords: ["history", "lines"] }] }],
  },
  { id: "keys", label: "Keybindings", groups: [{ id: "keys", label: "Keys", settings: [{ label: "Keybindings", keywords: ["shortcuts", "hotkeys"] }] }] },
];

const KEYS: [string, string[]][] = [
  ["Command palette", [MOD_KEY, SHIFT_KEY, "P"]],
  ["Quick open", [MOD_KEY, "P"]],
  ["Toggle sidebar", [MOD_KEY, "B"]],
  ["New terminal", [MOD_KEY, "T"]],
  ["Split right", [MOD_KEY, "\\"]],
];

export default function App() {
  const theme = useTheme();
  const [section, setSection] = React.useState<Section>("general");
  const [query, setQuery] = React.useState("");
  const hits = findSettings(query, SETTINGS);

  /** Opens a setting's section, scrolls its row into view and flashes it. */
  const open = (label: string) => {
    const at = locateSetting(label, SETTINGS);
    if (!at) return;
    setSection(at.chapter.id as Section);
    setQuery("");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const row = document.querySelector<HTMLElement>(`[data-setting="${CSS.escape(at.setting?.label ?? "")}"]`);
        if (!row) return;
        row.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        row.removeAttribute("data-flash");
        void row.offsetWidth;
        row.setAttribute("data-flash", "");
      }),
    );
  };
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
      <SettingsLayout
        nav={
          <div className="flex h-full w-56 shrink-0 flex-col bg-sidebar">
            <div className="p-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && hits[0]) open(hits[0].setting.label);
                  if (e.key === "Escape") setQuery("");
                }}
                placeholder="Find a setting"
                aria-label="Find a setting"
                className="h-8"
              />
            </div>
            {query.trim() ? (
              <div role="listbox" aria-label="Matching settings" className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-2 pb-2 nexis-scrollbar">
                {hits.length === 0 && <p className="px-3 py-2 text-ui text-muted-foreground">No setting matches.</p>}
                {hits.map((h, i) => (
                  <button
                    key={h.setting.label}
                    type="button"
                    role="option"
                    aria-selected={i === 0}
                    onClick={() => open(h.setting.label)}
                    className={cn("flex h-8 shrink-0 items-center gap-2 rounded-[10px] px-3 text-left text-body outline-none hover:bg-sidebar-accent/70 focus-visible:ring-2 focus-visible:ring-ring/40", i === 0 && "bg-sidebar-accent/70")}
                  >
                    <span className="min-w-0 flex-1 truncate">{h.setting.label}</span>
                    <span className="shrink-0 text-caption text-muted-foreground">{h.chapter.label}</span>
                  </button>
                ))}
              </div>
            ) : (
              <SidebarNav
                label="Settings"
                value={section}
                onChange={setSection}
                className="min-h-0 w-full flex-1"
                sections={[{ items: SETTINGS.map((c) => ({ id: c.id, label: c.label, icon: SECTION_ICON[c.id] })) }]}
              />
            )}
          </div>
        }
        footer={
          dirty.length > 0 && (
            <footer className="nexis-scene-enter flex h-14 shrink-0 items-center gap-3 border-t border-border/60 bg-sidebar/60 px-page">
              <span className="size-2 rounded-full bg-foreground/60" />
              <span className="text-sm">
                {dirty.length} unsaved {dirty.length === 1 ? "change" : "changes"}
              </span>
              <span className="truncate text-ui text-muted-foreground">{dirty.map((k) => FIELD_LABEL[k]).join(", ")}</span>
              <span className="flex-1" />
              <Button
                variant="ghost"
                onClick={() => {
                  const was = draft;
                  setDraft(saved);
                  toast(`Discarded ${dirty.length} ${dirty.length === 1 ? "change" : "changes"}`, { action: { label: "Undo", onClick: () => setDraft(was) } });
                }}
              >
                Discard
              </Button>
              <Button
                variant="brand"
                onClick={() => {
                  const before = saved;
                  setSaved(draft);
                  toast.success(`Saved ${dirty.length} ${dirty.length === 1 ? "change" : "changes"}`, {
                    action: { label: "Undo", onClick: () => setSaved(before) },
                  });
                }}
              >
                Save
              </Button>
            </footer>
          )
        }
      >
        {section === "general" && (
          <SettingsPage key="general" title="General" description="This device and how sessions start.">
            <SettingsGroup>
              <SettingRow data-setting="Device name" label="Device name" description="Shown to other devices on your network." htmlFor="device" align="stretch">
                <Input id="device" value={draft.name} onChange={(e) => set("name", e.target.value)} />
              </SettingRow>
              <SettingRow data-setting="Autosave" label="Autosave" description="Save files when focus leaves the editor." htmlFor="autosave">
                <Switch id="autosave" checked={draft.autosave} onCheckedChange={(v) => set("autosave", v)} />
              </SettingRow>
              <SettingRow data-setting="Restore session" label="Restore session" description="Reopen tabs and splits from last time." htmlFor="restore">
                <Switch id="restore" checked={draft.restore} onCheckedChange={(v) => set("restore", v)} />
              </SettingRow>
            </SettingsGroup>
            <SettingsGroup title="Reset">
              <SettingRow data-setting="Reset all settings" label="Reset all settings" description="Every preference goes back to its default, themes and keys too.">
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
                          toast("Every setting is back to its default");
                        }}
                      >
                        Reset
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </SettingRow>
            </SettingsGroup>
          </SettingsPage>
        )}

        {section === "appearance" && (
          <SettingsPage key="appearance" title="Appearance" description="How the app looks. Changes here apply immediately.">
            <SettingsGroup>
              <SettingRow data-setting="Mode" label="Mode" description="Follow the system, or always light or dark.">
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
              </SettingRow>
              <SettingRow data-setting="Theme" label="Theme" description="The palette for the whole app." htmlFor="theme" align="stretch">
                <Select value={theme.themeId} onValueChange={theme.setThemeId}>
                  <SelectTrigger id="theme" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {listBuiltinThemes().map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        <span
                          aria-hidden
                          className="size-2.5 shrink-0 rounded-full"
                          style={{
                            background: t.variants[theme.resolvedMode]?.colors?.ring ?? t.variants[theme.resolvedMode]?.colors?.primary ?? "var(--brand)",
                          }}
                        />
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow
                data-setting="Interface size"
                label="Interface size"
                description={`Auto follows the window's width (now ${interfaceScaleLabel(theme.interfaceScale)}). ${MOD_KEY}+= and ${MOD_KEY}+- step it, ${MOD_KEY}+0 resets.`}
              >
                <Segmented
                  label="Interface size"
                  value={String(theme.interfaceSize)}
                  onChange={(v) => theme.setInterfaceSize(parseInterfaceSize(v))}
                  segments={[{ id: "auto", label: "Auto" }, ...INTERFACE_SCALES.map((s) => ({ id: String(s), label: interfaceScaleLabel(s) }))]}
                />
              </SettingRow>
              <SettingRow data-setting="High contrast" label="High contrast" description="On top of any theme. Follows the OS under System." htmlFor="contrast" align="stretch">
                <Select value={theme.contrast} onValueChange={(v) => theme.setContrast(v as typeof theme.contrast)}>
                  <SelectTrigger id="contrast" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="standard">Off</SelectItem>
                    <SelectItem value="high">On</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </SettingsGroup>
          </SettingsPage>
        )}

        {section === "editor" && (
          <SettingsPage key="editor" title="Editor">
            <SettingsGroup>
              <SettingRow data-setting="Font size" label="Font size" description="The code font, in pixels at 100%." htmlFor="font-size">
                <NumberInput id="font-size" value={draft.fontSize} onChange={(v) => set("fontSize", v)} min={8} max={32} suffix="px" className="w-32" />
              </SettingRow>
              <SettingRow data-setting="Tab size" label="Tab size" description="Spaces per indent.">
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
              </SettingRow>
              <SettingRow data-setting="Word wrap" label="Word wrap" description="Wrap long lines at the window's edge." htmlFor="wrap">
                <Switch id="wrap" checked={draft.wrap} onCheckedChange={(v) => set("wrap", v)} />
              </SettingRow>
              <SettingRow data-setting="Vim mode" label="Vim mode" description="Modal editing with Vim's keys." htmlFor="vim">
                <Switch id="vim" checked={draft.vim} onCheckedChange={(v) => set("vim", v)} />
              </SettingRow>
            </SettingsGroup>
          </SettingsPage>
        )}

        {section === "terminal" && (
          <SettingsPage key="terminal" title="Terminal">
            <SettingsGroup>
              <SettingRow data-setting="Shell" label="Shell" description="Started in every new terminal." htmlFor="shell" align="stretch">
                <Select value={draft.shell} onValueChange={(v) => set("shell", v)}>
                  <SelectTrigger id="shell" className="w-full">
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
              </SettingRow>
              <SettingRow data-setting="Scrollback" label="Scrollback" description="Lines kept per terminal." htmlFor="scrollback">
                <NumberInput id="scrollback" value={draft.scrollback} onChange={(v) => set("scrollback", v)} min={1000} max={100000} step={1000} className="w-40" />
              </SettingRow>
            </SettingsGroup>
          </SettingsPage>
        )}

        {section === "keys" && (
          <SettingsPage key="keys" title="Keybindings">
            <SettingsGroup>
              {KEYS.map(([label, keys]) => (
                <SettingRow key={label} data-setting={label} label={label}>
                  <KbdGroup>
                    {keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </KbdGroup>
                </SettingRow>
              ))}
            </SettingsGroup>
          </SettingsPage>
        )}
      </SettingsLayout>
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        commands={[
          ...SETTINGS.map((c) => ({ id: c.id, label: c.label, group: "Sections", icon: SECTION_ICON[c.id], run: () => setSection(c.id) })),
          ...SETTINGS.flatMap((c) =>
            c.groups.flatMap((g) =>
              g.settings.map((st) => ({
                id: `setting-${st.label}`,
                label: st.label,
                group: "Settings",
                icon: SECTION_ICON[c.id],
                keywords: [c.label, g.label, ...(st.keywords ?? [])],
                run: () => open(st.label),
              })),
            ),
          ),
        ]}
      />
    </div>
  );
}
