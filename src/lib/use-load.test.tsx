// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useLoad } from "./use-load";

afterEach(cleanup);

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
}

function View({ id, load }: { id: string; load: (id: string) => Promise<string> }) {
  const { state, reload } = useLoad(() => load(id), [id]);
  return (
    <div>
      <p data-testid="s">{state.status === "ready" ? `ready:${state.data}` : state.status === "error" ? `error:${state.error.message}` : "loading"}</p>
      <button onClick={reload}>retry</button>
    </div>
  );
}

describe("useLoad", () => {
  it("goes loading to ready, and to error with an Error", async () => {
    const a = deferred<string>();
    const { rerender } = render(<View id="a" load={() => a.promise} />);
    expect(screen.getByTestId("s")).toHaveTextContent("loading");
    await act(async () => a.resolve("A"));
    expect(screen.getByTestId("s")).toHaveTextContent("ready:A");

    const b = deferred<string>();
    rerender(<View id="b" load={() => b.promise} />);
    await act(async () => b.reject("disk full"));
    expect(screen.getByTestId("s")).toHaveTextContent("error:disk full");
  });

  it("ignores an answer that arrives after the inputs changed", async () => {
    const slow = deferred<string>();
    const fast = deferred<string>();
    const { rerender } = render(<View id="slow" load={() => slow.promise} />);
    rerender(<View id="fast" load={() => fast.promise} />);
    await act(async () => fast.resolve("F"));
    await act(async () => slow.resolve("S"));
    expect(screen.getByTestId("s")).toHaveTextContent("ready:F");
  });

  it("reload runs it again", async () => {
    let n = 0;
    render(<View id="x" load={async () => `run${++n}`} />);
    await act(async () => {});
    expect(screen.getByTestId("s")).toHaveTextContent("ready:run1");
    await act(async () => screen.getByText("retry").click());
    expect(screen.getByTestId("s")).toHaveTextContent("ready:run2");
  });
});
