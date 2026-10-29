// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";
import { Combobox } from "./combobox";

beforeAll(() => {
  // cmdk scrolls the highlighted item into view; jsdom has no layout.
  Element.prototype.scrollIntoView = () => {};
});
afterEach(cleanup);

const OPTIONS = [
  { value: "atlas", label: "Atlas", keywords: ["maps"] },
  { value: "press", label: "Press" },
  { value: "epoch", label: "Epoch" },
];

function Harness({ initial = null, clearable = false, onChange = () => {} }: { initial?: string | null; clearable?: boolean; onChange?: (v: string | null) => void }) {
  const [v, setV] = React.useState<string | null>(initial);
  return (
    <Combobox
      options={OPTIONS}
      value={v}
      clearable={clearable}
      placeholder="Project"
      onValueChange={(next) => {
        setV(next);
        onChange(next);
      }}
    />
  );
}

describe("Combobox", () => {
  it("shows the placeholder, then the chosen label", () => {
    render(<Harness />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Project");
    cleanup();
    render(<Harness initial="press" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Press");
  });

  it("filters by label and by keywords, and reports the value", () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "maps" } });
    expect(screen.queryByText("Press")).toBeNull();
    fireEvent.click(screen.getByText("Atlas"));
    expect(onChange).toHaveBeenCalledWith("atlas");
    expect(screen.getByRole("combobox")).toHaveTextContent("Atlas");
  });

  it("says when nothing matches", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "zzz" } });
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("clears on picking the current option only when clearable", () => {
    const onChange = vi.fn();
    render(<Harness initial="press" clearable onChange={onChange} />);
    fireEvent.click(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("Press", { selector: "[data-slot=command-item] span" }));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("ErrorBoundary", () => {
  function Boom({ fail }: { fail: boolean }) {
    if (fail) throw new Error("bad row");
    return <p>fine</p>;
  }

  it("replaces a crashed subtree with a message and retries when the key changes", () => {
    const onError = vi.fn();
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    const { rerender } = render(
      <ErrorBoundary label="Log view" resetKey="a" onError={onError}>
        <Boom fail />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Log view stopped working");
    expect(screen.getByRole("alert")).toHaveTextContent("bad row");
    expect(onError).toHaveBeenCalledOnce();
    rerender(
      <ErrorBoundary label="Log view" resetKey="b" onError={onError}>
        <Boom fail={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("fine")).toBeInTheDocument();
    quiet.mockRestore();
  });
});
