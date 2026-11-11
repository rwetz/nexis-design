// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Load } from "../../lib/use-load";
import { DataBoundary } from "./data-boundary";

afterEach(cleanup);

const view = (state: Load<string[]>, extra: Partial<React.ComponentProps<typeof DataBoundary<string[]>>> = {}) =>
  render(
    <DataBoundary state={state} onRetry={extra.onRetry ?? (() => {})} noun="issues" {...extra}>
      {(rows) => <p>{rows.join(",")}</p>}
    </DataBoundary>,
  );

describe("DataBoundary", () => {
  it("loading: a busy status region with skeletons, no content", () => {
    view({ status: "loading" });
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByLabelText("Loading issues")).toBeInTheDocument();
  });

  it("error: names what failed, shows the message, and Retry retries", () => {
    const onRetry = vi.fn();
    view({ status: "error", error: new Error("disk is full") }, { onRetry });
    expect(screen.getByText("Couldn't load issues")).toBeInTheDocument();
    expect(screen.getByText("disk is full")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("empty: the default, then the app's own with its action", () => {
    view({ status: "ready", data: [] });
    expect(screen.getByText("No issues")).toBeInTheDocument();
    cleanup();
    view({ status: "ready", data: [] }, { empty: <button>Create the first</button> });
    expect(screen.getByRole("button", { name: "Create the first" })).toBeInTheDocument();
  });

  it("ready: renders the data, and isEmpty can say a non-array is empty", () => {
    view({ status: "ready", data: ["a", "b"] });
    expect(screen.getByText("a,b")).toBeInTheDocument();
    cleanup();
    view({ status: "ready", data: ["a"] }, { isEmpty: () => true });
    expect(screen.getByText("No issues")).toBeInTheDocument();
  });
});
