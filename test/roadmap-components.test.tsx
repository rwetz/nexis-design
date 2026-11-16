// ╔══════════════════════════════════════╗
// ║  Ryan Wetzstein                      ║
// ║  Design                              ║
// ║  2026                                ║
// ╚══════════════════════════════════════╝

import { fireEvent, render, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { DataTable, DateRangePicker, Tree, dates } from "../src";

it("selects a table page without dropping selection outside the page", () => {
  const onSelectionChange = vi.fn();
  const onSelect = vi.fn();
  const { getByRole } = render(
    <DataTable label="Records" columns={[{ key: "id", header: "ID" }]}
      rows={[{ id: "a" }, { id: "b" }]} rowKey={(row) => row.id}
      selection={new Set(["a", "other-page"])} onSelectionChange={onSelectionChange} onSelect={onSelect} />,
  );
  const all = getByRole("checkbox", { name: "Select all rows" });
  expect(all).toBePartiallyChecked();
  fireEvent.click(all);
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["a", "b", "other-page"]));
  fireEvent.click(getByRole("checkbox", { name: "Select row a" }));
  expect(onSelectionChange).toHaveBeenLastCalledWith(new Set(["other-page"]));
  expect(onSelect).not.toHaveBeenCalled();
});

it("toggles tree selection without folding the selected branch", () => {
  const onSelectionChange = vi.fn();
  const onExpandedChange = vi.fn();
  const { getByRole } = render(
    <Tree label="Files" nodes={[{ id: "root", label: "Root", children: [{ id: "a", label: "A" }] }]}
      expanded={new Set(["root"])} onExpandedChange={onExpandedChange}
      selection={new Set(["a"])} onSelectionChange={onSelectionChange} />,
  );
  expect(getByRole("tree")).toHaveAttribute("aria-multiselectable", "true");
  fireEvent.keyDown(getByRole("treeitem", { name: "Root" }), { key: " " });
  expect(onSelectionChange).toHaveBeenCalledWith(new Set(["a", "root"]));
  expect(onExpandedChange).not.toHaveBeenCalled();
});

it("commits a bounded date range only after both dates are picked", () => {
  const onChange = vi.fn();
  const { getByRole, queryByRole } = render(
    <DateRangePicker value={null} onChange={onChange} today={dates.date(2026, 10, 7)} min={dates.date(2026, 10, 5)} />,
  );
  fireEvent.click(getByRole("button", { name: /Pick a date range/ }));
  const calendar = within(getByRole("grid", { name: "October 2026" }));
  expect(calendar.getByRole("button", { name: "Oct 4, 2026" })).toBeDisabled();
  fireEvent.click(calendar.getByRole("button", { name: "Oct 9, 2026" }));
  expect(onChange).not.toHaveBeenCalled();
  fireEvent.click(calendar.getByRole("button", { name: "Oct 6, 2026" }));
  expect(onChange).toHaveBeenCalledWith({ start: dates.date(2026, 10, 6), end: dates.date(2026, 10, 9) });
  expect(queryByRole("grid")).not.toBeInTheDocument();
});
