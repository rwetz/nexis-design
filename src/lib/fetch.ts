// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Nexis                               ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

/**
 * Fetching an app's own data files (docs/PITFALLS.md §14). A file missing
 * from `public/` does not come back as a 404: Vite's dev server, and the
 * desktop build, answer with the app's own `index.html` and `200`. So `ok`
 * is true and the failure surfaces later, in a `JSON.parse` nobody catches,
 * and the view spins forever. These treat an HTML answer to a non-HTML
 * request as missing, and parse inside the same promise, so one `.catch`
 * covers both.
 */

export class MissingDataError extends Error {
  constructor(
    readonly path: string,
    readonly status: number,
  ) {
    super(`${path}: missing (${status})`);
    this.name = "MissingDataError";
  }
}

/** The response, or a `MissingDataError` for a non-OK status or an HTML page where data was expected. */
export async function fetchData(path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(path, init);
  const html = (res.headers.get("content-type") ?? "").includes("text/html") && !/\.html?($|\?)/.test(path);
  if (!res.ok || html) throw new MissingDataError(path, res.status);
  return res;
}

/** A JSON data file, or a rejection if it is missing or does not parse. */
export async function fetchJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  return (await fetchData(path, init)).json() as Promise<T>;
}
