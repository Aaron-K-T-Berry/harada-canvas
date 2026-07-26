import { useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { EditorToolbar } from "@/features/editor/editor-toolbar";
import { HaradaGrid } from "@/features/editor/harada-grid";
import { useEditorSession } from "@/features/editor/use-editor-session";
import { useRepository } from "@/lib/storage/repository-context";

export function EditorPage() {
  const { squareId } = useParams();
  const repository = useRepository();
  const editor = useEditorSession(squareId, repository);
  const flushRef = useRef(editor.flushPendingSave);
  const undoRef = useRef(editor.undo);
  const redoRef = useRef(editor.redo);

  useEffect(() => {
    flushRef.current = editor.flushPendingSave;
    undoRef.current = editor.undo;
    redoRef.current = editor.redo;
  }, [editor.flushPendingSave, editor.redo, editor.undo]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.tagName === "TEXTAREA" || target.tagName === "INPUT" || target.isContentEditable)
      ) {
        return;
      }

      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier) {
        return;
      }

      if (event.key.toLowerCase() === "z" && !event.shiftKey) {
        event.preventDefault();
        undoRef.current();
        return;
      }

      if ((event.key.toLowerCase() === "z" && event.shiftKey) || event.key.toLowerCase() === "y") {
        event.preventDefault();
        redoRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    return () => {
      flushRef.current();
    };
  }, []);

  if (editor.status === "loading") {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <p className="text-muted-foreground">Loading square…</p>
      </main>
    );
  }

  if (editor.status === "missing" || !editor.square) {
    return (
      <main className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6">
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

  const square = editor.square;

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{square.title}</h1>
          <p className="mt-1 text-muted-foreground">
            {editor.isExample
              ? "Example square — edits stay in this session and are not saved."
              : "Changes save automatically to this browser."}
          </p>
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

      <EditorToolbar
        rows={square.rows}
        columns={square.columns}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        onUndo={editor.undo}
        onRedo={editor.redo}
        onAddRow={editor.addRow}
        onAddColumn={editor.addColumn}
        onRemoveRow={() => editor.removeRow()}
        onRemoveColumn={() => editor.removeColumn()}
      />

      <HaradaGrid square={square} onChangeCell={editor.setCellValue} />

      <div className="space-y-1 text-sm" aria-live="polite">
        {editor.announcement ? <p>{editor.announcement}</p> : null}
        {editor.saveError ? <p className="text-destructive">{editor.saveError}</p> : null}
        {editor.isExample ? (
          <p className="text-muted-foreground">
            Create your own square from the dashboard to keep work after reload.
          </p>
        ) : null}
      </div>

      <AlertDialog
        open={editor.pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) {
            editor.cancelPendingRemoval();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {editor.pendingRemoval?.kind === "row" ? "row" : "column"} with text?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This {editor.pendingRemoval?.kind} contains text. Removing it permanently deletes that
              content from the square.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={editor.cancelPendingRemoval}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={editor.confirmPendingRemoval}>
              Remove {editor.pendingRemoval?.kind}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
