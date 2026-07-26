import {
  createEmptyCells,
  createStandardSquare,
  isValidGridSize,
  STANDARD_GRID_SIZE,
} from "@/models/harada-square";

describe("harada-square model", () => {
  it("creates a standard 9×9 square with empty cells", () => {
    const square = createStandardSquare({ id: "square-1", title: "Practice" });

    expect(square.id).toBe("square-1");
    expect(square.title).toBe("Practice");
    expect(square.rows).toBe(STANDARD_GRID_SIZE);
    expect(square.columns).toBe(STANDARD_GRID_SIZE);
    expect(square.cells).toHaveLength(STANDARD_GRID_SIZE);
    expect(
      square.cells.every(
        (row) => row.length === STANDARD_GRID_SIZE && row.every((cell) => cell === ""),
      ),
    ).toBe(true);
  });

  it("always uses a 9×9 grid even if other dimensions are requested", () => {
    const square = createStandardSquare({
      id: "forced",
      rows: 3,
      columns: 3,
      cells: [
        ["a", "b", "c"],
        ["d", "e", "f"],
        ["g", "h", "i"],
      ],
    });

    expect(square.rows).toBe(9);
    expect(square.columns).toBe(9);
    expect(square.cells).toHaveLength(9);
    expect(square.cells.every((row) => row.length === 9)).toBe(true);
    expect(square.cells[0]?.[0]).toBe("");
  });

  it("creates empty cells for helper dimensions", () => {
    expect(createEmptyCells(2, 3)).toEqual([
      ["", "", ""],
      ["", "", ""],
    ]);
  });

  it("only accepts the fixed 9×9 size", () => {
    expect(isValidGridSize(9)).toBe(true);
    expect(isValidGridSize(1)).toBe(false);
    expect(isValidGridSize(15)).toBe(false);
    expect(isValidGridSize(0)).toBe(false);
    expect(isValidGridSize(1.5)).toBe(false);
  });
});
