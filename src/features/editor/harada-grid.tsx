import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { isBlockBoundary } from "@/features/editor/domain/grid-ops";
import {
  cellGuidanceLabel,
  cellStructuralRole,
  type MoveDirection,
  moveFocus,
  nextTabPosition,
} from "@/features/editor/domain/navigation";
import { cn } from "@/lib/utils";
import type { HaradaSquare } from "@/models/harada-square";

interface HaradaGridProps {
  square: HaradaSquare;
  onChangeCell: (row: number, column: number, value: string) => void;
  readOnly?: boolean;
  compact?: boolean;
}

function cellToneClasses(role: ReturnType<typeof cellStructuralRole>) {
  switch (role) {
    case "main":
      return "bg-goal-cell text-goal-cell-foreground focus-visible:bg-goal-cell";
    case "supporting":
      return "bg-supporting-cell text-supporting-cell-foreground focus-visible:bg-supporting-cell";
    default:
      return "bg-card focus-visible:bg-accent";
  }
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

    const keyToDirection: Record<string, MoveDirection> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
    };

    if (event.key in keyToDirection) {
      event.preventDefault();
      const next = moveFocus(
        { row, column },
        keyToDirection[event.key] as MoveDirection,
        square.rows,
        square.columns,
      );
      focusCell(next.row, next.column);
      return;
    }

    if (event.key === "Enter" || event.key === "F2") {
      event.preventDefault();
      beginEdit(row, column);
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const next = nextTabPosition({ row, column }, square.rows, square.columns, event.shiftKey);
      focusCell(next.row, next.column);
      return;
    }

    if (!readOnly && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      setDraft(event.key);
      setEditing({ row, column });
    }
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
            const value = square.cells[rowIndex]?.[columnIndex] ?? "";
            const cellKey = `r${rowIndex}-c${columnIndex}`;
            const isFocused = focused.row === rowIndex && focused.column === columnIndex;
            const isEditing = editing?.row === rowIndex && editing.column === columnIndex;
            const guidance = cellGuidanceLabel(rowIndex, columnIndex, square.rows, square.columns);
            const structuralRole = cellStructuralRole(
              rowIndex,
              columnIndex,
              square.rows,
              square.columns,
            );
            const toneClasses = cellToneClasses(structuralRole);
            const borderClasses = cn(
              "border-border border-r border-b",
              toneClasses,
              isBlockBoundary(columnIndex) && "border-l-2 border-l-primary/40",
              isBlockBoundary(rowIndex) && "border-t-2 border-t-primary/40",
              columnIndex === square.columns - 1 && "border-r-0",
              rowIndex === square.rows - 1 && "border-b-0",
            );

            if (isEditing) {
              return (
                // biome-ignore lint/a11y/useSemanticElements: ARIA gridcell is required inside role=grid
                <div
                  key={cellKey}
                  role="gridcell"
                  tabIndex={0}
                  aria-colindex={columnIndex + 1}
                  aria-rowindex={rowIndex + 1}
                  className={cn("p-1", compact ? "min-h-12" : "min-h-16", borderClasses)}
                >
                  <label className="sr-only" htmlFor={`cell-editor-${rowIndex}-${columnIndex}`}>
                    Edit cell row {rowIndex + 1}, column {columnIndex + 1}
                  </label>
                  <textarea
                    id={`cell-editor-${rowIndex}-${columnIndex}`}
                    ref={inputRef}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commitEdit}
                    onKeyDown={handleEditorKeyDown}
                    className={cn(
                      "h-full w-full resize-none rounded-sm border border-ring bg-background p-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      compact ? "min-h-10" : "min-h-14",
                    )}
                  />
                </div>
              );
            }

            return (
              // biome-ignore lint/a11y/useSemanticElements: ARIA gridcell is required inside role=grid
              <button
                key={cellKey}
                type="button"
                role="gridcell"
                ref={(element) => {
                  if (!cellRefs.current[rowIndex]) {
                    cellRefs.current[rowIndex] = [];
                  }
                  const rowRefs = cellRefs.current[rowIndex];
                  if (rowRefs) {
                    rowRefs[columnIndex] = element;
                  }
                }}
                tabIndex={isFocused ? 0 : -1}
                aria-colindex={columnIndex + 1}
                aria-rowindex={rowIndex + 1}
                aria-readonly={readOnly || undefined}
                aria-label={
                  value
                    ? `Row ${rowIndex + 1}, column ${columnIndex + 1}: ${value}`
                    : guidance
                      ? `Row ${rowIndex + 1}, column ${columnIndex + 1}: empty, ${guidance}`
                      : `Row ${rowIndex + 1}, column ${columnIndex + 1}: empty`
                }
                onFocus={() => setFocused({ row: rowIndex, column: columnIndex })}
                onClick={() => beginEdit(rowIndex, columnIndex)}
                onDoubleClick={() => beginEdit(rowIndex, columnIndex)}
                onKeyDown={(event) => handleCellKeyDown(event, rowIndex, columnIndex)}
                className={cn(
                  "flex w-full items-center justify-center whitespace-pre-wrap break-words p-2 text-center text-sm transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  compact ? "min-h-12 text-xs" : "min-h-16",
                  borderClasses,
                  !value && structuralRole === "action" && "text-muted-foreground",
                  !value && structuralRole !== "action" && "opacity-70",
                  readOnly && "cursor-default",
                )}
              >
                {value || guidance || ""}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
