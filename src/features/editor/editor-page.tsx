import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function EditorPage() {
  const { squareId } = useParams();
  const isExample = squareId === "example";

  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {isExample ? "Example square" : "Square editor"}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {isExample
              ? "A non-persistent sample of the standard 9×9 Harada Square layout."
              : "Inline editing, autosave, and grid controls will land in the next milestone."}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/">Back to dashboard</Link>
        </Button>
      </div>

      <div
        aria-hidden="true"
        className="grid aspect-square max-w-3xl grid-cols-9 gap-px overflow-hidden rounded-lg border border-border bg-border"
      >
        {Array.from({ length: 81 }, (_, index) => {
          const row = Math.floor(index / 9);
          const column = index % 9;
          const isCenter = row === 4 && column === 4;
          const isSubGoalCenter = row % 3 === 1 && column % 3 === 1 && !isCenter;

          return (
            <div
              key={`${row}-${column}`}
              className="flex items-center justify-center bg-card p-1 text-center text-[10px] text-muted-foreground sm:text-xs"
            >
              {isCenter ? "Goal" : isSubGoalCenter ? "Sub" : ""}
            </div>
          );
        })}
      </div>
      <p className="sr-only">
        {isExample
          ? "Example Harada Square showing a nine by nine grid with a center goal."
          : "Harada Square editor placeholder showing a nine by nine grid."}
      </p>
    </main>
  );
}
