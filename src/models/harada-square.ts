export const STANDARD_GRID_SIZE = 9;

export interface HaradaSquare {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  rows: number;
  columns: number;
  cells: string[][];
}

export function createEmptyCells(rows: number, columns: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: columns }, () => ""));
}

export function createStandardSquare(partial?: Partial<HaradaSquare>): HaradaSquare {
  const now = new Date().toISOString();
  const cells =
    partial?.cells && isValidStandardGrid(STANDARD_GRID_SIZE, STANDARD_GRID_SIZE, partial.cells)
      ? partial.cells
      : createEmptyCells(STANDARD_GRID_SIZE, STANDARD_GRID_SIZE);

  return {
    id: partial?.id ?? crypto.randomUUID(),
    title: partial?.title ?? "Untitled square",
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    rows: STANDARD_GRID_SIZE,
    columns: STANDARD_GRID_SIZE,
    cells,
  };
}

export function isValidGridSize(value: number): boolean {
  return value === STANDARD_GRID_SIZE;
}

export function isValidStandardGrid(rows: number, columns: number, cells: string[][]): boolean {
  return (
    isValidGridSize(rows) &&
    isValidGridSize(columns) &&
    cells.length === STANDARD_GRID_SIZE &&
    cells.every(
      (row) => row.length === STANDARD_GRID_SIZE && row.every((cell) => typeof cell === "string"),
    )
  );
}
