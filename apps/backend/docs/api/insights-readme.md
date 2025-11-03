# Insights API - Business Intelligence Module

## 🎯 Overview

The Insights API is a comprehensive business intelligence module for your CRM/ERP system. It provides **industry-standard analytics** used by enterprise SaaS, CRM, and ERP platforms.

## ✨ Features

### 📊 Analytics Categories

1. **Sales Performance**
   - Top customers by revenue (CLV)
   - Monthly sales trends
   - Top selling products
   - Category performance analysis

2. **Customer Analytics**
   - Customer segmentation (B2B/B2C, Enterprise/SMB)
   - Customer lifetime value (CLV)
   - Active customer tracking
   - Segment revenue distribution

3. **Revenue & Financial KPIs**
   - Total revenue, subtotal, tax, discounts
   - Collection rate (AR performance)
   - Discount rate analysis
   - Average order value (AOV)
   - Overdue revenue tracking

4. **Operational Metrics**
   - Order fulfillment by status
   - Payment status breakdown
   - Inventory health monitoring
   - Stock-out rate tracking

5. **Growth Metrics**
   - Month-over-Month (MoM) growth
   - Revenue growth rate
   - Order volume growth
   - Customer acquisition trend

6. **Payment Analysis**
   - Payment method distribution
   - Days to payment (collection efficiency)
   - AR aging analysis
   - Payment status tracking

## 🚀 Quick Start

### 1. Basic Usage

```javascript
// Get comprehensive insights
GET /api/v1/insights

// Get specific metrics
GET /api/v1/insights/revenue/metrics
GET /api/v1/insights/customers/top?limit=10
GET /api/v1/insights/sales/monthly
```

### 2. With Date Filters

```javascript
GET /api/v1/insights?startDate=2024-01-01&endDate=2025-12-31
GET /api/v1/insights/sales/monthly?startDate=2025-01-01
```

## 📈 Industry-Standard Metrics

| Metric                | Description                    | Industry Benchmark |
| --------------------- | ------------------------------ | ------------------ |
| **Collection Rate**   | % of revenue collected         | > 90% is good      |
| **Stock Health Rate** | % products with adequate stock | > 95% target       |
| **Discount Rate**     | Impact of discounts on revenue | < 10% healthy      |
| **Stockout Rate**     | % products out of stock        | < 5% target        |
| **MoM Growth**        | Month-over-month growth        | 15-20% for SaaS    |
| **AOV**               | Average order value            | Track trends       |
| **CLV**               | Customer lifetime value        | Track by segment   |

## 📋 Endpoint List

### Core Insights

- `GET /api/v1/insights` - Comprehensive dashboard

### Customer Analytics

- `GET /api/v1/insights/customers/top` - Top customers by revenue
- `GET /api/v1/insights/customers/segments` - Segment analysis

### Sales Analytics

- `GET /api/v1/insights/sales/monthly` - Monthly sales trend

### Product Analytics

- `GET /api/v1/insights/products/top` - Top selling products
- `GET /api/v1/insights/categories/performance` - Category performance

### Financial Analytics

- `GET /api/v1/insights/revenue/metrics` - Revenue KPIs
- `GET /api/v1/insights/payments/analysis` - Payment & AR analysis

### Operational Analytics

- `GET /api/v1/insights/orders/metrics` - Order fulfillment metrics
- `GET /api/v1/insights/inventory/health` - Inventory health

### Growth Analytics

- `GET /api/v1/insights/growth/metrics` - MoM growth metrics

## 🎨 Use Cases by Role

### 👔 Executive / CEO

```bash
# Complete overview
GET /api/v1/insights

# Key metrics: Revenue, Growth, Customer segments
```

### 💰 CFO / Finance

```bash
GET /api/v1/insights/revenue/metrics
GET /api/v1/insights/payments/analysis
GET /api/v1/insights/growth/metrics

# Focus: Cash flow, AR, collection rate, discount analysis
```

### 📊 Sales Manager

```bash
GET /api/v1/insights/sales/monthly
GET /api/v1/insights/customers/top
GET /api/v1/insights/products/top

# Focus: Sales trends, top performers, customer insights
```

### 📦 Operations Manager

```bash
GET /api/v1/insights/orders/metrics
GET /api/v1/insights/inventory/health

# Focus: Fulfillment efficiency, inventory optimization
```

### 🎯 Marketing Manager

```bash
GET /api/v1/insights/customers/segments
GET /api/v1/insights/categories/performance

# Focus: Segmentation, targeting, product strategy
```

## 🧪 Testing

Bruno API tests are available in:

```
api-tests/mini-saas-api/Insights/
```

Test files:

- ✅ Get Comprehensive Insights
- ✅ Top Customers by Revenue
- ✅ Monthly Sales Trend
- ✅ Top Selling Products
- ✅ Category Performance
- ✅ Customer Segment Analysis
- ✅ Revenue Metrics & KPIs
- ✅ Order Fulfillment Metrics
- ✅ Inventory Health
- ✅ Growth Metrics (MoM)
- ✅ Payment & AR Analysis

## 📊 Sample Response

### Comprehensive Insights

```json
{
  "success": true,
  "data": {
    "period": {
      "startDate": null,
      "endDate": null,
      "generatedAt": "2025-10-27T10:30:00.000Z"
    },
    "salesPerformance": {
      "topCustomers": [
        {
          "name": "ACME Ltd",
          "totalSales": 12000,
          "totalOrders": 45,
          "averageOrderValue": 266.68
        }
      ],
      "monthlySales": [
        {
          "month": "2025-10",
          "totalSales": 22000,
          "totalOrders": 85,
          "collectionRate": "84.09"
        }
      ]
    },
    "revenueAnalytics": {
      "totalRevenue": 250000.0,
      "collectionRate": "84.00",
      "discountRate": "5.00"
    },
    "growthMetrics": {
      "monthOverMonth": {
        "revenue": {
          "growthRate": "46.67"
        }
      }
    }
  }
}
```

## 🔧 Technical Details

### Database Optimization

- Indexed on `org_id`, `order_date`, `customer_id`
- Efficient aggregation queries
- Optimized JOIN operations

### Performance

- Cached results recommended (5-15 min TTL)
- Limit date ranges (< 2 years)
- Use pagination where applicable

### Security

- Requires authentication (`authenticateToken`)
- Organization-scoped data
- Multi-tenant isolation

## 🌟 Future Enhancements

- [ ] Quarter-over-Quarter (QoQ) metrics
- [ ] Year-over-Year (YoY) comparisons
- [ ] Customer cohort analysis
- [ ] ML-based forecasting
- [ ] Real-time WebSocket updates
- [ ] Custom report builder
- [ ] Export to Excel/CSV
- [ ] Scheduled email reports
- [ ] Dashboard widgets API
- [ ] Anomaly detection

## 📚 Documentation

Full documentation: [`docs/INSIGHTS_API.md`](./docs/INSIGHTS_API.md)

## 🎓 Industry References

This implementation follows best practices from:

- Salesforce Analytics
- HubSpot Reporting
- Zoho Analytics
- Microsoft Dynamics 365
- SAP Business One
- NetSuite ERP

## 📝 License

Part of Mini SaaS ERP - See LICENSE file

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** October 27, 2025
