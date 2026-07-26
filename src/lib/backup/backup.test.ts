import {
  backupToAppData,
  createBackupFilename,
  mergeBackupIntoAppData,
  parseBackupJson,
} from "@/lib/backup/backup";
import { APP_DATA_VERSION, createEmptyAppData, DEFAULT_PREFERENCES } from "@/models/app-data";
import { createStandardSquare } from "@/models/harada-square";

describe("backup parsing and merge", () => {
  const square = createStandardSquare({ id: "square-1", title: "One" });

  const validBackup = {
    version: APP_DATA_VERSION,
    exportedAt: "2026-01-01T00:00:00.000Z",
    squares: [square],
    preferences: { theme: "dark" as const, onboardingSeen: true },
  };

  it("parses a valid versioned backup", () => {
    const result = parseBackupJson(JSON.stringify(validBackup));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.backup.squares).toEqual([square]);
      expect(result.backup.preferences.theme).toBe("dark");
    }
  });

  it("rejects invalid and unsupported backups without mutation helpers", () => {
    expect(parseBackupJson("{nope").ok).toBe(false);
    expect(parseBackupJson(JSON.stringify({ ...validBackup, version: 99 })).ok).toBe(false);
    expect(
      parseBackupJson(
        JSON.stringify({
          ...validBackup,
          squares: [{ ...square, rows: 3, columns: 3, cells: [["a"]] }],
        }),
      ).ok,
    ).toBe(false);
  });

  it("converts a backup into app data for replace imports", () => {
    const result = parseBackupJson(JSON.stringify(validBackup));
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(backupToAppData(result.backup)).toEqual({
      version: APP_DATA_VERSION,
      squares: [square],
      preferences: validBackup.preferences,
    });
  });

  it("merges backups and reassigns conflicting ids", () => {
    const current = createEmptyAppData(DEFAULT_PREFERENCES);
    current.squares = [square];

    const incoming = createStandardSquare({
      id: "square-1",
      title: "Incoming",
      cells: square.cells,
    });
    const unique = createStandardSquare({ id: "square-2", title: "Unique" });

    const merged = mergeBackupIntoAppData(current, {
      version: APP_DATA_VERSION,
      exportedAt: "2026-01-02T00:00:00.000Z",
      squares: [incoming, unique],
      preferences: { theme: "light", onboardingSeen: true },
    });

    expect(merged.importedCount).toBe(2);
    expect(merged.conflictCount).toBe(1);
    expect(merged.data.squares).toHaveLength(3);
    expect(merged.data.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(merged.data.squares.filter((item) => item.id === "square-1")).toHaveLength(1);
    expect(merged.data.squares.some((item) => item.title === "Incoming (imported)")).toBe(true);
    expect(merged.data.squares.some((item) => item.id === "square-2")).toBe(true);
  });

  it("builds a backup filename", () => {
    expect(createBackupFilename(new Date("2026-01-02T03:04:05.678Z"))).toBe(
      "harada-canvas-backup-2026-01-02T03-04-05-678Z.json",
    );
  });
});
