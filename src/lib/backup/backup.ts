import { isValidHaradaSquare, isValidPreferences } from "@/lib/storage/local-storage-repository";
import {
  APP_DATA_VERSION,
  type AppData,
  type AppPreferences,
  type HaradaCanvasBackup,
} from "@/models/app-data";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export type BackupParseResult =
  | { ok: true; backup: HaradaCanvasBackup }
  | { ok: false; reason: string };

export function parseBackupJson(raw: string): BackupParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "Backup file is not valid JSON." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, reason: "Backup file must be a JSON object." };
  }

  if (parsed.version !== APP_DATA_VERSION) {
    return {
      ok: false,
      reason: `Unsupported backup version: ${String(parsed.version)}.`,
    };
  }

  if (typeof parsed.exportedAt !== "string" || Number.isNaN(Date.parse(parsed.exportedAt))) {
    return { ok: false, reason: "Backup exportedAt timestamp is invalid." };
  }

  if (!Array.isArray(parsed.squares) || !parsed.squares.every(isValidHaradaSquare)) {
    return { ok: false, reason: "Backup squares failed validation." };
  }

  if (!isValidPreferences(parsed.preferences)) {
    return { ok: false, reason: "Backup preferences failed validation." };
  }

  return {
    ok: true,
    backup: {
      version: APP_DATA_VERSION,
      exportedAt: parsed.exportedAt,
      squares: parsed.squares,
      preferences: parsed.preferences,
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
  options: { mergePreferences: boolean } = { mergePreferences: false },
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

  const preferences: AppPreferences = options.mergePreferences
    ? backup.preferences
    : current.preferences;

  return {
    data: {
      version: APP_DATA_VERSION,
      squares: [...current.squares, ...importedSquares],
      preferences,
    },
    importedCount: importedSquares.length,
    conflictCount,
  };
}

export function createBackupFilename(exportedAt = new Date()): string {
  const stamp = exportedAt.toISOString().replace(/[:.]/g, "-");
  return `harada-canvas-backup-${stamp}.json`;
}
