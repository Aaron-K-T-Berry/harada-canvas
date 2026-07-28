import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { resolveCellKeyAction } from "@/features/editor/domain/cell-keyboard";
import { moveFocus, nextTabPosition } from "@/features/editor/domain/navigation";
import { HaradaGridCell } from "@/features/editor/harada-grid-cell";
import type { HaradaSquare } from "@/models/harada-square";

interface HaradaGridProps {
  square: HaradaSquare;
  onChangeCell: (row: number, column: number, value: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

export function HaradaGrid({
  square,
  onChangeCell,
  readOnly = false,
  compact = false,
}: HaradaGridProps) {
  const labelId = useId();
  const [focused, setFocused] = useState({ row: 0, column: 0 });
  const [editing, setEditing] = useState<{ row: number; column: number } | null>(null);
  const [draft, setDraft] = useState("");
  const cellRefs = useRef<Array<Array<HTMLButtonElement | null>>>([]);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setFocused((current) => ({
      row: Math.min(current.row, square.rows - 1),
      column: Math.min(current.column, square.columns - 1),
    }));
  }, [square.rows, square.columns]);

  useEffect(() => {
    if (!editing) {
      return;
    }
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const focusCell = (row: number, column: number) => {
    setFocused({ row, column });
    queueMicrotask(() => {
      cellRefs.current[row]?.[column]?.focus();
    });
  };

  const beginEdit = (row: number, column: number) => {
    if (readOnly) {
      return;
    }
    setDraft(square.cells[row]?.[column] ?? "");
    setEditing({ row, column });
  };

  const commitEdit = () => {
    if (!editing) {
      return;
    }
    onChangeCell(editing.row, editing.column, draft);
    const { row, column } = editing;
    setEditing(null);
    focusCell(row, column);
  };

  const cancelEdit = () => {
    if (!editing) {
      return;
    }
    const { row, column } = editing;
    setEditing(null);
    focusCell(row, column);
  };

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    row: number,
    column: number,
  ) => {
    if (editing) {
      return;
    }

    const action = resolveCellKeyAction(
      event.key,
      {
        shiftKey: event.shiftKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        altKey: event.altKey,
      },
      readOnly,
    );

    if (action.type === "none") {
      return;
    }

    event.preventDefault();

    if (action.type === "move") {
      const next = moveFocus({ row, column }, action.direction, square.rows, square.columns);
      focusCell(next.row, next.column);
      return;
    }

    if (action.type === "edit") {
      beginEdit(row, column);
      return;
    }

    if (action.type === "tab") {
      const next = nextTabPosition({ row, column }, square.rows, square.columns, action.reverse);
      focusCell(next.row, next.column);
      return;
    }

    setDraft(action.character);
    setEditing({ row, column });
  };

  const handleEditorKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelEdit();
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      commitEdit();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p id={labelId} className="text-sm text-muted-foreground">
        {readOnly
          ? "Use arrow keys or swipe to move between cells. Editing is turned off in this view."
          : "Use arrow keys to move between cells. Press Enter or F2 to edit. Escape cancels an edit."}
      </p>
      {/* biome-ignore lint/a11y/useSemanticElements: spreadsheet-style Harada grid uses ARIA grid roles */}
      <div
        role="grid"
        aria-labelledby={labelId}
        aria-readonly={readOnly || undefined}
        aria-rowcount={square.rows}
        aria-colcount={square.columns}
        className="overflow-auto rounded-lg border border-border"
      >
        <div
          className="inline-grid min-w-full"
          style={{
            gridTemplateColumns: `repeat(${square.columns}, minmax(${compact ? "3.25rem" : "4.5rem"}, 1fr))`,
          }}
        >
          {Array.from({ length: square.rows * square.columns }, (_, index) => {
            const rowIndex = Math.floor(index / square.columns);
            const columnIndex = index % square.columns;
            return (
              <HaradaGridCell
                key={`r${rowIndex}-c${columnIndex}`}
                rowIndex={rowIndex}
                columnIndex={columnIndex}
                rows={square.rows}
                columns={square.columns}
                value={square.cells[rowIndex]?.[columnIndex] ?? ""}
                isFocused={focused.row === rowIndex && focused.column === columnIndex}
                isEditing={editing?.row === rowIndex && editing.column === columnIndex}
                draft={draft}
                readOnly={readOnly}
                compact={compact}
                inputRef={inputRef}
                cellRef={(element) => {
                  if (!cellRefs.current[rowIndex]) {
                    cellRefs.current[rowIndex] = [];
                  }
                  const rowRefs = cellRefs.current[rowIndex];
                  if (rowRefs) {
                    rowRefs[columnIndex] = element;
                  }
                }}
                onFocusCell={() => setFocused({ row: rowIndex, column: columnIndex })}
                onBeginEdit={() => beginEdit(rowIndex, columnIndex)}
                onDraftChange={setDraft}
                onCommitEdit={commitEdit}
                onEditorKeyDown={handleEditorKeyDown}
                onCellKeyDown={(event) => handleCellKeyDown(event, rowIndex, columnIndex)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
