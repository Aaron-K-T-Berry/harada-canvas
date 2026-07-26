import { Copy, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { formatSquareTimestamp } from "@/features/dashboard/domain/square-list";
import type { HaradaSquare } from "@/models/harada-square";

interface SquareListProps {
  squares: HaradaSquare[];
  emptyMessage: string;
  onRename: (square: HaradaSquare) => void;
  onDuplicate: (square: HaradaSquare) => void;
  onDelete: (square: HaradaSquare) => void;
}

export function SquareList({
  squares,
  emptyMessage,
  onRename,
  onDuplicate,
  onDelete,
}: SquareListProps) {
  if (squares.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="divide-y divide-border border-y border-border">
      {squares.map((square) => (
        <li
          key={square.id}
          className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <Link
              to={`/square/${square.id}`}
              className="block truncate text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {square.title}
            </Link>
            <p className="mt-1 text-sm text-muted-foreground">
              Updated {formatSquareTimestamp(square.updatedAt)}
            </p>
          </div>
          <fieldset className="m-0 flex min-w-0 flex-wrap gap-2 border-0 p-0">
            <legend className="sr-only">Actions for {square.title}</legend>
            <Button asChild size="sm" variant="outline">
              <Link to={`/square/${square.id}`}>Open</Link>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onRename(square)}
              aria-label={`Rename ${square.title}`}
            >
              <Pencil />
              <span className="hidden sm:inline">Rename</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onDuplicate(square)}
              aria-label={`Duplicate ${square.title}`}
            >
              <Copy />
              <span className="hidden sm:inline">Duplicate</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onDelete(square)}
              aria-label={`Delete ${square.title}`}
            >
              <Trash2 />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </fieldset>
        </li>
      ))}
    </ul>
  );
}
