import { Link } from "react-router";
import { Button } from "@/components/ui/button";

interface OnboardingPanelProps {
  onCreateSquare: () => void;
  onDismiss: () => void;
}

export function OnboardingPanel({ onCreateSquare, onDismiss }: OnboardingPanelProps) {
  return (
    <section
      aria-label="Introduction"
      className="rounded-lg border border-border bg-card px-4 py-5 text-card-foreground"
    >
      <h2 className="text-xl font-medium">Welcome to Harada Canvas</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        The Harada method centers a long-term goal, then surrounds it with supporting goals and
        daily practices on a fixed 9×9 grid. Everything stays in this browser—clearing site data
        deletes your squares, so export JSON backups from the dashboard regularly.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={onCreateSquare}>
          Create your first square
        </Button>
        <Button asChild variant="outline">
          <Link to="/square/example">View example square</Link>
        </Button>
        <Button type="button" variant="ghost" onClick={onDismiss}>
          Continue to dashboard
        </Button>
      </div>
    </section>
  );
}
