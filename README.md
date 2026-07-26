# Harada Canvas

Harada Canvas is an open-source web app for building and managing [Harada Squares](https://en.wikipedia.org/wiki/Harada_Method) for goal planning. It runs entirely in the browser, stores data locally, and is designed for GitHub Pages hosting.

## Status

Core editor milestone: accessible 9×9 Harada Square editing with autosave, undo/redo, and safe row/column controls is available. Dashboard management (list/rename/search/sort) and import/export land next.

## Privacy

- Square contents stay in this browser via `localStorage`.
- Clearing site data for this origin permanently removes saved squares.
- Export a JSON backup before clearing browser storage or switching devices.

## Supported browsers

Latest two major versions of Chrome, Edge, Firefox, and Safari.

## Requirements

- Node.js 22+
- [pnpm](https://pnpm.io/) 10+

## Scripts

```bash
pnpm install
pnpm dev
pnpm test
pnpm typecheck
pnpm check
pnpm build
pnpm preview
```

| Script | Purpose |
| --- | --- |
| `pnpm dev` | Start the Vite development server |
| `pnpm test` | Run the Vitest suite |
| `pnpm test:coverage` | Run tests with coverage |
| `pnpm typecheck` | Type-check the project |
| `pnpm check` | Run Biome format and lint checks |
| `pnpm check:fix` | Apply Biome fixes |
| `pnpm build` | Type-check and create a production build |
| `pnpm preview` | Preview the production build locally |

Production builds default to the GitHub Pages base path `/harada-canvas/`. Override with `VITE_BASE_PATH` when needed:

```bash
VITE_BASE_PATH=/harada-canvas/pr-12/ pnpm build
```

## Local development

1. Install dependencies with `pnpm install`.
2. Start the app with `pnpm dev`.
3. Open the printed local URL.

Hash routing (`#/`, `#/square/:id`) keeps deep links working under GitHub Pages base paths without server rewrites.

## Contributing

1. Create a branch from `master`.
2. Make focused changes with tests for domain and storage behavior.
3. Run `pnpm check`, `pnpm typecheck`, `pnpm test`, and `pnpm build` before opening a pull request.
4. Keep square contents offline; do not add networked persistence.

## License

MIT
