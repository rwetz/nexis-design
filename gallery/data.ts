// Deterministic fixture data for the gallery, so screenshots are stable.

/** Mulberry32: a tiny seeded PRNG. */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function wave(n: number, seed: number, base = 50, amp = 20, noise = 6): number[] {
  const r = rng(seed);
  return Array.from({ length: n }, (_, i) =>
    Math.max(0, base + amp * Math.sin(i / 6 + seed) + amp * 0.4 * Math.sin(i / 2.3) + (r() - 0.5) * noise),
  );
}

export type Service = { id: string; name: string; region: string; rps: number; p95: number; errors: number; status: "ok" | "degraded" | "down" };

export const SERVICES: Service[] = [
  { id: "api", name: "api", region: "us-east-1", rps: 905, p95: 63, errors: 0.35, status: "ok" },
  { id: "auth", name: "auth", region: "us-east-1", rps: 624, p95: 32, errors: 0.58, status: "ok" },
  { id: "billing", name: "billing", region: "eu-west-1", rps: 195, p95: 14, errors: 0.47, status: "ok" },
  { id: "media", name: "media", region: "us-west-2", rps: 851, p95: 56, errors: 0.73, status: "ok" },
  { id: "queue", name: "queue", region: "us-east-1", rps: 942, p95: 65, errors: 0.68, status: "ok" },
  { id: "search", name: "search", region: "us-east-1", rps: 336, p95: 128, errors: 2.62, status: "degraded" },
  { id: "notify", name: "notify", region: "ap-south-1", rps: 88, p95: 41, errors: 0.12, status: "ok" },
  { id: "ingest", name: "ingest", region: "eu-west-1", rps: 1204, p95: 77, errors: 0.91, status: "ok" },
];

export const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

export const LOG_LEVELS = ["info", "info", "info", "debug", "warn", "info", "error", "info"] as const;
const LOG_MSGS = [
  "GET /api/v1/projects 200 in 41ms",
  "worker 3 picked up job build#4412",
  "cache hit ratio 0.93 over last 60s",
  "POST /api/v1/deploy 202 in 118ms",
  "slow query on projects_by_owner (412ms)",
  "connection pool resized 16 → 24",
  "upstream search timed out after 2000ms",
  "flushed 1,204 events to ingest",
  "lsp: rust-analyzer ready in 3.1s",
  "watching 2,318 files for changes",
];
export function logLine(i: number) {
  const r = rng(i * 7 + 3);
  const level = LOG_LEVELS[Math.floor(r() * LOG_LEVELS.length)];
  const msg = LOG_MSGS[Math.floor(r() * LOG_MSGS.length)];
  const s = 9 * 3600 + 30 * 60 + i;
  const t = `${String(Math.floor(s / 3600) % 24).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { i, t, level, msg };
}
