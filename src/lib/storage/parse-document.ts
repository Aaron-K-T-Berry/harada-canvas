import {
  APP_DATA_VERSION,
  type AppData,
  type AppPreferences,
  type ThemePreference,
} from "@/models/app-data";
import { type HaradaSquare, isValidGridSize } from "@/models/harada-square";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

function isIsoDateString(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

export function isValidHaradaSquare(value: unknown): value is HaradaSquare {
  if (!isRecord(value)) {
    return false;
  }

  const { id, title, createdAt, updatedAt, rows, columns, cells } = value;

  if (
    typeof id !== "string" ||
    id.length === 0 ||
    typeof title !== "string" ||
    !isIsoDateString(createdAt) ||
    !isIsoDateString(updatedAt) ||
    typeof rows !== "number" ||
    typeof columns !== "number" ||
    !isValidGridSize(rows) ||
    !isValidGridSize(columns) ||
    !Array.isArray(cells) ||
    cells.length !== rows
  ) {
    return false;
  }

  return cells.every(
    (row) =>
      Array.isArray(row) && row.length === columns && row.every((cell) => typeof cell === "string"),
  );
}

export function isValidPreferences(value: unknown): value is AppPreferences {
  if (!isRecord(value)) {
    return false;
  }

  return isThemePreference(value.theme) && typeof value.onboardingSeen === "boolean";
}

type DocumentKind = "stored" | "backup";

const LABELS = {
  stored: {
    json: "Stored data is not valid JSON.",
    object: "Stored data must be an object.",
    version: (version: unknown) => `Unsupported data version: ${String(version)}.`,
    squares: "Stored squares failed validation.",
    preferences: "Stored preferences failed validation.",
  },
  backup: {
    json: "Backup file is not valid JSON.",
    object: "Backup file must be a JSON object.",
    version: (version: unknown) => `Unsupported backup version: ${String(version)}.`,
    squares: "Backup squares failed validation.",
    preferences: "Backup preferences failed validation.",
  },
} as const;

export type ParseDocumentResult =
  | { ok: true; data: AppData; exportedAt: unknown }
  | { ok: false; reason: string };

export function parseAppDocument(raw: string, kind: DocumentKind): ParseDocumentResult {
  const labels = LABELS[kind];
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: labels.json };
  }

  if (!isRecord(parsed)) {
    return { ok: false, reason: labels.object };
  }

  if (parsed.version !== APP_DATA_VERSION) {
    return { ok: false, reason: labels.version(parsed.version) };
  }

  if (!Array.isArray(parsed.squares) || !parsed.squares.every(isValidHaradaSquare)) {
    return { ok: false, reason: labels.squares };
  }

  if (!isValidPreferences(parsed.preferences)) {
    return { ok: false, reason: labels.preferences };
  }

  return {
    ok: true,
    data: {
      version: APP_DATA_VERSION,
      squares: parsed.squares,
      preferences: parsed.preferences,
    },
    exportedAt: parsed.exportedAt,
  };
}
