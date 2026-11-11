// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * One registry of an app's settings, for the nav, the search and the
 * command palette at once (APP-FINDINGS 3, from BibleLM). A hand-kept list
 * of "Settings: ..." palette commands drifts from the page; a tree of
 * chapters, groups and settings (each with keywords) cannot.
 *
 *   const SETTINGS: SettingsChapter[] = [{ id: "appearance", label: "Appearance",
 *     groups: [{ id: "theme", label: "Theme", settings: [{ label: "Mode", keywords: ["dark"] }] }] }];
 *
 *   <SettingsTree nodes={settingsTreeNodes(SETTINGS)} ... />
 *   findSettings(query, SETTINGS)   // search box and palette
 *   locateSetting("Mode", SETTINGS) // deep link: open the chapter, flash the row
 */

import type * as React from "react";

export type SettingEntry = { label: string; keywords?: readonly string[] };
export type SettingsGroupEntry = { id: string; label: string; settings: readonly SettingEntry[] };
export type SettingsChapter = {
  id: string;
  label: string;
  /** The chapter's leading mark in a `SettingsTree`: a numeral or an icon. */
  mark?: React.ReactNode;
  groups: readonly SettingsGroupEntry[];
};

export type SettingHit = { chapter: SettingsChapter; group: SettingsGroupEntry; setting: SettingEntry };

const norm = (s: string) => s.toLowerCase().replace(/['’]/g, "");

/** Settings whose label or keywords match, best first: label starts with the query, then contains it, then a keyword, group or chapter does. */
export function findSettings(query: string, chapters: readonly SettingsChapter[]): SettingHit[] {
  const q = norm(query.trim());
  if (!q) return [];
  const scored: { hit: SettingHit; score: number }[] = [];
  for (const chapter of chapters)
    for (const group of chapter.groups)
      for (const setting of group.settings) {
        const label = norm(setting.label);
        const words = [norm(group.label), norm(chapter.label), ...(setting.keywords ?? []).map(norm)];
        const score = label.startsWith(q) ? 3 : label.includes(q) ? 2 : words.some((w) => w.includes(q)) ? 1 : 0;
        if (score) scored.push({ hit: { chapter, group, setting }, score });
      }
  // Array sort is stable, so equal scores keep registry order.
  return scored.sort((a, b) => b.score - a.score).map((x) => x.hit);
}

/** Where a label lives: a setting first, then a group, then a chapter. */
export function locateSetting(
  label: string,
  chapters: readonly SettingsChapter[],
): { chapter: SettingsChapter; group?: SettingsGroupEntry; setting?: SettingEntry } | undefined {
  const want = norm(label);
  for (const chapter of chapters)
    for (const group of chapter.groups) {
      const setting = group.settings.find((s) => norm(s.label).startsWith(want));
      if (setting) return { chapter, group, setting };
    }
  for (const chapter of chapters) {
    const group = chapter.groups.find((g) => norm(g.label).startsWith(want));
    if (group) return { chapter, group };
  }
  const chapter = chapters.find((c) => norm(c.label).startsWith(want));
  return chapter && { chapter };
}

/** The registry as `SettingsTree` nodes: chapters, with their groups as sections. */
export function settingsTreeNodes(chapters: readonly SettingsChapter[]) {
  return chapters.map((c) => ({ id: c.id, label: c.label, mark: c.mark, children: c.groups.map((g) => ({ id: g.id, label: g.label })) }));
}
