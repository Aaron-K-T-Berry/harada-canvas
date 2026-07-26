import {
  escapeMarkdownTableCell,
  markdownFilename,
  sanitizeFilename,
  squareToMarkdown,
} from "@/lib/markdown/export-markdown";
import { createStandardSquare } from "@/models/harada-square";

describe("markdown export", () => {
  it("escapes pipes, backslashes, and newlines for table cells", () => {
    expect(escapeMarkdownTableCell("a|b")).toBe("a\\|b");
    expect(escapeMarkdownTableCell("a\\b")).toBe("a\\\\b");
    expect(escapeMarkdownTableCell("line1\nline2")).toBe("line1<br>line2");
  });

  it("builds a titled markdown table matching the grid", () => {
    const square = createStandardSquare({
      id: "md",
      title: "Focus plan",
      cells: Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: 9 }, (_, column) =>
          row === 0 && column === 0 ? "Goal | A" : row === 1 && column === 1 ? "Sub\ngoal" : "",
        ),
      ),
    });

    const markdown = squareToMarkdown(square);

    expect(markdown).toContain("# Focus plan");
    expect(markdown).toContain("| C1 | C2 |");
    expect(markdown).toContain("| --- | --- |");
    expect(markdown).toContain("Goal \\| A");
    expect(markdown).toContain("Sub<br>goal");
    expect(markdown.split("\n").filter((line) => line.startsWith("|")).length).toBe(11);
  });

  it("creates safe markdown filenames", () => {
    expect(sanitizeFilename("My Plan!!")).toBe("my-plan");
    expect(markdownFilename(createStandardSquare({ title: "  " }))).toBe("harada-square.md");
  });
});
