export const STANDARD_GRID_SIZE = 9;
export const MIN_GRID_SIZE = 1;
export const MAX_GRID_SIZE = 15;

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
  const rows = partial?.rows ?? STANDARD_GRID_SIZE;
  const columns = partial?.columns ?? STANDARD_GRID_SIZE;

  return {
    id: partial?.id ?? crypto.randomUUID(),
    title: partial?.title ?? "Untitled square",
    createdAt: partial?.createdAt ?? now,
    updatedAt: partial?.updatedAt ?? now,
    rows,
    columns,
    cells: partial?.cells ?? createEmptyCells(rows, columns),
  };
}

export function isValidGridSize(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_GRID_SIZE && value <= MAX_GRID_SIZE;
}
