import { describe, expect, it } from "vitest";
import { deltaTone } from "../src/components/ui/stat";
import { meterTone } from "../src/components/ui/meter";
import { pageWindow } from "../src/components/ui/pagination";
import { clampStep } from "../src/components/ui/number-input";
import { flattenTree, type TreeNode } from "../src/components/ui/tree";
import { niceMax } from "../src/components/ui/chart";
import { initials } from "../src/components/ui/avatar";
import { rankCommands, type PaletteCommand } from "../src/components/ui/command-palette";
import * as D from "../src/lib/date";
import { fuzzyFilter, fuzzyMatch } from "../src/lib/fuzzy";
import { compareValues, nextSort, sortRows } from "../src/lib/sort";
import { formatBytes, formatCompact, formatDelta } from "../src/lib/format";
import { formatElapsed } from "../src/lib/duration";

describe("dates", () => {
  it("clamps month arithmetic instead of overflowing", () => {
    expect(D.addMonths(D.date(2026, 1, 31), 1)).toEqual(D.date(2026, 2, 28));
    expect(D.addMonths(D.date(2024, 1, 31), 1)).toEqual(D.date(2024, 2, 29));
    expect(D.addMonths(D.date(2026, 12, 15), 1)).toEqual(D.date(2027, 1, 15));
    expect(D.addMonths(D.date(2026, 1, 15), -1)).toEqual(D.date(2025, 12, 15));
  });
  it("adds days across month and year ends", () => {
    expect(D.addDays(D.date(2026, 12, 31), 1)).toEqual(D.date(2027, 1, 1));
    expect(D.addDays(D.date(2026, 3, 1), -1)).toEqual(D.date(2026, 2, 28));
  });
  it("always draws six weeks, starting on the requested weekday", () => {
    for (const ws of [0, 1]) {
      const g = D.monthGrid(2026, 10, ws);
      expect(g).toHaveLength(42);
      expect(D.weekday(g[0])).toBe(ws);
      expect(g.some((d) => D.sameDay(d, D.date(2026, 10, 1)))).toBe(true);
      expect(g.some((d) => D.sameDay(d, D.date(2026, 10, 31)))).toBe(true);
    }
  });
  it("round-trips ISO and rejects impossible dates", () => {
    expect(D.parseIso(D.iso(D.date(2026, 2, 3)))).toEqual(D.date(2026, 2, 3));
    expect(D.parseIso("2026-02-30")).toBeNull();
    expect(D.parseIso("2026-13-01")).toBeNull();
    expect(D.parseIso("nope")).toBeNull();
  });
  it("checks ranges inclusively", () => {
    expect(D.inRange(D.date(2026, 1, 1), D.date(2026, 1, 1), D.date(2026, 1, 1))).toBe(true);
    expect(D.inRange(D.date(2026, 1, 2), null, D.date(2026, 1, 1))).toBe(false);
  });
});

describe("fuzzy", () => {
  it("matches subsequences and rejects the rest", () => {
    expect(fuzzyMatch("gc", "Git: Commit").score).toBeGreaterThan(0);
    expect(fuzzyMatch("xyz", "Git: Commit").score).toBe(0);
  });
  it("prefers word starts", () => {
    const ranked = fuzzyFilter(["Toggle Changes", "Debug: Configure", "Git: Commit"], "gc", (s) => s);
    expect(ranked[0]).toBe("Git: Commit");
  });
  it("prefers prefixes and consecutive runs", () => {
    const ranked = fuzzyFilter(["Reload window", "Open settings", "Settings: theme"], "set", (s) => s);
    expect(ranked[0]).toBe("Settings: theme");
  });
  it("returns the matched indices for highlighting", () => {
    expect(fuzzyMatch("gc", "Git: Commit").indices).toEqual([0, 5]);
  });
  it("empty query keeps everything in order", () => {
    expect(fuzzyFilter(["b", "a"], "", (s) => s)).toEqual(["b", "a"]);
  });
});

describe("palette ranking", () => {
  const cmd = (id: string, label: string, group?: string, keywords?: string[]): PaletteCommand => ({ id, label, group, keywords, run: () => {} });
  it("puts the best match's group first", () => {
    const groups = rankCommands([cmd("a", "Open file", "File"), cmd("b", "Theme: Aurelian", "Theme")], "aur");
    expect(groups[0][0]).toBe("Theme");
  });
  it("matches hidden keywords", () => {
    const groups = rankCommands([cmd("a", "Theme: Aurelian", "Theme", ["gold umber"])], "umber");
    expect(groups).toHaveLength(1);
  });
});

describe("sorting", () => {
  it("cycles unsorted → asc → desc → unsorted", () => {
    let s = nextSort(null, "a");
    expect(s).toEqual({ key: "a", dir: "asc" });
    s = nextSort(s, "a");
    expect(s).toEqual({ key: "a", dir: "desc" });
    expect(nextSort(s, "a")).toBeNull();
    expect(nextSort(s, "b")).toEqual({ key: "b", dir: "asc" });
  });
  it("sorts naturally and keeps blanks last in both directions", () => {
    const rows = [{ v: "file10" }, { v: "" }, { v: "file2" }, { v: null }];
    expect(sortRows(rows, { key: "v", dir: "asc" }, (r) => r.v).map((r) => r.v)).toEqual(["file2", "file10", "", null]);
    expect(sortRows(rows, { key: "v", dir: "desc" }, (r) => r.v).map((r) => r.v)).toEqual(["file10", "file2", "", null]);
  });
  it("is stable", () => {
    const rows = [{ k: 1, id: "a" }, { k: 1, id: "b" }, { k: 0, id: "c" }];
    expect(sortRows(rows, { key: "k", dir: "asc" }, (r) => r.k).map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(sortRows(rows, { key: "k", dir: "desc" }, (r) => r.k).map((r) => r.id)).toEqual(["a", "b", "c"]);
  });
  it("compares numbers numerically", () => {
    expect(compareValues(9, 10)).toBeLessThan(0);
  });
});

describe("component logic", () => {
  it("pagination shows an ellipsis only where it hides two or more pages", () => {
    expect(pageWindow(20, 6)).toEqual([1, null, 5, 6, 7, null, 20]);
    expect(pageWindow(5, 2)).toEqual([1, 2, 3, 4, 5]);
    expect(pageWindow(7, 4)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(0, 1)).toEqual([]);
  });
  it("number input clamps and snaps to the step", () => {
    expect(clampStep(17, 1, 64, 4, 0)).toBe(16);
    expect(clampStep(999, 1, 64, 1, 0)).toBe(64);
    expect(clampStep(0.15 + 0.15, 0, 1, 0.1, 1)).toBe(0.3);
  });
  it("stat deltas are coloured by good/bad, not by sign", () => {
    expect(deltaTone(4, false)).toBe("good");
    expect(deltaTone(4, true)).toBe("bad");
    expect(deltaTone(-2, true)).toBe("good");
    expect(deltaTone(0, true)).toBe("flat");
  });
  it("meters cross thresholds", () => {
    expect(meterTone(0.5)).toBe("normal");
    expect(meterTone(0.8)).toBe("warn");
    expect(meterTone(0.95)).toBe("danger");
  });
  it("tree flattens only expanded branches", () => {
    const nodes: TreeNode[] = [{ id: "a", label: "a", children: [{ id: "a/b", label: "b", children: [{ id: "a/b/c", label: "c" }] }] }, { id: "d", label: "d" }];
    expect(flattenTree(nodes, new Set()).map((f) => f.node.id)).toEqual(["a", "d"]);
    const open = flattenTree(nodes, new Set(["a", "a/b"]));
    expect(open.map((f) => [f.node.id, f.depth, f.parentId])).toEqual([
      ["a", 0, null],
      ["a/b", 1, "a"],
      ["a/b/c", 2, "a/b"],
      ["d", 0, null],
    ]);
  });
  it("chart axes land on nice numbers", () => {
    expect(niceMax(86)).toBe(100);
    expect(niceMax(21)).toBe(25);
    expect(niceMax(0)).toBe(1);
    expect(niceMax(1200)).toBe(2000);
  });
  it("initials", () => {
    expect(initials("Ada Lovelace")).toBe("AL");
    expect(initials("Grace Brewster Hopper")).toBe("GH");
    expect(initials("linus")).toBe("LI");
    expect(initials("  ")).toBe("?");
  });
});

describe("format", () => {
  it("bytes, compact numbers, deltas, elapsed", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(12)).toBe("12 B");
    expect(formatCompact(18234)).toBe("18.2K");
    expect(formatCompact(4_000_000)).toBe("4M");
    expect(formatDelta(4.2)).toBe("+4.2%");
    expect(formatDelta(-0.5)).toBe("−0.5%");
    expect(formatElapsed(192_000)).toBe("3:12");
    expect(formatElapsed(3 * 3600_000 + 12 * 60_000)).toBe("3h 12m");
  });
});
