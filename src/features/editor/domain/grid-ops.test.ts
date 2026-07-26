import { updateCell } from "@/features/editor/domain/grid-ops";
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

  it("rejects updates outside the fixed 9×9 grid", () => {
    const square = createStandardSquare({ id: "1" });
    expect(updateCell(square, 9, 0, "nope").ok).toBe(false);
    expect(updateCell(square, 0, 9, "nope").ok).toBe(false);
  });
});
