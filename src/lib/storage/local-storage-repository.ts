import type { SquareRepository, StorageReadResult } from "@/lib/storage/repository";
import {
  APP_DATA_VERSION,
  type AppData,
  type AppPreferences,
  createEmptyAppData,
  DEFAULT_PREFERENCES,
  type ThemePreference,
} from "@/models/app-data";
import { type HaradaSquare, isValidGridSize } from "@/models/harada-square";

export const STORAGE_KEY = "harada-canvas:v1";

function isRecord(value: unknown): value is Record<string, unknown> {
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

export function parseAppData(
  raw: string,
): { ok: true; data: AppData } | { ok: false; reason: string } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: "Stored data is not valid JSON." };
  }

  if (!isRecord(parsed)) {
    return { ok: false, reason: "Stored data must be an object." };
  }

  if (parsed.version !== APP_DATA_VERSION) {
    return {
      ok: false,
      reason: `Unsupported data version: ${String(parsed.version)}.`,
    };
  }

  if (!Array.isArray(parsed.squares) || !parsed.squares.every(isValidHaradaSquare)) {
    return { ok: false, reason: "Stored squares failed validation." };
  }

  if (!isValidPreferences(parsed.preferences)) {
    return { ok: false, reason: "Stored preferences failed validation." };
  }

  const data: AppData = {
    version: APP_DATA_VERSION,
    squares: parsed.squares,
    preferences: parsed.preferences,
  };

  return { ok: true, data };
}

export function createLocalStorageRepository(
  storage: Storage = localStorage,
  key = STORAGE_KEY,
): SquareRepository {
  const read = (): StorageReadResult => {
    const raw = storage.getItem(key);

    if (raw === null) {
      return { status: "empty", data: createEmptyAppData() };
    }

    const parsed = parseAppData(raw);
    if (!parsed.ok) {
      return {
        status: "invalid",
        data: createEmptyAppData(),
        raw,
        reason: parsed.reason,
      };
    }

    return { status: "ok", data: parsed.data };
  };

  const write = (data: AppData): void => {
    storage.setItem(key, JSON.stringify(data));
  };

  const requireData = (): AppData => {
    const result = read();
    if (result.status === "invalid") {
      throw new Error(result.reason);
    }
    return result.data;
  };

  return {
    read,
    write,
    listSquares() {
      return requireData().squares;
    },
    getSquare(id) {
      return requireData().squares.find((square) => square.id === id);
    },
    saveSquare(square) {
      if (!isValidHaradaSquare(square)) {
        throw new Error("Cannot save an invalid square.");
      }

      const data = requireData();
      const index = data.squares.findIndex((item) => item.id === square.id);
      const nextSquares =
        index === -1
          ? [...data.squares, square]
          : data.squares.map((item, itemIndex) => (itemIndex === index ? square : item));

      write({ ...data, squares: nextSquares });
    },
    deleteSquare(id) {
      const data = requireData();
      write({
        ...data,
        squares: data.squares.filter((square) => square.id !== id),
      });
    },
    getPreferences() {
      return requireData().preferences;
    },
    setPreferences(preferences) {
      if (!isValidPreferences(preferences)) {
        throw new Error("Cannot save invalid preferences.");
      }

      const data = requireData();
      write({ ...data, preferences });
    },
    exportBackup() {
      const data = requireData();
      return {
        version: data.version,
        exportedAt: new Date().toISOString(),
        squares: data.squares,
        preferences: data.preferences,
      };
    },
    clear() {
      storage.removeItem(key);
    },
  };
}

export { DEFAULT_PREFERENCES };
