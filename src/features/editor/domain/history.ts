import { cloneCells } from "@/features/editor/domain/grid-ops";

export interface EditorSnapshot {
  rows: number;
  columns: number;
  cells: string[][];
}

export interface EditorHistory {
  past: EditorSnapshot[];
  present: EditorSnapshot;
  future: EditorSnapshot[];
}

export function createSnapshot(rows: number, columns: number, cells: string[][]): EditorSnapshot {
  return {
    rows,
    columns,
    cells: cloneCells(cells),
  };
}

export function snapshotsEqual(a: EditorSnapshot, b: EditorSnapshot): boolean {
  if (a.rows !== b.rows || a.columns !== b.columns) {
    return false;
  }

  return a.cells.every((row, rowIndex) =>
    row.every((cell, columnIndex) => cell === b.cells[rowIndex]?.[columnIndex]),
  );
}

export function createHistory(present: EditorSnapshot): EditorHistory {
  return {
    past: [],
    present: createSnapshot(present.rows, present.columns, present.cells),
    future: [],
  };
}

export function pushHistory(history: EditorHistory, next: EditorSnapshot): EditorHistory {
  if (snapshotsEqual(history.present, next)) {
    return history;
  }

  // ponytail: past capped at 50; raise or spill to disk if long sessions need deeper undo
  const past = [...history.past, history.present].slice(-50);

  return {
    past,
    present: createSnapshot(next.rows, next.columns, next.cells),
    future: [],
  };
}

export function undo(history: EditorHistory): EditorHistory {
  const previous = history.past.at(-1);
  if (!previous) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redo(history: EditorHistory): EditorHistory {
  const next = history.future[0];
  if (!next) {
    return history;
  }

  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}

export function canUndo(history: EditorHistory): boolean {
  return history.past.length > 0;
}

export function canRedo(history: EditorHistory): boolean {
  return history.future.length > 0;
}
