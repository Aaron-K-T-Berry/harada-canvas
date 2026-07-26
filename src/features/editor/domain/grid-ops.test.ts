import {
  addColumn,
  addRow,
  columnHasText,
  removeColumn,
  removeRow,
  rowHasText,
  updateCell,
} from "@/features/editor/domain/grid-ops";
import { createStandardSquare } from "@/models/harada-square";

describe("grid operations", () => {
  it("updates cell text", () => {
    const square = createStandardSquare({ id: "1" });
    const result = updateCell(square, 0, 0, "Goal");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.square.cells[0]?.[0]).toBe("Goal");
      expect(result.square).not.toBe(square);
    }
  });

  it("adds and removes rows while staying rectangular", () => {
    const square = createStandardSquare({ id: "1" });
    const added = addRow(square);
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }

    expect(added.square.rows).toBe(10);
    expect(added.square.cells).toHaveLength(10);
    expect(added.square.cells.every((row) => row.length === 9)).toBe(true);

    const withText = updateCell(added.square, 9, 0, "keep me");
    expect(withText.ok).toBe(true);
    if (!withText.ok) {
      return;
    }

    expect(rowHasText(withText.square.cells, 9)).toBe(true);
    const removed = removeRow(withText.square, 9);
    expect(removed.ok).toBe(true);
    if (removed.ok) {
      expect(removed.removedText).toBe(true);
      expect(removed.square.rows).toBe(9);
    }
  });

  it("adds and removes columns and flags populated removals", () => {
    const square = createStandardSquare({ id: "1" });
    const added = addColumn(square);
    expect(added.ok).toBe(true);
    if (!added.ok) {
      return;
    }

    const withText = updateCell(added.square, 0, 9, "edge");
    expect(withText.ok).toBe(true);
    if (!withText.ok) {
      return;
    }

    expect(columnHasText(withText.square.cells, 9)).toBe(true);
    const removed = removeColumn(withText.square, 9);
    expect(removed.ok).toBe(true);
    if (removed.ok) {
      expect(removed.removedText).toBe(true);
      expect(removed.square.columns).toBe(9);
    }
  });

  it("protects against shrinking below one row or column", () => {
    const square = createStandardSquare({ id: "1", rows: 1, columns: 1, cells: [[""]] });
    expect(removeRow(square).ok).toBe(false);
    expect(removeColumn(square).ok).toBe(false);
  });

  it("rejects growth beyond fifteen", () => {
    const square = createStandardSquare({
      id: "1",
      rows: 15,
      columns: 15,
      cells: Array.from({ length: 15 }, () => Array.from({ length: 15 }, () => "")),
    });

    expect(addRow(square).ok).toBe(false);
    expect(addColumn(square).ok).toBe(false);
  });
});
