import {
  isValidHaradaSquare,
  isValidPreferences,
  parseAppDocument,
} from "@/lib/storage/parse-document";
import type { SquareRepository, StorageReadResult } from "@/lib/storage/repository";
import { type AppData, createEmptyAppData } from "@/models/app-data";

export const STORAGE_KEY = "harada-canvas:v1";

export { isValidHaradaSquare, isValidPreferences } from "@/lib/storage/parse-document";

export function parseAppData(
  raw: string,
): { ok: true; data: AppData } | { ok: false; reason: string } {
  const parsed = parseAppDocument(raw, "stored");
  if (!parsed.ok) {
    return parsed;
  }
  return { ok: true, data: parsed.data };
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
