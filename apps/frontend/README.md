# centura-fe

Next.js frontend for [Centura](../../README.md). Not intended to run standalone —
it expects the Centura backend to be reachable.

## Running

From the repository root:

```bash
npm run dev:frontend          # http://localhost:3000
```

Or with the full stack in Docker, which is usually what you want:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
# frontend on http://localhost:4321, backend on http://localhost:8765
```

## Configuration

| Variable              | Purpose                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | API base URL used by the browser. Compiled into the bundle at build time — changing it requires a rebuild, not a restart. |
| `INTERNAL_API_URL`    | API base URL used for server-side requests inside Docker (`http://backend:8765/api/v1`).                                  |

## Layout

```
app/
├── (dashboard)/dashboard/   # Authenticated app: analytics, customers, orders, products, settings
├── (public)/                # Marketing and auth pages
├── contact/
└── organizations/           # Organisation creation and selection
components/                  # Shared React components (PascalCase files)
hooks/                       # Custom hooks
lib/                         # API client, validation schemas, helpers
```

## Conventions

- TypeScript throughout; `any` should not appear in new code.
- Components in `components/` use PascalCase filenames; route folders follow the
  Next.js App Router convention.
- Tailwind CSS 4 for styling, Radix UI primitives for accessible components,
  Zod for runtime validation of API responses and forms.

## Scripts

| Script               | Description                                               |
| -------------------- | --------------------------------------------------------- |
| `npm run dev`        | Dev server with Turbopack on port 3000                    |
| `npm run dev:docker` | Dev server bound to `0.0.0.0:4321` for the Docker overlay |
| `npm run build`      | Production build (standalone output)                      |
| `npm run start`      | Serve the production build                                |
| `npm run lint`       | ESLint                                                    |
