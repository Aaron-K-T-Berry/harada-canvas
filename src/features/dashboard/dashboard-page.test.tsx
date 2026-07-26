import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createLocalStorageRepository } from "@/lib/storage/local-storage-repository";
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

describe("dashboard management", () => {
  beforeEach(() => {
    window.location.hash = "#/";
  });

  it("lists saved squares for returning users", () => {
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    repository.saveSquare(
      createStandardSquare({
        id: "one",
        title: "Morning goals",
        updatedAt: "2026-01-02T00:00:00.000Z",
      }),
    );

    render(<App repository={repository} />);

    expect(screen.getByRole("heading", { name: "Your squares" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Morning goals" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Welcome to Harada Canvas" }),
    ).not.toBeInTheDocument();
  });

  it("searches and sorts squares", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    repository.saveSquare(
      createStandardSquare({
        id: "a",
        title: "Alpha",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );
    repository.saveSquare(
      createStandardSquare({
        id: "b",
        title: "Beta",
        updatedAt: "2026-01-03T00:00:00.000Z",
      }),
    );

    render(<App repository={repository} />);

    await user.selectOptions(screen.getByLabelText("Sort by"), "name-asc");
    const list = screen.getByRole("list");
    const links = within(list).getAllByRole("link", { name: /Alpha|Beta/ });
    expect(links[0]).toHaveTextContent("Alpha");
    expect(links[1]).toHaveTextContent("Beta");

    await user.type(screen.getByLabelText("Search"), "bet");
    expect(screen.getByRole("link", { name: "Beta" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Alpha" })).not.toBeInTheDocument();
  });

  it("renames, duplicates, and deletes squares with confirmation", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    repository.saveSquare(
      createStandardSquare({
        id: "manage-me",
        title: "Original",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }),
    );

    render(<App repository={repository} />);

    await user.click(screen.getByRole("button", { name: "Rename Original" }));
    const dialog = screen.getByRole("dialog");
    const titleInput = within(dialog).getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Renamed square");
    await user.click(within(dialog).getByRole("button", { name: "Save title" }));

    expect(screen.getByRole("link", { name: "Renamed square" })).toBeInTheDocument();
    expect(repository.getSquare("manage-me")?.title).toBe("Renamed square");

    await user.click(screen.getByRole("button", { name: "Duplicate Renamed square" }));
    expect(screen.getByRole("link", { name: "Copy of Renamed square" })).toBeInTheDocument();
    expect(repository.listSquares()).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Delete Renamed square" }));
    const confirm = screen.getByRole("alertdialog");
    await user.click(within(confirm).getByRole("button", { name: "Delete square" }));

    expect(screen.queryByRole("link", { name: "Renamed square" })).not.toBeInTheDocument();
    expect(repository.getSquare("manage-me")).toBeUndefined();
    expect(screen.getByRole("link", { name: "Copy of Renamed square" })).toBeInTheDocument();
  });

  it("dismisses onboarding without creating a square", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    render(<App repository={repository} />);

    await user.click(screen.getByRole("button", { name: "Continue to dashboard" }));

    expect(
      screen.queryByRole("heading", { name: "Welcome to Harada Canvas" }),
    ).not.toBeInTheDocument();
    expect(repository.getPreferences().onboardingSeen).toBe(true);
    expect(repository.listSquares()).toHaveLength(0);
  });

  it("creates a square and opens the editor", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    render(<App repository={repository} />);

    await user.click(screen.getByRole("button", { name: "Create square" }));

    expect(screen.getByRole("heading", { name: "Untitled square" })).toBeInTheDocument();
    expect(repository.listSquares()).toHaveLength(1);
  });
});
