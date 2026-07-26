import { Download, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorToolbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExportMarkdown?: () => void;
}

export function EditorToolbar({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExportMarkdown,
}: EditorToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Editor controls">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canUndo}
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
        disabled={!canRedo}
        onClick={onRedo}
        aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z Control+Y Meta+Y"
      >
        <Redo2 />
        Redo
      </Button>
      {onExportMarkdown ? (
        <Button type="button" variant="outline" size="sm" onClick={onExportMarkdown}>
          <Download />
          Export Markdown
        </Button>
      ) : null}
    </div>
  );
}
