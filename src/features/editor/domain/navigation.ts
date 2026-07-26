export type MoveDirection = "up" | "down" | "left" | "right";

export interface CellPosition {
  row: number;
  column: number;
}

export function moveFocus(
  position: CellPosition,
  direction: MoveDirection,
  rows: number,
  columns: number,
): CellPosition {
  switch (direction) {
    case "up":
      return {
        row: Math.max(0, position.row - 1),
        column: position.column,
      };
    case "down":
      return {
        row: Math.min(rows - 1, position.row + 1),
        column: position.column,
      };
    case "left":
      return {
        row: position.row,
        column: Math.max(0, position.column - 1),
      };
    case "right":
      return {
        row: position.row,
        column: Math.min(columns - 1, position.column + 1),
      };
  }
}

export function nextTabPosition(
  position: CellPosition,
  rows: number,
  columns: number,
  reverse = false,
): CellPosition {
  const index = position.row * columns + position.column;
  const total = rows * columns;
  const nextIndex = reverse ? (index - 1 + total) % total : (index + 1) % total;

  return {
    row: Math.floor(nextIndex / columns),
    column: nextIndex % columns,
  };
}

/** Guidance labels shown as placeholders for blank structured 9×9 squares. */
export function cellGuidanceLabel(
  row: number,
  column: number,
  rows: number,
  columns: number,
): string | undefined {
  const role = cellStructuralRole(row, column, rows, columns);
  if (role === "main") {
    return "Main goal";
  }
  if (role === "supporting") {
    return "Supporting goal";
  }
  return undefined;
}

export type CellStructuralRole = "main" | "supporting" | "action";

/** Structural role for standard Harada 9×9 layout coloring and guidance. */
export function cellStructuralRole(
  row: number,
  column: number,
  rows: number,
  columns: number,
): CellStructuralRole {
  if (rows !== 9 || columns !== 9) {
    return "action";
  }

  if (row === 4 && column === 4) {
    return "main";
  }

  if (row % 3 === 1 && column % 3 === 1) {
    return "supporting";
  }

  return "action";
}
