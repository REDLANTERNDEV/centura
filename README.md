# 🚀 Mini SaaS ERP - Multi-Tenant Business Management Platform

Modern, secure, and scalable multi-tenant ERP/CRM system built with Node.js, Express, PostgreSQL, and Next.js.

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

- ✅ **Customer Management** - CRM with segments, cities, credit limits
- ✅ **Product Management** - Inventory tracking, low stock alerts
- ✅ **Order Management** - Complete order workflow with stock integration
- ✅ **Analytics** - Sales statistics, top products, customer insights
- ✅ **Organization Management** - Multi-tenant setup

### 🎯 Business Logic

- ✅ Automatic stock management (order creation/cancellation)
- ✅ Auto-calculated totals (subtotal, tax, discount)
- ✅ Order number generation (ORD2025000001)
- ✅ Order status workflow (draft → confirmed → delivered)
- ✅ Payment tracking (pending → paid)

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

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 14 or higher
- npm or yarn
- Bruno (for API testing)

### 1. Clone Repository

```bash
git clone https://github.com/REDLANTERNDEV/mini-saas-erp.git
cd mini-saas-erp
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Create database
createdb saasdb

# Run migrations
cd apps/backend
psql -U postgres -d saasdb -f scripts/schema.sql
```

### 4. Configure Environment

```bash
# Backend configuration
cd apps/backend
cp .env.example .env

# Edit .env with your settings:
# - Database credentials
# - JWT secret
# - Port number
```

### 5. Sync Bruno Environment

**Important:** After setting up the project or changing backend PORT:

```bash
npm run sync:bruno
```

This command automatically syncs Bruno API test environment with your backend `.env` PORT setting!

### 6. Start Development

```bash
# Start backend server
npm run dev:backend

# In another terminal, start frontend
npm run dev:frontend
```

### 7. Test with Bruno

1. Open Bruno
2. Load collection: `api-tests/mini-saas-api`
3. Select **Development** environment
4. Run Auth/Login to get token
5. Start testing!

---

## 📁 Project Structure

```text
mini-saas-erp/
├── apps/
│   ├── backend/              # Express API server
│   │   ├── src/
│   │   │   ├── config/       # Configuration files
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── middleware/   # Auth, security, error handling
│   │   │   ├── models/       # Database models
│   │   │   ├── routes/       # API routes
│   │   │   ├── services/     # Business logic
│   │   │   └── validators/   # Input validation
│   │   ├── scripts/          # Database migrations
│   │   ├── docs/             # API documentation
│   │   └── .env              # Environment variables
│   │
│   └── frontend/             # Next.js application
│       ├── app/              # Next.js 15 App Router
│       └── public/           # Static assets
│
├── api-tests/                # Bruno API test collection
│   └── mini-saas-api/
│       ├── environments/     # Development & Production
│       ├── Auth/             # Authentication tests
│       ├── Products/         # Product API tests
│       ├── Orders/           # Order API tests
│       ├── Analytics/        # Analytics tests
│       └── Customers/        # Customer tests
│
├── scripts/
│   └── sync-bruno-env.js     # Auto-sync Bruno with backend .env
│
├── docs/                     # Project documentation
│   ├── USER_REGISTRATION_FLOW.md
│   ├── BRUNO_ENV_SYNC.md
│   └── KAYIT_SISTEMI_DEGISIKLIKLERI.md
│
└── package.json              # Workspace configuration
```

---

## 📚 Available Scripts

### Development

```bash
# Start backend development server
npm run dev:backend

# Start frontend development server
npm run dev:frontend

# Sync Bruno environment with backend .env
npm run sync:bruno
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Production

```bash
# Build for production
npm run build

# Start production server
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

See `docs/USER_REGISTRATION_FLOW.md` for detailed flow.

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

- **API Testing:** `api-tests/README.md`
- **User Registration:** `docs/USER_REGISTRATION_FLOW.md`
- **Bruno Sync:** `docs/BRUNO_ENV_SYNC.md`
- **Database Schema:** `apps/backend/docs/DATABASE.md`
- **Orders API:** `apps/backend/docs/ORDERS_API_GUIDE.md`

---

## 🔒 Security Features

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

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

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
