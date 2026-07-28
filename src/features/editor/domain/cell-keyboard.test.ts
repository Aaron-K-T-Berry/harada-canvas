import { resolveCellKeyAction } from "@/features/editor/domain/cell-keyboard";

describe("resolveCellKeyAction", () => {
  const noMods = { shiftKey: false, ctrlKey: false, metaKey: false, altKey: false };

  it("maps arrows to move", () => {
    expect(resolveCellKeyAction("ArrowUp", noMods, false)).toEqual({
      type: "move",
      direction: "up",
    });
    expect(resolveCellKeyAction("ArrowRight", noMods, false)).toEqual({
      type: "move",
      direction: "right",
    });
  });

  it("maps Enter/F2 to edit and Tab to tab", () => {
    expect(resolveCellKeyAction("Enter", noMods, false)).toEqual({ type: "edit" });
    expect(resolveCellKeyAction("F2", noMods, false)).toEqual({ type: "edit" });
    expect(resolveCellKeyAction("Tab", noMods, false)).toEqual({ type: "tab", reverse: false });
    expect(resolveCellKeyAction("Tab", { ...noMods, shiftKey: true }, false)).toEqual({
      type: "tab",
      reverse: true,
    });
  });

  it("maps printable keys to type unless readOnly or modified", () => {
    expect(resolveCellKeyAction("a", noMods, false)).toEqual({ type: "type", character: "a" });
    expect(resolveCellKeyAction("a", noMods, true)).toEqual({ type: "none" });
    expect(resolveCellKeyAction("a", { ...noMods, metaKey: true }, false)).toEqual({
      type: "none",
    });
  });
});
