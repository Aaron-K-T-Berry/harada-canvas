import {
  canRedo,
  canUndo,
  createHistory,
  createSnapshot,
  pushHistory,
  redo,
  undo,
} from "@/features/editor/domain/history";

describe("editor history", () => {
  it("supports undo and redo of snapshots", () => {
    let history = createHistory(
      createSnapshot(2, 2, [
        ["a", ""],
        ["", ""],
      ]),
    );

    history = pushHistory(
      history,
      createSnapshot(2, 2, [
        ["a", "b"],
        ["", ""],
      ]),
    );
    history = pushHistory(
      history,
      createSnapshot(2, 2, [
        ["a", "b"],
        ["c", ""],
      ]),
    );

    expect(canUndo(history)).toBe(true);
    history = undo(history);
    expect(history.present.cells[1]?.[0]).toBe("");
    expect(canRedo(history)).toBe(true);

    history = redo(history);
    expect(history.present.cells[1]?.[0]).toBe("c");
  });

  it("clears the redo stack after a new change", () => {
    let history = createHistory(createSnapshot(1, 1, [["one"]]));
    history = pushHistory(history, createSnapshot(1, 1, [["two"]]));
    history = undo(history);
    history = pushHistory(history, createSnapshot(1, 1, [["three"]]));

    expect(canRedo(history)).toBe(false);
    expect(history.present.cells[0]?.[0]).toBe("three");
  });

  it("ignores duplicate snapshots", () => {
    const snapshot = createSnapshot(1, 1, [["same"]]);
    const history = createHistory(snapshot);
    const next = pushHistory(history, createSnapshot(1, 1, [["same"]]));

    expect(next.past).toHaveLength(0);
    expect(next).toBe(history);
  });

  it("drops the oldest past entry after 50 pushes", () => {
    let history = createHistory(createSnapshot(1, 1, [["0"]]));
    const firstPresent = history.present;

    for (let i = 1; i <= 51; i += 1) {
      history = pushHistory(history, createSnapshot(1, 1, [[String(i)]]));
    }

    expect(history.past).toHaveLength(50);
    expect(history.past[0]).not.toBe(firstPresent);
    expect(history.past[0]?.cells[0]?.[0]).toBe("1");
    expect(history.present.cells[0]?.[0]).toBe("51");
  });
});
