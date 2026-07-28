import { resolveUndoRedoAction } from "@/hooks/use-undo-redo-shortcuts";

describe("resolveUndoRedoAction", () => {
  const noMods = { shiftKey: false, ctrlKey: false, metaKey: false };
  const meta = { ...noMods, metaKey: true };
  const ctrl = { ...noMods, ctrlKey: true };

  it("maps Cmd/Ctrl+Z to undo", () => {
    expect(resolveUndoRedoAction("z", meta)).toBe("undo");
    expect(resolveUndoRedoAction("Z", ctrl)).toBe("undo");
  });

  it("maps Cmd/Ctrl+Shift+Z and Cmd/Ctrl+Y to redo", () => {
    expect(resolveUndoRedoAction("z", { ...meta, shiftKey: true })).toBe("redo");
    expect(resolveUndoRedoAction("y", meta)).toBe("redo");
    expect(resolveUndoRedoAction("Y", ctrl)).toBe("redo");
  });

  it("returns null without a modifier or for other keys", () => {
    expect(resolveUndoRedoAction("z", noMods)).toBeNull();
    expect(resolveUndoRedoAction("y", noMods)).toBeNull();
    expect(resolveUndoRedoAction("a", meta)).toBeNull();
  });
});
