import type { HaradaSquare } from "@/models/harada-square";

/** Escape cell text for a GitHub-flavored Markdown table cell. */
export function escapeMarkdownTableCell(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r\n|\r|\n/g, "<br>");
}

export function sanitizeFilename(title: string): string {
  const cleaned = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned.length > 0 ? cleaned.slice(0, 80) : "harada-square";
}

export function squareToMarkdown(square: HaradaSquare): string {
  const header = `# ${square.title.trim() || "Untitled square"}`;
  const note =
    "_Exported from Harada Canvas as a readable Markdown table. This format is not intended for lossless restore._";

  const columnCount = square.columns;
  const headerRow = `| ${Array.from({ length: columnCount }, (_, index) => `C${index + 1}`).join(" | ")} |`;
  const separatorRow = `| ${Array.from({ length: columnCount }, () => "---").join(" | ")} |`;
  const bodyRows = square.cells.map(
    (row) => `| ${row.map((cell) => escapeMarkdownTableCell(cell)).join(" | ")} |`,
  );

  return [header, "", note, "", headerRow, separatorRow, ...bodyRows, ""].join("\n");
}

export function markdownFilename(square: HaradaSquare): string {
  return `${sanitizeFilename(square.title)}.md`;
}
