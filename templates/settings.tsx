// ╔══════════════════════════════════════╗
// ║  @nexis/design — app template        ║
// ║  settings                            ║
// ╚══════════════════════════════════════╝
//
// Shape: a nav of sections · settings pages of label-and-description rows
// (docs/RULES.md R4.2) · a draft that is saved or discarded as a whole · a
// confirm dialog for the destructive reset.
// Start here for: preferences windows, config tools, admin consoles.
//
// Appearance is wired to the real theme engine, and applies live — that is
// the one setting a user wants to *see* before committing, so it bypasses
// the draft on purpose. It includes Interface size (RULES R2.3), which every
// app's settings must have.

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
        }
        footer={
          dirty.length > 0 && (
            <footer className="nexis-scene-enter flex h-14 shrink-0 items-center gap-3 border-t border-border/60 bg-sidebar/60 px-page">
              <span className="size-2 rounded-full bg-foreground/60" />
              <span className="text-sm">
                {dirty.length} unsaved {dirty.length === 1 ? "change" : "changes"}
              </span>
              <span className="truncate text-ui text-muted-foreground">{dirty.join(", ")}</span>
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
          )
        }
      >
        {section === "general" && (
          <SettingsPage key="general" title="General" description="This device and how sessions start.">
            <SettingsGroup>
              <SettingRow label="Device name" description="Shown to other devices on your network." htmlFor="device" align="stretch">
                <Input id="device" value={draft.name} onChange={(e) => set("name", e.target.value)} />
              </SettingRow>
              <SettingRow label="Autosave" description="Save files when focus leaves the editor." htmlFor="autosave">
                <Switch id="autosave" checked={draft.autosave} onCheckedChange={(v) => set("autosave", v)} />
              </SettingRow>
              <SettingRow label="Restore session" description="Reopen tabs and splits from last time." htmlFor="restore">
                <Switch id="restore" checked={draft.restore} onCheckedChange={(v) => set("restore", v)} />
              </SettingRow>
            </SettingsGroup>
            <SettingsGroup title="Reset">
              <SettingRow label="Reset all settings" description="Every preference goes back to its default, themes and keys too.">
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
              </SettingRow>
            </SettingsGroup>
          </SettingsPage>
        )}

        {section === "appearance" && (
          <SettingsPage key="appearance" title="Appearance" description="How the app looks. Changes here apply immediately.">
            <SettingsGroup>
              <SettingRow label="Mode" description="Follow the system, or always light or dark.">
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
              <SettingRow label="Theme" description="The palette for the whole app." htmlFor="theme" align="stretch">
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
              <SettingRow label="High contrast" description="On top of any theme. Follows the OS under System." htmlFor="contrast" align="stretch">
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
              <SettingRow label="Font size" description="The code font, in pixels at 100%." htmlFor="font-size">
                <NumberInput id="font-size" value={draft.fontSize} onChange={(v) => set("fontSize", v)} min={8} max={32} suffix="px" className="w-32" />
              </SettingRow>
              <SettingRow label="Tab size" description="Spaces per indent.">
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
              <SettingRow label="Word wrap" description="Wrap long lines at the window's edge." htmlFor="wrap">
                <Switch id="wrap" checked={draft.wrap} onCheckedChange={(v) => set("wrap", v)} />
              </SettingRow>
              <SettingRow label="Vim mode" description="Modal editing with Vim's keys." htmlFor="vim">
                <Switch id="vim" checked={draft.vim} onCheckedChange={(v) => set("vim", v)} />
              </SettingRow>
            </SettingsGroup>
          </SettingsPage>
        )}

        {section === "terminal" && (
          <SettingsPage key="terminal" title="Terminal">
            <SettingsGroup>
              <SettingRow label="Shell" description="Started in every new terminal." htmlFor="shell" align="stretch">
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
              <SettingRow label="Scrollback" description="Lines kept per terminal." htmlFor="scrollback">
                <NumberInput id="scrollback" value={draft.scrollback} onChange={(v) => set("scrollback", v)} min={1000} max={100000} step={1000} className="w-40" />
              </SettingRow>
            </SettingsGroup>
          </SettingsPage>
        )}

        {section === "keys" && (
          <SettingsPage key="keys" title="Keybindings">
            <SettingsGroup>
              {KEYS.map(([label, keys]) => (
                <SettingRow key={label} label={label}>
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
