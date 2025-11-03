# 🚀 Production Deployment Checklist

Use this checklist before deploying your Mini SaaS ERP to production.

## 📋 Pre-Deployment Checklist

### Security Configuration

- [ ] **Environment Variables**
  - [ ] Created `.env` from `.env.docker.example`
  - [ ] Generated secure `JWT_SECRET` (32+ bytes)
  - [ ] Generated secure `SESSION_SECRET` (32+ bytes)
  - [ ] Set strong `DB_PASSWORD` (16+ characters)
  - [ ] Never committed `.env` to version control

- [ ] **Database Security**
  - [ ] Changed default PostgreSQL password
  - [ ] Limited database user permissions
  - [ ] Configured database firewall rules
  - [ ] Enabled PostgreSQL SSL connections (if required)
  - [ ] Set up regular automated backups

- [ ] **Application Security**
  - [ ] Updated `FRONTEND_URL` to production domain
  - [ ] Configured `COOKIE_DOMAIN` correctly
  - [ ] Enabled HTTPS/SSL
  - [ ] Reviewed CORS settings
  - [ ] Set secure cookie flags
  - [ ] Configured rate limiting
  - [ ] Enabled security headers

- [ ] **Docker Security**
  - [ ] Using latest stable base images
  - [ ] Scanned images for vulnerabilities
  - [ ] Running containers as non-root user
  - [ ] Limited container resources
  - [ ] Configured network isolation
  - [ ] Enabled read-only root filesystem where possible

### Infrastructure Setup

- [ ] **Server Configuration**
  - [ ] Minimum 2 CPU cores, 4GB RAM
  - [ ] 50GB+ disk space available
  - [ ] Docker 24.0+ installed
  - [ ] Docker Compose 2.20+ installed
  - [ ] Firewall configured (ports 80, 443)
  - [ ] SSH key-based authentication
  - [ ] Disabled root SSH access

- [ ] **Domain & SSL**
  - [ ] Domain DNS configured
  - [ ] SSL certificates obtained (Let's Encrypt/commercial)
  - [ ] Certificates placed in `nginx/ssl/`
  - [ ] Nginx HTTPS configuration uncommented
  - [ ] Automatic certificate renewal configured
  - [ ] Tested SSL configuration (A+ rating)

- [ ] **Networking**
  - [ ] Load balancer configured (if using)
  - [ ] CDN configured (if using)
  - [ ] Reverse proxy setup (Nginx)
  - [ ] Health check endpoints working
  - [ ] HTTPS redirect enabled

### Application Configuration

- [ ] **Environment Settings**
  - [ ] `NODE_ENV=production`
  - [ ] Correct API URLs configured
  - [ ] Session timeout appropriate
  - [ ] Log levels set correctly
  - [ ] Debug mode disabled

- [ ] **Database**
  - [ ] Database migrations applied
  - [ ] PostgreSQL timezone configured to UTC (automatic via docker-compose)
  - [ ] Initial data seeded (if needed)
  - [ ] Connection pooling configured
  - [ ] Query optimization reviewed
  - [ ] Database indexes created

- [ ] **Performance**
  - [ ] Static assets optimized
  - [ ] Gzip compression enabled
  - [ ] Caching strategy implemented
  - [ ] Resource limits configured
  - [ ] Connection limits appropriate

### Monitoring & Logging

- [ ] **Logging**
  - [ ] Log rotation configured
  - [ ] Centralized logging setup (optional)
  - [ ] Error tracking enabled
  - [ ] Access logs monitored
  - [ ] Sensitive data not logged

- [ ] **Monitoring**
  - [ ] Health checks working
  - [ ] Uptime monitoring configured
  - [ ] Resource monitoring enabled
  - [ ] Alerts configured
  - [ ] Dashboard created (optional)

- [ ] **Backups**
  - [ ] Automated backup script tested
  - [ ] Backup schedule configured
  - [ ] Backup restoration tested
  - [ ] Off-site backup storage
  - [ ] Backup retention policy defined

### Testing

- [ ] **Functionality**
  - [ ] All API endpoints tested
  - [ ] Frontend functionality verified
  - [ ] Authentication flow tested
  - [ ] Authorization rules verified
  - [ ] Error handling tested

- [ ] **Performance**
  - [ ] Load testing completed
  - [ ] Response times acceptable
  - [ ] Database queries optimized
  - [ ] Memory leaks checked
  - [ ] Concurrent users tested

- [ ] **Security**
  - [ ] Security scan completed
  - [ ] Vulnerability assessment done
  - [ ] Penetration testing performed (optional)
  - [ ] OWASP Top 10 reviewed
  - [ ] Dependencies up to date

## 🚀 Deployment Steps

### 1. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/mini-saas-erp
sudo chown $USER:$USER /opt/mini-saas-erp
cd /opt/mini-saas-erp
```

### 2. Code Deployment

```bash
# Clone repository (or copy files)
git clone <your-repo-url> .

# Or use rsync to copy files
# rsync -avz --exclude 'node_modules' ./ user@server:/opt/mini-saas-erp/
```

### 3. Environment Configuration

```bash
# Create production .env
cp .env.docker.example .env

# Edit with secure values
nano .env

# Verify configuration
cat .env | grep -v PASSWORD | grep -v SECRET
```

### 4. SSL Certificate Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
sudo chown $USER:$USER ./nginx/ssl/*.pem

# Uncomment HTTPS server block in nginx/conf.d/default.conf
nano nginx/conf.d/default.conf
```

### 5. Build and Start

```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or with Nginx reverse proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
```

### 6. Verify Deployment

```bash
# Build images
docker-compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Or with Nginx reverse proxy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
```

### 6. Verify Deployment

```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://localhost:5000/api/v1/health
curl http://localhost:3000

# Test from outside
curl https://yourdomain.com
curl https://yourdomain.com/api/v1/health
```

### 7. Set Up Automated Backups

```bash
# Make backup script executable
chmod +x scripts/backup-db.sh

# Test backup
./scripts/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e

# Add this line:
0 2 * * * /opt/mini-saas-erp/scripts/backup-db.sh >> /var/log/mini-saas-backup.log 2>&1
```

### 8. Configure Monitoring

```bash
# Set up log rotation
sudo nano /etc/logrotate.d/mini-saas-erp

# Add monitoring scripts/tools
# - Uptime Robot
# - New Relic
# - DataDog
# - Prometheus + Grafana
```

## 🔄 Post-Deployment

### Immediate Tasks

- [ ] Verify all services are running
- [ ] Test authentication flow
- [ ] Create admin user
- [ ] Test backup and restore
- [ ] Monitor logs for errors
- [ ] Check performance metrics
- [ ] Verify SSL certificate
- [ ] Test from different locations

### Within 24 Hours

- [ ] Monitor error rates
- [ ] Check resource usage
- [ ] Verify backups completed
- [ ] Test alerting system
- [ ] Document any issues
- [ ] Update team documentation

### Within 1 Week

- [ ] Performance optimization
- [ ] User feedback collection
- [ ] Security review
- [ ] Backup verification
- [ ] Scaling plan review
- [ ] Disaster recovery test

## 🆘 Rollback Plan

If deployment fails:

```bash
# Stop services
docker-compose down

# Restore previous version
git checkout <previous-tag>

# Restart
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Restore database if needed
./scripts/restore-db.sh backups/backup_YYYYMMDD_HHMMSS.sql.gz
```

## 📊 Production Monitoring Commands

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Check resource usage
docker stats

# Check service health
docker-compose ps
curl http://localhost:5000/api/v1/health

# View database size
docker-compose exec postgres psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('mini_saas_erp'));"

# Active connections
docker-compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"
```

## 🔐 Security Hardening

### Additional Security Measures

1. **Enable Fail2ban**

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
```

2. **Configure Firewall (UFW)**

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
sudo ufw enable
```

3. **Disable Unused Services**

```bash
sudo systemctl list-unit-files --type=service --state=enabled
# Disable unnecessary services
```

4. **Regular Updates**

```bash
# Create update script
cat > /opt/mini-saas-erp/scripts/update-system.sh << 'EOF'
#!/bin/bash
sudo apt update
sudo apt upgrade -y
docker-compose pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
EOF

chmod +x /opt/mini-saas-erp/scripts/update-system.sh

# Schedule weekly (Sunday 3 AM)
0 3 * * 0 /opt/mini-saas-erp/scripts/update-system.sh >> /var/log/mini-saas-update.log 2>&1
```

## 📈 Scaling Considerations

When you need to scale:

- [ ] Use managed database (AWS RDS, DigitalOcean Managed DB)
- [ ] Implement Redis for session storage
- [ ] Add load balancer
- [ ] Use CDN for static assets
- [ ] Horizontal scaling (multiple instances)
- [ ] Database read replicas
- [ ] Caching layer (Redis/Memcached)
- [ ] Queue system for background jobs

## 📞 Support Contacts

Document your support contacts:

- **Hosting Provider:** **\*\***\_\_\_**\*\***
- **Domain Registrar:** **\*\***\_\_\_**\*\***
- **SSL Provider:** **\*\***\_\_\_**\*\***
- **On-Call Contact:** **\*\***\_\_\_**\*\***
- **Backup Contact:** **\*\***\_\_\_**\*\***

## ✅ Final Verification

Before announcing production:

- [ ] All checklist items completed
- [ ] Team trained on deployment
- [ ] Documentation updated
- [ ] Monitoring alerts tested
- [ ] Backup/restore verified
- [ ] Performance acceptable
- [ ] Security audit passed
- [ ] User acceptance testing done

---

**Deployment Date:** **\*\***\_**\*\***  
**Deployed By:** **\*\***\_**\*\***  
**Version:** **\*\***\_**\*\***  
**Notes:** **\*\***\_**\*\***

---

🎉 **Congratulations on your production deployment!**
