import {
  duplicateSquare,
  filterSquaresByTitle,
  querySquares,
  renameSquare,
  sortSquares,
} from "@/features/dashboard/domain/square-list";
import { createStandardSquare } from "@/models/harada-square";

describe("square list domain", () => {
  const alpha = createStandardSquare({
    id: "a",
    title: "Alpha goals",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  });
  const beta = createStandardSquare({
    id: "b",
    title: "Beta plan",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  });

  it("filters squares by title", () => {
    expect(filterSquaresByTitle([alpha, beta], "beta")).toEqual([beta]);
    expect(filterSquaresByTitle([alpha, beta], "  ")).toEqual([alpha, beta]);
  });

  it("sorts by name and updated date", () => {
    expect(sortSquares([beta, alpha], "name-asc").map((square) => square.id)).toEqual(["a", "b"]);
    expect(sortSquares([alpha, beta], "updated-desc").map((square) => square.id)).toEqual([
      "a",
      "b",
    ]);
  });

  it("queries with filter then sort", () => {
    const result = querySquares([alpha, beta], "a", "name-asc");
    expect(result.map((square) => square.id)).toEqual(["a", "b"]);
  });

  it("renames squares and rejects blank titles", () => {
    expect(renameSquare(alpha, "  New title  ")?.title).toBe("New title");
    expect(renameSquare(alpha, "   ")).toBeNull();
  });

  it("duplicates a square with a new id and copied cells", () => {
    const source = createStandardSquare({
      id: "source",
      title: "Source",
      cells: Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, column) => (row === 0 && column === 0 ? "Goal" : "")),
      ),
    });
    const copy = duplicateSquare(source);

    expect(copy.id).not.toBe(source.id);
    expect(copy.title).toBe("Copy of Source");
    expect(copy.cells[0]?.[0]).toBe("Goal");
    const copyFirstRow = copy.cells[0];
    if (copyFirstRow) {
      copyFirstRow[0] = "Changed";
    }
    expect(source.cells[0]?.[0]).toBe("Goal");
  });
});
