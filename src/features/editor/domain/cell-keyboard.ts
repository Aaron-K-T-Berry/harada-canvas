import type { MoveDirection } from "@/features/editor/domain/navigation";

export type CellKeyAction =
  | { type: "move"; direction: MoveDirection }
  | { type: "edit" }
  | { type: "tab"; reverse: boolean }
  | { type: "type"; character: string }
  | { type: "none" };

const KEY_TO_DIRECTION: Record<string, MoveDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

/** Resolve a focused cell keydown into a navigation/edit action. */
export function resolveCellKeyAction(
  key: string,
  mods: { shiftKey: boolean; ctrlKey: boolean; metaKey: boolean; altKey: boolean },
  readOnly: boolean,
): CellKeyAction {
  const direction = KEY_TO_DIRECTION[key];
  if (direction) {
    return { type: "move", direction };
  }

  if (key === "Enter" || key === "F2") {
    return { type: "edit" };
  }

  if (key === "Tab") {
    return { type: "tab", reverse: mods.shiftKey };
  }

  if (!readOnly && key.length === 1 && !mods.ctrlKey && !mods.metaKey && !mods.altKey) {
    return { type: "type", character: key };
  }

  return { type: "none" };
}
