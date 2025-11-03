# 📦 Orders API - Complete Guide

## Overview

Professional Order Management System with full CRM/ERP features including inventory tracking, workflow management, and financial analytics.

## 🎯 Features Implemented

### Core Features

- ✅ Complete CRUD operations for Products and Orders
- ✅ Multi-tenant organization isolation
- ✅ Automatic order number generation
- ✅ Real-time inventory tracking
- ✅ Order workflow management
- ✅ Payment tracking
- ✅ Date range filtering
- ✅ Sales analytics and reporting

### Advanced CRM/ERP Features

- ✅ **Order Status Workflow**: Draft → Confirmed → Processing → Shipped → Delivered
- ✅ **Payment Tracking**: Pending → Partial → Paid → Refunded
- ✅ **Automatic Price Calculation**: Total, tax, discount
- ✅ **Stock Management**: Automatic stock reduction/restoration
- ✅ **Low Stock Alerts**: Track products below threshold
- ✅ **Customer Order History**: View all orders per customer
- ✅ **Sales Statistics**: Revenue, order counts, averages
- ✅ **Top Selling Products**: Analytics by date range
- ✅ **Invoice-Ready Data**: Complete customer and order details
- ✅ **Audit Trail**: Track who created/modified records

## 📊 Database Schema

### Products Table

```sql
- id (PK)
- org_id (FK) - Multi-tenant isolation
- name, description
- sku (unique per org), barcode
- category
- price, cost_price
- tax_rate
- stock_quantity, low_stock_threshold
- unit (pcs, kg, liter, etc.)
- is_active
- created_by, created_at, updated_at
```

### Orders Table

```sql
- id (PK)
- org_id (FK), customer_id (FK)
- order_number (auto-generated, unique)
- order_date, expected_delivery_date
- status (draft, confirmed, processing, shipped, delivered, cancelled)
- payment_status (pending, partial, paid, refunded)
- payment_method, paid_amount
- shipping_address, shipping_city
- billing_address, billing_city
- subtotal, discount_percentage, discount_amount
- tax_amount, total
- notes
- created_by, created_at, updated_at
```

### Order Items Table

```sql
- id (PK)
- order_id (FK), product_id (FK)
- quantity, unit_price
- tax_rate, discount_amount
- subtotal, tax_amount, total (stored for historical accuracy)
```

## 🚀 API Endpoints

### Products API

#### GET /api/v1/products

Get all products for organization

```text
Query Parameters:
- category: Filter by category
- is_active: true/false
- low_stock: true (products below threshold)
- min_price, max_price: Price range
- search: Search by name, SKU, or barcode
- page, limit: Pagination
```

#### GET /api/v1/products/:id

Get product by ID

#### GET /api/v1/products/low-stock

Get products below stock threshold

#### POST /api/v1/products

Create new product

```json
{
  "name": "Product Name",
  "sku": "UNIQUE-SKU",
  "category": "Category",
  "price": 99.99,
  "cost_price": 50.0,
  "tax_rate": 18.0,
  "stock_quantity": 100,
  "low_stock_threshold": 10,
  "unit": "pcs"
}
```

#### PUT /api/v1/products/:id

Update product

#### PATCH /api/v1/products/:id/stock

Update stock quantity

```json
{
  "quantity": 10,
  "type": "add" // or "subtract"
}
```

#### DELETE /api/v1/products/:id

Soft delete product

---

### Orders API

#### GET /api/v1/orders

Get all orders for organization

```text
Query Parameters:
- status: Filter by order status
- payment_status: Filter by payment status
- customer_id: Filter by customer
- start_date, end_date: Date range filter
- search: Search by order number or customer
- page, limit: Pagination
```

#### GET /api/v1/orders/:id

Get order by ID with all details

#### POST /api/v1/orders

Create new order

```json
{
  "customer_id": 1,
  "order_date": "2025-10-27T10:00:00Z",
  "expected_delivery_date": "2025-11-03T10:00:00Z",
  "status": "draft",
  "payment_status": "pending",
  "payment_method": "credit_card",
  "shipping_address": "Address",
  "shipping_city": "City",
  "discount_percentage": 10,
  "items": [
    {
      "product_id": 1,
      "quantity": 2,
      "unit_price": 99.99,
      "tax_rate": 18.0,
      "discount_amount": 10.0
    }
  ]
}
```

#### PATCH /api/v1/orders/:id/status

Update order status

```json
{
  "status": "confirmed"
}
```

#### PATCH /api/v1/orders/:id/payment

Update payment status

```json
{
  "payment_status": "paid",
  "paid_amount": 1000.0
}
```

#### PATCH /api/v1/orders/:id/cancel

Cancel order (restores stock)

#### DELETE /api/v1/orders/:id

Delete order (restores stock if not cancelled)

---

### Analytics & Reporting API

#### GET /api/v1/orders/statistics

Get sales statistics

```text
Query Parameters:
- start_date, end_date: Date range
```

Response:

```json
{
  "total_orders": 150,
  "delivered_orders": 120,
  "cancelled_orders": 5,
  "paid_orders": 100,
  "total_revenue": 50000.0,
  "paid_revenue": 45000.0,
  "pending_revenue": 5000.0,
  "average_order_value": 333.33
}
```

#### GET /api/v1/orders/top-products

Get top selling products

```text
Query Parameters:
- start_date, end_date: Date range
- limit: Number of results (default: 10)
```

Response:

```json
[
  {
    "id": 1,
    "name": "Laptop",
    "sku": "LAP-001",
    "total_quantity": 50,
    "total_revenue": 25000.0,
    "order_count": 30
  }
]
```

#### GET /api/v1/orders/customer/:customerId

Get all orders for a specific customer

## 💡 Smart Features

### 1. Automatic Price Calculation

- If `unit_price` is not provided in order items, uses current product price
- Automatically calculates:
  - Item subtotal: `quantity × unit_price`
  - Item tax: `(subtotal - discount) × (tax_rate / 100)`
  - Item total: `subtotal - discount + tax`
  - Order total: Sum of all items + order-level discount

### 2. Inventory Management

- **Stock Reduction**: Automatically reduces stock when order is created
- **Stock Restoration**: Automatically restores stock when order is cancelled/deleted
- **Stock Validation**: Prevents orders if insufficient stock
- **Low Stock Alerts**: Identifies products below threshold
- **Transactional Safety**: All stock operations are wrapped in transactions

### 3. Order Workflow

```text
Draft → Confirmed → Processing → Shipped → Delivered
         ↓
    Cancelled (can cancel anytime except after delivered)
```

### 4. Payment Tracking

```text
Pending → Partial → Paid → Refunded
```

### 5. Historical Accuracy

- Product prices are stored in order items (not referenced)
- If product price changes, historical orders remain accurate
- Useful for invoicing and financial reports

### 6. Order Number Generation

- Format: `ORD{YEAR}{6-digit-sequence}`
- Example: `ORD2025000001`
- Automatically increments per organization
- Unique per year

## 🔒 Security & Validation

### Multi-Tenant Isolation

- All queries filtered by `org_id`
- Products and orders are organization-specific
- Customers can only order from their organization's products

### Input Validation

- ✅ Required field validation
- ✅ Data type validation (numbers, dates, etc.)
- ✅ Range validation (prices, quantities, percentages)
- ✅ Business logic validation (stock availability)
- ✅ Duplicate prevention (SKU uniqueness per org)

### Error Handling

- Meaningful error messages
- Proper HTTP status codes
- Transaction rollback on failures

## 📈 Use Cases

### 1. E-Commerce Store

- Online product catalog
- Shopping cart → Order creation
- Payment processing
- Order tracking
- Customer order history

### 2. Wholesale Business

- Bulk ordering
- Customer-specific pricing
- Invoice generation
- Inventory management
- Sales analytics

### 3. Service Industry

- Service packages as products
- Booking/scheduling as orders
- Payment tracking
- Customer history

### 4. Manufacturing

- Raw materials as products
- Production orders
- Stock management
- Cost tracking

## 🎨 Future Enhancements

### Potential Additional Features

1. **Returns & Refunds Management**
   - Create return orders
   - Automatic stock restoration
   - Partial/full refunds

2. **Inventory Adjustments**
   - Stock count corrections
   - Damaged goods tracking
   - Transfer between locations

3. **Quotations**
   - Draft quotes before orders
   - Quote → Order conversion
   - Quote expiration

4. **Recurring Orders**
   - Subscription-based orders
   - Automatic reordering

5. **Shipping Integration**
   - Carrier selection
   - Tracking numbers
   - Shipping labels

6. **Advanced Pricing**
   - Customer-specific pricing
   - Volume discounts
   - Promotional pricing

7. **Multi-Currency Support**
   - Currency conversion
   - Exchange rates

8. **Advanced Analytics**
   - Product performance
   - Customer segmentation
   - Profit margins
   - Forecasting

9. **Notifications**
   - Order confirmation emails
   - Low stock alerts
   - Delivery notifications

10. **Document Generation**
    - PDF invoices
    - Packing slips
    - Receipts

## 🗄️ Database Migration

Run the migration script:

```bash
psql -U your_user -d your_database -f scripts/migration_products_orders.sql
```

This creates:

- `products` table
- `orders` table
- `order_items` table
- Indexes for performance
- Triggers for auto-updating timestamps
- Views for reporting
- Sample data (commented out)

## 📝 Testing

Use the provided HTTP file:

- `docs/ORDERS_API_TESTING.http`

Includes:

- ✅ All CRUD operations
- ✅ Filtering and search
- ✅ Analytics endpoints
- ✅ Error scenarios
- ✅ Edge cases

## 🔍 Monitoring

### Key Metrics to Track

1. **Inventory Health**
   - Low stock products count
   - Out of stock products
   - Total inventory value

2. **Sales Performance**
   - Daily/Weekly/Monthly revenue
   - Order fulfillment rate
   - Average order value

3. **Customer Insights**
   - Top customers by order count
   - Top customers by revenue
   - Customer lifetime value

4. **Product Performance**
   - Best-selling products
   - Slow-moving inventory
   - Product profitability

## 🎓 Best Practices

1. **Always use transactions** for operations that modify both orders and inventory
2. **Validate stock availability** before creating orders
3. **Use proper HTTP status codes** (200, 201, 400, 404, 409, 500)
4. **Log all financial transactions** for audit purposes
5. **Implement pagination** for large result sets
6. **Cache frequently accessed data** (product catalog, prices)
7. **Index frequently queried fields** (order_date, status, customer_id)
8. **Regular backups** of order and financial data

---

**Created by:** CRM/ERP Development Team  
**Version:** 1.0  
**Date:** October 27, 2025
