import {
  createEmptyCells,
  type HaradaSquare,
  isValidGridSize,
  MAX_GRID_SIZE,
  MIN_GRID_SIZE,
} from "@/models/harada-square";

export type GridMutationResult = { ok: true; square: HaradaSquare } | { ok: false; reason: string };

export type RemoveResult =
  | { ok: true; square: HaradaSquare; removedText: boolean }
  | { ok: false; reason: string };

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

export function rowHasText(cells: string[][], rowIndex: number): boolean {
  const row = cells[rowIndex];
  return Boolean(row?.some((cell) => cell.trim().length > 0));
}

export function columnHasText(cells: string[][], columnIndex: number): boolean {
  return cells.some((row) => (row[columnIndex] ?? "").trim().length > 0);
}

export function addRow(square: HaradaSquare, atIndex = square.rows): GridMutationResult {
  if (!isValidGridSize(square.rows + 1)) {
    return {
      ok: false,
      reason: `Grids can have at most ${MAX_GRID_SIZE} rows.`,
    };
  }

  if (atIndex < 0 || atIndex > square.rows) {
    return { ok: false, reason: "Row index is out of range." };
  }

  const cells = cloneCells(square.cells);
  cells.splice(
    atIndex,
    0,
    Array.from({ length: square.columns }, () => ""),
  );

  return {
    ok: true,
    square: touch(square, { rows: square.rows + 1, cells }),
  };
}

export function addColumn(square: HaradaSquare, atIndex = square.columns): GridMutationResult {
  if (!isValidGridSize(square.columns + 1)) {
    return {
      ok: false,
      reason: `Grids can have at most ${MAX_GRID_SIZE} columns.`,
    };
  }

  if (atIndex < 0 || atIndex > square.columns) {
    return { ok: false, reason: "Column index is out of range." };
  }

  const cells = cloneCells(square.cells).map((row) => {
    const next = [...row];
    next.splice(atIndex, 0, "");
    return next;
  });

  return {
    ok: true,
    square: touch(square, { columns: square.columns + 1, cells }),
  };
}

export function removeRow(square: HaradaSquare, rowIndex = square.rows - 1): RemoveResult {
  if (square.rows <= MIN_GRID_SIZE) {
    return {
      ok: false,
      reason: `Grids must keep at least ${MIN_GRID_SIZE} row.`,
    };
  }

  if (rowIndex < 0 || rowIndex >= square.rows) {
    return { ok: false, reason: "Row index is out of range." };
  }

  const removedText = rowHasText(square.cells, rowIndex);
  const cells = cloneCells(square.cells);
  cells.splice(rowIndex, 1);

  return {
    ok: true,
    removedText,
    square: touch(square, { rows: square.rows - 1, cells }),
  };
}

export function removeColumn(square: HaradaSquare, columnIndex = square.columns - 1): RemoveResult {
  if (square.columns <= MIN_GRID_SIZE) {
    return {
      ok: false,
      reason: `Grids must keep at least ${MIN_GRID_SIZE} column.`,
    };
  }

  if (columnIndex < 0 || columnIndex >= square.columns) {
    return { ok: false, reason: "Column index is out of range." };
  }

  const removedText = columnHasText(square.cells, columnIndex);
  const cells = cloneCells(square.cells).map((row) => {
    const next = [...row];
    next.splice(columnIndex, 1);
    return next;
  });

  return {
    ok: true,
    removedText,
    square: touch(square, { columns: square.columns - 1, cells }),
  };
}

export function createBlankGrid(rows: number, columns: number): string[][] {
  return createEmptyCells(rows, columns);
}

export function isBlockBoundary(index: number, blockSize = 3): boolean {
  return index > 0 && index % blockSize === 0;
}
