import {
  cellGuidanceLabel,
  cellStructuralRole,
  moveFocus,
  nextTabPosition,
} from "@/features/editor/domain/navigation";

describe("grid navigation", () => {
  it("moves focus with arrow directions and clamps at edges", () => {
    expect(moveFocus({ row: 0, column: 0 }, "up", 9, 9)).toEqual({ row: 0, column: 0 });
    expect(moveFocus({ row: 0, column: 0 }, "left", 9, 9)).toEqual({ row: 0, column: 0 });
    expect(moveFocus({ row: 0, column: 0 }, "right", 9, 9)).toEqual({ row: 0, column: 1 });
    expect(moveFocus({ row: 8, column: 8 }, "down", 9, 9)).toEqual({ row: 8, column: 8 });
  });

  it("tabs through cells in row-major order", () => {
    expect(nextTabPosition({ row: 0, column: 8 }, 9, 9)).toEqual({ row: 1, column: 0 });
    expect(nextTabPosition({ row: 0, column: 0 }, 9, 9, true)).toEqual({ row: 8, column: 8 });
  });

  it("provides guidance labels for blank 9×9 structure", () => {
    expect(cellGuidanceLabel(4, 4, 9, 9)).toBe("Main goal");
    expect(cellGuidanceLabel(1, 1, 9, 9)).toBe("Supporting goal");
    expect(cellGuidanceLabel(0, 0, 9, 9)).toBeUndefined();
    expect(cellGuidanceLabel(4, 4, 10, 10)).toBeUndefined();
  });

  it("identifies structural roles for coloring", () => {
    expect(cellStructuralRole(4, 4, 9, 9)).toBe("main");
    expect(cellStructuralRole(1, 1, 9, 9)).toBe("supporting");
    expect(cellStructuralRole(0, 0, 9, 9)).toBe("action");
    expect(cellStructuralRole(4, 4, 8, 8)).toBe("action");
  });
});
