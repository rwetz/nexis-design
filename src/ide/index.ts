// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { EditorView } from "@codemirror/view";

export { buildTerminalTheme } from "./terminalTheme";

/** Editor chrome that follows live CSS tokens. Reconfigure on mode changes to
 * update CodeMirror's dark facet. Language highlighting is composable. */
export function buildCodeMirrorTheme(mode: "light" | "dark") {
  return EditorView.theme({
    "&": { color: "var(--foreground)", backgroundColor: "var(--background)" },
    ".cm-content": { caretColor: "var(--terminal-cursor)" },
    "&.cm-focused .cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--terminal-cursor)" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection": {
      backgroundColor: "var(--terminal-selection)",
    },
    ".cm-gutters": {
      backgroundColor: "var(--background)",
      color: "var(--muted-foreground)",
      borderRight: "1px solid var(--border)",
    },
    ".cm-activeLine, .cm-activeLineGutter": { backgroundColor: "var(--muted)" },
    ".cm-panels, .cm-tooltip": { backgroundColor: "var(--popover)", color: "var(--popover-foreground)" },
  }, { dark: mode === "dark" });
}
