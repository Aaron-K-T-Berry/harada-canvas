import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createLocalStorageRepository } from "@/lib/storage/local-storage-repository";

function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

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

describe("App shell", () => {
  beforeEach(() => {
    window.location.hash = "#/";
  });

  it("shows onboarding for first-time visitors", () => {
    const repository = createLocalStorageRepository(createMemoryStorage());
    render(<App repository={repository} />);

    expect(screen.getByRole("heading", { name: "Welcome to Harada Canvas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View example square" })).toBeInTheDocument();
  });

  it("navigates to the example square", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    render(<App repository={repository} />);

    await user.click(screen.getByRole("link", { name: "View example square" }));

    expect(screen.getByRole("heading", { name: "Example square" })).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByText(/edits stay in this session/i)).toBeInTheDocument();
  });

  it("skips the welcome panel once onboarding has been seen", () => {
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });

    render(<App repository={repository} />);

    expect(
      screen.queryByRole("heading", { name: "Welcome to Harada Canvas" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Your squares" })).toBeInTheDocument();
  });
});
