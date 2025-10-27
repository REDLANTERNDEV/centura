# 🚀 Mini SaaS - Backend API

Professional multi-tenant SaaS backend built with **Node.js**, **Express**, and **PostgreSQL**.

## ✨ Features

### 🔐 Authentication & Security

- JWT-based authentication with HTTP-only cookies
- Multi-tenant architecture with organization isolation
- Role-based access control (Admin, Manager, User)
- Secure password hashing with bcrypt
- Token cleanup service for expired sessions

### 👥 User & Organization Management

- User registration and authentication
- Organization creation and management
- Role assignment and permissions
- Multi-user support per organization

### 📦 Product Management

- Complete CRUD operations
- Inventory tracking
- Stock management (add/subtract)
- Low stock alerts
- Category and SKU management
- Price and cost tracking
- Tax rate configuration

### 📋 Order Management

- Order creation with automatic pricing
- Order status workflow (draft → confirmed → processing → shipped → delivered)
- Payment tracking (pending → partial → paid → refunded)
- Automatic stock deduction
- Order cancellation with stock restoration
- Customer order history
- Order search and filtering

### 👤 Customer Management

- Customer CRUD operations
- Corporate and individual customer types
- Customer segmentation (VIP, Premium, Standard, etc.)
- Credit limit management
- Payment terms configuration
- Tax information tracking

### 📊 Analytics & Reporting

- Sales statistics
- Top-selling products
- Revenue tracking
- Order analytics
- Customer insights

## 🏗️ Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Authentication**: JWT (jsonwebtoken)
- **Security**: bcrypt, cookie-parser, helmet
- **Validation**: Custom validators
- **Environment**: dotenv

## 📁 Project Structure

```text
apps/backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── db.js        # Database connection
│   │   ├── cookies.js   # Cookie settings
│   │   └── test.js      # Test utilities
│   ├── controllers/      # Request handlers
│   │   ├── userController.js
│   │   ├── organizationController.js
│   │   ├── customerController.js
│   │   ├── productController.js
│   │   └── orderController.js
│   ├── middleware/       # Express middleware
│   │   ├── auth.js      # Authentication
│   │   ├── security.js  # Security headers
│   │   └── errorHandler.js
│   ├── models/           # Database models
│   │   ├── userModel.js
│   │   ├── organizationModel.js
│   │   ├── roleModel.js
│   │   ├── customerModel.js
│   │   ├── productModel.js
│   │   └── orderModel.js
│   ├── routes/           # API routes
│   │   ├── authRoutes.js
│   │   ├── organizationRoutes.js
│   │   ├── customerRoutes.js
│   │   └── index.js
│   ├── services/         # Business services
│   │   └── tokenCleanupService.js
│   └── validators/       # Input validation
│       ├── customerValidator.js
│       ├── productValidator.js
│       └── orderValidator.js
├── scripts/              # Database scripts
│   ├── migration_*.sql  # Migration files
│   └── seed_*.sql       # Seed data
├── docs/                 # Documentation
│   ├── DATABASE.md      # Database schema
│   ├── ORDERS_API_GUIDE.md
│   └── *.md
├── tests/                # Test files
├── app.js               # Express app configuration
├── server.js            # Server entry point
└── package.json
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher (or Docker)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd mini-saas-erp/apps/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` file:

   ```env
   PORT=5000
   NODE_ENV=development

   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=saasdb
   DB_USER=postgres
   DB_PASSWORD=your_password

   # JWT
   JWT_SECRET=your_super_secret_key_change_in_production
   JWT_EXPIRES_IN=15m
   JWT_COOKIE_EXPIRES_IN=15
   ```

4. **Set up PostgreSQL Database**

   **Option A: Using Docker**

   ```bash
   docker run --name postgres-db \
     -e POSTGRES_PASSWORD=yourpassword \
     -e POSTGRES_DB=saasdb \
     -p 5432:5432 \
     -d postgres:15
   ```

   **Option B: Local PostgreSQL**

   ```sql
   CREATE DATABASE saasdb;
   ```

5. **Run Database Migrations**

   ```bash
   # Execute migration files in order
   psql -U postgres -d saasdb -f scripts/migration_001_initial.sql
   psql -U postgres -d saasdb -f scripts/migration_002_customers.sql
   psql -U postgres -d saasdb -f scripts/migration_products_orders.sql
   ```

   **Or using Docker:**

   ```bash
   docker exec -i postgres-db psql -U postgres -d saasdb < scripts/migration_001_initial.sql
   docker exec -i postgres-db psql -U postgres -d saasdb < scripts/migration_002_customers.sql
   docker exec -i postgres-db psql -U postgres -d saasdb < scripts/migration_products_orders.sql
   ```

6. **Start the server**

   ```bash
   npm start
   ```

   Server will start on <http://localhost:5000>

## 🧪 Testing

### Using Bruno (Recommended)

Professional API testing with [Bruno](https://www.usebruno.com/):

1. Open Bruno
2. Import collection from `../../api-tests/mini-saas-api/`
3. Select Development environment
4. Run requests!

See detailed guide: `../../api-tests/README.md`

### Using cURL

```bash
# Register new user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "orgName": "Acme Corp",
    "orgCode": "ACME001"
  }'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePass123!"
  }'

# Get products (with cookie)
curl -X GET http://localhost:5000/api/v1/products \
  -b cookies.txt
```

## 📚 API Documentation

### Authentication

- `POST /api/v1/auth/register` - Register new user and organization
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user

### Organizations

- `GET /api/v1/organizations` - List organizations
- `GET /api/v1/organizations/:id` - Get organization details
- `PUT /api/v1/organizations/:id` - Update organization
- `DELETE /api/v1/organizations/:id` - Delete organization

### Customers

- `GET /api/v1/customers` - List customers (with pagination & filters)
- `GET /api/v1/customers/:id` - Get customer details
- `POST /api/v1/customers` - Create customer
- `PUT /api/v1/customers/:id` - Update customer
- `DELETE /api/v1/customers/:id` - Delete customer

### Products

- `GET /api/v1/products` - List products (with pagination & filters)
- `GET /api/v1/products/:id` - Get product details
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/:id` - Update product
- `PATCH /api/v1/products/:id/stock` - Update stock
- `GET /api/v1/products/low-stock` - Get low stock products
- `DELETE /api/v1/products/:id` - Delete product (soft delete)

### Orders

- `GET /api/v1/orders` - List orders (with pagination & filters)
- `GET /api/v1/orders/:id` - Get order details
- `POST /api/v1/orders` - Create order
- `PATCH /api/v1/orders/:id/status` - Update order status
- `PATCH /api/v1/orders/:id/payment` - Update payment status
- `PATCH /api/v1/orders/:id/cancel` - Cancel order
- `DELETE /api/v1/orders/:id` - Delete order
- `GET /api/v1/orders/statistics` - Get sales statistics
- `GET /api/v1/orders/top-products` - Get top-selling products
- `GET /api/v1/orders/customer/:customerId` - Get customer orders

For detailed API documentation, see:

- [Orders API Guide](docs/ORDERS_API_GUIDE.md)
- [Database Schema](docs/DATABASE.md)
- [Multi-Tenant Roles](docs/MULTI_TENANT_ROLES_GUIDE.md)

## 🔒 Security Features

- **HTTP-Only Cookies**: Tokens stored in HTTP-only cookies to prevent XSS
- **Helmet**: Security headers configured
- **CORS**: Configurable CORS policy
- **Password Hashing**: bcrypt with salt rounds
- **JWT Expiration**: Short-lived tokens (15 minutes)
- **Input Validation**: Custom validators for all inputs
- **SQL Injection Protection**: Parameterized queries
- **Organization Isolation**: Multi-tenant data isolation

## 🗄️ Database Schema

### Core Tables

- `users` - User accounts
- `organizations` - Organization/company data
- `roles` - User roles and permissions
- `customers` - Customer information
- `products` - Product catalog
- `orders` - Order headers
- `order_items` - Order line items

### Views

- `product_inventory_status` - Product stock status
- `order_summary` - Order summary with customer info

See [DATABASE.md](docs/DATABASE.md) for complete schema documentation.

## 🛠️ Development

### Environment

- Development: `NODE_ENV=development`
- Production: `NODE_ENV=production`

### Database Migrations

Place migration files in `scripts/` folder with naming convention:

- `migration_001_initial.sql`
- `migration_002_feature_name.sql`
- etc.

Execute in order using psql or Docker.

### Code Style

- ESLint configured
- Follow existing code patterns
- Use async/await for database operations
- Include JSDoc comments for functions
- Validate inputs before processing

## 📊 Performance

- Connection pooling configured (max 20 connections)
- Indexes on foreign keys
- Pagination for list endpoints (default 50 per page)
- Token cleanup service runs daily at 3 AM

## 🐛 Troubleshooting

### Database Connection Errors

```bash
# Check PostgreSQL is running
docker ps  # for Docker
sudo systemctl status postgresql  # for Linux

# Check connection settings in .env
DB_HOST=localhost
DB_PORT=5432
```

### Authentication Issues

- Token expires in 15 minutes
- Clear cookies and login again
- Check JWT_SECRET is set in .env

### Migration Errors

- Run migrations in order
- Check PostgreSQL version (15+)
- Verify database exists
- Check user permissions

## 📝 License

MIT License

## 👥 Contributing

Contributions are welcome! Please follow the existing code style and include tests.

---

Built with ❤️ for modern SaaS applications
