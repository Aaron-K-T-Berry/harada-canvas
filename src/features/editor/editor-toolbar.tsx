import { Columns3, Redo2, Rows3, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MAX_GRID_SIZE, MIN_GRID_SIZE } from "@/models/harada-square";

interface EditorToolbarProps {
  rows: number;
  columns: number;
  canUndo: boolean;
  canRedo: boolean;
  disabled?: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onAddRow: () => void;
  onAddColumn: () => void;
  onRemoveRow: () => void;
  onRemoveColumn: () => void;
}

export function EditorToolbar({
  rows,
  columns,
  canUndo,
  canRedo,
  disabled = false,
  onUndo,
  onRedo,
  onAddRow,
  onAddColumn,
  onRemoveRow,
  onRemoveColumn,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Grid controls">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || !canUndo}
        onClick={onUndo}
        aria-keyshortcuts="Control+Z Meta+Z"
      >
        <Undo2 />
        Undo
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || !canRedo}
        onClick={onRedo}
        aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y"
      >
        <Redo2 />
        Redo
      </Button>
      <div className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden="true" />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || rows >= MAX_GRID_SIZE}
        onClick={onAddRow}
      >
        <Rows3 />
        Add row
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || rows <= MIN_GRID_SIZE}
        onClick={onRemoveRow}
      >
        Remove row
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || columns >= MAX_GRID_SIZE}
        onClick={onAddColumn}
      >
        <Columns3 />
        Add column
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || columns <= MIN_GRID_SIZE}
        onClick={onRemoveColumn}
      >
        Remove column
      </Button>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows} × {columns}
      </p>
    </div>
  );
}
