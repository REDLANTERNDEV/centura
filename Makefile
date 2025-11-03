# ============================================
# Makefile for Mini SaaS ERP
# Cross-platform development & deployment
# ============================================

.PHONY: help build up down logs clean dev prod restart backup

# Default target
.DEFAULT_GOAL := help

# Variables
COMPOSE_DEV = docker-compose -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PROD = docker-compose -f docker-compose.yml -f docker-compose.prod.yml

# ============================================
# Help
# ============================================
help: ## Show this help message
	@echo "Mini SaaS ERP - Docker Commands"
	@echo "================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# Development
# ============================================
dev: ## Start development environment with hot reload
	$(COMPOSE_DEV) up --build

dev-d: ## Start development environment in detached mode
	$(COMPOSE_DEV) up -d --build

dev-logs: ## Show development logs
	$(COMPOSE_DEV) logs -f

dev-down: ## Stop development environment
	$(COMPOSE_DEV) down

# ============================================
# Production
# ============================================
prod: ## Start production environment
	$(COMPOSE_PROD) up -d --build

prod-logs: ## Show production logs
	$(COMPOSE_PROD) logs -f

prod-down: ## Stop production environment
	$(COMPOSE_PROD) down

prod-scale: ## Scale production services (e.g., make prod-scale service=backend replicas=3)
	$(COMPOSE_PROD) up -d --scale $(service)=$(replicas)

# ============================================
# General Commands
# ============================================
build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

restart: ## Restart all services
	docker-compose restart

logs: ## Show logs for all services
	docker-compose logs -f

ps: ## List running containers
	docker-compose ps

# ============================================
# Database
# ============================================
db-backup: ## Backup PostgreSQL database
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U postgres mini_saas_erp > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created in backups/"

db-restore: ## Restore PostgreSQL database (file=backups/backup.sql)
	docker-compose exec -T postgres psql -U postgres mini_saas_erp < $(file)

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U postgres -d mini_saas_erp

db-logs: ## Show database logs
	docker-compose logs -f postgres

# ============================================
# Service Management
# ============================================
backend-shell: ## Open backend container shell
	docker-compose exec backend sh

frontend-shell: ## Open frontend container shell
	docker-compose exec frontend sh

backend-logs: ## Show backend logs
	docker-compose logs -f backend

frontend-logs: ## Show frontend logs
	docker-compose logs -f frontend

# ============================================
# Cleanup
# ============================================
clean: ## Remove all containers, volumes, and images
	docker-compose down -v --remove-orphans
	docker system prune -af --volumes

clean-volumes: ## Remove all volumes (WARNING: deletes data!)
	docker-compose down -v

clean-images: ## Remove all project images
	docker-compose down --rmi all

# ============================================
# Health & Monitoring
# ============================================
health: ## Check health of all services
	@echo "Checking service health..."
	@docker-compose ps

stats: ## Show container resource usage
	docker stats

# ============================================
# Testing
# ============================================
test: ## Run tests (placeholder)
	@echo "Running tests..."
	# Add test commands here

# ============================================
# Security
# ============================================
security-scan: ## Scan images for vulnerabilities
	@echo "Scanning images for vulnerabilities..."
	docker scout cves mini-saas-backend || true
	docker scout cves mini-saas-frontend || true

# ============================================
# Installation
# ============================================
install: ## Initial setup - copy env files and build
	@echo "Setting up Mini SaaS ERP..."
	@if not exist .env (copy .env.docker.example .env)
	@echo "Please edit .env file with your configuration"
	@echo "Then run: make dev or make prod"
