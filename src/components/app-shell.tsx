import { Moon, Sun } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { SkipLink } from "@/components/skip-link";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function AppShell() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SkipLink />
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="rounded-sm text-lg font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Harada Canvas
          </Link>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-border">
        <p className="mx-auto max-w-6xl px-4 py-3 text-xs text-muted-foreground sm:px-6">
          Independent, unofficial tool; not affiliated with Takashi Harada or official Harada Method
          programs.
        </p>
      </footer>
    </div>
  );
}
