# 🚀 Mini SaaS ERP - Multi-Tenant Business Management Platform

Modern, secure, and scalable multi-tenant ERP/CRM system built with Node.js, Express, PostgreSQL, and Next.js.

> **🐳 Docker Setup (RECOMMENDED):** [Docker Quickstart](./docs/docker/QUICKSTART.md) - Get running in 5 minutes!
>
> **🔧 Manual Setup:** Follow the steps below.

## ✨ Features

### 🔐 Authentication & Security

- ✅ Argon2 password hashing (OWASP recommended)
- ✅ HTTP-only cookie-based JWT authentication
- ✅ Automatic token refresh with rotation
- ✅ Session management with automatic cleanup
- ✅ Multi-tenant data isolation

### 🏢 Multi-Tenant Architecture

- ✅ Complete organization isolation
- ✅ Role-based access control (RBAC)
- ✅ Invitation system (email-based)
- ✅ Multiple organizations per user
- ✅ Flexible role hierarchy (owner, admin, manager, user, viewer)

### 📦 Core Modules

- ✅ **Customer Management** - CRM with segments, RFM analysis, CLV tracking
- ✅ **Product Management** - Inventory tracking, low stock alerts, reorder management
- ✅ **Order Management** - Complete order workflow with stock integration
- ✅ **Analytics Dashboard** - 20+ KPIs, 5 detailed tabs, professional charts
- ✅ **Advanced Insights** - Revenue metrics, customer retention, inventory turnover
- ✅ **Organization Management** - Multi-tenant setup, settings, user management

### 🎯 Business Logic

- ✅ Automatic stock management (order creation/cancellation)
- ✅ Auto-calculated totals (subtotal, tax, discount)
- ✅ Order number generation (ORD2025000001)
- ✅ Order status workflow (draft → confirmed → processing → shipped → delivered)
- ✅ Payment tracking (pending → partial → paid → refunded)
- ✅ Customer metrics automation (RFM, CLV, retention rate)
- ✅ Real-time inventory turnover calculation

---

## 🛠️ Tech Stack

### Backend

- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **Authentication:** JWT + Argon2
- **Validation:** Native JavaScript (zero dependencies)
- **API Testing:** Bruno

### Frontend

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** CSS Modules

### DevOps

- **Version Control:** Git
- **Code Quality:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged
- **Environment:** dotenv
- **Containerization:** Docker + Docker Compose
- **Reverse Proxy:** Nginx

---

## 🚀 Quick Start

### 🐳 Method 1: Docker Setup (RECOMMENDED)

Docker is the easiest and fastest way to get started. All dependencies are installed automatically.

#### For Windows Users:

```powershell
# 1. Run the automated setup script
.\scripts\docker-setup.ps1

# The script will prompt you for:
# - Development or Production environment?
# - Secure passwords will be auto-generated
```

#### For Linux/Mac Users:

```bash
# 1. Make the script executable
chmod +x scripts/docker-setup.sh

# 2. Run the automated setup script
./scripts/docker-setup.sh
```

#### Manual Docker Setup:

```bash
# 1. Create environment file
cp .env.docker.example .env

# 2. Edit .env file (important: change passwords!)
# Windows: notepad .env
# Linux/Mac: nano .env

# 3. For development environment
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# OR for production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

> **💡 Note:** PostgreSQL is configured to use UTC timezone by default for consistent timestamp handling across all regions.

#### Access the Application:

- **Frontend:** http://localhost:4321
- **Backend API:** http://localhost:8765
- **API Health:** http://localhost:8765/api/v1/health

#### Common Docker Commands:

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Backup database
.\scripts\backup-db.ps1  # Windows
./scripts/backup-db.sh   # Linux/Mac

# Check all services status
docker-compose ps
```

**📚 Detailed Docker Guide:** [Docker Documentation](./docs/docker/README.md)

---

### 💻 Method 2: Traditional Setup (Manual)

If you prefer not to use Docker, you can set up manually.

### 💻 Yöntem 2: Geleneksel Kurulum (Manuel)

Docker kullanmak istemiyorsanız, geleneksel yöntemle kurulum yapabilirsiniz.

#### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- npm or yarn
- Bruno (for API testing)

#### 1. Clone Repository

```bash
git clone https://github.com/REDLANTERNDEV/mini-saas-erp.git
cd mini-saas-erp
```

#### 2. Install Dependencies

```bash
npm install
```

#### 3. Database Setup

```bash
# Create database
createdb saasdb

# Run migrations
cd apps/backend
psql -U postgres -d saasdb -f scripts/schema.sql
```

#### 4. Configure Environment

```bash
# Backend configuration
cd apps/backend
cp .env.example .env

# Edit .env with your settings:
# - Database credentials
# - JWT secret
# - Port number
```

#### 5. Sync Bruno Environment

**Important:** After setting up the project or changing backend PORT:

```bash
npm run sync:bruno
```

This command automatically syncs Bruno API test environment with your backend `.env` PORT setting!

#### 6. Start Development

```bash
# Start backend server
npm run dev:backend

# In another terminal, start frontend
npm run dev:frontend
```

#### 7. Test with Bruno

1. Open Bruno
2. Load collection: `api-tests/mini-saas-api`
3. Select **Development** environment
4. Run Auth/Login to get token
5. Start testing!

---

## 📁 Proje Yapısı

```text
mini-saas-erp/
├── 📱 apps/
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── config/       # Yapılandırma dosyaları
│   │   │   ├── controllers/  # İstek işleyiciler
│   │   │   ├── middleware/   # Auth, güvenlik, hata yönetimi
│   │   │   ├── models/       # Veritabanı modelleri
│   │   │   ├── routes/       # API rotaları
│   │   │   ├── services/     # İş mantığı
│   │   │   └── validators/   # Girdi doğrulama
│   │   ├── scripts/          # Veritabanı migrations
│   │   ├── docs/             # API dokümantasyonu
│   │   ├── Dockerfile        # Backend Docker yapılandırması
│   │   ├── .dockerignore     # Docker build optimizasyonu
│   │   └── .env              # Ortam değişkenleri
│   │
│   └── frontend/             # Next.js uygulaması
│       ├── app/              # Next.js 15 App Router
│       ├── components/       # React bileşenleri
│       ├── hooks/            # Custom hooks
│       ├── lib/              # Yardımcı kütüphaneler
│       ├── public/           # Statik dosyalar
│       ├── Dockerfile        # Frontend Docker yapılandırması
│       └── .dockerignore     # Docker build optimizasyonu
│
├── 🐳 Docker Yapılandırması
│   ├── docker-compose.yml            # Temel yapılandırma
│   ├── docker-compose.dev.yml        # Development ortamı
│   ├── docker-compose.prod.yml       # Production ortamı
│   ├── docker-compose.ci.yml         # CI/CD referansı
│   ├── .env.docker.example           # Docker ortam değişkenleri
│   ├── .dockerignore                 # Build context optimizasyonu
│   └── Makefile                      # Otomasyon komutları
│
├── 🔧 nginx/                 # Reverse Proxy (Production)
│   ├── nginx.conf            # Ana yapılandırma
│   └── conf.d/
│       └── default.conf      # Server blokları
│
├── 🛠️ scripts/
│   ├── docker-setup.sh       # Unix/Linux/Mac otomatik kurulum
│   ├── docker-setup.ps1      # Windows PowerShell otomatik kurulum
│   ├── backup-db.sh          # Unix veritabanı yedeği
│   ├── backup-db.ps1         # Windows veritabanı yedeği
│   └── sync-bruno-env.js     # Bruno API test senkronizasyonu
│
├── 🧪 api-tests/             # Bruno API test koleksiyonu
│   └── mini-saas-api/
│       ├── environments/     # Development & Production
│       ├── Auth/             # Authentication testleri
│       ├── Products/         # Product API testleri
│       ├── Orders/           # Order API testleri
│       ├── Analytics/        # Analytics testleri
│       └── Customers/        # Customer testleri
│
├── 📚 docs/                  # Proje dokümantasyonu
│   ├── docker/               # Docker dokümantasyonu
│   │   ├── README.md         # Komple Docker rehberi
│   │   ├── QUICKSTART.md     # Hızlı başlangıç
│   │   ├── SETUP_SUMMARY.md  # Kurulum özeti
│   │   ├── INDEX.md          # Dokümantasyon indeksi
│   │   └── PRODUCTION_CHECKLIST.md
│   ├── deployment/           # Deployment rehberleri
│   │   └── FILE_STRUCTURE.md # Detaylı dosya yapısı
│   ├── guides/               # Kullanım rehberleri
│   │   ├── analytics.md
│   │   └── analytics-page.md
│   ├── api/                  # API dokümantasyonu
│   └── architecture/         # Mimari dokümantasyonu
│
└── 📦 Root Dosyalar
    ├── README.md             # Ana README (bu dosya)
    ├── package.json          # Workspace yapılandırması
    ├── Makefile              # Docker otomasyon komutları
    └── LICENSE               # Lisans
```

---

## 📚 Kullanılabilir Komutlar

### 🐳 Docker Komutları (Önerilen)

```bash
# Development ortamını başlat
make dev

# Production ortamını başlat
make prod

# Logları görüntüle
make logs

# Veritabanı yedeği al
make db-backup

# Tüm servislerin durumunu kontrol et
make health

# Servisleri durdur
make down

# Temizlik (tüm container ve volume'leri sil)
make clean

# Tüm komutları görmek için
make help
```

### 💻 Geleneksel Development Komutları

```bash
# Backend development server'ı başlat
npm run dev:backend

# Frontend development server'ı başlat
npm run dev:frontend

# Bruno environment'ı backend .env ile senkronize et
npm run sync:bruno
```

### 🧹 Code Quality

```bash
# ESLint çalıştır
npm run lint

# Prettier ile kodu formatla
npm run format
```

### 🚀 Production Komutları (Geleneksel)

```bash
# Production için build et
npm run build

# Production server'ı başlat
npm start
```

---

## 🔧 Configuration

### Backend Environment Variables

See `apps/backend/.env.example` for the complete template with all available configuration options.

**Quick reference:**

```properties
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mini_saas_erp
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here-at-least-256-bits
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Session (CSRF protection)
SESSION_SECRET=your-session-secret-key-here-different-from-jwt
```

💡 **Tip:** Copy `.env.example` to `.env` and update the values (already covered in Quick Start step 4).

### Bruno Environment Sync

**Automatic sync with backend `.env`:**

```bash
npm run sync:bruno
```

**What it does:**

- Reads `PORT` from `apps/backend/.env`
- Updates `api-tests/mini-saas-api/environments/Development.bru`
- Sets correct `baseUrl` automatically

**When to run:**

- ✅ After cloning the project
- ✅ After changing backend PORT
- ✅ When Bruno can't connect to API
- ✅ When setting up new development environment

---

## 🔐 Authentication Flow

### 1. Register (Simple)

```json
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

No organization required during registration!

### 2. Login

```json
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

Returns HTTP-only cookies with access & refresh tokens.

### 3. After Login

User can:

- **Create organization** (becomes org_owner)
- **Accept invitation** (joins existing org)
- **Work with multiple organizations**

See [User Registration Flow](apps/backend/docs/architecture/user-registration.md) for detailed flow.

---

## 🏢 Multi-Tenant Features

### Organization Roles

- **org_owner** - Full control, can transfer ownership
- **org_admin** - Manage organization settings and users
- **manager** - Manage team and resources
- **user** - Standard access
- **viewer** - Read-only access

### Invitation System

```json
POST /api/v1/organizations/invite
{
  "email": "newmember@example.com",
  "role": "user"
}
```

Sends email invitation with unique token.

---

## 📊 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token

### Organizations

- `GET /api/v1/organizations/me` - Current organization
- `POST /api/v1/organizations` - Create organization
- `GET /api/v1/organizations/:id` - Get organization
- `PUT /api/v1/organizations/:id` - Update organization

### Products (8 endpoints)

- Full CRUD operations
- Stock management
- Low stock alerts

### Orders (8 endpoints)

- Order creation with auto-pricing
- Status workflow management
- Payment tracking
- Stock integration

### Analytics (3 endpoints)

- Sales statistics
- Top selling products
- Customer order history

### Customers

- Customer management
- Segmentation
- Credit limit tracking

See `api-tests/README.md` for detailed API documentation.

---

## 🧪 Testing

### API Testing with Bruno

1. **Start backend server**

   ```bash
   npm run dev:backend
   ```

2. **Sync environment**

   ```bash
   npm run sync:bruno
   ```

3. **Open Bruno**
   - Load collection: `api-tests/mini-saas-api`
   - Select **Development** environment
   - Run tests!

### Test Workflow

1. Auth/Login → Get token
2. Create Customer
3. Create Products
4. Create Order
5. Update Order Status
6. View Analytics

---

## 📖 Documentation

### Core Documentation

- **[Analytics Guide](docs/guides/analytics.md)** - Comprehensive analytics dashboard guide (700+ lines)
- **[Analytics Page Guide](docs/guides/analytics-page.md)** - Frontend analytics implementation
- **[Database Schema](apps/backend/docs/architecture/database.md)** - Complete database reference (38KB)
- **[Security Architecture](apps/backend/docs/architecture/security.md)** - Multi-tenant security
- **[Multi-Tenant Roles](apps/backend/docs/architecture/multi-tenant-roles.md)** - RBAC implementation
- **[User Registration Flow](apps/backend/docs/architecture/user-registration.md)** - Modern SaaS registration

### API Documentation

- **[Insights API](apps/backend/docs/api/insights.md)** - Advanced analytics endpoints (577 lines)
- **[Insights Quick Start](apps/backend/docs/api/insights-readme.md)** - Business intelligence module
- **[Orders API](apps/backend/docs/api/orders.md)** - Order management API
- **[Organizations API](apps/backend/docs/api/organizations.md)** - Organization endpoints
- **[API Overview](apps/backend/docs/api/README.md)** - API documentation index

### Architecture & Setup

- **[Backend README](apps/backend/README.md)** - Backend setup & architecture
- **[Error Handling](apps/backend/docs/architecture/error-handling.md)** - Error handling patterns
- **[HTTP-Only Cookies](apps/backend/docs/architecture/http-only-cookies.md)** - Authentication security
- **[Token Cleanup](apps/backend/docs/architecture/token-cleanup.md)** - Automatic token management
- **[Zod Implementation](apps/backend/docs/architecture/zod-implementation.md)** - Validation with Zod
- **[Zod Reference](apps/backend/docs/architecture/zod-reference.md)** - Quick reference card

### Setup & Configuration

- **[API Testing](api-tests/README.md)** - Bruno API test suite
- **[Bruno Environment Sync](apps/backend/docs/setup/bruno-environment.md)** - API testing setup
- **[CORS Setup](apps/backend/docs/setup/cors.md)** - Cross-origin configuration
- **[Token Refresh](docs/guides/token-refresh-fix.md)** - Authentication troubleshooting
- **[Test Credentials](apps/backend/docs/setup/test-credentials.md)** - Development credentials

### Frontend Documentation

- **[Frontend README](apps/frontend/README.md)** - Frontend setup
- **[Auth Middleware](apps/frontend/docs/architecture/auth-middleware.md)** - Authentication flow
- **[Organization Create](apps/frontend/docs/architecture/organization-create.md)** - Org creation architecture
- **[Organization Selection](apps/frontend/docs/architecture/organization-selection.md)** - Multi-tenant UI
- **[UI/UX Improvements](apps/frontend/docs/components/ui-ux-improvements.md)** - Design enhancements
- **[Shadcn Organization](apps/frontend/docs/components/shadcn-organization.md)** - Component library

### Archives

- **[Operations](docs/operations/)** - Documentation cleanup reports

---

## � Deployment & Docker

### Development Ortamında Çalıştırma

```bash
# Otomatik kurulum (Windows)
.\scripts\docker-setup.ps1

# Otomatik kurulum (Linux/Mac)
./scripts/docker-setup.sh

# Manuel
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Production Ortamında Çalıştırma

```bash
# 1. Environment dosyasını hazırla
cp .env.docker.example .env
# .env dosyasını düzenle ve güvenli şifreler belirle!

# 2. Production ortamını başlat
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. Nginx ile (SSL/HTTPS için)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile production up -d
```

### Veritabanı Yönetimi

```bash
# Yedek al
make db-backup
# veya
.\scripts\backup-db.ps1  # Windows
./scripts/backup-db.sh   # Linux/Mac

# Yedekten geri yükle
make db-restore file=backups/backup_20240101_120000.sql
```

### Monitoring & Logs

```bash
# Tüm logları görüntüle
make logs

# Belirli bir servisin loglarını görüntüle
docker-compose logs -f backend
docker-compose logs -f frontend

# Servis durumlarını kontrol et
make health

# Resource kullanımını görüntüle
make stats
```

**📚 Docker Dokümantasyonu:**

- **[Hızlı Başlangıç](./docs/docker/QUICKSTART.md)** - 5 dakikada çalıştır
- **[Komple Rehber](./docs/docker/README.md)** - Detaylı Docker dokümantasyonu
- **[Production Checklist](./docs/docker/PRODUCTION_CHECKLIST.md)** - Production öncesi kontrol

---

## �🔒 Security Features

- ✅ Argon2 password hashing
- ✅ HTTP-only cookies (XSS protection)
- ✅ JWT with automatic rotation
- ✅ Token expiration (15min access, 7day refresh)
- ✅ Automatic token cleanup
- ✅ Multi-tenant data isolation
- ✅ Role-based access control

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

---

## 📝 License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0) - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**REDLANTERNDEV**

- GitHub: [@REDLANTERNDEV](https://github.com/REDLANTERNDEV)

---

## 🎉 Getting Help

- **Documentation:** Check `docs/` folder
- **API Tests:** Use Bruno collection in `api-tests/`
- **Issues:** Open an issue on GitHub
- **Questions:** Check existing documentation first

---

**Built with ❤️ using modern web technologies**
