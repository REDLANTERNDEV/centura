# Insights API Documentation

## Overview

The Insights API provides comprehensive business intelligence and analytics for your CRM/ERP system. This API follows industry standards and provides metrics commonly used by enterprise SaaS, CRM, and ERP platforms.

## Base Endpoint

```
/api/v1/insights
```

All endpoints require authentication and organization context.

## Common Query Parameters

Most endpoints support these optional query parameters:

- `startDate` (YYYY-MM-DD): Filter data from this date
- `endDate` (YYYY-MM-DD): Filter data until this date
- `limit` (integer): Limit number of results (where applicable)

---

## Endpoints

### 1. Comprehensive Insights Dashboard

```http
GET /api/v1/insights
```

Returns a complete dashboard with all analytics in one request.

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2025-12-31",
      "generatedAt": "2025-10-27T10:30:00.000Z"
    },
    "salesPerformance": {
      "topCustomers": [...],
      "monthlySales": [...],
      "topProducts": [...],
      "categoryPerformance": [...]
    },
    "customerAnalytics": {...},
    "revenueAnalytics": {...},
    "orderAnalytics": {...},
    "inventoryInsights": {...},
    "growthMetrics": {...},
    "paymentAnalysis": {...}
  }
}
```

---

### 2. Top Customers by Revenue

```http
GET /api/v1/insights/customers/top?limit=10
```

**Industry Metric:** Customer Lifetime Value (CLV) Ranking

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "customerId": 1,
      "name": "ACME Ltd",
      "customerCode": "CUST-001",
      "email": "contact@acme.com",
      "segment": "enterprise",
      "customerType": "business",
      "totalSales": 12000.5,
      "totalOrders": 45,
      "averageOrderValue": 266.68,
      "lastOrderDate": "2025-10-15",
      "firstOrderDate": "2024-03-10",
      "customerLifetimeDays": 584
    }
  ]
}
```

**Key Metrics:**

- `totalSales`: Total revenue from this customer (CLV)
- `averageOrderValue`: AOV - average spend per order
- `customerLifetimeDays`: How long they've been a customer

**Use Cases:**

- Identify VIP customers
- Customer retention strategies
- Personalized marketing campaigns
- Account management prioritization

---

### 3. Monthly Sales Trend

```http
GET /api/v1/insights/sales/monthly
```

**Industry Metric:** Time-Series Revenue Analysis

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "month": "2025-10",
      "totalSales": 22000.0,
      "totalOrders": 85,
      "averageOrderValue": 258.82,
      "uniqueCustomers": 34,
      "paidAmount": 18500.0,
      "pendingAmount": 3500.0,
      "collectionRate": "84.09"
    },
    {
      "month": "2025-09",
      "totalSales": 15000.0,
      "totalOrders": 62,
      "averageOrderValue": 241.94,
      "uniqueCustomers": 28,
      "paidAmount": 14200.0,
      "pendingAmount": 800.0,
      "collectionRate": "94.67"
    }
  ]
}
```

**Key Metrics:**

- `collectionRate`: % of revenue collected (cash flow efficiency)
- `uniqueCustomers`: Customer acquisition trend
- `averageOrderValue`: Pricing and basket size trend

**Use Cases:**

- Revenue forecasting
- Seasonal trend analysis
- Budget vs actual comparison
- Investor reporting

---

### 4. Top Selling Products

```http
GET /api/v1/insights/products/top?limit=10
```

**Industry Metric:** Product Performance Ranking

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "productId": 5,
      "name": "Premium Widget Pro",
      "sku": "WID-PRO-001",
      "category": "electronics",
      "currentPrice": 299.99,
      "currentStock": 45,
      "timesOrdered": 120,
      "totalQuantitySold": 380,
      "totalRevenue": 113996.2,
      "averageSellingPrice": 299.99
    }
  ]
}
```

**Key Metrics:**

- `totalRevenue`: Revenue contribution
- `totalQuantitySold`: Unit velocity
- `averageSellingPrice`: Pricing effectiveness

**Use Cases:**

- Inventory planning
- Pricing optimization
- Product bundling strategies
- Supplier negotiations

---

### 5. Category Performance

```http
GET /api/v1/insights/categories/performance
```

**Industry Metric:** Category-Level Revenue Analysis

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "category": "electronics",
      "totalProducts": 24,
      "totalOrders": 450,
      "totalUnitsSold": 1250,
      "totalRevenue": 185000.0,
      "averagePrice": 148.0,
      "totalStockValue": 3600,
      "revenueShare": "45.50"
    }
  ]
}
```

**Key Metrics:**

- `revenueShare`: % contribution to total revenue
- `totalStockValue`: Inventory investment per category

**Use Cases:**

- Category management
- Merchandising strategy
- Supplier relationship management
- Margin analysis

---

### 6. Customer Segment Analysis

```http
GET /api/v1/insights/customers/segments
```

**Industry Metric:** Customer Segmentation KPIs

**Response:**

```json
{
  "success": true,
  "data": {
    "segments": [
      {
        "segment": "enterprise",
        "customerType": "business",
        "customerCount": 15,
        "totalOrders": 320,
        "totalRevenue": 285000.0,
        "averageOrderValue": 890.63,
        "activeLast30Days": 12,
        "customerShare": "25.00",
        "revenueShare": "62.50"
      }
    ],
    "summary": {
      "totalCustomers": 60,
      "totalRevenue": 456000.0
    }
  }
}
```

**Key Metrics:**

- `revenueShare`: Revenue concentration by segment
- `activeLast30Days`: Recent engagement
- `averageOrderValue`: Spend behavior by segment

**Use Cases:**

- Targeted marketing campaigns
- Pricing strategy by segment
- Product development priorities
- Customer retention programs

---

### 7. Revenue Metrics & Financial KPIs

```http
GET /api/v1/insights/revenue/metrics
```

**Industry Metrics:** CFO Dashboard KPIs

**Response:**

```json
{
  "success": true,
  "data": {
    "totalOrders": 450,
    "totalRevenue": 250000.0,
    "subtotalRevenue": 225000.0,
    "totalTax": 22500.0,
    "totalDiscounts": 12500.0,
    "averageOrderValue": 555.56,
    "collectedRevenue": 210000.0,
    "pendingRevenue": 35000.0,
    "overdueRevenue": 5000.0,
    "uniqueCustomers": 85,
    "collectionRate": "84.00",
    "discountRate": "5.00"
  }
}
```

**Key Metrics:**

- `collectionRate`: Cash collection efficiency (AR performance)
- `discountRate`: Discount impact on revenue
- `overdueRevenue`: Collections risk exposure
- `averageOrderValue`: Customer spend behavior

**Industry Standards:**

- **Good Collection Rate**: > 90%
- **Healthy Discount Rate**: < 10%
- **DSO (Days Sales Outstanding)**: < 45 days

**Use Cases:**

- Cash flow forecasting
- Working capital management
- Pricing strategy validation
- Financial reporting

---

### 8. Order Fulfillment Metrics

```http
GET /api/v1/insights/orders/metrics
```

**Industry Metrics:** Operational KPIs

**Response:**

```json
{
  "success": true,
  "data": {
    "byStatus": [
      {
        "status": "delivered",
        "count": 320,
        "totalValue": 180000.0
      },
      {
        "status": "shipped",
        "count": 45,
        "totalValue": 25000.0
      },
      {
        "status": "processing",
        "count": 30,
        "totalValue": 18000.0
      }
    ],
    "byPaymentStatus": [
      {
        "paymentStatus": "paid",
        "count": 350,
        "totalValue": 200000.0
      },
      {
        "paymentStatus": "pending",
        "count": 40,
        "totalValue": 20000.0
      }
    ]
  }
}
```

**Use Cases:**

- Monitor order pipeline
- Identify fulfillment bottlenecks
- Improve delivery speed
- Reduce cancellation rate

---

### 9. Inventory Health

```http
GET /api/v1/insights/inventory/health
```

**Industry Metrics:** Inventory Management KPIs

**Response:**

```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "activeProducts": 142,
    "lowStockProducts": 12,
    "outOfStockProducts": 3,
    "totalInventoryValue": 285000.0,
    "averageStockLevel": 85.5,
    "totalUnitsInStock": 12825,
    "stockHealthRate": "92.00",
    "stockoutRate": "2.00"
  }
}
```

**Key Metrics:**

- `totalInventoryValue`: Asset value tied up in inventory
- `stockHealthRate`: % of products with adequate stock
- `stockoutRate`: % of products out of stock

**Industry Standards:**

- **Target Stock Health Rate**: > 95%
- **Target Stockout Rate**: < 5%

**Use Cases:**

- Prevent stockouts
- Optimize inventory levels
- Cash flow management
- Reorder point calculation

---

### 10. Growth Metrics (MoM)

```http
GET /api/v1/insights/growth/metrics
```

**Industry Metrics:** Growth Rate Analysis

**Response:**

```json
{
  "success": true,
  "data": {
    "monthOverMonth": {
      "revenue": {
        "current": 22000.0,
        "previous": 15000.0,
        "growthRate": "46.67"
      },
      "orders": {
        "current": 85,
        "previous": 62,
        "growthRate": "37.10"
      },
      "customers": {
        "current": 34,
        "previous": 28,
        "growthRate": "21.43"
      }
    }
  }
}
```

**Use Cases:**

- Track business growth
- Investor reporting
- Budget forecasting
- Performance benchmarking

---

### 11. Payment & Accounts Receivable Analysis

```http
GET /api/v1/insights/payments/analysis
```

**Industry Metrics:** AR Management KPIs

**Response:**

```json
{
  "success": true,
  "data": {
    "breakdown": [
      {
        "paymentStatus": "paid",
        "paymentMethod": "credit_card",
        "count": 180,
        "totalAmount": 120000.0,
        "percentage": "48.00",
        "averageDaysToPayment": "3.50"
      },
      {
        "paymentStatus": "pending",
        "paymentMethod": "bank_transfer",
        "count": 45,
        "totalAmount": 35000.0,
        "percentage": "14.00",
        "averageDaysToPayment": "0.00"
      }
    ],
    "summary": {
      "totalAmount": 250000.0,
      "totalTransactions": 450
    }
  }
}
```

**Key Metrics:**

- `averageDaysToPayment`: Collection efficiency
- Payment method distribution
- AR aging breakdown

**Use Cases:**

- Optimize payment methods
- Improve collection processes
- Reduce days to payment
- Cash flow optimization

---

## Industry Standards & Best Practices

### Key Performance Indicators (KPIs)

1. **Revenue KPIs**
   - Monthly Recurring Revenue (MRR)
   - Average Order Value (AOV)
   - Revenue Growth Rate

2. **Customer KPIs**
   - Customer Lifetime Value (CLV)
   - Customer Acquisition Cost (CAC)
   - Customer Retention Rate

3. **Operational KPIs**
   - Order Fulfillment Rate
   - Inventory Turnover Ratio
   - Days Sales Outstanding (DSO)

4. **Financial KPIs**
   - Gross Profit Margin
   - Collection Rate
   - Discount Rate

### Benchmarks

- **SaaS Companies**: 15-20% MoM growth rate
- **Retail/E-commerce**: 2-5% monthly growth
- **B2B**: Average DSO of 30-45 days
- **Inventory**: Turnover ratio of 4-6x annually

### Data Refresh Recommendations

- **Real-time**: Order metrics, inventory health
- **Daily**: Revenue metrics, payment analysis
- **Weekly**: Customer analytics, product performance
- **Monthly**: Growth metrics, segment analysis

---

## Error Handling

All endpoints return standard error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common error codes:

- `400`: Bad request (missing organization context)
- `401`: Unauthorized (invalid or missing token)
- `403`: Forbidden (no access to organization)
- `500`: Internal server error

---

## Performance Considerations

1. **Caching**: Consider caching results for 5-15 minutes
2. **Date Ranges**: Limit queries to reasonable date ranges (< 2 years)
3. **Pagination**: Use limit parameter to control response size
4. **Indexing**: Ensure database indexes on `order_date`, `org_id`, `customer_id`

---

## Future Enhancements

Planned additions:

- [ ] Quarter-over-Quarter (QoQ) metrics
- [ ] Year-over-Year (YoY) comparisons
- [ ] Customer cohort analysis
- [ ] Product recommendation engine
- [ ] Predictive analytics (ML-based forecasting)
- [ ] Real-time dashboard WebSocket updates
- [ ] Export to Excel/CSV
- [ ] Custom report builder
- [ ] Scheduled email reports

---

## Example Use Cases

### 1. Executive Dashboard

Combine multiple endpoints for a comprehensive overview:

```
GET /api/v1/insights (full dashboard)
```

### 2. Sales Manager Dashboard

```
GET /api/v1/insights/sales/monthly
GET /api/v1/insights/customers/top
GET /api/v1/insights/products/top
```

### 3. CFO Dashboard

```
GET /api/v1/insights/revenue/metrics
GET /api/v1/insights/payments/analysis
GET /api/v1/insights/growth/metrics
```

### 4. Operations Manager Dashboard

```
GET /api/v1/insights/orders/metrics
GET /api/v1/insights/inventory/health
```

### 5. Marketing Dashboard

```
GET /api/v1/insights/customers/segments
GET /api/v1/insights/categories/performance
```

---

## Integration Examples

### React/Next.js Dashboard

```typescript
import { useState, useEffect } from 'react';

const InsightsDashboard = () => {
  const [insights, setInsights] = useState(null);

  useEffect(() => {
    fetch('/api/v1/insights', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => setInsights(data.data));
  }, []);

  return (
    <div>
      <RevenueChart data={insights?.revenueAnalytics} />
      <CustomerSegments data={insights?.customerAnalytics} />
      <GrowthMetrics data={insights?.growthMetrics} />
    </div>
  );
};
```

### Python Analytics Script

```python
import requests
import pandas as pd

def get_insights(token, start_date, end_date):
    response = requests.get(
        'https://api.example.com/api/v1/insights',
        headers={'Authorization': f'Bearer {token}'},
        params={'startDate': start_date, 'endDate': end_date}
    )
    return response.json()

# Analyze monthly sales trend
insights = get_insights(token, '2024-01-01', '2025-12-31')
sales_df = pd.DataFrame(insights['data']['salesPerformance']['monthlySales'])
print(sales_df.describe())
```

---

## Support

For questions or issues with the Insights API:

- Documentation: `/docs/INSIGHTS_API.md`
- API Tests: See Bruno collection in `api-tests/mini-saas-api/Insights/`
- Support: Open an issue in the repository

---

**Last Updated:** October 27, 2025  
**API Version:** v1  
**Status:** Production Ready ✅
