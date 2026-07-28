import type { KeyboardEvent, Ref } from "react";
import { isBlockBoundary } from "@/features/editor/domain/grid-ops";
import {
  type CellStructuralRole,
  cellGuidanceLabel,
  cellStructuralRole,
} from "@/features/editor/domain/navigation";
import { cn } from "@/lib/utils";

function cellToneClasses(role: CellStructuralRole) {
  switch (role) {
    case "main":
      return "bg-goal-cell text-goal-cell-foreground focus-visible:bg-goal-cell";
    case "supporting":
      return "bg-supporting-cell text-supporting-cell-foreground focus-visible:bg-supporting-cell";
    default:
      return "bg-card focus-visible:bg-accent";
  }
}

function cellBorderClasses(
  rowIndex: number,
  columnIndex: number,
  rows: number,
  columns: number,
  structuralRole: CellStructuralRole,
) {
  return cn(
    "border-border border-r border-b",
    cellToneClasses(structuralRole),
    isBlockBoundary(columnIndex) && "border-l-2 border-l-primary/40",
    isBlockBoundary(rowIndex) && "border-t-2 border-t-primary/40",
    columnIndex === columns - 1 && "border-r-0",
    rowIndex === rows - 1 && "border-b-0",
  );
}

function cellAriaLabel(rowIndex: number, columnIndex: number, value: string, guidance?: string) {
  const location = `Row ${rowIndex + 1}, column ${columnIndex + 1}`;
  if (value) {
    return `${location}: ${value}`;
  }
  if (guidance) {
    return `${location}: empty, ${guidance}`;
  }
  return `${location}: empty`;
}

export interface HaradaGridCellProps {
  rowIndex: number;
  columnIndex: number;
  rows: number;
  columns: number;
  value: string;
  isFocused: boolean;
  isEditing: boolean;
  draft: string;
  readOnly: boolean;
  compact: boolean;
  inputRef: Ref<HTMLTextAreaElement>;
  cellRef: (element: HTMLButtonElement | null) => void;
  onFocusCell: () => void;
  onBeginEdit: () => void;
  onDraftChange: (value: string) => void;
  onCommitEdit: () => void;
  onEditorKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onCellKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}

function HaradaGridCellEditor({
  rowIndex,
  columnIndex,
  borderClasses,
  compact,
  draft,
  inputRef,
  onDraftChange,
  onCommitEdit,
  onEditorKeyDown,
}: {
  rowIndex: number;
  columnIndex: number;
  borderClasses: string;
  compact: boolean;
  draft: string;
  inputRef: Ref<HTMLTextAreaElement>;
  onDraftChange: (value: string) => void;
  onCommitEdit: () => void;
  onEditorKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: ARIA gridcell is required inside role=grid
    <div
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
        onChange={(event) => onDraftChange(event.target.value)}
        onBlur={onCommitEdit}
        onKeyDown={onEditorKeyDown}
        className={cn(
          "h-full w-full resize-none rounded-sm border border-ring bg-background p-2 text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "min-h-10" : "min-h-14",
        )}
      />
    </div>
  );
}

function emptyCellToneClasses(
  value: string,
  structuralRole: CellStructuralRole,
): string | undefined {
  if (value) {
    return undefined;
  }
  return structuralRole === "action" ? "text-muted-foreground" : "opacity-70";
}

function HaradaGridCellButton({
  rowIndex,
  columnIndex,
  value,
  guidance,
  structuralRole,
  borderClasses,
  isFocused,
  readOnly,
  compact,
  cellRef,
  onFocusCell,
  onBeginEdit,
  onCellKeyDown,
}: {
  rowIndex: number;
  columnIndex: number;
  value: string;
  guidance?: string;
  structuralRole: CellStructuralRole;
  borderClasses: string;
  isFocused: boolean;
  readOnly: boolean;
  compact: boolean;
  cellRef: (element: HTMLButtonElement | null) => void;
  onFocusCell: () => void;
  onBeginEdit: () => void;
  onCellKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: ARIA gridcell is required inside role=grid
    <button
      type="button"
      role="gridcell"
      ref={cellRef}
      tabIndex={isFocused ? 0 : -1}
      aria-colindex={columnIndex + 1}
      aria-rowindex={rowIndex + 1}
      aria-readonly={readOnly || undefined}
      aria-label={cellAriaLabel(rowIndex, columnIndex, value, guidance)}
      onFocus={onFocusCell}
      onClick={onBeginEdit}
      onDoubleClick={onBeginEdit}
      onKeyDown={onCellKeyDown}
      className={cn(
        "flex w-full items-center justify-center whitespace-pre-wrap break-words p-2 text-center text-sm transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        compact ? "min-h-12 text-xs" : "min-h-16",
        borderClasses,
        emptyCellToneClasses(value, structuralRole),
        readOnly && "cursor-default",
      )}
    >
      {value || guidance || ""}
    </button>
  );
}

export function HaradaGridCell({
  rowIndex,
  columnIndex,
  rows,
  columns,
  value,
  isFocused,
  isEditing,
  draft,
  readOnly,
  compact,
  inputRef,
  cellRef,
  onFocusCell,
  onBeginEdit,
  onDraftChange,
  onCommitEdit,
  onEditorKeyDown,
  onCellKeyDown,
}: HaradaGridCellProps) {
  const guidance = cellGuidanceLabel(rowIndex, columnIndex, rows, columns);
  const structuralRole = cellStructuralRole(rowIndex, columnIndex, rows, columns);
  const borderClasses = cellBorderClasses(rowIndex, columnIndex, rows, columns, structuralRole);

  if (isEditing) {
    return (
      <HaradaGridCellEditor
        rowIndex={rowIndex}
        columnIndex={columnIndex}
        borderClasses={borderClasses}
        compact={compact}
        draft={draft}
        inputRef={inputRef}
        onDraftChange={onDraftChange}
        onCommitEdit={onCommitEdit}
        onEditorKeyDown={onEditorKeyDown}
      />
    );
  }

  return (
    <HaradaGridCellButton
      rowIndex={rowIndex}
      columnIndex={columnIndex}
      value={value}
      guidance={guidance}
      structuralRole={structuralRole}
      borderClasses={borderClasses}
      isFocused={isFocused}
      readOnly={readOnly}
      compact={compact}
      cellRef={cellRef}
      onFocusCell={onFocusCell}
      onBeginEdit={onBeginEdit}
      onCellKeyDown={onCellKeyDown}
    />
  );
}
