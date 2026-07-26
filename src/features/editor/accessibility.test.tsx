import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "@/App";
import { createLocalStorageRepository } from "@/lib/storage/local-storage-repository";
import { createStandardSquare } from "@/models/harada-square";

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

function mockViewport(isCompact: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: query.includes("max-width: 767px") ? isCompact : false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return false;
      },
    }),
  });
}

describe("accessibility and responsive polish", () => {
  beforeEach(() => {
    window.location.hash = "#/";
    mockViewport(false);
  });

  it("exposes a skip link to main content", async () => {
    const user = userEvent.setup();
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    render(<App repository={repository} />);

    const skip = screen.getByRole("button", { name: "Skip to main content" });
    await user.click(skip);
    expect(document.getElementById("main-content")).toHaveFocus();
    expect(window.location.hash).toBe("#/");
  });

  it("uses a simplified viewing mode on compact viewports", async () => {
    const user = userEvent.setup();
    mockViewport(true);
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    repository.saveSquare(createStandardSquare({ id: "mobile", title: "Mobile square" }));

    window.location.hash = "#/square/mobile";
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Mobile square" })).toBeInTheDocument();
    expect(screen.getByText(/simplified viewing mode/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Undo" })).not.toBeInTheDocument();
    expect(screen.getByRole("grid")).toHaveAttribute("aria-readonly", "true");

    await user.click(screen.getByRole("button", { name: "Enable editing on this device" }));
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("grid")).not.toHaveAttribute("aria-readonly");
  });

  it("keeps full editing controls on desktop viewports", async () => {
    const repository = createLocalStorageRepository(createMemoryStorage());
    repository.setPreferences({ theme: "light", onboardingSeen: true });
    repository.saveSquare(createStandardSquare({ id: "desktop", title: "Desktop square" }));

    window.location.hash = "#/square/desktop";
    render(<App repository={repository} />);

    expect(await screen.findByRole("heading", { name: "Desktop square" })).toBeInTheDocument();
    expect(screen.queryByText(/simplified viewing mode/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Undo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export Markdown" })).toBeInTheDocument();
  });
});
