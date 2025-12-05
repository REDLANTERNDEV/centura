# ============================================
# Centura CRM - Makefile
# Geliştirme ve Deployment Komutları
# ============================================

.PHONY: help build up down logs clean dev prod restart backup

# Default target
.DEFAULT_GOAL := help

# Variables
COMPOSE_DEV = docker-compose -f docker-compose.yml -f docker-compose.dev.yml
COMPOSE_PROD = docker-compose -f docker-compose.yml -f docker-compose.prod.yml

# ============================================
# Yardım
# ============================================
help: ## Bu yardım mesajını göster
	@echo "Centura CRM - Docker Komutları"
	@echo "================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ============================================
# Geliştirme
# ============================================
dev: ## Geliştirme ortamını hot reload ile başlat
	$(COMPOSE_DEV) up --build

dev-d: ## Geliştirme ortamını arka planda başlat
	$(COMPOSE_DEV) up -d --build

dev-logs: ## Geliştirme loglarını göster
	$(COMPOSE_DEV) logs -f

dev-down: ## Geliştirme ortamını durdur
	$(COMPOSE_DEV) down

# ============================================
# Üretim
# ============================================
prod: ## Üretim ortamını başlat
	$(COMPOSE_PROD) up -d --build

prod-logs: ## Üretim loglarını göster
	$(COMPOSE_PROD) logs -f

prod-down: ## Üretim ortamını durdur
	$(COMPOSE_PROD) down

# ============================================
# Genel Komutlar
# ============================================
build: ## Tüm Docker imajlarını derle
	docker-compose build

up: ## Tüm servisleri başlat
	docker-compose up -d

down: ## Tüm servisleri durdur
	docker-compose down

restart: ## Tüm servisleri yeniden başlat
	docker-compose restart

logs: ## Tüm servisler için logları göster
	docker-compose logs -f

ps: ## Çalışan konteynerları listele
	docker-compose ps

# ============================================
# Veritabanı
# ============================================
db-backup: ## PostgreSQL veritabanını yedekle
	@mkdir -p backups
	docker-compose exec -T postgres pg_dump -U postgres centura_crm > backups/backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Yedek oluşturuldu: backups/"

db-restore: ## PostgreSQL veritabanını geri yükle (file=backups/backup.sql)
	docker-compose exec -T postgres psql -U postgres centura_crm < $(file)

db-shell: ## PostgreSQL Shell'ini aç
	docker-compose exec postgres psql -U postgres -d centura_crm

db-logs: ## Veritabanı loglarını göster
	docker-compose logs -f postgres

# ============================================
# Servis Yönetimi
# ============================================
backend-shell: ## Backend konteyner shell'ini aç
	docker-compose exec backend sh

frontend-shell: ## Frontend konteyner shell'ini aç
	docker-compose exec frontend sh

backend-logs: ## Backend loglarını göster
	docker-compose logs -f backend

frontend-logs: ## Frontend loglarını göster
	docker-compose logs -f frontend

# ============================================
# Temizleme
# ============================================
clean: ## Tüm konteynerleri, volume'ları ve imajları sil
	docker-compose down -v --remove-orphans
	docker system prune -af --volumes

clean-volumes: ## Tüm volume'ları sil (UYARI: veriyi siler!)
	docker-compose down -v

clean-images: ## Proje imajlarını sil
	docker-compose down --rmi all

# ============================================
# Durum & Izleme
# ============================================
health: ## Tüm servislerin durumunu kontrol et
	@echo "Servis durumu kontrol ediliyor..."
	@docker-compose ps

stats: ## Konteyner kaynak kullanımını göster
	docker stats

# ============================================
# Kurulum
# ============================================
install: ## İlk kurulum - .env dosyasını kopyala ve derle
	@echo "Centura CRM kurulumu başlıyor..."
	@if not exist .env copy .env.example .env
	@echo ".env dosyasını düzenleyerek konfigürasyonunu tamamla"
	@echo "Sonra çalıştır: make dev veya make prod"
