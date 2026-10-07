// @nexis/design — the design layer shared across the Nexis desktop apps.
//
// Ships TypeScript source rather than a build: every consumer is Vite + TS,
// so there is nothing a compile step would buy that the consumer's own
// bundler does not already do, and a build would add a publish pipeline to
// a dependency that is resolved straight from git.
//
// Stylesheets are NOT re-exported here — CSS is imported by path so the
// consumer chooses a variant explicitly:
//
//   import "@nexis/design/styles/globals.css";      // any app
//   import "@nexis/design/styles/globals.ide.css";  // + terminal / editor
//
// Every component is also importable on its own, shadcn-style:
//   import { Button } from "@nexis/design/ui/button";

// ── Theme ──────────────────────────────────────────────────────────────────
export * from "./theme";

// ── Icons: the single choke point. Never import the vendor directly. ──────
export { Icon, ICON_SIZE, ICON_NAMES, type IconName, type IconSize, type IconProps } from "./icon/icon";

// ── Chrome ─────────────────────────────────────────────────────────────────
export { TitleBar, ChromePreviewContext } from "./components/TitleBar";
export { StatusBar, StatusItem } from "./components/StatusBar";
export { WindowControls } from "./components/WindowControls";
export { WindowResizeEdges } from "./components/WindowResizeEdges";
/** @deprecated Renamed to match Nexis; now Linux-only, as it should be. */
export { WindowResizeEdges as ResizeHandles } from "./components/WindowResizeEdges";

// ── Motion moments ────────────────────────────────────────────────────────
export * from "./components/motion";

// ── Components ────────────────────────────────────────────────────────────
export * from "./components/ui/BranchedMenu";
export * from "./components/ui/CallChip";
export * from "./components/ui/ThoughtLine";
export * from "./components/ui/accordion";
export * from "./components/ui/alert-dialog";
export * from "./components/ui/alert";
export * from "./components/ui/avatar";
export * from "./components/ui/badge";
export * from "./components/ui/breadcrumb";
export * from "./components/ui/button-group";
export * from "./components/ui/button";
export * from "./components/ui/calendar";
export * from "./components/ui/card";
export * from "./components/ui/chart";
export * from "./components/ui/checkbox";
export * from "./components/ui/collapsible";
export * from "./components/ui/command-palette";
export * from "./components/ui/command";
export * from "./components/ui/context-menu";
export * from "./components/ui/data-table";
export * from "./components/ui/dialog";
export * from "./components/ui/dropdown-menu";
export * from "./components/ui/empty";
export * from "./components/ui/field";
export * from "./components/ui/gliding-tabs";
export * from "./components/ui/hover-card";
export * from "./components/ui/input-group";
export * from "./components/ui/input";
export * from "./components/ui/item";
export * from "./components/ui/kbd-hint";
export * from "./components/ui/kbd";
export * from "./components/ui/label";
export * from "./components/ui/menubar";
export * from "./components/ui/meter";
export * from "./components/ui/number-input";
export * from "./components/ui/pagination";
export * from "./components/ui/panel";
export * from "./components/ui/popover";
export * from "./components/ui/progress";
export * from "./components/ui/property-list";
export * from "./components/ui/radio-group";
export * from "./components/ui/rail-indicator";
export * from "./components/ui/resizable";
export * from "./components/ui/scroll-area";
export * from "./components/ui/scroll-fade";
export * from "./components/ui/segmented";
export * from "./components/ui/select";
export * from "./components/ui/separator";
export * from "./components/ui/sheet";
export * from "./components/ui/sidebar-nav";
export * from "./components/ui/skeleton";
export * from "./components/ui/slider";
export * from "./components/ui/sonner";
export * from "./components/ui/spinner";
export * from "./components/ui/stat";
export * from "./components/ui/status-dot";
export * from "./components/ui/steps";
export * from "./components/ui/switch";
export * from "./components/ui/tabs";
export * from "./components/ui/textarea";
export * from "./components/ui/timeline";
export * from "./components/ui/toggle-group";
export * from "./components/ui/toggle";
export * from "./components/ui/toolbar";
export * from "./components/ui/tooltip";
export * from "./components/ui/tree";
export * from "./components/ui/virtual-list";
export * from "./components/ui/use-gliding-rail";

// ── Lib ───────────────────────────────────────────────────────────────────
export * from "./lib/platform";
export { ease, dur, railSpring, useRailTransition, useReducedMotion, spring, tween } from "./lib/motion";
export { cn } from "./lib/utils";
export { formatElapsed } from "./lib/duration";
export * from "./lib/format";
export * from "./lib/sort";
export * from "./lib/fuzzy";
export * as dates from "./lib/date";
export type { CalendarDate } from "./lib/date";
export { readAppTokens, readTerminalTokens, resolveCssColor } from "./styles/tokens";
