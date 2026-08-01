# Production deployment checklist

Use this before deploying Centura to production. The checklist items are
general practice and not individually verified against this codebase; the
commands and file paths are.

## Security

- [ ] `.env` created from `.env.docker.example`, never committed
- [ ] `JWT_SECRET` and `SESSION_SECRET` are 32+ random characters
      (`openssl rand -hex 32`)
- [ ] `DB_PASSWORD` is strong and not the default
- [ ] `FRONTEND_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL` point at your real
      domain, not `localhost`
- [ ] `COOKIE_DOMAIN` set correctly if serving frontend and API from
      different subdomains
- [ ] `NODE_ENV=production` — required for `secure` cookies to activate, see
      [http-only-cookies.md](../../apps/backend/docs/architecture/http-only-cookies.md)
- [ ] Postgres is **not** publicly exposed — the base `docker-compose.yml`
      already doesn't publish port 5432; don't add a `ports:` override that
      does

## Infrastructure

- [ ] Docker Engine 24.0+, Docker Compose 2.20+
- [ ] Firewall allows only what's needed — 80/443 if you're terminating TLS
      here, plus SSH
- [ ] SSH key-based auth, root login disabled

## TLS

Two paths — pick one, don't do both:

**Your own reverse proxy** (Traefik, Caddy, Cloudflare, Dokploy…) terminates
TLS and forwards to the frontend/backend containers directly. Skip the
bundled nginx entirely.

**Bundled nginx terminates TLS.** Follow
[`nginx/conf.d/tls.conf.example`](../../nginx/conf.d/tls.conf.example) —
obtain certificates, place them in `nginx/ssl/`, enable the config file, and
set `COOKIE_DOMAIN` / `NEXT_PUBLIC_API_URL` to match. The default nginx config
serves plain HTTP and does **not** need certificates to start.

## Deployment

```bash
git clone <your-repo-url> /opt/centura && cd /opt/centura
cp .env.docker.example .env
nano .env   # set the values from the Security section above
```

```bash
# Without the bundled nginx (your own proxy handles TLS)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# With the bundled nginx
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d --build
```

Verify:

```bash
docker-compose ps
docker-compose logs -f

curl http://localhost:8765/api/v1/health
curl https://yourdomain.com/api/v1/health
```

## Backups

```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh          # writes ./backups/backup_<timestamp>.sql.gz
```

Schedule it:

```bash
crontab -e
# 0 2 * * * /opt/centura/scripts/backup-db.sh >> /var/log/centura-backup.log 2>&1
```

There is no `restore-db.sh` script. To restore, decompress and pipe into
`psql` directly, or use `make db-restore file=backups/....sql` — note the
`Makefile` target hardcodes the database name `centura_crm`, which only
matches if that's your actual `DB_NAME`. See the database-name note in
[database.md](../../apps/backend/docs/architecture/database.md#veritabanı-adı)
and the fuller explanation in
[docs/docker/README.md](./README.md#database-backup-and-restore).

## Monitoring

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker stats

docker-compose exec postgres psql -U postgres -c \
  "SELECT pg_size_pretty(pg_database_size('${DB_NAME}'));"
```

Set up log rotation (`/etc/logrotate.d/`) and an uptime/health check against
`/api/v1/health`. Nothing in this repo does that for you.

## Post-deployment

- [ ] Full signup → org creation → dashboard flow tested end-to-end
- [ ] `docker exec ... nc -zv postgres 5432` from outside the Docker network
      **fails** — confirms the database isn't reachable externally
- [ ] Backup ran and the resulting file was test-restored somewhere other
      than production
- [ ] Logs checked for errors in the first hour

## Rollback

```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
git checkout <previous-tag>
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Database rollback requires restoring from a backup taken before the
deployment — there's no automatic schema-migration rollback, since there's no
migration tooling at all (see [database.md](../../apps/backend/docs/architecture/database.md#şema-değişiklikleri)).

## Known gaps

Not implemented in this repo, worth deciding on before you actually need
them:

- No managed-database story, no Redis, no read replicas, no queue system —
  fine for the current scale, listed here so scaling decisions aren't a
  surprise.
- No centralized logging or alerting.
- No automated rollback for database schema changes.

## Related

- [Docker deployment guide](./README.md)
- [Docker quick start](./QUICKSTART.md)
- [Database schema](../../apps/backend/docs/architecture/database.md)
- [HTTP-only cookies & production cookie config](../../apps/backend/docs/architecture/http-only-cookies.md)
