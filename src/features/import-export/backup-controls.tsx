import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  backupToAppData,
  createBackupFilename,
  mergeBackupIntoAppData,
  parseBackupJson,
} from "@/lib/backup/backup";
import { downloadTextFile } from "@/lib/download";
import type { SquareRepository } from "@/lib/storage/repository";
import type { AppPreferences } from "@/models/app-data";
import { createEmptyAppData } from "@/models/app-data";

type ImportMode = "merge" | "replace";

interface BackupControlsProps {
  repository: SquareRepository;
  onDataChanged: (preferences?: AppPreferences) => void;
  onAnnounce: (message: string) => void;
}

export function BackupControls({ repository, onDataChanged, onAnnounce }: BackupControlsProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingRaw, setPendingRaw] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleExport = () => {
    try {
      const backup = repository.exportBackup();
      downloadTextFile(
        createBackupFilename(new Date(backup.exportedAt)),
        `${JSON.stringify(backup, null, 2)}\n`,
        "application/json;charset=utf-8",
      );
      onAnnounce("Downloaded a JSON backup of all squares and preferences.");
    } catch (error) {
      onAnnounce(error instanceof Error ? error.message : "Unable to export backup.");
    }
  };

  const openImportPicker = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChosen = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseBackupJson(text);
      if (!parsed.ok) {
        setImportError(parsed.reason);
        onAnnounce(parsed.reason);
        return;
      }

      setPendingRaw(text);
      setDialogOpen(true);
      setImportError(null);
    } catch {
      const message = "Could not read the selected backup file.";
      setImportError(message);
      onAnnounce(message);
    }
  };

  const applyImport = (mode: ImportMode) => {
    if (!pendingRaw) {
      return;
    }

    const parsed = parseBackupJson(pendingRaw);
    if (!parsed.ok) {
      setImportError(parsed.reason);
      return;
    }

    const currentRead = repository.read();
    const current =
      currentRead.status === "ok" || currentRead.status === "empty"
        ? currentRead.data
        : createEmptyAppData();

    if (mode === "replace") {
      const data = backupToAppData(parsed.backup);
      repository.write(data);
      onDataChanged(data.preferences);
      onAnnounce(
        `Replaced local data with ${String(data.squares.length)} square${data.squares.length === 1 ? "" : "s"} from the backup.`,
      );
    } else {
      const merged = mergeBackupIntoAppData(current, parsed.backup, { mergePreferences: false });
      repository.write(merged.data);
      onDataChanged(merged.data.preferences);
      onAnnounce(
        `Added ${String(merged.importedCount)} square${merged.importedCount === 1 ? "" : "s"} from the backup${merged.conflictCount > 0 ? ` (${String(merged.conflictCount)} id conflict${merged.conflictCount === 1 ? "" : "s"} reassigned)` : ""}.`,
      );
    }

    setDialogOpen(false);
    setPendingRaw(null);
  };

  return (
    <section aria-label="Backup and restore" className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-medium">Backup and restore</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Squares stay only in this browser. Export a JSON backup before clearing site data,
          switching browsers, or updating devices. Invalid backups never change your current data.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handleExport}>
          Export JSON backup
        </Button>
        <Button type="button" variant="outline" onClick={openImportPicker}>
          Import JSON backup
        </Button>
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            void handleFileChosen(file);
            event.target.value = "";
          }}
        />
      </div>
      {importError ? (
        <p className="text-sm text-destructive" role="alert">
          {importError}
        </p>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setPendingRaw(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import backup</DialogTitle>
            <DialogDescription>
              Choose whether imported squares should be added to your current squares or replace
              them entirely. Replace also restores preferences from the backup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="outline" onClick={() => applyImport("merge")}>
              Add to existing
            </Button>
            <Button type="button" onClick={() => applyImport("replace")}>
              Replace all data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
