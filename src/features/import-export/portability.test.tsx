import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createBackupFilename } from "@/lib/backup/backup";
import { createLocalStorageRepository, STORAGE_KEY } from "@/lib/storage/local-storage-repository";
import { APP_DATA_VERSION } from "@/models/app-data";
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

describe("portability workflows", () => {
  beforeEach(() => {
    window.location.hash = "#/";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("exports markdown from the editor", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    repository.saveSquare(createStandardSquare({ id: "md-square", title: "Markdown me" }));

    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:mock");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    window.location.hash = "#/square/md-square";
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Markdown me" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Export Markdown" }));
    expect(screen.getByText(/Downloaded a Markdown export/i)).toBeInTheDocument();
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
  });

  it("imports a backup with merge or replace choices", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const repository = createLocalStorageRepository(storage);
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    repository.saveSquare(createStandardSquare({ id: "local", title: "Local square" }));

    const backup = {
      version: APP_DATA_VERSION,
      exportedAt: "2026-02-01T00:00:00.000Z",
      squares: [createStandardSquare({ id: "imported", title: "Imported square" })],
      preferences: { theme: "dark" as const, onboardingSeen: true },
    };
    const file = new File([JSON.stringify(backup)], createBackupFilename(), {
      type: "application/json",
    });

    render(<App repository={repository} />);

    const importButton = screen.getByRole("button", { name: "Import JSON backup" });
    const fileInput = importButton.parentElement?.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    await user.upload(fileInput, file);

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Add to existing" }));

    expect(screen.getByRole("link", { name: "Local square" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Imported square" })).toBeInTheDocument();
    expect(repository.listSquares()).toHaveLength(2);
    expect(repository.getPreferences().theme).toBe("light");
  });

  it("rejects invalid backups without changing data", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    repository.saveSquare(createStandardSquare({ id: "keep", title: "Keep me" }));

    render(<App repository={repository} />);

    const importButton = screen.getByRole("button", { name: "Import JSON backup" });
    const fileInput = importButton.parentElement?.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(["{not-json"], "bad.json", { type: "application/json" });

    await user.upload(fileInput, file);

    expect(screen.getByRole("alert")).toHaveTextContent(/not valid JSON/i);
    expect(repository.listSquares()).toHaveLength(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("recovers from invalid local storage", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({ version: 99, squares: [], preferences: {} }),
    });
    const repository = createLocalStorageRepository(storage);

    render(<App repository={repository} />);

    expect(screen.getByRole("heading", { name: "Local data needs attention" })).toBeInTheDocument();
    expect(screen.getByText(/Unsupported data version/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Reset local data" }));

    expect(screen.getByRole("heading", { name: "Your squares" })).toBeInTheDocument();
    expect(repository.read().status).toBe("ok");
    expect(repository.listSquares()).toHaveLength(0);
  });
});
