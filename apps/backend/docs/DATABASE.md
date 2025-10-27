# Database Schema

## Overview

This document describes the database schema for the Mini SaaS ERP/CRM application.

## Database: saasdb (PostgreSQL in Docker)

## Tables

### organizations

Organization/Company master table for multi-tenancy.

```sql
CREATE TABLE organizations (
  org_id SERIAL PRIMARY KEY,
  org_name VARCHAR(255) NOT NULL,
  industry VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Turkey',
  tax_number VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

- `org_id`: Auto-incrementing primary key (sufficient for unique identification)
- `org_name`: Organization/Company name
- `industry`: Business industry/sector
- `phone`: Organization phone number
- `email`: Organization contact email
- `address`: Full address
- `city`: City location
- `country`: Country (default: Turkey)
- `tax_number`: Tax identification number
- `is_active`: Organization active status
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Indexes:**

```sql
CREATE INDEX idx_organizations_is_active ON organizations(is_active);
CREATE INDEX idx_organizations_org_name ON organizations(org_name);
```

---

### users

User authentication and management table.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(org_id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  system_role VARCHAR(50) CHECK (system_role IN ('platform_admin') OR system_role IS NULL),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `org_id`: Foreign key to organizations table (nullable for platform admins)
- `email`: User's email address (unique, stored in lowercase via backend normalization)
- `password_hash`: Argon2 hashed password
- `first_name`: User's first name
- `last_name`: User's last name
- `system_role`: Platform-level role (only 'platform_admin' or NULL) - **NOT for user data access**
- `is_active`: User active status
- `created_at`: Account creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Important Notes:**

- Email addresses are automatically normalized to lowercase by the backend before any database operation
- `system_role = 'super_admin'` has been **REMOVED** for security (October 2024)
- Platform admins can ONLY manage infrastructure, NEVER access user/organization data
- All user permissions are managed through `user_organization_roles` table

**Foreign Keys:**

- `org_id` → `organizations(org_id)` ON DELETE SET NULL

**Indexes:**

```sql
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_system_role ON users(system_role);
```

---

### refresh_tokens

Stores hashed JWT refresh tokens for session management.

```sql
CREATE TABLE refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to users table
- `token_hash`: Argon2 hashed refresh token (never store plain tokens)
- `expires_at`: Token expiration timestamp
- `created_at`: Token creation timestamp
- `is_revoked`: Token revocation status

**Foreign Keys:**

- `user_id` → `users(id)` ON DELETE CASCADE

**Indexes:**

```sql
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

---

### user_organization_roles

Organization-based role assignments for multi-tenant security.

```sql
CREATE TABLE user_organization_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('org_owner', 'org_admin', 'manager', 'user', 'viewer')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_org_role UNIQUE (user_id, org_id)
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to users table
- `org_id`: Foreign key to organizations table
- `role`: Organization role (org_owner=80, org_admin=60, manager=40, user=20, viewer=10)
- `permissions`: Additional JSON permissions
- `is_active`: Role active status
- `assigned_by`: User who assigned this role
- `assigned_at`: Role assignment timestamp
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Role Hierarchy:**

- `org_owner` (80): Organization owner - full control
- `org_admin` (60): Organization administrator
- `manager` (40): Team lead/manager
- `user` (20): Regular user
- `viewer` (10): Read-only access

**Foreign Keys:**

- `user_id` → `users(id)` ON DELETE CASCADE
- `org_id` → `organizations(org_id)` ON DELETE CASCADE
- `assigned_by` → `users(id)` ON DELETE SET NULL

**Indexes:**

```sql
CREATE INDEX idx_user_org_roles_user_id ON user_organization_roles(user_id);
CREATE INDEX idx_user_org_roles_org_id ON user_organization_roles(org_id);
CREATE INDEX idx_user_org_roles_role ON user_organization_roles(role);
CREATE INDEX idx_user_org_roles_is_active ON user_organization_roles(is_active);
CREATE UNIQUE INDEX unique_user_org_role ON user_organization_roles(user_id, org_id);
```

---

### platform_admins

Platform administrators for infrastructure management ONLY.

```sql
CREATE TABLE platform_admins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_level VARCHAR(50) NOT NULL CHECK (admin_level IN ('senior', 'junior', 'readonly')),
  permissions JSONB DEFAULT '{"infrastructure_only": true}',
  can_access_user_data BOOLEAN DEFAULT FALSE CHECK (can_access_user_data = FALSE),
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_platform_admin UNIQUE (user_id)
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `user_id`: Foreign key to users table
- `admin_level`: Platform admin level (senior, junior, readonly)
- `permissions`: JSON permissions (infrastructure only)
- `can_access_user_data`: **ALWAYS FALSE** - Platform admins CANNOT access user data
- `assigned_by`: User who assigned this role
- `assigned_at`: Assignment timestamp
- `revoked_at`: Revocation timestamp (if revoked)
- `is_active`: Admin status
- `notes`: Administrative notes
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Security Notes:**

- Platform admins manage infrastructure (databases, servers, deployments)
- Platform admins **CANNOT** access any organization or customer data
- This follows enterprise standards (Stripe, Salesforce, AWS model)
- All platform admin actions should be logged in audit_logs

**Foreign Keys:**

- `user_id` → `users(id)` ON DELETE CASCADE
- `assigned_by` → `users(id)` ON DELETE SET NULL

**Indexes:**

```sql
CREATE INDEX idx_platform_admins_user_id ON platform_admins(user_id);
CREATE INDEX idx_platform_admins_admin_level ON platform_admins(admin_level);
CREATE INDEX idx_platform_admins_is_active ON platform_admins(is_active);
CREATE UNIQUE INDEX unique_platform_admin ON platform_admins(user_id);
```

---

### support_access_requests

Time-limited support access with customer approval.

```sql
CREATE TABLE support_access_requests (
  id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  support_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  access_level VARCHAR(50) NOT NULL CHECK (access_level IN ('readonly', 'limited', 'full')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'revoked')),
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  access_started_at TIMESTAMP,
  access_ended_at TIMESTAMP,
  approval_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `ticket_number`: Unique support ticket number
- `support_user_id`: Support team member requesting access
- `target_org_id`: Target organization for support access
- `requested_by`: User who created the request
- `reason`: Detailed reason for access request
- `access_level`: readonly, limited, or full access
- `status`: Request status (pending, approved, rejected, expired, revoked)
- `approved_by`: Customer user who approved the request
- `approved_at`: Approval timestamp
- `expires_at`: Access expiration timestamp (max 24 hours)
- `access_started_at`: When access was actually used
- `access_ended_at`: When access was terminated
- `approval_notes`: Customer approval notes
- `created_at`: Request creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Security Workflow:**

1. Support creates request with ticket number and reason
2. Customer org_owner/org_admin must approve
3. Access is time-limited (max 24 hours)
4. All actions during access are logged in audit_logs
5. Access auto-expires or can be revoked anytime

**Foreign Keys:**

- `support_user_id` → `users(id)` ON DELETE CASCADE
- `target_org_id` → `organizations(org_id)` ON DELETE CASCADE
- `requested_by` → `users(id)` ON DELETE SET NULL
- `approved_by` → `users(id)` ON DELETE SET NULL

**Indexes:**

```sql
CREATE INDEX idx_support_requests_ticket_number ON support_access_requests(ticket_number);
CREATE INDEX idx_support_requests_support_user ON support_access_requests(support_user_id);
CREATE INDEX idx_support_requests_target_org ON support_access_requests(target_org_id);
CREATE INDEX idx_support_requests_status ON support_access_requests(status);
CREATE INDEX idx_support_requests_expires_at ON support_access_requests(expires_at);
CREATE UNIQUE INDEX unique_support_ticket ON support_access_requests(ticket_number);
```

---

### audit_logs

Comprehensive audit trail for GDPR/SOC2/ISO27001 compliance.

```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(org_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  request_id VARCHAR(100),
  support_ticket_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `org_id`: Organization context (nullable for platform actions)
- `user_id`: User who performed the action
- `action`: Action type (CREATE, UPDATE, DELETE, VIEW, EXPORT, etc.)
- `entity_type`: Entity affected (customer, user, organization, etc.)
- `entity_id`: ID of affected entity
- `changes`: JSON before/after values
- `ip_address`: Client IP address
- `user_agent`: Client user agent
- `request_id`: Unique request identifier for tracing
- `support_ticket_number`: If action was during support access
- `created_at`: Action timestamp

**Use Cases:**

- GDPR compliance (data access/export tracking)
- SOC2 audit requirements
- ISO27001 security controls
- Security incident investigation
- Customer data access transparency

**Foreign Keys:**

- `org_id` → `organizations(org_id)` ON DELETE CASCADE
- `user_id` → `users(id)` ON DELETE SET NULL

**Indexes:**

```sql
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_support_ticket ON audit_logs(support_ticket_number);
```

---

### customers

Customer/Client management table for ERP/CRM system.

```sql
CREATE TABLE customers (
  customer_id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  customer_code VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  mobile VARCHAR(20),
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Turkey',
  address TEXT,
  postal_code VARCHAR(20),
  tax_number VARCHAR(50),
  tax_office VARCHAR(100),

  -- CRM fields
  segment VARCHAR(50) CHECK (segment IN ('VIP', 'Premium', 'Standard', 'Basic', 'Potential')),
  customer_type VARCHAR(50) CHECK (customer_type IN ('Corporate', 'Individual', 'Government', 'Other')),
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(15, 2) DEFAULT 0,

  -- Status & metadata
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Constraints
  CONSTRAINT unique_customer_code_per_org UNIQUE (org_id, customer_code)
);
```

**Columns:**

- `customer_id`: Auto-incrementing primary key
- `org_id`: Foreign key to organizations table (multi-tenancy)
- `customer_code`: Unique customer code within organization (e.g., 'CUST-001')
- `name`: Customer/Company name
- `email`: Customer email address
- `phone`: Primary phone number
- `mobile`: Mobile phone number
- `city`: Customer city
- `country`: Customer country (default: Turkey)
- `address`: Full postal address
- `postal_code`: Postal/ZIP code
- `tax_number`: Tax identification number
- `tax_office`: Tax office name
- `segment`: Customer segment (VIP, Premium, Standard, Basic, Potential)
- `customer_type`: Customer type (Corporate, Individual, Government, Other)
- `payment_terms`: Payment terms in days (default: 30)
- `credit_limit`: Maximum credit limit (default: 0)
- `is_active`: Customer active status (for soft delete)
- `notes`: Additional notes/comments
- `assigned_user_id`: User responsible for this customer
- `created_by`: User who created this customer
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Foreign Keys:**

- `org_id` → `organizations(org_id)` ON DELETE CASCADE
- `assigned_user_id` → `users(id)` ON DELETE SET NULL
- `created_by` → `users(id)` ON DELETE SET NULL

**Indexes:**

```sql
CREATE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_city ON customers(city);
CREATE INDEX idx_customers_segment ON customers(segment);
CREATE INDEX idx_customers_is_active ON customers(is_active);
CREATE INDEX idx_customers_created_at ON customers(created_at);
```

**Constraints:**

- `unique_customer_code_per_org`: Customer code must be unique within each organization
- `segment`: CHECK constraint for valid segments
- `customer_type`: CHECK constraint for valid customer types

---

## Triggers

### Auto-update timestamps

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_organization_roles_updated_at
  BEFORE UPDATE ON user_organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_admins_updated_at
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_access_requests_updated_at
  BEFORE UPDATE ON support_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Database Functions

### Role & Permission Helpers

```sql
-- Get user's role in a specific organization
CREATE OR REPLACE FUNCTION get_user_role_in_org(p_user_id INTEGER, p_org_id INTEGER)
RETURNS VARCHAR AS $$
DECLARE
    v_role VARCHAR(50);
BEGIN
    SELECT role INTO v_role
    FROM user_organization_roles
    WHERE user_id = p_user_id
      AND org_id = p_org_id
      AND is_active = TRUE;

    RETURN v_role;
END;
$$ LANGUAGE plpgsql;

-- Check if user has required permission level in organization
CREATE OR REPLACE FUNCTION user_has_permission(
    p_user_id INTEGER,
    p_org_id INTEGER,
    p_required_role VARCHAR
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_role VARCHAR(50);
    v_role_levels JSONB := '{
        "org_owner": 80,
        "org_admin": 60,
        "manager": 40,
        "user": 20,
        "viewer": 10
    }'::jsonb;
BEGIN
    v_user_role := get_user_role_in_org(p_user_id, p_org_id);

    IF v_user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    RETURN (v_role_levels->>v_user_role)::INTEGER >= (v_role_levels->>p_required_role)::INTEGER;
END;
$$ LANGUAGE plpgsql;
```

### Views

```sql
-- User organization access view
CREATE OR REPLACE VIEW v_user_organization_access AS
SELECT
    u.id AS user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.is_active AS user_active,
    uor.org_id,
    o.org_name,
    o.org_code,
    uor.role,
    uor.is_active AS role_active,
    uor.assigned_at,
    uor.assigned_by
FROM users u
INNER JOIN user_organization_roles uor ON u.id = uor.user_id
INNER JOIN organizations o ON uor.org_id = o.org_id
WHERE u.is_active = TRUE
  AND uor.is_active = TRUE
  AND o.is_active = TRUE;
```

---

## Entity Relationship Diagram

```text
organizations (1) ──< (N) users
     │                    │
     │ (1)                │ (1)
     │                    │
     ├──< (N) customers   ├──< (N) refresh_tokens
     │    │               │
     │    └──< (N) orders ├──< (N) user_organization_roles
     │         │          │
     │         └──< (N) order_items ├──< (1) platform_admins
     │                    │          │
     ├──< (N) products    │          └──< (N) support_access_requests
     │    │               │
     │    └──< (N) order_items
     │
     ├──< (N) user_organization_roles
     │
     ├──< (N) support_access_requests
     │
     └──< (N) audit_logs

users (1) ──< (N) audit_logs

customers (1) ──< (N) orders
          │
          └──< assigned_user_id (users)
          └──< created_by (users)

products (1) ──< (N) order_items
         │
         └──< created_by (users)

orders (1) ──< (N) order_items
       │
       └──< created_by (users)
```

**Key Relationships:**

- Each **organization** can have multiple products, orders, and customers
- Each **customer** can have multiple orders
- Each **order** contains multiple order_items
- Each **product** can appear in multiple order_items
- All entities are isolated by **org_id** for multi-tenancy
- Historical accuracy: order_items store prices (don't reference current product prices)

---

## Multi-Tenancy Model

### Organization Isolation (Full Tenant Isolation)

All data is isolated by `org_id` with **ZERO cross-organization access**:

- Users can belong to organizations via `user_organization_roles`
- Customers belong to one organization only
- Queries automatically filter by `WHERE org_id = user.org_id`
- **No cross-organization data access** - enforced at middleware level
- Each organization is completely isolated (Stripe/Salesforce model)

### Security Model (Enterprise-Grade)

#### 1. Organization Roles (Primary Authorization)

- ✅ All permissions managed through `user_organization_roles` table
- ✅ Role hierarchy: org_owner (80) > org_admin (60) > manager (40) > user (20) > viewer (10)
- ✅ One user can have different roles in different organizations
- ✅ Automatic org_owner assignment on organization creation

#### 2. Platform Administration (Infrastructure Only)

- ✅ `platform_admins` table for infrastructure management
- ✅ Platform admins **CANNOT** access organization or customer data
- ✅ Enforced by `can_access_user_data = FALSE` check constraint
- ✅ Separate from user permissions (infrastructure vs. user data)

#### 3. Support Access (Time-Limited & Approved)

- ✅ `support_access_requests` table for customer support
- ✅ Requires customer approval (org_owner or org_admin)
- ✅ Time-limited access (max 24 hours)
- ✅ All actions logged in audit_logs
- ✅ Ticket-based workflow (no direct access)

#### 4. Audit Trail (Compliance)

- ✅ `audit_logs` table for comprehensive logging
- ✅ GDPR compliance (data access transparency)
- ✅ SOC2/ISO27001 audit requirements
- ✅ Tracks all CRUD operations
- ✅ Links to support tickets when applicable

#### 5. JWT Token Security

- ✅ HTTP-only cookies (XSS protection)
- ✅ Tokens include: userId, email, orgId
- ✅ **Removed**: systemRole field (security improvement - Oct 2024)
- ✅ Refresh token rotation
- ✅ Token cleanup service (automated)

### Security Features

- ✅ Full tenant isolation (no cross-org access)
- ✅ Role-based access control (RBAC)
- ✅ Platform admin separation (infrastructure only)
- ✅ Support access workflow (approval required)
- ✅ Comprehensive audit logging
- ✅ Foreign key constraints ensure data integrity
- ✅ CASCADE deletes maintain referential integrity
- ✅ CHECK constraints for data validation

### Enterprise Standards Compliance

This security model follows industry best practices from:

- **Stripe**: Full tenant isolation, no super admin
- **Salesforce**: Organization-based permissions
- **AWS**: Separate infrastructure and user data access
- **Notion**: Time-limited support access with approval

**Migration Note (October 2024):**

- ❌ Removed: `system_role = 'super_admin'` (security risk)
- ✅ Added: Enterprise security tables (platform_admins, support_access_requests, audit_logs)
- ✅ Migration: All super_admins converted to org_owner roles
- ✅ Result: Zero single-point-of-failure accounts

---

## Sample Data

```sql
-- Default Organization
INSERT INTO organizations (org_name, industry, is_active)
VALUES ('Default Organization', 'General', TRUE);

-- Sample Customers
INSERT INTO customers (
  org_id, customer_code, name, email, phone, city, segment, customer_type, is_active
) VALUES
  (1, 'CUST-001', 'Acme Corporation', 'contact@acme.com', '+90 212 555 0001', 'Istanbul', 'VIP', 'Corporate', TRUE),
  (1, 'CUST-002', 'Tech Solutions Ltd.', 'info@techsolutions.com', '+90 312 555 0002', 'Ankara', 'Premium', 'Corporate', TRUE),
  (1, 'CUST-003', 'Global Trade Inc.', 'sales@globaltrade.com', '+90 232 555 0003', 'Izmir', 'Standard', 'Corporate', TRUE),
  (1, 'CUST-004', 'Ahmet Yılmaz', 'ahmet@example.com', '+90 555 111 2233', 'Istanbul', 'Basic', 'Individual', TRUE),
  (1, 'CUST-005', 'Mehmet Demir', 'mehmet@example.com', '+90 555 444 5566', 'Ankara', 'Standard', 'Individual', TRUE);
```

---

### products

Product catalog with inventory management for ERP system.

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cost_price DECIMAL(10, 2),
  tax_rate DECIMAL(5, 2) DEFAULT 0.00,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  unit VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT unique_sku_per_org UNIQUE(org_id, sku),
  CONSTRAINT check_price_positive CHECK (price >= 0),
  CONSTRAINT check_cost_price_positive CHECK (cost_price >= 0 OR cost_price IS NULL),
  CONSTRAINT check_stock_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT check_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100)
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `org_id`: Foreign key to organizations table (multi-tenancy)
- `name`: Product name
- `description`: Detailed product description
- `sku`: Stock Keeping Unit - unique identifier per organization
- `barcode`: Product barcode (optional)
- `category`: Product category (Electronics, Furniture, etc.)
- `price`: Selling price (DECIMAL for financial accuracy)
- `cost_price`: Purchase/cost price (for profit calculations)
- `tax_rate`: Tax percentage (e.g., 18.00 for 18% VAT)
- `stock_quantity`: Current stock quantity
- `low_stock_threshold`: Alert threshold for low stock
- `unit`: Unit of measurement (pcs, kg, liter, box, etc.)
- `is_active`: Product active status (for soft delete)
- `created_by`: User who created this product
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Foreign Keys:**

- `org_id` → `organizations(org_id)` ON DELETE CASCADE
- `created_by` → `users(id)` ON DELETE SET NULL

**Indexes:**

```sql
CREATE INDEX idx_products_org_id ON products(org_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_low_stock ON products(stock_quantity, low_stock_threshold);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
```

**Constraints:**

- `unique_sku_per_org`: SKU must be unique within each organization
- `check_price_positive`: Price cannot be negative
- `check_cost_price_positive`: Cost price cannot be negative (if provided)
- `check_stock_non_negative`: Stock quantity cannot be negative
- `check_tax_rate_valid`: Tax rate must be between 0 and 100

---

### orders

Customer orders with complete workflow and payment tracking.

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMP,

  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
  ),

  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'partial', 'paid', 'refunded')
  ),
  payment_method VARCHAR(50),
  paid_amount DECIMAL(10, 2) DEFAULT 0.00,

  shipping_address TEXT,
  shipping_city VARCHAR(100),
  billing_address TEXT,
  billing_city VARCHAR(100),

  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  notes TEXT,

  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_subtotal_positive CHECK (subtotal >= 0),
  CONSTRAINT check_discount_percentage_valid CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  CONSTRAINT check_discount_amount_positive CHECK (discount_amount >= 0),
  CONSTRAINT check_tax_amount_positive CHECK (tax_amount >= 0),
  CONSTRAINT check_total_positive CHECK (total >= 0),
  CONSTRAINT check_paid_amount_positive CHECK (paid_amount >= 0)
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `org_id`: Foreign key to organizations table (multi-tenancy)
- `customer_id`: Foreign key to customers table
- `order_number`: Unique order number (auto-generated, format: ORD2025000001)
- `order_date`: Order creation date
- `expected_delivery_date`: Expected delivery date
- `status`: Order workflow status (draft → confirmed → processing → shipped → delivered / cancelled)
- `payment_status`: Payment status (pending → partial → paid / refunded)
- `payment_method`: Payment method (cash, credit_card, bank_transfer, etc.)
- `paid_amount`: Amount already paid
- `shipping_address`: Shipping address
- `shipping_city`: Shipping city
- `billing_address`: Billing address
- `billing_city`: Billing city
- `subtotal`: Sum of all order items before discounts and tax
- `discount_percentage`: Order-level discount percentage
- `discount_amount`: Order-level discount amount
- `tax_amount`: Total tax amount
- `total`: Final order total (subtotal - discount + tax)
- `notes`: Additional order notes
- `created_by`: User who created this order
- `created_at`: Record creation timestamp
- `updated_at`: Last update timestamp (auto-updated via trigger)

**Order Status Workflow:**

- `draft` → `confirmed` → `processing` → `shipped` → `delivered`
- `cancelled` (can be set at any stage except after delivered)

**Payment Status Workflow:**

- `pending` → `partial` → `paid` → `refunded`

**Foreign Keys:**

- `org_id` → `organizations(org_id)` ON DELETE CASCADE
- `customer_id` → `customers(customer_id)` ON DELETE RESTRICT
- `created_by` → `users(id)` ON DELETE SET NULL

**Indexes:**

```sql
CREATE INDEX idx_orders_org_id ON orders(org_id);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_date_range ON orders(org_id, order_date DESC);
```

---

### order_items

Individual line items within orders.

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,

  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) NOT NULL,
  total DECIMAL(10, 2) NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT check_quantity_positive CHECK (quantity > 0),
  CONSTRAINT check_unit_price_positive CHECK (unit_price >= 0),
  CONSTRAINT check_item_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100),
  CONSTRAINT check_item_discount_positive CHECK (discount_amount >= 0),
  CONSTRAINT check_item_subtotal_positive CHECK (subtotal >= 0),
  CONSTRAINT check_item_tax_amount_positive CHECK (tax_amount >= 0),
  CONSTRAINT check_item_total_positive CHECK (total >= 0)
);
```

**Columns:**

- `id`: Auto-incrementing primary key
- `order_id`: Foreign key to orders table
- `product_id`: Foreign key to products table
- `quantity`: Quantity ordered
- `unit_price`: Price per unit (stored for historical accuracy - doesn't change if product price changes)
- `tax_rate`: Tax percentage for this item
- `discount_amount`: Item-level discount amount
- `subtotal`: quantity × unit_price
- `tax_amount`: (subtotal - discount) × (tax_rate / 100)
- `total`: subtotal - discount_amount + tax_amount
- `created_at`: Record creation timestamp

**Calculations:**

- `subtotal = quantity × unit_price`
- `tax_amount = (subtotal - discount_amount) × (tax_rate / 100)`
- `total = subtotal - discount_amount + tax_amount`

**Foreign Keys:**

- `order_id` → `orders(id)` ON DELETE CASCADE
- `product_id` → `products(id)` ON DELETE RESTRICT

**Indexes:**

```sql
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
```

**Important Notes:**

- Prices and tax rates are **stored** (not referenced) to maintain historical accuracy
- If a product's price changes after an order is placed, the order retains the original price
- This is essential for financial accuracy and invoice generation

---

## Migration Files

- `scripts/create_organizations_and_customers.sql` - Initial schema migration
- `scripts/create_customers_tables.sql` - Customer table creation
- `scripts/remove_super_admin_add_enterprise_security.sql` - **Enterprise security migration (Oct 2024)**
  - Removes super_admin system role
  - Adds platform_admins table (infrastructure only)
  - Adds support_access_requests table (time-limited access)
  - Adds audit_logs table (compliance)
  - Adds user_organization_roles table (multi-tenant RBAC)
  - Updates all database functions for tenant isolation
- `scripts/migration_products_orders.sql` - **Products & Orders System (Oct 2024)**
  - Adds products table (inventory management)
  - Adds orders table (order workflow & payment tracking)
  - Adds order_items table (order line items)
  - Adds product_inventory_status view (inventory reporting)
  - Adds order_summary view (order analytics)
  - Includes automatic stock management
  - Includes historical price preservation

---

## Performance Optimizations

1. **Indexes on frequently queried columns:**
   - `org_id` (for multi-tenancy filtering)
   - `city` (for geographic analysis)
   - `segment` (for customer segmentation)
   - `is_active` (for filtering active records)

2. **Triggers for automatic timestamp updates:**
   - `updated_at` automatically updated on row changes

3. **Foreign key constraints:**
   - Ensure referential integrity
   - CASCADE deletes for cleanup

4. **CHECK constraints:**
   - Data validation at database level
   - Valid enum values enforced
