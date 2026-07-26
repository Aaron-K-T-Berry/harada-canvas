import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { backupToAppData, parseBackupJson } from "@/lib/backup/backup";
import { downloadTextFile } from "@/lib/download";
import type { SquareRepository } from "@/lib/storage/repository";
import { type AppPreferences, createEmptyAppData, DEFAULT_PREFERENCES } from "@/models/app-data";

interface StorageRecoveryProps {
  repository: SquareRepository;
  reason: string;
  raw: string | null;
  onRecovered: (preferences: AppPreferences) => void;
}

export function StorageRecovery({ repository, reason, raw, onRecovered }: StorageRecoveryProps) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDownloadRaw = () => {
    downloadTextFile(
      "harada-canvas-corrupted-storage.json",
      raw ?? "",
      "application/json;charset=utf-8",
    );
    setMessage("Downloaded the raw local data for safekeeping.");
    setError(null);
  };

  const handleReset = () => {
    repository.clear();
    const empty = createEmptyAppData(DEFAULT_PREFERENCES);
    repository.write(empty);
    onRecovered(empty.preferences);
  };

  const handleImportReplace = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const parsed = parseBackupJson(text);
      if (!parsed.ok) {
        setError(parsed.reason);
        setMessage(null);
        return;
      }

      const data = backupToAppData(parsed.backup);
      repository.write(data);
      onRecovered(data.preferences);
    } catch {
      setError("Could not read the selected backup file.");
      setMessage(null);
    }
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-5 px-4 py-12 sm:px-6"
    >
      <h1 className="text-3xl font-semibold tracking-tight">Local data needs attention</h1>
      <p className="text-muted-foreground">
        Harada Canvas could not read the squares saved in this browser. Your existing data was left
        unchanged. Clearing site data also permanently removes squares, so keep JSON backups once
        you recover.
      </p>
      <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground">
        {reason}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={handleDownloadRaw} disabled={!raw}>
          Download raw data
        </Button>
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
          Replace from JSON backup
        </Button>
        <Button type="button" variant="default" onClick={handleReset}>
          Reset local data
        </Button>
        <input
          id={fileInputId}
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            void handleImportReplace(file);
            event.target.value = "";
          }}
        />
      </div>
      <div className="space-y-1 text-sm" aria-live="polite">
        {message ? <p>{message}</p> : null}
        {error ? <p className="text-destructive">{error}</p> : null}
      </div>
    </main>
  );
}
