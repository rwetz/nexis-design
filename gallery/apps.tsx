import type * as React from "react";
import { ChromePreviewContext, type IconName } from "@nexis/design";
import Console from "../templates/console";
import Dashboard from "../templates/dashboard";
import Explorer from "../templates/explorer";
import Launcher from "../templates/launcher";
import Minimal from "../templates/minimal";
import Settings from "../templates/settings";
import Wizard from "../templates/wizard";
import Workbench from "../templates/workbench";

export type AppId = "dashboard" | "workbench" | "settings" | "settings-deep" | "explorer" | "console" | "wizard" | "launcher" | "minimal";

// The gallery runs outside Tauri, so templates' `controls="auto"` would draw
// no window controls; the preview context shows them inert instead.
const wrap = (C: React.ComponentType) => () => (
  <ChromePreviewContext.Provider value={true}>
    <C />
  </ChromePreviewContext.Provider>
);

export const APPS: Record<AppId, { label: string; icon: IconName; component: React.ComponentType }> = {
  dashboard: { label: "Dashboard", icon: "activity", component: wrap(() => <Dashboard live={!new URLSearchParams(location.search).has("still")} />) },
  workbench: { label: "Workbench", icon: "code", component: wrap(Workbench) },
  settings: { label: "Settings", icon: "settings", component: wrap(Settings) },
  "settings-deep": { label: "Deep settings", icon: "settings", component: wrap(() => <Settings deep />) },
  explorer: { label: "Explorer", icon: "table", component: wrap(Explorer) },
  console: { label: "Console", icon: "terminal", component: wrap(() => <Console live={!new URLSearchParams(location.search).has("still")} />) },
  wizard: { label: "Wizard", icon: "magic", component: wrap(Wizard) },
  launcher: { label: "Launcher", icon: "play", component: wrap(Launcher) },
  minimal: { label: "Minimal", icon: "square", component: wrap(Minimal) },
};
