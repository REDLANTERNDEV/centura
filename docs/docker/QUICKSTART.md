# Docker quick start

Get Centura running locally with Docker.

## Requirements

- Docker and Docker Compose
- ~4 GB RAM and ~10 GB free disk space

## Scripted setup

The setup script checks your Docker installation, generates secrets, writes `.env`
and starts the stack. It asks whether you want development or production mode.

```bash
# Linux / macOS
chmod +x scripts/docker-setup.sh
./scripts/docker-setup.sh
```

```powershell
# Windows
.\scripts\docker-setup.ps1
```

## Manual setup

```bash
cp .env.docker.example .env
```

Set these before starting — the defaults are not safe to run with:

- `DB_PASSWORD`
- `JWT_SECRET` (32+ random characters)
- `SESSION_SECRET` (32+ random characters)

```bash
openssl rand -base64 48    # generates a suitable secret
```

Then start the development stack:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

| Service      | URL                                 |
| ------------ | ----------------------------------- |
| Frontend     | http://localhost:4321               |
| Backend API  | http://localhost:8765/api/v1        |
| Health check | http://localhost:8765/api/v1/health |
| PostgreSQL   | localhost:5432                      |

The schema is created on first start from `apps/backend/scripts/init-schema.sql`.

## Production

Production additionally requires `NEXT_PUBLIC_API_URL` and `CORS_ORIGIN`. The build
fails deliberately if `NEXT_PUBLIC_API_URL` is unset, because that value is compiled
into the frontend bundle.

```bash
# Behind your own reverse proxy (Traefik, Caddy, Cloudflare, Dokploy…)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# With the bundled nginx — the profile is required, or nginx will not start
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build
```

See the [production checklist](./PRODUCTION_CHECKLIST.md) before going live.

## Common commands

```bash
# Logs, all services or one
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend

# Restart a service
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart backend

# Stop, keeping data
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Stop and delete the database volume — destroys all data
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Database backups:

```bash
./scripts/backup-db.sh      # Linux / macOS
.\scripts\backup-db.ps1     # Windows
```

## Troubleshooting

**Port already in use.** `BACKEND_PORT` and `FRONTEND_PORT` change the host port
only; the containers always listen on 8765 and 4321 internally.

```bash
BACKEND_PORT=9000
FRONTEND_PORT=3001
```

**Database won't start.** Check the logs, then restart:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.yml -f docker-compose.dev.yml restart postgres
```

**Frontend can't reach the API.** `NEXT_PUBLIC_API_URL` is baked in at build time, so
changing it needs `--build`, not a restart.

**Start over from scratch.** This deletes all data:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## More

- [Detailed Docker guide](./README.md)
- [Production checklist](./PRODUCTION_CHECKLIST.md)
- [Project README](../../README.md)
