import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EditorToolbar } from "@/features/editor/editor-toolbar";
import { HaradaGrid } from "@/features/editor/harada-grid";
import { MobileEditorBanner } from "@/features/editor/mobile-editor-banner";
import { useEditorSession } from "@/features/editor/use-editor-session";
import { useIsCompactViewport } from "@/hooks/use-media-query";
import { downloadTextFile } from "@/lib/download";
import { markdownFilename, squareToMarkdown } from "@/lib/markdown/export-markdown";
import { useRepository } from "@/lib/storage/repository-context";

export function EditorPage() {
  const { squareId } = useParams();
  const repository = useRepository();
  const editor = useEditorSession(squareId, repository);
  const isCompact = useIsCompactViewport();
  const [mobileEditingEnabled, setMobileEditingEnabled] = useState(false);
  const undoRef = useRef(editor.undo);
  const redoRef = useRef(editor.redo);
  const [exportAnnouncement, setExportAnnouncement] = useState("");

  const readOnly = isCompact && !mobileEditingEnabled;
  const compact = isCompact;

  useEffect(() => {
    undoRef.current = editor.undo;
    redoRef.current = editor.redo;
  }, [editor.redo, editor.undo]);

  useEffect(() => {
    if (!isCompact) {
      setMobileEditingEnabled(false);
    }
  }, [isCompact]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (readOnly) {
        return;
      }

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
  }, [readOnly]);

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

  const square = editor.square;

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
          <p className="mt-1 text-muted-foreground">
            {editor.isExample
              ? "Example square — edits stay in this session and are not saved."
              : readOnly
                ? "Viewing mode for smaller screens."
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

      {isCompact ? (
        <MobileEditorBanner
          editingEnabled={mobileEditingEnabled}
          onEnableEditing={() => setMobileEditingEnabled(true)}
          onDisableEditing={() => setMobileEditingEnabled(false)}
        />
      ) : null}

      {!readOnly ? (
        <EditorToolbar
          canUndo={editor.canUndo}
          canRedo={editor.canRedo}
          onUndo={editor.undo}
          onRedo={editor.redo}
          onExportMarkdown={handleExportMarkdown}
        />
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={handleExportMarkdown}>
            Export Markdown
          </Button>
        </div>
      )}

      <HaradaGrid
        square={square}
        onChangeCell={editor.setCellValue}
        readOnly={readOnly}
        compact={compact}
      />

      <div
        className="space-y-1 text-sm"
        aria-live={editor.saveError ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {editor.announcement ? <p>{editor.announcement}</p> : null}
        {exportAnnouncement ? <p>{exportAnnouncement}</p> : null}
        {editor.saveError ? <p className="text-destructive">{editor.saveError}</p> : null}
        {editor.isExample ? (
          <p className="text-muted-foreground">
            Create your own square from the dashboard to keep work after reload.
          </p>
        ) : null}
      </div>
    </main>
  );
}
