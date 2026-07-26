import { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  duplicateSquare,
  querySquares,
  renameSquare,
  type SquareSortOption,
} from "@/features/dashboard/domain/square-list";
import { OnboardingPanel } from "@/features/dashboard/onboarding-panel";
import { RenameSquareDialog } from "@/features/dashboard/rename-square-dialog";
import { SquareList } from "@/features/dashboard/square-list";
import { BackupControls } from "@/features/import-export/backup-controls";
import { useRepository } from "@/lib/storage/repository-context";
import type { AppPreferences } from "@/models/app-data";
import type { HaradaSquare } from "@/models/harada-square";

interface DashboardPageProps {
  onboardingSeen: boolean;
  onCreateSquare: () => void;
  onMarkOnboardingSeen: () => void;
  onPreferencesChanged: (preferences: AppPreferences) => void;
}

const SORT_OPTIONS: Array<{ value: SquareSortOption; label: string }> = [
  { value: "updated-desc", label: "Last modified (newest)" },
  { value: "name-asc", label: "Name (A–Z)" },
];

export function DashboardPage({
  onboardingSeen,
  onCreateSquare,
  onMarkOnboardingSeen,
  onPreferencesChanged,
}: DashboardPageProps) {
  const repository = useRepository();
  const searchId = useId();
  const sortId = useId();
  const [squares, setSquares] = useState<HaradaSquare[]>(() => {
    try {
      return repository.listSquares();
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SquareSortOption>("updated-desc");
  const [announcement, setAnnouncement] = useState("");
  const [renaming, setRenaming] = useState<HaradaSquare | null>(null);
  const [deleting, setDeleting] = useState<HaradaSquare | null>(null);

  const refreshSquares = () => {
    try {
      setSquares(repository.listSquares());
    } catch {
      setSquares([]);
    }
  };

  const visibleSquares = querySquares(squares, query, sort);

  const handleRename = (title: string) => {
    if (!renaming) {
      return;
    }

    const next = renameSquare(renaming, title);
    if (!next) {
      setAnnouncement("Enter a title before saving.");
      return;
    }

    repository.saveSquare(next);
    refreshSquares();
    setAnnouncement(`Renamed to “${next.title}”.`);
    setRenaming(null);
  };

  const handleDuplicate = (square: HaradaSquare) => {
    const copy = duplicateSquare(square);
    repository.saveSquare(copy);
    refreshSquares();
    setAnnouncement(`Duplicated “${square.title}”.`);
  };

  const handleConfirmDelete = () => {
    if (!deleting) {
      return;
    }

    repository.deleteSquare(deleting.id);
    refreshSquares();
    setAnnouncement(`Deleted “${deleting.title}”.`);
    setDeleting(null);
  };

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6"
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your squares</h1>
        <p className="max-w-2xl text-muted-foreground">
          Create and manage Harada Squares locally in this browser. Nothing is uploaded to a server.
        </p>
      </div>

      {!onboardingSeen ? (
        <OnboardingPanel onCreateSquare={onCreateSquare} onDismiss={onMarkOnboardingSeen} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Need a refresher?{" "}
          <Link
            to="/square/example"
            className="underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open the example square
          </Link>
          .
        </p>
      )}

      <section aria-label="Saved squares" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium">Saved squares</h2>
          <Button type="button" onClick={onCreateSquare}>
            Create square
          </Button>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor={searchId}>Search</Label>
            <Input
              id={searchId}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by title"
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2 sm:w-64">
            <Label htmlFor={sortId}>Sort by</Label>
            <select
              id={sortId}
              value={sort}
              onChange={(event) => setSort(event.target.value as SquareSortOption)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SquareList
          squares={visibleSquares}
          emptyMessage={
            squares.length === 0
              ? "No saved squares yet. Create one to get started."
              : "No squares match your search."
          }
          onRename={setRenaming}
          onDuplicate={handleDuplicate}
          onDelete={setDeleting}
        />
      </section>

      <BackupControls
        repository={repository}
        onAnnounce={setAnnouncement}
        onDataChanged={(preferences) => {
          refreshSquares();
          if (preferences) {
            onPreferencesChanged(preferences);
          }
        }}
      />

      <div className="text-sm" aria-live="polite">
        {announcement ? <p>{announcement}</p> : null}
      </div>

      <RenameSquareDialog
        open={renaming !== null}
        initialTitle={renaming?.title ?? ""}
        onOpenChange={(open) => {
          if (!open) {
            setRenaming(null);
          }
        }}
        onRename={handleRename}
      />

      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleting(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{deleting?.title}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the square from this browser. There is no server-side
              recovery.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Delete square</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
