/**
 * Async data for a view, as the one `status` that RULES R7.3's four states
 * switch on. Runs `fn` on mount and whenever `deps` change, drops a stale
 * answer when the inputs moved on, and exposes `reload` for the Retry button.
 *
 *   const { state, reload } = useLoad(() => call<Project[]>("list_projects", {}, FIXTURE), []);
 *   if (state.status === "loading") return <Skeleton … />;
 *   if (state.status === "error") return <Alert variant="destructive">… <Button onClick={reload}>Retry</Button></Alert>;
 *   if (state.data.length === 0) return <Empty>…</Empty>;
 */

import * as React from "react";

export type Load<T> = { status: "loading" } | { status: "error"; error: Error } | { status: "ready"; data: T };

export function useLoad<T>(fn: () => Promise<T>, deps: React.DependencyList): { state: Load<T>; reload: () => void } {
  const [state, setState] = React.useState<Load<T>>({ status: "loading" });
  const [attempt, setAttempt] = React.useState(0);
  // The latest `fn` without making callers memoise it.
  const latest = React.useRef(fn);
  latest.current = fn;

  React.useEffect(() => {
    let live = true;
    setState({ status: "loading" });
    latest.current().then(
      (data) => live && setState({ status: "ready", data }),
      (e) => live && setState({ status: "error", error: e instanceof Error ? e : new Error(String(e)) }),
    );
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = React.useCallback(() => setAttempt((n) => n + 1), []);
  return { state, reload };
}
