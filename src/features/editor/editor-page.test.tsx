import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
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

async function flushAutosave() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 450));
  });
}

function getCell(name: RegExp) {
  return screen.getByRole("gridcell", { name });
}

describe("editor workflows", () => {
  beforeEach(() => {
    window.location.hash = "#/";
  });

  it("edits a cell, autosaves, and supports undo", async () => {
    const user = userEvent.setup();
    const storage = createMemoryStorage();
    const repository = createLocalStorageRepository(storage);
    const square = createStandardSquare({ id: "edit-me", title: "Editable" });
    repository.saveSquare(square);

    window.location.hash = "#/square/edit-me";
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Editable" })).toBeInTheDocument();

    await user.click(getCell(/Row 1, column 1: empty/i));
    const editor = screen.getByLabelText(/Edit cell row 1, column 1/i);
    await user.clear(editor);
    await user.type(editor, "Focus");
    await user.keyboard("{Enter}");

    expect(getCell(/Row 1, column 1: Focus/i)).toBeInTheDocument();

    await flushAutosave();
    expect(repository.getSquare("edit-me")?.cells[0]?.[0]).toBe("Focus");

    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(getCell(/Row 1, column 1: empty/i)).toBeInTheDocument();
  });

  it("keeps a fixed 9×9 grid without resize controls", async () => {
    const repository = createLocalStorageRepository(createMemoryStorage());
    const square = createStandardSquare({ id: "fixed", title: "Fixed" });
    repository.saveSquare(square);

    window.location.hash = "#/square/fixed";
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Fixed" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add row" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove row" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add column" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Remove column" })).not.toBeInTheDocument();
    expect(screen.queryByText("9 × 9")).not.toBeInTheDocument();
  });

  it("moves focus with arrow keys", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    const square = createStandardSquare({ id: "keys", title: "Keys" });
    repository.saveSquare(square);

    window.location.hash = "#/square/keys";
    render(<App repository={repository} />);

    const firstCell = await screen.findByRole("gridcell", { name: /Row 1, column 1: empty/i });
    firstCell.focus();
    await user.keyboard("{ArrowRight}");

    expect(getCell(/Row 1, column 2: empty/i)).toHaveFocus();
  });

  it("keeps example square edits out of storage", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());

    window.location.hash = "#/square/example";
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Example square" })).toBeInTheDocument();
    await user.click(getCell(/Row 1, column 1: empty/i));
    await user.type(screen.getByLabelText(/Edit cell row 1, column 1/i), "Temp");
    await user.keyboard("{Enter}");
    await flushAutosave();

    expect(repository.listSquares()).toHaveLength(0);
  });
});
