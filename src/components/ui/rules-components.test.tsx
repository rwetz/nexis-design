// @vitest-environment jsdom
// The components that carry docs/RULES.md's layout patterns.
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LazyMotion, domAnimation } from "motion/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ListPresence, PresenceItem } from "../presence";
import { parseHex } from "./color-picker";
import { ControlRow } from "./control-row";
import { SettingRow } from "./settings-layout";

afterEach(cleanup);

describe("parseHex", () => {
  it("takes three or six digits, with or without the hash, in any case", () => {
    expect(parseHex("abc")).toBe("#aabbcc");
    expect(parseHex("#ABC")).toBe("#aabbcc");
    expect(parseHex(" 163A70 ")).toBe("#163a70");
    expect(parseHex("#163a70")).toBe("#163a70");
  });
  it("refuses anything else", () => {
    expect(parseHex("#12345")).toBeNull();
    expect(parseHex("teal")).toBeNull();
    expect(parseHex("")).toBeNull();
  });
});

describe("ControlRow", () => {
  it("marks an edited control and resets it on a double-click of the label", () => {
    const reset = vi.fn();
    render(
      <ControlRow label="Line weight" htmlFor="w" edited onReset={reset} value="94">
        <input id="w" />
      </ControlRow>,
    );
    expect(screen.getByLabelText("edited")).toBeInTheDocument();
    fireEvent.doubleClick(screen.getByText("Line weight"));
    expect(reset).toHaveBeenCalledOnce();
  });

  it("doesn't reset a control at its default", () => {
    const reset = vi.fn();
    render(
      <ControlRow label="Line weight" onReset={reset}>
        <input />
      </ControlRow>,
    );
    fireEvent.doubleClick(screen.getByText("Line weight"));
    expect(reset).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("edited")).toBeNull();
  });

  it("gives the control the value's slot when there is no value", () => {
    const { container } = render(
      <ControlRow label="Blend">
        <select />
      </ControlRow>,
    );
    expect(container.querySelector(".col-span-2")).not.toBeNull();
  });
});

describe("SettingRow", () => {
  it("labels its control", () => {
    render(
      <SettingRow label="Start screen" description="Open on the start screen." htmlFor="start">
        <input id="start" type="checkbox" />
      </SettingRow>,
    );
    expect(screen.getByLabelText("Start screen")).toHaveAttribute("id", "start");
  });
});

describe("ListPresence", () => {
  it("removes a row once it has left", async () => {
    vi.useFakeTimers();
    const view = (rows: number[]) => (
      <LazyMotion features={domAnimation} strict>
        <ListPresence>
          {rows.map((n) => (
            <PresenceItem key={n}>Layer {n}</PresenceItem>
          ))}
        </ListPresence>
      </LazyMotion>
    );
    const { rerender } = render(view([1, 2]));
    expect(screen.getByText("Layer 2")).toBeInTheDocument();
    rerender(view([1]));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.queryByText("Layer 2")).toBeNull();
    vi.useRealTimers();
  });
});
