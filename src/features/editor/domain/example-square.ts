import { createStandardSquare, type HaradaSquare } from "@/models/harada-square";

const EXAMPLE_CELLS: string[][] = [
  ["", "", "", "", "", "", "", "", ""],
  ["", "Health", "Sleep 8h", "", "Career", "Ship weekly", "", "Learning", "Read 20m"],
  ["", "Walk daily", "", "", "Deep work", "", "", "Take notes", ""],
  ["", "", "", "", "", "", "", "", ""],
  ["", "Family", "Weekly call", "", "Run a marathon", "Budget plan", "", "Creative", "Sketch"],
  ["", "Dinner night", "", "", "Save 10%", "", "", "Share work", ""],
  ["", "", "", "", "", "", "", "", ""],
  ["", "Mindset", "Journal", "", "Community", "Volunteer", "", "Adventure", "Hike"],
  ["", "Meditate", "", "", "Help a friend", "", "", "Plan trip", ""],
];

export function createExampleSquare(): HaradaSquare {
  return createStandardSquare({
    id: "example",
    title: "Example square",
    cells: EXAMPLE_CELLS.map((row) => [...row]),
  });
}

export function isExampleSquareId(id: string | undefined): boolean {
  return id === "example";
}
