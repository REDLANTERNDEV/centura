# 🐳 Docker Deployment Guide

Production-ready Docker configuration for Mini SaaS ERP with industry best practices.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [Production](#production)
- [Database Management](#database-management)
- [Monitoring & Logs](#monitoring--logs)
- [Security](#security)
- [Troubleshooting](#troubleshooting)

## 🎯 Prerequisites

- Docker Engine 24.0+
- Docker Compose 2.20+
- Make (optional, for using Makefile commands)

**Windows Users:**

- Docker Desktop for Windows
- WSL2 enabled
- Git Bash or PowerShell

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone repository
git clone <your-repo-url>
cd mini-saas-erp

# Copy environment file
cp .env.docker.example .env

# Edit .env with your configuration
# IMPORTANT: Change default passwords and secrets!
```

### 2. Start Development Environment

**Using Make:**

```bash
make dev
```

**Using Docker Compose:**

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

**Using PowerShell:**

```powershell
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### 3. Access Applications

- **Frontend:** http://localhost:4321
- **Backend API:** http://localhost:8765
- **Database:** localhost:5432

## ⚙️ Environment Configuration

### Required Environment Variables

Create a `.env` file in the root directory:

```env
# Database
DB_NAME=mini_saas_erp
DB_USER=postgres
DB_PASSWORD=your-secure-password-here

# JWT & Security
JWT_SECRET=your-256-bit-secret-key-here
SESSION_SECRET=your-session-secret-here

# URLs
FRONTEND_URL=http://localhost:4321
NEXT_PUBLIC_API_BASE_URL=http://localhost:8765/api/v1
```

### Generate Secure Secrets

**Using Node.js:**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Using OpenSSL:**

```bash
openssl rand -hex 32
```

**Using PowerShell:**

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## 💻 Development

### Start Development Environment

```bash
# With hot reload
make dev

# In detached mode
make dev-d

# View logs
make dev-logs

# Stop
make dev-down
```

### Development Features

- ✅ Hot module reloading
- ✅ Source code mounted as volumes
- ✅ Debug ports exposed
- ✅ Development database with sample data

### Access Development Tools

```bash
# Backend shell
make backend-shell

# Frontend shell
make frontend-shell

# Database shell
make db-shell

# View specific logs
make backend-logs
make frontend-logs
```

## 🏭 Production

### Start Production Environment

```bash
# Build and start
make prod

# View logs
make prod-logs

# Stop
make prod-down
```

### Production Features

- ✅ Multi-stage builds (smaller images)
- ✅ Non-root user execution
- ✅ Health checks
- ✅ Resource limits
- ✅ Automatic restarts
- ✅ Security hardening
- ✅ Nginx reverse proxy

### Production with Nginx

The production setup includes an optional Nginx reverse proxy:

```bash
# Start with Nginx
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
```

### Scaling Services

```bash
# Scale backend to 3 instances
make prod-scale service=backend replicas=3

# Scale frontend to 2 instances
make prod-scale service=frontend replicas=2
```

## 🗄️ Database Management

### Backup Database

```bash
# Create backup
make db-backup

# Backups are stored in ./backups/ directory
```

### Restore Database

```bash
# Restore from backup file
make db-restore file=backups/backup_20240101_120000.sql
```

### Database Shell Access

```bash
# PostgreSQL CLI
make db-shell

# Or directly
docker-compose exec postgres psql -U postgres -d mini_saas_erp
```

### Run SQL Scripts

```bash
# Execute SQL file
docker-compose exec -T postgres psql -U postgres -d mini_saas_erp < scripts/migration.sql
```

## 📊 Monitoring & Logs

### View Logs

```bash
# All services
make logs

# Specific service
make backend-logs
make frontend-logs
make db-logs

# Follow logs
docker-compose logs -f [service-name]
```

### Health Checks

```bash
# Check service health
make health

# Or detailed status
docker-compose ps
```

### Resource Usage

```bash
# Real-time stats
make stats

# Or
docker stats
```

## 🔒 Security

### Security Features Implemented

1. **Container Security**
   - Non-root user execution
   - Minimal base images (Alpine)
   - No unnecessary packages
   - Read-only root filesystem where possible

2. **Network Security**
   - Isolated Docker network
   - Service-to-service communication only
   - No exposed ports except necessary ones

3. **Application Security**
   - Environment variable isolation
   - Secret management
   - Security headers (Nginx)
   - Rate limiting (Nginx)

4. **Database Security**
   - Named volumes for persistence
   - Backup capabilities
   - Health checks

### Security Scanning

```bash
# Scan images for vulnerabilities
make security-scan

# Or manually
docker scout cves mini-saas-backend
docker scout cves mini-saas-frontend
```

### Best Practices

- ✅ Never commit `.env` files
- ✅ Use strong, unique secrets
- ✅ Regularly update base images
- ✅ Monitor container logs
- ✅ Implement backup strategy
- ✅ Use HTTPS in production (configure Nginx SSL)

## 🔧 Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port
netstat -ano | findstr :5000

# Stop all services and restart
make down
make up
```

#### 2. Database Connection Failed

```bash
# Check database health
docker-compose ps postgres

# View database logs
make db-logs

# Restart database
docker-compose restart postgres
```

#### 3. Build Failures

```bash
# Clean and rebuild
make clean
make build
```

#### 4. Volume Permission Issues

```bash
# Reset volumes (WARNING: deletes data!)
make clean-volumes
```

### Debugging

```bash
# Enter container for debugging
docker-compose exec backend sh

# Check environment variables
docker-compose exec backend env

# Test network connectivity
docker-compose exec backend ping postgres
```

### Reset Everything

```bash
# Complete cleanup (WARNING: deletes all data!)
make clean
```

## 📚 Additional Resources

### Docker Commands Reference

```bash
# View all containers
docker ps -a

# View all images
docker images

# Remove unused resources
docker system prune -a

# View volumes
docker volume ls

# Inspect container
docker inspect <container-name>
```

### Useful Make Commands

```bash
make help           # Show all available commands
make install        # Initial setup
make build          # Build images
make up             # Start services
make down           # Stop services
make restart        # Restart services
make clean          # Complete cleanup
```

## 🌐 Production Deployment

### SSL/HTTPS Configuration

1. Obtain SSL certificates (Let's Encrypt, etc.)
2. Place certificates in `./nginx/ssl/`
3. Uncomment HTTPS server block in `nginx/conf.d/default.conf`
4. Update `COOKIE_DOMAIN` in `.env`

### Environment-Specific Configs

- **Development:** `docker-compose.dev.yml`
- **Production:** `docker-compose.prod.yml`
- **Custom:** Create `docker-compose.custom.yml`

### CI/CD Integration

Example GitHub Actions workflow:

```yaml
- name: Build and push Docker images
  run: |
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml build
    docker-compose push
```

## 📞 Support

For issues or questions:

1. Check logs: `make logs`
2. Review [Troubleshooting](#troubleshooting)
3. Open an issue on GitHub

## 📄 License

See LICENSE file for details.

---

**Built with ❤️ using Docker, Node.js, Next.js, and PostgreSQL**
