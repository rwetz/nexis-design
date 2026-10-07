// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * The command palette's matcher: subsequence matching with bonuses for the
 * things people actually type — word starts ("gc" → "Git: Commit"),
 * consecutive runs, and an early first hit. Returns 0 for no match, and the
 * matched indices so the palette can highlight them.
 *
 * cmdk ships its own scorer; this one replaces it so ranking is the same in
 * every app and testable without a DOM.
 */
export type FuzzyMatch = { score: number; indices: number[] };

const NO_MATCH: FuzzyMatch = { score: 0, indices: [] };

function isBoundary(text: string, i: number): boolean {
  if (i === 0) return true;
  const prev = text[i - 1];
  const cur = text[i];
  return (
    prev === " " || prev === "-" || prev === "_" || prev === "/" || prev === ":" || prev === "." ||
    (prev === prev.toLowerCase() && cur !== cur.toLowerCase())
  );
}

export function fuzzyMatch(query: string, text: string): FuzzyMatch {
  const q = query.trim().toLowerCase();
  if (q === "") return { score: 1, indices: [] };
  const t = text.toLowerCase();

  // Greedy forward pass that prefers word boundaries: for each query char,
  // take the next boundary occurrence if one exists before the next plain
  // occurrence would force us past it; otherwise the next occurrence.
  const indices: number[] = [];
  let from = 0;
  for (const ch of q) {
    let hit = -1;
    let boundaryHit = -1;
    for (let i = from; i < t.length; i++) {
      if (t[i] !== ch) continue;
      if (hit === -1) hit = i;
      if (isBoundary(text, i)) {
        boundaryHit = i;
        break;
      }
    }
    // Only jump ahead to a boundary when the plain hit is not itself adjacent
    // to the previous match — a consecutive run beats a later word start.
    const prev = indices[indices.length - 1];
    const pick =
      boundaryHit !== -1 && !(hit !== -1 && prev !== undefined && hit === prev + 1)
        ? boundaryHit
        : hit;
    if (pick === -1) return NO_MATCH;
    indices.push(pick);
    from = pick + 1;
  }

  let score = 0;
  for (let k = 0; k < indices.length; k++) {
    const i = indices[k];
    score += 1;
    if (isBoundary(text, i)) score += 3;
    if (k > 0 && i === indices[k - 1] + 1) score += 2;
  }
  score += Math.max(0, 4 - indices[0]) * 0.5; // early start
  score -= (t.length - q.length) * 0.01; // prefer shorter labels on ties
  if (t.startsWith(q)) score += 4;
  return { score: Math.max(score, 0.001), indices };
}

/** Sort `items` by match against `query`, dropping non-matches. Stable. */
export function fuzzyFilter<T>(items: readonly T[], query: string, text: (item: T) => string): T[] {
  return items
    .map((item, i) => ({ item, i, m: fuzzyMatch(query, text(item)) }))
    .filter((x) => x.m.score > 0)
    .sort((a, b) => b.m.score - a.m.score || a.i - b.i)
    .map((x) => x.item);
}
