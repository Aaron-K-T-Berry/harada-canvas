import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { RenameSquareDialog } from "@/features/dashboard/rename-square-dialog";
import { EditorToolbar } from "@/features/editor/editor-toolbar";
import { HaradaGrid } from "@/features/editor/harada-grid";
import { MobileEditorBanner } from "@/features/editor/mobile-editor-banner";
import { useEditorSession } from "@/features/editor/use-editor-session";
import { useIsCompactViewport } from "@/hooks/use-media-query";
import { useUndoRedoShortcuts } from "@/hooks/use-undo-redo-shortcuts";
import { downloadTextFile } from "@/lib/download";
import { markdownFilename, squareToMarkdown } from "@/lib/markdown/export-markdown";
import { useRepository } from "@/lib/storage/repository-context";
import type { HaradaSquare } from "@/models/harada-square";

function editorSubtitle(isExample: boolean, readOnly: boolean): string {
  if (isExample) {
    return "Example square — edits stay in this session and are not saved.";
  }
  if (readOnly) {
    return "Viewing mode for smaller screens.";
  }
  return "Changes save automatically to this browser.";
}

function EditorPageActions({
  readOnly,
  canRename,
  squareTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onExportMarkdown,
  onRename,
}: {
  readOnly: boolean;
  canRename: boolean;
  squareTitle: string;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExportMarkdown: () => void;
  onRename: () => void;
}) {
  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onExportMarkdown}>
          Export Markdown
        </Button>
      </div>
    );
  }

  return (
    <EditorToolbar
      canUndo={canUndo}
      canRedo={canRedo}
      onUndo={onUndo}
      onRedo={onRedo}
      onExportMarkdown={onExportMarkdown}
      onRename={canRename ? onRename : undefined}
      renameLabel={canRename ? `Rename ${squareTitle}` : undefined}
    />
  );
}

function EditorStatusRegion({
  announcement,
  exportAnnouncement,
  saveError,
  isExample,
}: {
  announcement: string;
  exportAnnouncement: string;
  saveError: string | null;
  isExample: boolean;
}) {
  return (
    <div
      className="space-y-1 text-sm"
      aria-live={saveError ? "assertive" : "polite"}
      aria-atomic="true"
    >
      {announcement ? <p>{announcement}</p> : null}
      {exportAnnouncement ? <p>{exportAnnouncement}</p> : null}
      {saveError ? <p className="text-destructive">{saveError}</p> : null}
      {isExample ? (
        <p className="text-muted-foreground">
          Create your own square from the dashboard to keep work after reload.
        </p>
      ) : null}
    </div>
  );
}

export function EditorPage() {
  const { squareId } = useParams();
  const repository = useRepository();
  const editor = useEditorSession(squareId, repository);
  const isCompact = useIsCompactViewport();
  const [mobileEditingEnabled, setMobileEditingEnabled] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [exportAnnouncement, setExportAnnouncement] = useState("");

  const readOnly = isCompact && !mobileEditingEnabled;
  const compact = isCompact;
  const canRename = !readOnly && !editor.isExample;

  useUndoRedoShortcuts({
    enabled: !readOnly,
    undo: editor.undo,
    redo: editor.redo,
  });

  useEffect(() => {
    if (!isCompact) {
      setMobileEditingEnabled(false);
    }
  }, [isCompact]);

  if (editor.status === "loading") {
    return (
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-muted-foreground">Loading square…</p>
      </main>
    );
  }

  if (editor.status === "missing" || !editor.square) {
    return (
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6"
      >
        <h1 className="text-3xl font-semibold tracking-tight">Square not found</h1>
        <p className="text-muted-foreground">
          This square is not saved in this browser. Create a new square from the dashboard.
        </p>
        <div>
          <Button asChild variant="outline">
            <Link to="/">Back to dashboard</Link>
          </Button>
        </div>
      </main>
    );
  }

  const square: HaradaSquare = editor.square;

  const handleExportMarkdown = () => {
    editor.flushPendingSave();
    downloadTextFile(
      markdownFilename(square),
      squareToMarkdown(square),
      "text/markdown;charset=utf-8",
    );
    setExportAnnouncement("Downloaded a Markdown export of this square.");
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{square.title}</h1>
          <p className="mt-1 text-muted-foreground">{editorSubtitle(editor.isExample, readOnly)}</p>
        </div>
        <Button asChild variant="outline">
          <Link
            to="/"
            onClick={() => {
              editor.flushPendingSave();
            }}
          >
            Back to dashboard
          </Link>
        </Button>
      </div>

      {isCompact ? (
        <MobileEditorBanner
          editingEnabled={mobileEditingEnabled}
          onEnableEditing={() => setMobileEditingEnabled(true)}
          onDisableEditing={() => setMobileEditingEnabled(false)}
        />
      ) : null}

      <EditorPageActions
        readOnly={readOnly}
        canRename={canRename}
        squareTitle={square.title}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onExportMarkdown={handleExportMarkdown}
        onRename={() => setRenameOpen(true)}
      />

      <HaradaGrid
        square={square}
        onChangeCell={editor.setCellValue}
        readOnly={readOnly}
        compact={compact}
      />

      <EditorStatusRegion
        announcement={editor.announcement}
        exportAnnouncement={exportAnnouncement}
        saveError={editor.saveError}
        isExample={editor.isExample}
      />

      <RenameSquareDialog
        open={renameOpen}
        initialTitle={square.title}
        onOpenChange={setRenameOpen}
        onRename={editor.renameTitle}
      />
    </main>
  );
}
