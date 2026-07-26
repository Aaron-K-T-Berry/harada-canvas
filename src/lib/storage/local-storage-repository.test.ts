import {
  createLocalStorageRepository,
  parseAppData,
  STORAGE_KEY,
} from "@/lib/storage/local-storage-repository";
import { createEmptyAppData, DEFAULT_PREFERENCES } from "@/models/app-data";
import { createStandardSquare } from "@/models/harada-square";

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const store = new Map(Object.entries(initial));

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key) {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    key(index) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key) {
      store.delete(key);
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

describe("local storage repository", () => {
  it("returns empty app data when nothing is stored", () => {
    const repository = createLocalStorageRepository(createMemoryStorage());
    const result = repository.read();

    expect(result.status).toBe("empty");
    expect(result.data).toEqual(createEmptyAppData());
  });

  it("round-trips squares and preferences", () => {
    const repository = createLocalStorageRepository(createMemoryStorage());
    const square = createStandardSquare({ id: "a", title: "Morning goals" });

    repository.saveSquare(square);
    repository.setPreferences({ theme: "dark", onboardingSeen: true });

    expect(repository.listSquares()).toEqual([square]);
    expect(repository.getSquare("a")).toEqual(square);
    expect(repository.getPreferences()).toEqual({
      theme: "dark",
      onboardingSeen: true,
    });
  });

  it("preserves raw data when stored JSON is invalid", () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: "{not-json" });
    const repository = createLocalStorageRepository(storage);
    const result = repository.read();

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.raw).toBe("{not-json");
      expect(result.reason).toMatch(/valid JSON/i);
      expect(result.data).toEqual(createEmptyAppData());
    }
    expect(storage.getItem(STORAGE_KEY)).toBe("{not-json");
  });

  it("rejects unsupported versions without mutating storage", () => {
    const payload = JSON.stringify({
      version: 99,
      squares: [],
      preferences: DEFAULT_PREFERENCES,
    });
    const storage = createMemoryStorage({ [STORAGE_KEY]: payload });
    const repository = createLocalStorageRepository(storage);
    const result = repository.read();

    expect(result.status).toBe("invalid");
    if (result.status === "invalid") {
      expect(result.reason).toMatch(/Unsupported data version/);
    }
    expect(storage.getItem(STORAGE_KEY)).toBe(payload);
  });

  it("exports a versioned backup", () => {
    const repository = createLocalStorageRepository(createMemoryStorage());
    const square = createStandardSquare({ id: "b", title: "Backup me" });
    repository.saveSquare(square);

    const backup = repository.exportBackup();
    expect(backup.version).toBe(1);
    expect(backup.squares).toEqual([square]);
    expect(backup.preferences).toEqual(DEFAULT_PREFERENCES);
    expect(Date.parse(backup.exportedAt)).not.toBeNaN();
  });

  it("parses valid app data", () => {
    const square = createStandardSquare({ id: "c", title: "Valid" });
    const raw = JSON.stringify({
      version: 1,
      squares: [square],
      preferences: { theme: "system", onboardingSeen: false },
    });

    expect(parseAppData(raw)).toEqual({
      ok: true,
      data: {
        version: 1,
        squares: [square],
        preferences: { theme: "system", onboardingSeen: false },
      },
    });
  });
});
