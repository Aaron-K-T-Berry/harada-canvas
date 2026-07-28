import { useEffect, useRef } from "react";

export type UndoRedoAction = "undo" | "redo";

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable)
  );
}

/** Resolve a keydown into undo/redo when Cmd/Ctrl is held. */
export function resolveUndoRedoAction(
  key: string,
  mods: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean },
): UndoRedoAction | null {
  if (!mods.metaKey && !mods.ctrlKey) {
    return null;
  }

  const lower = key.toLowerCase();
  if (lower === "z" && !mods.shiftKey) {
    return "undo";
  }
  if ((lower === "z" && mods.shiftKey) || lower === "y") {
    return "redo";
  }
  return null;
}

interface UseUndoRedoShortcutsOptions {
  enabled: boolean;
  undo: () => void;
  redo: () => void;
}

/** Window-level Cmd/Ctrl+Z / Shift+Z / Y when not typing in an editable field. */
export function useUndoRedoShortcuts({ enabled, undo, redo }: UseUndoRedoShortcutsOptions) {
  const undoRef = useRef(undo);
  const redoRef = useRef(redo);

  useEffect(() => {
    undoRef.current = undo;
    redoRef.current = redo;
  }, [redo, undo]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      const action = resolveUndoRedoAction(event.key, {
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
      });
      if (!action) {
        return;
      }

      event.preventDefault();
      if (action === "undo") {
        undoRef.current();
      } else {
        redoRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
