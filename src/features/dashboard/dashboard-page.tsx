import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DashboardPageProps {
  onboardingSeen: boolean;
}

export function DashboardPage({ onboardingSeen }: DashboardPageProps) {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your squares</h1>
        <p className="max-w-2xl text-muted-foreground">
          Create and manage Harada Squares locally in this browser. Nothing is uploaded to a server.
        </p>
      </div>

      {!onboardingSeen ? (
        <section
          aria-label="Introduction"
          className="rounded-lg border border-border bg-card px-4 py-5 text-card-foreground"
        >
          <h2 className="text-xl font-medium">Welcome to Harada Canvas</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            The Harada method centers a long-term goal, then surrounds it with supporting goals and
            daily practices on a 9×9 grid. Start from the standard template, then reshape the grid
            when your planning process needs it.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link to="/square/example">View example square</Link>
            </Button>
          </div>
        </section>
      ) : null}

      <section aria-label="Saved squares" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium">Saved squares</h2>
          <Button type="button" disabled>
            Create square
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Square management arrives in the next milestone. Your data model and local storage layer
          are ready.
        </p>
      </section>
    </main>
  );
}
