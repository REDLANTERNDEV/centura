-- =====================================================
-- Products & Orders System Migration
-- Version: 1.0
-- Description: Create products, orders, and order_items tables
-- =====================================================

-- Drop existing tables if they exist (be careful in production!)
-- DROP TABLE IF EXISTS order_items CASCADE;
-- DROP TABLE IF EXISTS orders CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cost_price DECIMAL(10, 2),
  tax_rate DECIMAL(5, 2) DEFAULT 0.00, -- Tax percentage (e.g., 18.00 for 18%)
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  unit VARCHAR(50) NOT NULL, -- pcs, kg, liter, box, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT unique_sku_per_org UNIQUE(org_id, sku),
  CONSTRAINT check_price_positive CHECK (price >= 0),
  CONSTRAINT check_cost_price_positive CHECK (cost_price >= 0 OR cost_price IS NULL),
  CONSTRAINT check_stock_non_negative CHECK (stock_quantity >= 0),
  CONSTRAINT check_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100)
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_org_id ON products(org_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(stock_quantity, low_stock_threshold);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);

-- =====================================================
-- ORDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(org_id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_delivery_date TIMESTAMP,
  
  -- Order workflow status
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
  ),
  
  -- Payment information
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (
    payment_status IN ('pending', 'partial', 'paid', 'refunded')
  ),
  payment_method VARCHAR(50), -- cash, credit_card, bank_transfer, etc.
  paid_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Shipping & Billing addresses
  shipping_address TEXT,
  shipping_city VARCHAR(100),
  billing_address TEXT,
  billing_city VARCHAR(100),
  
  -- Financial calculations
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  tax_amount DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Additional information
  notes TEXT,
  
  -- Audit fields
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_subtotal_positive CHECK (subtotal >= 0),
  CONSTRAINT check_discount_percentage_valid CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  CONSTRAINT check_discount_amount_positive CHECK (discount_amount >= 0),
  CONSTRAINT check_tax_amount_positive CHECK (tax_amount >= 0),
  CONSTRAINT check_total_positive CHECK (total >= 0),
  CONSTRAINT check_paid_amount_positive CHECK (paid_amount >= 0)
);

-- Indexes for orders
CREATE INDEX IF NOT EXISTS idx_orders_org_id ON orders(org_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_date_range ON orders(org_id, order_date DESC);

-- =====================================================
-- ORDER ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0.00,
  discount_amount DECIMAL(10, 2) DEFAULT 0.00,
  
  -- Calculated fields (stored for historical accuracy)
  subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
  tax_amount DECIMAL(10, 2) NOT NULL, -- (subtotal - discount) * (tax_rate / 100)
  total DECIMAL(10, 2) NOT NULL, -- subtotal - discount_amount + tax_amount
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT check_quantity_positive CHECK (quantity > 0),
  CONSTRAINT check_unit_price_positive CHECK (unit_price >= 0),
  CONSTRAINT check_item_tax_rate_valid CHECK (tax_rate >= 0 AND tax_rate <= 100),
  CONSTRAINT check_item_discount_positive CHECK (discount_amount >= 0),
  CONSTRAINT check_item_subtotal_positive CHECK (subtotal >= 0),
  CONSTRAINT check_item_tax_amount_positive CHECK (tax_amount >= 0),
  CONSTRAINT check_item_total_positive CHECK (total >= 0)
);

-- Indexes for order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to products
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to orders
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Note: Uncomment below to insert sample data
-- Make sure to replace org_id and user_id with actual values from your database

/*
-- Sample Products
INSERT INTO products (org_id, name, description, sku, category, price, cost_price, tax_rate, stock_quantity, low_stock_threshold, unit, created_by)
VALUES 
  (1, 'Laptop Dell XPS 15', 'High-performance laptop', 'LAP-XPS15-001', 'Electronics', 1299.99, 999.99, 18.00, 50, 10, 'pcs', 1),
  (1, 'Wireless Mouse', 'Ergonomic wireless mouse', 'MOU-WLS-001', 'Electronics', 29.99, 15.99, 18.00, 200, 50, 'pcs', 1),
  (1, 'Office Chair', 'Comfortable office chair', 'CHR-OFF-001', 'Furniture', 249.99, 150.00, 18.00, 30, 5, 'pcs', 1),
  (1, 'Desk Lamp LED', 'Energy-efficient LED lamp', 'LMP-LED-001', 'Electronics', 39.99, 20.00, 18.00, 100, 20, 'pcs', 1);

-- Sample Order
INSERT INTO orders (org_id, customer_id, order_number, order_date, status, payment_status, payment_method, subtotal, tax_amount, total, created_by)
VALUES 
  (1, 1, 'ORD2025000001', CURRENT_TIMESTAMP, 'confirmed', 'paid', 'credit_card', 1579.97, 284.39, 1864.36, 1);

-- Sample Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, tax_rate, subtotal, tax_amount, total)
VALUES 
  (1, 1, 1, 1299.99, 18.00, 1299.99, 233.998, 1533.988),
  (1, 2, 2, 29.99, 18.00, 59.98, 10.796, 70.776),
  (1, 4, 1, 39.99, 18.00, 39.99, 7.198, 47.188);
*/

-- =====================================================
-- VIEWS FOR REPORTING
-- =====================================================

-- View: Product inventory status
CREATE OR REPLACE VIEW product_inventory_status AS
SELECT 
  p.id,
  p.org_id,
  p.name,
  p.sku,
  p.category,
  p.price,
  p.stock_quantity,
  p.low_stock_threshold,
  CASE 
    WHEN p.stock_quantity = 0 THEN 'OUT_OF_STOCK'
    WHEN p.stock_quantity <= p.low_stock_threshold THEN 'LOW_STOCK'
    ELSE 'IN_STOCK'
  END as stock_status,
  p.stock_quantity * p.price as inventory_value
FROM products p
WHERE p.is_active = TRUE;

-- View: Order summary
CREATE OR REPLACE VIEW order_summary AS
SELECT 
  o.id,
  o.org_id,
  o.order_number,
  o.order_date,
  o.status,
  o.payment_status,
  c.name as customer_name,
  c.email as customer_email,
  COUNT(oi.id) as items_count,
  o.subtotal,
  o.discount_amount,
  o.tax_amount,
  o.total,
  o.paid_amount,
  (o.total - o.paid_amount) as balance_due
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.org_id, o.order_number, o.order_date, o.status, o.payment_status,
         c.name, c.email, o.subtotal, o.discount_amount, o.tax_amount, o.total, o.paid_amount;

-- =====================================================
-- GRANT PERMISSIONS (adjust as needed)
-- =====================================================
-- GRANT ALL PRIVILEGES ON TABLE products TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE orders TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE order_items TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMENT ON TABLE products IS 'Product catalog with inventory management';
COMMENT ON TABLE orders IS 'Customer orders with complete workflow and payment tracking';
COMMENT ON TABLE order_items IS 'Individual line items within orders';
COMMENT ON VIEW product_inventory_status IS 'Real-time inventory status for all active products';
COMMENT ON VIEW order_summary IS 'Summary view of orders with customer and financial details';
