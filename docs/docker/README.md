# Docker deployment guide

Deeper reference alongside [QUICKSTART.md](./QUICKSTART.md), which covers the
fastest path to a running stack. This document covers the `Makefile`
shortcuts and production details.

## Prerequisites

- Docker Engine 24.0+, Docker Compose 2.20+
- `make` (optional — every target is a thin wrapper around `docker-compose`,
  shown below each command)

## Quick start

```bash
cp .env.docker.example .env
# edit .env — set DB_PASSWORD, JWT_SECRET, SESSION_SECRET at minimum
```

```bash
make dev              # docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

| Service     | URL                   |
| ----------- | --------------------- |
| Frontend    | http://localhost:4321 |
| Backend API | http://localhost:8765 |
| PostgreSQL  | localhost:5432        |

Generate a secret:

```bash
openssl rand -hex 32
```

> **`make install`** is currently broken on macOS and Linux — it uses Windows
> batch syntax (`if not exist .env copy ...`) that `/bin/sh` can't parse. Use
> `cp .env.docker.example .env` directly instead.

## Make targets

All targets are defined in [`Makefile`](../../Makefile). The ones that exist:

| Target                                                     | Runs                                                                                                    |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `make dev` / `dev-d` / `dev-down` / `dev-logs`             | Dev stack, foreground / detached / stop / logs                                                          |
| `make prod` / `prod-down` / `prod-logs`                    | Prod stack — **does not start nginx**, see below                                                        |
| `make up` / `down` / `restart` / `ps`                      | Base compose file only, no overlay                                                                      |
| `make build`                                               | `docker-compose build`                                                                                  |
| `make backend-shell` / `frontend-shell` / `db-shell`       | Shell into a running container                                                                          |
| `make backend-logs` / `frontend-logs` / `db-logs` / `logs` | Follow logs                                                                                             |
| `make health`                                              | `docker-compose ps`                                                                                     |
| `make stats`                                               | `docker stats`                                                                                          |
| `make db-backup` / `db-restore file=...`                   | See below — has a database-name gotcha                                                                  |
| `make clean`                                               | Removes containers, volumes, **and prunes the Docker system** — affects images outside this project too |
| `make clean-volumes`                                       | `docker-compose down -v` — deletes data                                                                 |
| `make clean-images`                                        | `docker-compose down --rmi all`                                                                         |

`make prod-scale` and `make security-scan`, mentioned in older docs, do not
exist as targets.

## Production

```bash
make prod
```

This is `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build` — it does **not** pass `--profile production`, so the bundled nginx service does not start. That's consistent with the rest of this repo's deployment docs: nginx is opt-in, for people who don't already run their own reverse proxy. To include it:

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build
```

See [QUICKSTART.md](./QUICKSTART.md#production) for the required environment
variables (`NEXT_PUBLIC_API_URL` fails the build if unset) and
[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) before going live.

### TLS

The bundled nginx serves plain HTTP by default. To terminate TLS in it
instead of an upstream proxy, follow the steps in
[`nginx/conf.d/tls.conf.example`](../../nginx/conf.d/tls.conf.example) — it
covers certificates, enabling the config, and the required `.env` changes
(`COOKIE_DOMAIN`, `NEXT_PUBLIC_API_URL`, etc.).

## Database backup and restore

```bash
make db-backup                              # writes ./backups/backup_<timestamp>.sql
make db-restore file=backups/backup_....sql
```

**Gotcha:** both targets hardcode the database name `centura_crm`:

```makefile
docker-compose exec -T postgres pg_dump -U postgres centura_crm > ...
```

That matches `.env.docker.example`'s `DB_NAME`, but **not** the base
`docker-compose.yml` default (`mini_saas_erp`) — see the database-name note in
[database.md](../../apps/backend/docs/architecture/database.md#veritabanı-adı).
If your `DB_NAME` differs from `centura_crm`, edit the Makefile target or run
`pg_dump`/`psql` manually with the right name.

## Logs and monitoring

```bash
make logs              # all services
make backend-logs      # one service
docker-compose ps       # container status
docker stats             # live resource usage
```

## Troubleshooting

**Port already in use.** `BACKEND_PORT` and `FRONTEND_PORT` in `.env` change
the _host_ port only — containers always listen on 8765 and 4321 internally.

**Database connection failed.**

```bash
docker-compose ps postgres
make db-logs
docker-compose restart postgres
```

**Build failures.**

```bash
docker-compose build --no-cache
```

**Start over.** This deletes all data:

```bash
make clean-volumes
make dev
```

## Cleanup

`make clean` is more destructive than it looks — beyond this project's
containers and volumes, it runs `docker system prune -af --volumes`, which
removes **all** unused Docker images, containers, and volumes on the machine,
not just this project's. Use `make clean-volumes` or `make clean-images` for
a narrower cleanup.

## Related

- [Docker quick start](./QUICKSTART.md)
- [Production checklist](./PRODUCTION_CHECKLIST.md)
- [Project README](../../README.md)
