import { useEffect, useRef, useState } from "react";
import { renameSquare } from "@/features/dashboard/domain/square-list";
import { createExampleSquare, isExampleSquareId } from "@/features/editor/domain/example-square";
import { updateCell } from "@/features/editor/domain/grid-ops";
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

function historyFor(square: HaradaSquare | null): EditorHistory | null {
  if (!square) {
    return null;
  }
  return createHistory(createSnapshot(square.rows, square.columns, square.cells));
}

export function useEditorSession(squareId: string | undefined, repository: SquareRepository) {
  const [status, setStatus] = useState<EditorStatus>("loading");
  const [square, setSquare] = useState<HaradaSquare | null>(null);
  const [history, setHistory] = useState<EditorHistory | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  const squareRef = useRef(square);
  const historyRef = useRef(history);
  const statusRef = useRef(status);

  useEffect(() => {
    squareRef.current = square;
  }, [square]);

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    const load = (nextStatus: EditorStatus, nextSquare: HaradaSquare | null) => {
      setStatus(nextStatus);
      setSquare(nextSquare);
      setHistory(historyFor(nextSquare));
      setAnnouncement("");
      setSaveError(null);
    };

    if (!squareId) {
      load("missing", null);
      return;
    }

    if (isExampleSquareId(squareId)) {
      load("example", createExampleSquare());
      return;
    }

    try {
      const existing = repository.getSquare(squareId);
      if (!existing) {
        load("missing", null);
        return;
      }
      load("ready", existing);
    } catch {
      load("missing", null);
    }
  }, [squareId, repository]);

  const persistSquare = (next: HaradaSquare) => {
    if (statusRef.current !== "ready") {
      return;
    }

    try {
      repository.saveSquare(next);
      setSaveError(null);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save square.");
    }
  };

  const [scheduleSave, flushSave] = useDebouncedCallback((next: HaradaSquare) => {
    persistSquare(next);
  }, AUTOSAVE_DELAY_MS);

  useEffect(() => {
    return () => {
      flushSave();
    };
  }, [flushSave]);

  const commit = (nextSquare: HaradaSquare, nextAnnouncement?: string) => {
    const currentHistory = historyRef.current;
    if (!currentHistory) {
      return;
    }

    const nextHistory = pushHistory(
      currentHistory,
      createSnapshot(nextSquare.rows, nextSquare.columns, nextSquare.cells),
    );
    setSquare(nextSquare);
    setHistory(nextHistory);
    if (nextAnnouncement !== undefined) {
      setAnnouncement(nextAnnouncement);
    }
    setSaveError(null);
    if (statusRef.current === "ready") {
      scheduleSave(nextSquare);
    }
  };

  const setCellValue = (row: number, column: number, value: string) => {
    const current = squareRef.current;
    if (!current) {
      return;
    }

    const result = updateCell(current, row, column, value);
    if (result.ok) {
      commit(result.square);
    }
  };

  const renameTitle = (title: string) => {
    const current = squareRef.current;
    if (!current) {
      return;
    }

    const next = renameSquare(current, title);
    if (!next) {
      setAnnouncement("Enter a title before saving.");
      return;
    }

    if (next === current) {
      return;
    }

    setSquare(next);
    setAnnouncement(`Renamed to “${next.title}”.`);
    setSaveError(null);
    if (statusRef.current === "ready") {
      scheduleSave(next);
    }
  };

  const applyHistoryMove = (direction: "undo" | "redo") => {
    const currentSquare = squareRef.current;
    const currentHistory = historyRef.current;
    if (!currentSquare || !currentHistory) {
      return;
    }
    if (direction === "undo" ? !canUndo(currentHistory) : !canRedo(currentHistory)) {
      return;
    }

    const nextHistory = direction === "undo" ? undo(currentHistory) : redo(currentHistory);
    const nextSquare = applySnapshot(currentSquare, nextHistory.present);
    setSquare(nextSquare);
    setHistory(nextHistory);
    setAnnouncement(direction === "undo" ? "Undid last change." : "Redid last change.");
    setSaveError(null);
    if (statusRef.current === "ready") {
      scheduleSave(nextSquare);
    }
  };

  const flushPendingSave = () => {
    flushSave();
    const current = squareRef.current;
    if (current && statusRef.current === "ready") {
      persistSquare(current);
    }
  };

  return {
    status,
    square,
    announcement,
    saveError,
    canUndo: history ? canUndo(history) : false,
    canRedo: history ? canRedo(history) : false,
    setCellValue,
    renameTitle,
    undo: () => applyHistoryMove("undo"),
    redo: () => applyHistoryMove("redo"),
    flushPendingSave,
    isExample: status === "example",
  };
}
