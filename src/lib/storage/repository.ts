import type { AppData, AppPreferences, HaradaCanvasBackup } from "@/models/app-data";
import type { HaradaSquare } from "@/models/harada-square";

export type StorageReadResult =
  | { status: "ok"; data: AppData }
  | { status: "empty"; data: AppData }
  | { status: "invalid"; data: AppData; raw: string | null; reason: string };

export interface SquareRepository {
  read(): StorageReadResult;
  write(data: AppData): void;
  listSquares(): HaradaSquare[];
  getSquare(id: string): HaradaSquare | undefined;
  saveSquare(square: HaradaSquare): void;
  deleteSquare(id: string): void;
  getPreferences(): AppPreferences;
  setPreferences(preferences: AppPreferences): void;
  exportBackup(): HaradaCanvasBackup;
  clear(): void;
}
