# centura-be

Express backend for [Centura](../../README.md). PostgreSQL accessed directly via
`pg` — no ORM.

## Running

From the repository root:

```bash
npm run dev:backend          # http://localhost:8765
```

Or with the full stack in Docker, which is usually what you want:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

You need a running PostgreSQL 16 instance with
[`scripts/init-schema.sql`](./scripts/init-schema.sql) applied — the Docker
setup does this automatically on first start.

## Configuration

Full reference in the [root README](../../README.md#quick-start) and
[`.env.docker.example`](../../.env.docker.example). The essentials:

| Variable                                                  | Notes                             |
| --------------------------------------------------------- | --------------------------------- |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Postgres connection               |
| `JWT_SECRET`, `SESSION_SECRET`                            | 32+ random characters             |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN`        | Default `15m` / `7d`              |
| `CORS_ORIGIN`, `FRONTEND_URL`                             | Must match your frontend's origin |

## Layout

```
src/
├── config/       # db.js (pg pool), cookies.js, messages.js
├── controllers/  # Request handlers
├── middleware/   # auth, org context, security, error handling
├── models/       # SQL, one file per domain
├── routes/       # Endpoint definitions
├── services/     # tokenCleanupService (scheduled job)
└── validators/   # Hand-written input validation, no library
scripts/
├── init-schema.sql              # Full schema, applied on first DB start
└── optimize-refresh-tokens.sql  # Additional indexes
```

## API surface

| Resource          | Docs                                                                                                                                                 |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auth              | `signup`, `login`, `logout`, `refresh-token`, `verify-access`, `verify-token` — see [http-only-cookies.md](./docs/architecture/http-only-cookies.md) |
| Organizations     | [docs/api/organizations.md](./docs/api/organizations.md)                                                                                             |
| Orders & Products | [docs/api/orders.md](./docs/api/orders.md)                                                                                                           |
| Customers         | `GET/POST /customers`, `GET/PUT/DELETE /customers/:id`, `GET /customers/stats`                                                                       |
| Insights          | [docs/api/insights.md](./docs/api/insights.md)                                                                                                       |

No `/auth/register` or `/auth/me` endpoints exist — registration is `POST
/auth/signup`, and there's no dedicated "current user" endpoint;
`verify-access` returns `req.user` as a side effect of validating the cookie.

## Architecture docs

- [Database schema](./docs/architecture/database.md)
- [Multi-tenant roles](./docs/architecture/multi-tenant-roles.md)
- [Organization context security](./docs/architecture/security.md)
- [HTTP-only cookies & auth flow](./docs/architecture/http-only-cookies.md)
- [Token cleanup & refresh rotation](./docs/architecture/token-cleanup.md)
- [Backend validation](./docs/architecture/validation.md)
- [Error handling (frontend interceptor)](./docs/architecture/error-handling.md)

## Notes

- Connection pool: `max: 20` ([`config/db.js`](./src/config/db.js)).
- Expired/revoked refresh tokens are cleaned up hourly by a `node-cron` job,
  not daily — see [token-cleanup.md](./docs/architecture/token-cleanup.md).
- Passwords and refresh tokens are hashed with **Argon2id**, not bcrypt.
- Licensed under [AGPL-3.0](../../LICENSE), same as the rest of the repo —
  not MIT.
