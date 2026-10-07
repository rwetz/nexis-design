import type * as React from "react";
import { ChromePreviewContext, type IconName } from "@nexis/design";
import Console from "../templates/console";
import Dashboard from "../templates/dashboard";
import Explorer from "../templates/explorer";
import Minimal from "../templates/minimal";
import Settings from "../templates/settings";
import Wizard from "../templates/wizard";
import Workbench from "../templates/workbench";

export type AppId = "dashboard" | "workbench" | "settings" | "explorer" | "console" | "wizard" | "minimal";

// The gallery runs outside Tauri, so templates' `controls="auto"` would draw
// no window controls; the preview context shows them inert instead.
const wrap = (C: React.ComponentType) => () => (
  <ChromePreviewContext.Provider value={true}>
    <C />
  </ChromePreviewContext.Provider>
);

export const APPS: Record<AppId, { label: string; icon: IconName; component: React.ComponentType }> = {
  dashboard: { label: "Dashboard", icon: "activity", component: wrap(Dashboard) },
  workbench: { label: "Workbench", icon: "code", component: wrap(Workbench) },
  settings: { label: "Settings", icon: "settings", component: wrap(Settings) },
  explorer: { label: "Explorer", icon: "table", component: wrap(Explorer) },
  console: { label: "Console", icon: "terminal", component: wrap(Console) },
  wizard: { label: "Wizard", icon: "magic", component: wrap(Wizard) },
  minimal: { label: "Minimal", icon: "square", component: wrap(Minimal) },
};
