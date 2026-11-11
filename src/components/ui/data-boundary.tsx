/**
 * RULES R7.3 in one component: the four states of a view that gets data from
 * somewhere (a file, the backend, a network). Pair it with `useLoad`.
 *
 *   const { state, reload } = useLoad(() => call<Issue[]>("list_issues", {}, FIXTURE), []);
 *   <DataBoundary state={state} onRetry={reload} noun="issues" empty={<Empty>…one action…</Empty>}>
 *     {(issues) => <DataTable rows={issues} … />}
 *   </DataBoundary>
 *
 * Loading is a `Skeleton` in the content's shape (pass `skeleton` when rows
 * are not the right shape), an error replaces the content with an
 * `Alert` and a Retry, and an empty result shows `empty`, which should offer
 * the one action that fills it.
 */

import * as React from "react";
import { Icon } from "../../icon/icon";
import { cn } from "../../lib/utils";
import type { Load } from "../../lib/use-load";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";
import { Button } from "./button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./empty";
import { Skeleton } from "./skeleton";

/** Rows of placeholder in the shape of a list or table body. */
export function SkeletonRows({ rows = 8, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-row p-gutter", className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-8 w-full" style={{ opacity: 1 - i * (0.7 / rows) }} />
      ))}
    </div>
  );
}

type Props<T> = {
  state: Load<T>;
  onRetry: () => void;
  /** What is loading, for the messages: "issues" gives "Couldn't load issues". */
  noun: string;
  /** Defaults to an empty array. */
  isEmpty?: (data: T) => boolean;
  skeleton?: React.ReactNode;
  /** Shown when `isEmpty`; defaults to a bare "No {noun}". Give it an action. */
  empty?: React.ReactNode;
  children: (data: T) => React.ReactNode;
  className?: string;
};

export function DataBoundary<T>({ state, onRetry, noun, isEmpty, skeleton, empty, children, className }: Props<T>) {
  if (state.status === "loading")
    return (
      <div role="status" aria-busy="true" aria-label={`Loading ${noun}`} className={cn("min-h-0 flex-1", className)}>
        {skeleton ?? <SkeletonRows />}
      </div>
    );

  if (state.status === "error")
    return (
      <div className={cn("p-gutter", className)}>
        <Alert variant="destructive">
          <Icon name="alert-circle" />
          <AlertTitle>Couldn't load {noun}</AlertTitle>
          <AlertDescription>{state.error.message}</AlertDescription>
          <AlertAction>
            <Button size="xs" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </AlertAction>
        </Alert>
      </div>
    );

  const none = isEmpty ? isEmpty(state.data) : Array.isArray(state.data) && state.data.length === 0;
  if (none)
    return (
      <>
        {empty ?? (
          <Empty className={className}>
            <EmptyHeader>
              <EmptyTitle>No {noun}</EmptyTitle>
              <EmptyDescription>Nothing here yet.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </>
    );

  return <>{children(state.data)}</>;
}
