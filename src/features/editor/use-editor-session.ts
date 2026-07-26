import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createExampleSquare, isExampleSquareId } from "@/features/editor/domain/example-square";
import {
  addColumn,
  addRow,
  removeColumn,
  removeRow,
  updateCell,
} from "@/features/editor/domain/grid-ops";
import {
  canRedo,
  canUndo,
  createHistory,
  createSnapshot,
  type EditorHistory,
  pushHistory,
  redo,
  undo,
} from "@/features/editor/domain/history";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";
import type { SquareRepository } from "@/lib/storage/repository";
import type { HaradaSquare } from "@/models/harada-square";

const AUTOSAVE_DELAY_MS = 400;

type EditorStatus = "loading" | "ready" | "missing" | "example";

interface EditorState {
  status: EditorStatus;
  square: HaradaSquare | null;
  history: EditorHistory | null;
  announcement: string;
  saveError: string | null;
}

type EditorAction =
  | { type: "load"; status: EditorStatus; square: HaradaSquare | null }
  | { type: "apply"; square: HaradaSquare; history: EditorHistory; announcement?: string }
  | { type: "announce"; message: string }
  | { type: "save-error"; message: string | null };

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "load":
      return {
        status: action.status,
        square: action.square,
        history: action.square
          ? createHistory(
              createSnapshot(action.square.rows, action.square.columns, action.square.cells),
            )
          : null,
        announcement: "",
        saveError: null,
      };
    case "apply":
      return {
        ...state,
        square: action.square,
        history: action.history,
        announcement: action.announcement ?? state.announcement,
        saveError: null,
      };
    case "announce":
      return { ...state, announcement: action.message };
    case "save-error":
      return { ...state, saveError: action.message };
  }
}

function applySnapshot(
  square: HaradaSquare,
  snapshot: ReturnType<typeof createSnapshot>,
): HaradaSquare {
  return {
    ...square,
    rows: snapshot.rows,
    columns: snapshot.columns,
    cells: snapshot.cells.map((row) => [...row]),
    updatedAt: new Date().toISOString(),
  };
}

export function useEditorSession(squareId: string | undefined, repository: SquareRepository) {
  const [state, dispatch] = useReducer(editorReducer, {
    status: "loading",
    square: null,
    history: null,
    announcement: "",
    saveError: null,
  });
  const [pendingRemoval, setPendingRemoval] = useState<null | {
    kind: "row" | "column";
    index: number;
  }>(null);
  const squareRef = useRef<HaradaSquare | null>(null);
  const persistEnabled = state.status === "ready";

  useEffect(() => {
    squareRef.current = state.square;
  }, [state.square]);

  useEffect(() => {
    if (!squareId) {
      dispatch({ type: "load", status: "missing", square: null });
      return;
    }

    if (isExampleSquareId(squareId)) {
      dispatch({ type: "load", status: "example", square: createExampleSquare() });
      return;
    }

    try {
      const existing = repository.getSquare(squareId);
      if (!existing) {
        dispatch({ type: "load", status: "missing", square: null });
        return;
      }

      dispatch({ type: "load", status: "ready", square: existing });
    } catch {
      dispatch({ type: "load", status: "missing", square: null });
    }
  }, [squareId, repository]);

  const persistSquare = useCallback(
    (square: HaradaSquare) => {
      if (!persistEnabled) {
        return;
      }

      try {
        repository.saveSquare(square);
        dispatch({ type: "save-error", message: null });
      } catch (error) {
        dispatch({
          type: "save-error",
          message: error instanceof Error ? error.message : "Unable to save square.",
        });
      }
    },
    [persistEnabled, repository],
  );

  const [scheduleSave, flushSave] = useDebouncedCallback((square: HaradaSquare) => {
    persistSquare(square);
  }, AUTOSAVE_DELAY_MS);

  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  const commit = useCallback(
    (nextSquare: HaradaSquare, announcement?: string) => {
      if (!state.history) {
        return;
      }

      const history = pushHistory(
        state.history,
        createSnapshot(nextSquare.rows, nextSquare.columns, nextSquare.cells),
      );
      dispatch({ type: "apply", square: nextSquare, history, announcement });
      if (persistEnabled) {
        scheduleSave(nextSquare);
      }
    },
    [persistEnabled, scheduleSave, state.history],
  );

  const setCellValue = useCallback(
    (row: number, column: number, value: string) => {
      if (!state.square) {
        return;
      }

      const result = updateCell(state.square, row, column, value);
      if (result.ok) {
        commit(result.square);
      }
    },
    [commit, state.square],
  );

  const handleUndo = useCallback(() => {
    if (!state.square || !state.history || !canUndo(state.history)) {
      return;
    }

    const history = undo(state.history);
    const square = applySnapshot(state.square, history.present);
    dispatch({ type: "apply", square, history, announcement: "Undid last change." });
    if (persistEnabled) {
      scheduleSave(square);
    }
  }, [persistEnabled, scheduleSave, state.history, state.square]);

  const handleRedo = useCallback(() => {
    if (!state.square || !state.history || !canRedo(state.history)) {
      return;
    }

    const history = redo(state.history);
    const square = applySnapshot(state.square, history.present);
    dispatch({ type: "apply", square, history, announcement: "Redid last change." });
    if (persistEnabled) {
      scheduleSave(square);
    }
  }, [persistEnabled, scheduleSave, state.history, state.square]);

  const requestRemoveRow = useCallback(
    (index?: number) => {
      if (!state.square) {
        return;
      }
      const rowIndex = index ?? state.square.rows - 1;
      const preview = removeRow(state.square, rowIndex);
      if (!preview.ok) {
        dispatch({ type: "announce", message: preview.reason });
        return;
      }
      if (preview.removedText) {
        setPendingRemoval({ kind: "row", index: rowIndex });
        return;
      }
      commit(preview.square, "Removed row.");
    },
    [commit, state.square],
  );

  const requestRemoveColumn = useCallback(
    (index?: number) => {
      if (!state.square) {
        return;
      }
      const columnIndex = index ?? state.square.columns - 1;
      const preview = removeColumn(state.square, columnIndex);
      if (!preview.ok) {
        dispatch({ type: "announce", message: preview.reason });
        return;
      }
      if (preview.removedText) {
        setPendingRemoval({ kind: "column", index: columnIndex });
        return;
      }
      commit(preview.square, "Removed column.");
    },
    [commit, state.square],
  );

  const confirmPendingRemoval = useCallback(() => {
    if (!state.square || !pendingRemoval) {
      return;
    }

    const result =
      pendingRemoval.kind === "row"
        ? removeRow(state.square, pendingRemoval.index)
        : removeColumn(state.square, pendingRemoval.index);

    setPendingRemoval(null);

    if (!result.ok) {
      dispatch({ type: "announce", message: result.reason });
      return;
    }

    commit(
      result.square,
      pendingRemoval.kind === "row" ? "Removed row with text." : "Removed column with text.",
    );
  }, [commit, pendingRemoval, state.square]);

  const cancelPendingRemoval = useCallback(() => {
    setPendingRemoval(null);
  }, []);

  const handleAddRow = useCallback(() => {
    if (!state.square) {
      return;
    }
    const result = addRow(state.square);
    if (!result.ok) {
      dispatch({ type: "announce", message: result.reason });
      return;
    }
    commit(result.square, "Added row.");
  }, [commit, state.square]);

  const handleAddColumn = useCallback(() => {
    if (!state.square) {
      return;
    }
    const result = addColumn(state.square);
    if (!result.ok) {
      dispatch({ type: "announce", message: result.reason });
      return;
    }
    commit(result.square, "Added column.");
  }, [commit, state.square]);

  const flushPendingSave = useCallback(() => {
    flushSave();
    const current = squareRef.current;
    if (current && persistEnabled) {
      persistSquare(current);
    }
  }, [flushSave, persistEnabled, persistSquare]);

  return useMemo(
    () => ({
      status: state.status,
      square: state.square,
      announcement: state.announcement,
      saveError: state.saveError,
      canUndo: state.history ? canUndo(state.history) : false,
      canRedo: state.history ? canRedo(state.history) : false,
      pendingRemoval,
      setCellValue,
      undo: handleUndo,
      redo: handleRedo,
      addRow: handleAddRow,
      addColumn: handleAddColumn,
      removeRow: requestRemoveRow,
      removeColumn: requestRemoveColumn,
      confirmPendingRemoval,
      cancelPendingRemoval,
      flushPendingSave,
      isReadOnly: false,
      isExample: state.status === "example",
    }),
    [
      cancelPendingRemoval,
      confirmPendingRemoval,
      flushPendingSave,
      handleAddColumn,
      handleAddRow,
      handleRedo,
      handleUndo,
      pendingRemoval,
      requestRemoveColumn,
      requestRemoveRow,
      setCellValue,
      state.announcement,
      state.history,
      state.saveError,
      state.square,
      state.status,
    ],
  );
}
