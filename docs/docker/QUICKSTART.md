# Docker Quick Start

Get Mini SaaS ERP running with Docker in 5 minutes!

## Requirements

- Docker Desktop installed
- 4GB+ RAM
- 10GB+ disk space

## Installation

### Windows

```powershell
# Automated setup (recommended)
.\scripts\docker-setup.ps1
```

### Linux/Mac

```bash
# Make script executable
chmod +x scripts/docker-setup.sh

# Run automated setup
./scripts/docker-setup.sh
```

The script will ask whether you want to run in development or production mode, then:

- Check Docker installation
- Generate secure passwords
- Create .env file
- Start services

### Manual Setup

```bash
# 1. Create environment file
cp .env.docker.example .env
nano .env  # Change passwords!

# 2. Development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# 3. Production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Access

- **Frontend:** http://localhost:4321
- **Backend:** http://localhost:8765
- **Health:** http://localhost:8765/api/v1/health

## Basic Commands

```bash
# View logs
docker-compose logs -f
docker-compose logs -f backend

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Database backup
.\scripts\backup-db.ps1  # Windows
./scripts/backup-db.sh   # Linux/Mac
```

## Troubleshooting

**Port already in use:**

```bash
# Change in .env file
BACKEND_PORT=5001
FRONTEND_PORT=3001
```

**Database error:**

```bash
docker-compose logs postgres
docker-compose restart postgres
```

**Fresh start:**

```bash
docker-compose down -v
docker-compose up --build
```

## More Information

- [Detailed Guide](./README.md)
- [Production Checklist](./PRODUCTION_CHECKLIST.md)
- [Main README](../../README.md)
