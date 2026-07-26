import { createEmptyCells, createStandardSquare, isValidGridSize } from "@/models/harada-square";

describe("harada-square model", () => {
  it("creates a standard 9×9 square with empty cells", () => {
    const square = createStandardSquare({ id: "square-1", title: "Practice" });

    expect(square.id).toBe("square-1");
    expect(square.title).toBe("Practice");
    expect(square.rows).toBe(9);
    expect(square.columns).toBe(9);
    expect(square.cells).toHaveLength(9);
    expect(square.cells.every((row) => row.length === 9 && row.every((cell) => cell === ""))).toBe(
      true,
    );
  });

  it("creates empty cells for custom dimensions", () => {
    expect(createEmptyCells(2, 3)).toEqual([
      ["", "", ""],
      ["", "", ""],
    ]);
  });

  it("validates grid size bounds", () => {
    expect(isValidGridSize(1)).toBe(true);
    expect(isValidGridSize(15)).toBe(true);
    expect(isValidGridSize(0)).toBe(false);
    expect(isValidGridSize(16)).toBe(false);
    expect(isValidGridSize(1.5)).toBe(false);
  });
});
