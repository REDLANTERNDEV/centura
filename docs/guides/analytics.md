# Analytics Dashboard - Comprehensive Guide

**Last Updated:** November 3, 2025  
**Version:** 2.0  
**Status:** Production-Ready

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Features & Capabilities](#features--capabilities)
3. [Analytics Modules](#analytics-modules)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Components](#frontend-components)
6. [Migration Guide](#migration-guide)
7. [API Reference](#api-reference)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Analytics Dashboard is a comprehensive, industry-standard business intelligence solution for the Mini SaaS ERP/CRM system. It provides real-time insights into revenue, sales, customers, inventory, and overall business performance with **20+ KPIs** and professional data visualizations.

### What's Included

- ✅ **5 Detailed Analytics Tabs** (Overview, Revenue, Sales, Customers, Inventory)
- ✅ **20+ Key Performance Indicators** with trend analysis
- ✅ **Professional Charts** using Recharts (Line, Bar, Area, Pie)
- ✅ **Time Period Filtering** (7d, 30d, 90d, YTD, All Time)
- ✅ **Real-time Data Refresh** with loading states
- ✅ **Export Capabilities** (CSV/JSON)
- ✅ **Multi-tenant Organization Support**
- ✅ **Responsive Design** for all screen sizes
- ✅ **Dark Mode Support**

---

## Features & Capabilities

### 🎯 Key Performance Indicators (KPIs)

#### Revenue Metrics

- **Total Revenue**: Track all-time and period revenue with growth comparisons
- **Average Order Value (AOV)**: Analyze transaction values
- **Gross Margin**: Profitability analysis (revenue - cost)
- **Collection Rate**: Payment collection efficiency

#### Sales Metrics

- **Total Orders**: Monitor order volume and trends
- **Order Fulfillment Rate**: Track delivered orders
- **Category Performance**: Revenue breakdown by product category
- **Top Selling Products**: Best performers by revenue

#### Customer Metrics

- **Active Customers**: Track engaged customer base
- **Customer Retention Rate**: Monitor customer loyalty
- **Churn Rate**: Identify customer attrition
- **Customer Lifetime Value (CLV)**: Long-term customer value
- **RFM Analysis**: Recency, Frequency, Monetary segmentation
- **Customer Segmentation**: VIP, Premium, Standard, Basic distribution

#### Inventory Metrics

- **Total Products**: Current product catalog size
- **Low Stock Alerts**: Products below threshold
- **Out of Stock**: Zero-stock product count
- **Inventory Value**: Total stock value (cost × quantity)
- **Inventory Turnover Ratio**: Stock movement efficiency

#### Financial Metrics

- **Days Sales Outstanding (DSO)**: Accounts receivable efficiency
- **Month-over-Month Growth**: Trend analysis
- **Payment Status Breakdown**: Paid, Pending, Partial tracking

---

## Analytics Modules

### 1. Overview Tab 📊

**Purpose:** Quick snapshot of overall business health

**Components:**

- Monthly sales trend chart (dual-axis: revenue + orders)
- Order status distribution pie chart
- Top 5 selling products ranking
- Summary KPI cards (Revenue, Orders, Customers, AOV)

**Chart Type:** Line chart with dual Y-axis

- Left axis: Revenue (₺)
- Right axis: Order count (#)

**Use Case:** Daily monitoring, executive dashboard view

---

### 2. Revenue Tab 💰

**Purpose:** Deep dive into revenue performance

**Metrics Displayed:**

- Total Revenue (All-time)
- Period Revenue (filtered by time range)
- Growth Rate (% change vs previous period)
- Revenue by Order Status (Delivered, Processing, Cancelled)

**Chart Type:** Bar chart with status-based coloring

**Use Case:** Financial reporting, revenue analysis, growth tracking

---

### 3. Sales Tab 📈

**Purpose:** Product and category performance analysis

**Metrics Displayed:**

- Category Performance (revenue breakdown)
- Monthly Sales Performance (trend analysis)
- Top Products by Revenue
- Quantity vs Revenue comparison

**Chart Types:**

- Area chart for sales trends
- Bar chart for category performance
- Table for top products

**Use Case:** Product strategy, inventory planning, pricing decisions

---

### 4. Customers Tab 👥

**Purpose:** Customer behavior and segmentation insights

**Metrics Displayed:**

- Total Customers
- Active Customers (orders in period)
- New Customers (first order in period)
- Customer Retention Rate
- Customer Segments (VIP, Premium, Standard, Basic)
- Top Customers by Revenue

**Chart Types:**

- Pie chart for segmentation
- Table for top customers
- Trend indicators for growth

**Use Case:** CRM strategy, customer engagement, retention programs

---

### 5. Inventory Tab 📦

**Purpose:** Stock management and inventory health

**Metrics Displayed:**

- Total Products
- Low Stock Products (below threshold)
- Out of Stock Products (zero quantity)
- Total Inventory Value (cost-based)
- Stock Health Distribution

**Chart Type:** Pie chart for stock status distribution

**Use Case:** Inventory management, reordering decisions, warehouse optimization

---

## Backend Implementation

### Database Schema Enhancements

#### Migration (November 2025)

**Added Columns to `orders` table:**

```sql
ALTER TABLE orders ADD COLUMN payment_completed_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN fulfilled_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMPTZ;
```

**Added Columns to `customers` table:**

```sql
ALTER TABLE customers ADD COLUMN rfm_score INTEGER DEFAULT 0;
ALTER TABLE customers ADD COLUMN customer_lifetime_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE customers ADD COLUMN last_order_date TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN total_orders_count INTEGER DEFAULT 0;
```

**Added Columns to `products` table:**

```sql
ALTER TABLE products ADD COLUMN reorder_level INTEGER DEFAULT 10;
ALTER TABLE products ADD COLUMN reorder_quantity INTEGER DEFAULT 50;
ALTER TABLE products ADD COLUMN last_restock_date TIMESTAMPTZ;
```

#### Automatic Customer Metrics Update

**Trigger Function:**

```sql
CREATE OR REPLACE FUNCTION update_customer_metrics()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE customers
  SET
    last_order_date = (
      SELECT MAX(order_date) FROM orders WHERE customer_id = NEW.customer_id
    ),
    total_orders_count = (
      SELECT COUNT(*) FROM orders WHERE customer_id = NEW.customer_id
    ),
    customer_lifetime_value = (
      SELECT COALESCE(SUM(total), 0) FROM orders
      WHERE customer_id = NEW.customer_id AND status = 'delivered'
    )
  WHERE customer_id = NEW.customer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_customer_metrics
AFTER INSERT OR UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION update_customer_metrics();
```

#### RFM Calculation Function

```sql
CREATE OR REPLACE FUNCTION calculate_rfm_score(p_org_id INTEGER)
RETURNS TABLE (
  customer_id INTEGER,
  recency_score INTEGER,
  frequency_score INTEGER,
  monetary_score INTEGER,
  rfm_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH customer_rfm AS (
    SELECT
      c.customer_id,
      EXTRACT(DAY FROM (CURRENT_DATE - MAX(o.order_date))) AS recency_days,
      COUNT(o.id) AS frequency,
      SUM(o.total) AS monetary
    FROM customers c
    LEFT JOIN orders o ON c.customer_id = o.customer_id
    WHERE c.org_id = p_org_id
    GROUP BY c.customer_id
  ),
  rfm_quartiles AS (
    SELECT
      customer_id,
      -- Recency: Lower is better (reverse scoring)
      CASE
        WHEN recency_days <= 30 THEN 5
        WHEN recency_days <= 60 THEN 4
        WHEN recency_days <= 90 THEN 3
        WHEN recency_days <= 180 THEN 2
        ELSE 1
      END AS r_score,
      -- Frequency: Higher is better
      NTILE(5) OVER (ORDER BY frequency) AS f_score,
      -- Monetary: Higher is better
      NTILE(5) OVER (ORDER BY monetary) AS m_score
    FROM customer_rfm
  )
  SELECT
    customer_id,
    r_score AS recency_score,
    f_score AS frequency_score,
    m_score AS monetary_score,
    (r_score + f_score + m_score) AS rfm_score
  FROM rfm_quartiles;
END;
$$ LANGUAGE plpgsql;
```

---

### API Endpoints

#### Comprehensive Insights Endpoint

**Endpoint:** `GET /api/v1/insights/comprehensive`

**Query Parameters:**

- `startDate` (optional): Start date for filtering (ISO 8601)
- `endDate` (optional): End date for filtering (ISO 8601)

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "revenue": {
      "totalRevenue": 1250000.50,
      "periodRevenue": 85000.00,
      "growthRate": 12.5,
      "grossMargin": 35.2,
      "collectionRate": 92.3
    },
    "orders": {
      "totalOrders": 1543,
      "periodOrders": 125,
      "averageOrderValue": 680.00,
      "fulfillmentRate": 94.5,
      "statusBreakdown": {
        "delivered": 1320,
        "processing": 89,
        "shipped": 65,
        "confirmed": 45,
        "cancelled": 24
      }
    },
    "customers": {
      "totalCustomers": 456,
      "activeCustomers": 234,
      "newCustomers": 45,
      "retentionRate": 78.5,
      "churnRate": 21.5,
      "segmentation": {
        "VIP": 23,
        "Premium": 67,
        "Standard": 189,
        "Basic": 177
      }
    },
    "inventory": {
      "totalProducts": 234,
      "lowStockProducts": 12,
      "outOfStockProducts": 3,
      "inventoryValue": 456789.50,
      "turnoverRatio": 4.2
    },
    "topProducts": [...],
    "topCustomers": [...],
    "categoryPerformance": [...],
    "monthlySales": [...]
  }
}
```

#### Additional Analytics Endpoints

**Customer Retention:**

```
GET /api/v1/insights/customers/retention
```

**Churn Analysis:**

```
GET /api/v1/insights/customers/churn
```

**RFM Analysis:**

```
GET /api/v1/insights/customers/rfm
```

**Days Sales Outstanding:**

```
GET /api/v1/insights/payments/dso
```

**Gross Margin:**

```
GET /api/v1/insights/revenue/gross-margin
```

**Inventory Turnover:**

```
GET /api/v1/insights/inventory/turnover
```

---

## Frontend Components

### Main Analytics Page

**Location:** `apps/frontend/app/(dashboard)/dashboard/analytics/page.tsx`

**Key Features:**

- Organization context management
- Time period filtering state
- Data fetching with error handling
- Tab-based navigation (5 tabs)
- Loading states with skeletons
- Refresh functionality

**State Management:**

```typescript
const [analyticsData, setAnalyticsData] = useState(null);
const [loading, setLoading] = useState(true);
const [timePeriod, setTimePeriod] = useState('30d');
const [lastRefresh, setLastRefresh] = useState(new Date());
```

**Data Fetching Logic:**

```typescript
const fetchAnalytics = async () => {
  if (!selectedOrganization) return;

  setLoading(true);
  try {
    const { startDate, endDate } = getDateRange(timePeriod);
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const response = await fetch(`/api/v1/insights/comprehensive?${params}`, {
      headers: { 'x-organization-id': selectedOrganization.org_id },
    });

    const result = await response.json();
    if (result.success) {
      setAnalyticsData(transformBackendData(result.data));
    }
  } catch (error) {
    console.error('Analytics fetch error:', error);
  } finally {
    setLoading(false);
  }
};
```

---

### Reusable Analytics Components

**Location:** `apps/frontend/components/analytics/AnalyticsComponents.tsx`

#### MetricCard Component

```typescript
interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const MetricCard: React.FC<MetricCardProps> = ({...}) => {
  // Professional KPI card with trend indicators
};
```

#### EmptyState Component

```typescript
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({...}) => {
  // User-friendly empty state with optional action button
};
```

#### StatBadge Component

```typescript
interface StatBadgeProps {
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

export const StatBadge: React.FC<StatBadgeProps> = ({...}) => {
  // Color-coded status badge
};
```

#### ProgressBar Component

```typescript
interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({...}) => {
  // Animated progress indicator
};
```

---

### Analytics Utilities

**Location:** `apps/frontend/lib/analytics-utils.ts`

#### Export Functions

```typescript
export const exportToCSV = (data: any[], filename: string) => {
  const csv = convertToCSV(data);
  downloadFile(csv, filename, 'text/csv');
};

export const exportToJSON = (data: any, filename: string) => {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, filename, 'application/json');
};
```

#### Formatters

```typescript
export const formatCurrency = (amount: number, locale = 'tr-TR') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

export const formatPercentage = (value: number, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

export const formatNumber = (value: number, decimals = 0) => {
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
```

#### Calculation Helpers

```typescript
export const calculateGrowthRate = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};

export const calculateMovingAverage = (data: number[], period: number) => {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(0);
    } else {
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  return result;
};

export const getTrendDirection = (value: number): 'up' | 'down' | 'neutral' => {
  if (value > 0.5) return 'up';
  if (value < -0.5) return 'down';
  return 'neutral';
};
```

---

### Step 1: Backend Update

**Update dependencies (if needed):**

```bash
cd apps/backend
npm install
```

**No code changes required** - Analytics endpoints already implemented in:

- `apps/backend/src/controllers/insightsController.js`
- `apps/backend/src/models/insightsModel.js`
- `apps/backend/src/routes/insightsRoutes.js`

---

### Step 2: Frontend Update

**Install required packages:**

```bash
cd apps/frontend
npx shadcn@latest add chart tabs
```

**No additional changes needed** - Analytics page already created.

---

### Step 3: Test Analytics

**Bruno API Tests:**

Navigate to `api-tests/mini-saas-api/Insights/` and run:

1. `Get Comprehensive Insights.bru`
2. `Revenue Metrics & KPIs.bru`
3. `Customer Segment Analysis.bru`
4. `Top Selling Products.bru`
5. `Growth Metrics (MoM).bru`

**Frontend Testing:**

1. Navigate to `/dashboard/analytics`
2. Switch between tabs (Overview, Revenue, Sales, Customers, Inventory)
3. Change time periods (7d, 30d, 90d, YTD, All Time)
4. Click refresh button
5. Verify charts render correctly
6. Check dark mode compatibility

---

## API Reference

### Query Parameters

All analytics endpoints support these optional parameters:

| Parameter   | Type    | Format   | Description                            |
| ----------- | ------- | -------- | -------------------------------------- |
| `startDate` | string  | ISO 8601 | Filter start date (e.g., "2025-01-01") |
| `endDate`   | string  | ISO 8601 | Filter end date (e.g., "2025-12-31")   |
| `orgId`     | integer | -        | Organization ID (from JWT or header)   |

### Response Format

All endpoints return this structure:

```json
{
  "success": boolean,
  "data": {...},
  "error": string | null,
  "timestamp": "ISO 8601 string"
}
```

### Error Handling

**Common Error Codes:**

| Code | Message               | Resolution                 |
| ---- | --------------------- | -------------------------- |
| 401  | Unauthorized          | Check authentication token |
| 403  | Forbidden             | Verify organization access |
| 404  | Not Found             | Check endpoint URL         |
| 500  | Internal Server Error | Check backend logs         |

---

## Best Practices

### Performance Optimization

1. **Database Indexing:**

   ```sql
   CREATE INDEX idx_orders_org_date ON orders(org_id, order_date DESC);
   CREATE INDEX idx_orders_status ON orders(org_id, status);
   CREATE INDEX idx_customers_org ON customers(org_id);
   CREATE INDEX idx_products_org ON products(org_id);
   ```

2. **Query Optimization:**
   - Use `Promise.all()` for parallel data fetching
   - Implement proper pagination for large datasets
   - Cache frequently accessed data (Redis)
   - Use database views for complex calculations

3. **Frontend Optimization:**
   - Lazy load chart components
   - Debounce time period changes
   - Implement virtual scrolling for large tables
   - Cache analytics data (5-minute TTL)

---

### Data Accuracy

1. **Always filter by organization ID**
2. **Use proper date range calculations**
3. **Handle NULL values in aggregations**
4. **Validate time period inputs**
5. **Use COALESCE for default values**

---

### Security

1. **Organization Isolation:**
   - Every query must include `WHERE org_id = $1`
   - Validate organization access in middleware
   - Never expose other organizations' data

2. **Input Validation:**
   - Sanitize date inputs
   - Validate time period ranges
   - Prevent SQL injection with parameterized queries

3. **Rate Limiting:**
   - Limit analytics API calls (10 req/min per org)
   - Implement caching to reduce database load

---

## Troubleshooting

### Common Issues

#### Issue 1: "No data available"

**Possible Causes:**

- No orders/customers/products in database
- Wrong organization selected
- Date range too narrow
- Backend API error

**Solution:**

1. Check browser console for errors
2. Verify organization context is set
3. Expand date range (try "All Time")
4. Check backend logs: `docker logs mini-saas-backend`

---

#### Issue 2: Charts not rendering

**Possible Causes:**

- Missing Recharts library
- Invalid data format
- CSS conflicts

**Solution:**

1. Verify Recharts installation: `npm list recharts`
2. Check data structure matches chart expectations
3. Clear browser cache
4. Check for console errors

---

#### Issue 3: Incorrect metrics

**Possible Causes:**

- Database migration not run
- Cached data
- Calculation errors in backend

**Solution:**

1. Verify database migration: `\d orders` (check columns)
2. Clear cache: Restart backend container
3. Test API endpoints directly with Bruno
4. Check backend logs for calculation errors

---

#### Issue 4: Slow performance

**Possible Causes:**

- Missing database indexes
- Large dataset without pagination
- Too many parallel requests

**Solution:**

1. Add recommended indexes (see Best Practices)
2. Implement pagination for large tables
3. Use `Promise.all()` instead of sequential calls
4. Enable database query logging to find slow queries

---

## Additional Resources

### Related Documentation

- [Database Schema](../apps/backend/docs/DATABASE.md) - Complete database reference
- [Insights API](../apps/backend/docs/INSIGHTS_API.md) - Detailed API documentation
- [Multi-Tenant Guide](../apps/backend/docs/MULTI_TENANT_ROLES_GUIDE.md) - Organization isolation

### External Resources

- [Recharts Documentation](https://recharts.org/) - Chart library
- [shadcn/ui Charts](https://ui.shadcn.com/docs/components/chart) - UI components
- [Analytics Best Practices](https://www.klipfolio.com/resources/articles/dashboard-best-practices)

---

## Changelog

### Version 2.0 (November 2025)

- ✅ Added comprehensive backend analytics
- ✅ Implemented RFM customer segmentation
- ✅ Added CLV calculation
- ✅ Enhanced database schema with analytics columns
- ✅ Created automatic customer metrics trigger
- ✅ Added 7 new analytics endpoints
- ✅ Improved frontend with 5 detailed tabs
- ✅ Added time period filtering
- ✅ Implemented export functionality

### Version 1.0 (October 2025)

- ✅ Initial analytics dashboard
- ✅ Basic revenue and sales metrics
- ✅ Customer and product insights
- ✅ Multi-tenant support

---

**Need Help?** Check backend logs or contact the development team.
