import { parseAppDocument } from "@/lib/storage/parse-document";
import { APP_DATA_VERSION, type AppData, type HaradaCanvasBackup } from "@/models/app-data";

export type BackupParseResult =
  | { ok: true; backup: HaradaCanvasBackup }
  | { ok: false; reason: string };

export function parseBackupJson(raw: string): BackupParseResult {
  const parsed = parseAppDocument(raw, "backup");
  if (!parsed.ok) {
    return parsed;
  }

  if (typeof parsed.exportedAt !== "string" || Number.isNaN(Date.parse(parsed.exportedAt))) {
    return { ok: false, reason: "Backup exportedAt timestamp is invalid." };
  }

  return {
    ok: true,
    backup: {
      version: APP_DATA_VERSION,
      exportedAt: parsed.exportedAt,
      squares: parsed.data.squares,
      preferences: parsed.data.preferences,
    },
  };
}

export function backupToAppData(backup: HaradaCanvasBackup): AppData {
  return {
    version: APP_DATA_VERSION,
    squares: backup.squares,
    preferences: backup.preferences,
  };
}

export function mergeBackupIntoAppData(
  current: AppData,
  backup: HaradaCanvasBackup,
): { data: AppData; importedCount: number; conflictCount: number } {
  const existingIds = new Set(current.squares.map((square) => square.id));
  let conflictCount = 0;

  const importedSquares = backup.squares.map((square) => {
    if (!existingIds.has(square.id)) {
      existingIds.add(square.id);
      return square;
    }

    conflictCount += 1;
    const nextId = crypto.randomUUID();
    existingIds.add(nextId);
    return {
      ...square,
      id: nextId,
      title: square.title.endsWith("(imported)") ? square.title : `${square.title} (imported)`,
      updatedAt: new Date().toISOString(),
    };
  });

  return {
    data: {
      version: APP_DATA_VERSION,
      squares: [...current.squares, ...importedSquares],
      preferences: current.preferences,
    },
    importedCount: importedSquares.length,
    conflictCount,
  };
}

export function createBackupFilename(exportedAt = new Date()): string {
  const stamp = exportedAt.toISOString().replace(/[:.]/g, "-");
  return `harada-canvas-backup-${stamp}.json`;
}
