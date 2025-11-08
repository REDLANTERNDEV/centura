-- ============================================
-- Mini SaaS ERP - Complete Database Schema
-- PostgreSQL Initialization Script
-- ============================================
-- This script creates all tables from scratch
-- Run this ONLY on a fresh database
-- ============================================

-- Set timezone to UTC
ALTER DATABASE saasdb SET timezone TO 'UTC';

-- ============================================
-- FUNCTION: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TABLE: organizations
-- ============================================
CREATE TABLE IF NOT EXISTS organizations (
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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_org_name ON organizations(org_name);

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  org_id INTEGER REFERENCES organizations(org_id) ON DELETE SET NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  system_role VARCHAR(50) CHECK (system_role = 'platform_admin' OR system_role IS NULL),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_system_role ON users(system_role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: refresh_tokens
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  is_revoked BOOLEAN DEFAULT FALSE
);

-- Basic indexes for lookups
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_created_at ON refresh_tokens(created_at DESC);

-- Optimized composite indexes for performance (login/logout optimization)
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_active 
  ON refresh_tokens(expires_at, is_revoked) 
  WHERE is_revoked = FALSE AND expires_at > NOW();

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_lookup 
  ON refresh_tokens(expires_at DESC, is_revoked, created_at DESC) 
  WHERE is_revoked = FALSE;

-- ============================================
-- TABLE: user_organization_roles
-- ============================================
CREATE TABLE IF NOT EXISTS user_organization_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('org_owner', 'org_admin', 'manager', 'user', 'viewer')),
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_org_role UNIQUE (user_id, org_id)
);

CREATE INDEX IF NOT EXISTS idx_user_org_roles_user_id ON user_organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_org_id ON user_organization_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_role ON user_organization_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_is_active ON user_organization_roles(is_active);

CREATE TRIGGER update_user_organization_roles_updated_at
  BEFORE UPDATE ON user_organization_roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: platform_admins
-- ============================================
CREATE TABLE IF NOT EXISTS platform_admins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  admin_level VARCHAR(50) NOT NULL CHECK (admin_level IN ('senior', 'junior', 'readonly')),
  permissions JSONB DEFAULT '{"infrastructure_only": true}',
  can_access_user_data BOOLEAN DEFAULT FALSE CHECK (can_access_user_data = FALSE),
  assigned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_platform_admin UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_platform_admins_user_id ON platform_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_platform_admins_admin_level ON platform_admins(admin_level);
CREATE INDEX IF NOT EXISTS idx_platform_admins_is_active ON platform_admins(is_active);

CREATE TRIGGER update_platform_admins_updated_at
  BEFORE UPDATE ON platform_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: support_access_requests
-- ============================================
CREATE TABLE IF NOT EXISTS support_access_requests (
  id SERIAL PRIMARY KEY,
  support_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  ticket_number VARCHAR(50),
  reason TEXT NOT NULL,
  requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'expired')),
  access_granted_at TIMESTAMPTZ,
  access_expires_at TIMESTAMPTZ,
  access_duration_minutes INTEGER DEFAULT 60,
  can_view_data BOOLEAN DEFAULT TRUE,
  can_modify_data BOOLEAN DEFAULT FALSE,
  can_export_data BOOLEAN DEFAULT FALSE,
  actions_log JSONB DEFAULT '[]',
  revoked_at TIMESTAMPTZ,
  revoked_by INTEGER REFERENCES users(id),
  revoke_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_support_access_org ON support_access_requests(target_org_id);
CREATE INDEX IF NOT EXISTS idx_support_access_status ON support_access_requests(approval_status);
CREATE INDEX IF NOT EXISTS idx_support_access_expires ON support_access_requests(access_expires_at);

CREATE TRIGGER update_support_access_requests_updated_at
  BEFORE UPDATE ON support_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_email VARCHAR(255),
  user_role VARCHAR(50),
  impersonating_user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id VARCHAR(100),
  org_id INTEGER REFERENCES organizations(org_id) ON DELETE SET NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  request_path VARCHAR(500),
  request_method VARCHAR(10),
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT audit_logs_unique_check UNIQUE (user_id, action, resource_type, resource_id, created_at)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_impersonating ON audit_logs(impersonating_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================
-- TABLE: customers
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
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
  segment VARCHAR(50) CHECK (segment IN ('VIP', 'Premium', 'Standard', 'Basic', 'Potential')),
  customer_type VARCHAR(50) CHECK (customer_type IN ('Corporate', 'Individual', 'Government', 'Other')),
  payment_terms INTEGER DEFAULT 30,
  credit_limit DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  -- Analytics columns
  first_purchase_date TIMESTAMPTZ,
  last_purchase_date TIMESTAMPTZ,
  total_lifetime_value DECIMAL(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  rfm_score VARCHAR(10),
  rfm_segment VARCHAR(50),
  CONSTRAINT unique_customer_code_per_org UNIQUE (org_id, customer_code)
);

CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_city ON customers(city);
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_rfm_segment ON customers(rfm_segment) WHERE rfm_segment IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_last_purchase ON customers(last_purchase_date DESC);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: products
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- KDV hariç satış fiyatı
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- KDV dahil satış fiyatı (müşterinin ödeyeceği)
  cost_price DECIMAL(10, 2), -- Tedarikçiden alış maliyeti (kar hesabı için)
  tax_rate DECIMAL(5, 2) DEFAULT 0.00, -- KDV oranı (%)
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  unit VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  -- Analytics columns
  reorder_point INTEGER DEFAULT 10,
  lead_time_days INTEGER DEFAULT 7,
  last_restock_date TIMESTAMPTZ,
  times_out_of_stock INTEGER DEFAULT 0,
  CONSTRAINT unique_sku_per_org UNIQUE(org_id, sku),
  CONSTRAINT check_base_price_positive CHECK (base_price >= 0),
  CONSTRAINT check_price_positive CHECK (price >= 0),
  CONSTRAINT check_cost_price_positive CHECK (cost_price >= 0 OR cost_price IS NULL),
  CONSTRAINT check_stock_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT check_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock_quantity, low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  order_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMPTZ,
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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  -- Analytics columns
  paid_at TIMESTAMPTZ,
  fulfilled_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  CONSTRAINT check_subtotal_positive CHECK (subtotal >= 0),
  CONSTRAINT check_discount_percentage_valid CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  CONSTRAINT check_discount_amount_positive CHECK (discount_amount >= 0),
  CONSTRAINT check_tax_amount_positive CHECK (tax_amount >= 0),
  CONSTRAINT check_total_positive CHECK (total >= 0),
  CONSTRAINT check_paid_amount_positive CHECK (paid_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_orders_org_id ON orders(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_date_range ON orders(org_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at) WHERE paid_at IS NOT NULL;

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: order_items
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
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
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_quantity_positive CHECK (quantity > 0),
  CONSTRAINT check_unit_price_positive CHECK (unit_price >= 0),
  CONSTRAINT check_item_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100),
  CONSTRAINT check_item_discount_positive CHECK (discount_amount >= 0),
  CONSTRAINT check_item_subtotal_positive CHECK (subtotal >= 0),
  CONSTRAINT check_item_tax_amount_positive CHECK (tax_amount >= 0),
  CONSTRAINT check_item_total_positive CHECK (total >= 0)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

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

-- ============================================
-- VIEWS
-- ============================================

-- User organization access view
CREATE OR REPLACE VIEW v_user_organization_access AS
SELECT
    u.id AS user_id,
    u.email,
    u.name,
    u.is_active AS user_active,
    uor.org_id,
    o.org_name,
    uor.role,
    uor.is_active AS role_active,
    uor.assigned_at,
    uor.assigned_by,
    o.is_active AS org_active
FROM users u
INNER JOIN user_organization_roles uor ON u.id = uor.user_id
INNER JOIN organizations o ON uor.org_id = o.org_id
WHERE u.is_active = TRUE
  AND uor.is_active = TRUE
  AND o.is_active = TRUE;

-- ============================================
-- COMPLETED
-- ============================================
-- All tables created with TIMESTAMPTZ
-- All triggers configured
-- All indexes created
-- Helper functions and views created
-- ============================================
