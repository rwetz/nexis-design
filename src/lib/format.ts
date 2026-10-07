// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/** 1536 → "1.5 KB". Binary units, because that is what file sizes are. */
export function formatBytes(bytes: number, digits = 1): string {
  if (!Number.isFinite(bytes)) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = Math.abs(bytes);
  let u = 0;
  while (v >= 1024 && u < units.length - 1) {
    v /= 1024;
    u++;
  }
  const s = u === 0 ? String(Math.round(v)) : v.toFixed(digits);
  return `${bytes < 0 ? "-" : ""}${s} ${units[u]}`;
}

/** 18234 → "18.2K", 4_100_000 → "4.1M". For stat tiles, not for tables. */
export function formatCompact(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  const [div, suffix] =
    abs >= 1e9 ? [1e9, "B"] : abs >= 1e6 ? [1e6, "M"] : abs >= 1e3 ? [1e3, "K"] : [1, ""];
  if (div === 1) return String(Math.round(n * 10 ** digits) / 10 ** digits);
  return `${(n / div).toFixed(digits).replace(/\.0+$/, "")}${suffix}`;
}

/** +4.2 → "+4.2%", -0.04 → "−0.0%". Uses a real minus sign. */
export function formatDelta(pct: number, digits = 1): string {
  const s = Math.abs(pct).toFixed(digits);
  if (pct > 0) return `+${s}%`;
  if (pct < 0) return `−${s}%`;
  return `${s}%`;
}
