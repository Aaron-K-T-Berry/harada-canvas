import type { HaradaSquare } from "@/models/harada-square";

export type GridMutationResult = { ok: true; square: HaradaSquare } | { ok: false; reason: string };

function touch(square: HaradaSquare, patch: Partial<HaradaSquare>): HaradaSquare {
  return {
    ...square,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
}

export function cloneCells(cells: string[][]): string[][] {
  return cells.map((row) => [...row]);
}

export function updateCell(
  square: HaradaSquare,
  row: number,
  column: number,
  value: string,
): GridMutationResult {
  if (row < 0 || row >= square.rows || column < 0 || column >= square.columns) {
    return { ok: false, reason: "Cell is outside the grid." };
  }

  if (square.cells[row]?.[column] === value) {
    return { ok: true, square };
  }

  const cells = cloneCells(square.cells);
  const targetRow = cells[row];
  if (!targetRow) {
    return { ok: false, reason: "Cell is outside the grid." };
  }
  targetRow[column] = value;

  return { ok: true, square: touch(square, { cells }) };
}

export function isBlockBoundary(index: number, blockSize = 3): boolean {
  return index > 0 && index % blockSize === 0;
}
