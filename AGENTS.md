# AGENTS.md

## Cursor Cloud specific instructions

### Overview

TypeFlow is a developer typing trainer — a React 19 + Vite frontend with a Hono/Bun backend API and a local SQLite database (via libSQL/Turso). Authentication uses Clerk.

### Services

| Service            | Command              | Port        | Notes                                                  |
| ------------------ | -------------------- | ----------- | ------------------------------------------------------ |
| Frontend (Vite)    | `bun run dev`        | 5173        | Or `bun run dev -- --host 0.0.0.0` for external access |
| Backend API (Hono) | `bun run server:dev` | 3456        | Auto-reloads via `bun --watch`                         |
| Both together      | `bun run dev:all`    | 5173 + 3456 | Runs frontend and backend in parallel                  |

### Key caveats

- **Clerk auth is required for the frontend UI.** Without `VITE_CLERK_PUBLISHABLE_KEY` in `.env`, the frontend renders a blank "Configuration Error" page. The backend works independently.
- **Local database setup:** Run `bun run db:setup` once to create `.env` from `.env.example` and run migrations against a local SQLite file (`local.db`). If `local.db` already exists, migrations are idempotent.
- **Typecheck:** `bun run typecheck` reports errors for optional Tauri desktop plugins (`@tauri-apps/plugin-os`, `@tauri-apps/plugin-shell`) that are not installed. This is expected for web-only development and does not affect the frontend or backend.
- **Lint/test/build commands:** See `package.json` scripts. Key ones: `bun run lint`, `bun run test:run`, `bun run build`.
- **Pre-commit hook:** `.husky/pre-commit` runs `bun run lint-staged`.
