import { cloneCells } from "@/features/editor/domain/grid-ops";
import { createStandardSquare, type HaradaSquare } from "@/models/harada-square";

export type SquareSortOption =
  | "name-asc"
  | "name-desc"
  | "updated-desc"
  | "updated-asc"
  | "created-desc"
  | "created-asc";

export function filterSquaresByTitle(squares: HaradaSquare[], query: string): HaradaSquare[] {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) {
    return [...squares];
  }

  return squares.filter((square) => square.title.toLocaleLowerCase().includes(normalized));
}

export function sortSquares(squares: HaradaSquare[], sort: SquareSortOption): HaradaSquare[] {
  const next = [...squares];

  next.sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
      case "name-desc":
        return b.title.localeCompare(a.title, undefined, { sensitivity: "base" });
      case "updated-asc":
        return a.updatedAt.localeCompare(b.updatedAt);
      case "updated-desc":
        return b.updatedAt.localeCompare(a.updatedAt);
      case "created-asc":
        return a.createdAt.localeCompare(b.createdAt);
      case "created-desc":
        return b.createdAt.localeCompare(a.createdAt);
      default:
        return 0;
    }
  });

  return next;
}

export function querySquares(
  squares: HaradaSquare[],
  query: string,
  sort: SquareSortOption,
): HaradaSquare[] {
  return sortSquares(filterSquaresByTitle(squares, query), sort);
}

export function renameSquare(square: HaradaSquare, title: string): HaradaSquare | null {
  const nextTitle = title.trim();
  if (!nextTitle) {
    return null;
  }

  if (nextTitle === square.title) {
    return square;
  }

  return {
    ...square,
    title: nextTitle,
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateSquare(square: HaradaSquare): HaradaSquare {
  const now = new Date().toISOString();
  return createStandardSquare({
    id: crypto.randomUUID(),
    title: `Copy of ${square.title}`,
    createdAt: now,
    updatedAt: now,
    cells: cloneCells(square.cells),
  });
}

export function formatSquareTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
