# Analytics Dashboard - Implementation Guide

## Overview

The Analytics Dashboard is a comprehensive, industry-standard business intelligence solution for the Centura ERP/CRM system. It provides real-time insights into revenue, sales, customers, inventory, and overall business performance.

## Features

### 🎯 Key Performance Indicators (KPIs)

- **Total Revenue**: Track period revenue with growth rate comparisons
- **Total Orders**: Monitor order volume and trends
- **Active Customers**: View customer engagement metrics
- **Average Order Value**: Analyze transaction values and fulfillment rates

### 📊 Analytics Modules

#### 1. **Overview Tab**

- Monthly sales trend with dual-axis charts (revenue & orders)
- Order status distribution (pie chart)
- Top-selling products ranking
- Quick snapshot of business health

#### 2. **Revenue Tab**

- Total revenue (all-time)
- Period revenue comparison
- Growth rate analysis
- Revenue breakdown by order status
- Interactive bar charts for revenue visualization

#### 3. **Sales Tab**

- Category performance analysis
- Monthly sales performance trends
- Top products by revenue
- Area charts for sales trends
- Quantity vs. revenue comparisons

#### 4. **Customers Tab**

- Total, active, and new customer metrics
- Customer retention rate
- Customer segmentation analysis (pie chart)
- Top customers by revenue
- Customer behavior insights

#### 5. **Inventory Tab**

- Total products tracking
- Low stock alerts
- Out-of-stock monitoring
- Inventory value calculation
- Stock health distribution visualization

### 🎨 Design Features

- **Responsive Design**: Fully responsive across all devices
- **shadcn/ui Components**: Industry-standard UI components
- **Recharts Integration**: Professional chart library
- **Dark Mode Support**: Automatic theme switching
- **Loading States**: Skeleton loaders for better UX
- **Error Handling**: Graceful error states with retry options

### 🔧 Technical Features

- **Time Period Filtering**: 7 days, 30 days, 90 days, YTD, All-time
- **Data Refresh**: Manual refresh with loading indicators
- **Export Functionality**: Export analytics data (ready for implementation)
- **Real-time Updates**: Auto-refresh capabilities
- **Organization Context**: Multi-tenant support

## Usage

### Accessing Analytics

Navigate to the Analytics page from the sidebar:

```
Dashboard → Analytics
```

### Time Period Selection

Use the time period selector to filter data:

- **Last 7 Days**: Weekly performance snapshot
- **Last 30 Days**: Monthly overview (default)
- **Last 90 Days**: Quarterly analysis
- **Year to Date**: Annual performance tracking
- **All Time**: Complete historical data

### Refreshing Data

Click the refresh button (🔄) to reload analytics data without refreshing the page.

### Exporting Data

Click the "Export" button to download analytics reports (feature ready for backend integration).

## API Integration

The analytics page integrates with the following API endpoint:

```typescript
GET / api / v1 / insights;
```

### Query Parameters

- `period`: Time period filter (7d, 30d, 90d, ytd, all)

### Expected Response Structure

```typescript
interface AnalyticsData {
  revenueMetrics: {
    totalRevenue: number;
    periodRevenue: number;
    previousPeriodRevenue: number;
    growthRate: number;
    averageOrderValue: number;
    totalOrders: number;
    revenueByStatus: Array<{
      status: string;
      amount: number;
      percentage: number;
    }>;
  };

  customerMetrics: {
    totalCustomers: number;
    newCustomers: number;
    activeCustomers: number;
    customerRetentionRate: number;
    topCustomers: Array<{
      id: number;
      name: string;
      totalRevenue: number;
      orderCount: number;
    }>;
    segmentation: Array<{
      segment: string;
      count: number;
      revenue: number;
      percentage: number;
    }>;
  };

  salesMetrics: {
    monthlySales: Array<{
      month: string;
      revenue: number;
      orders: number;
      customers: number;
    }>;
    categoryPerformance: Array<{
      category: string;
      revenue: number;
      quantity: number;
      growthRate: number;
    }>;
    topProducts: Array<{
      id: number;
      name: string;
      revenue: number;
      quantity: number;
      category: string;
    }>;
  };

  inventoryMetrics: {
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
    inventoryValue: number;
    turnoverRate: number;
    stockHealth: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  };

  orderMetrics: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    fulfillmentRate: number;
    averageProcessingTime: number;
    ordersByStatus: Array<{
      status: string;
      count: number;
      percentage: number;
    }>;
  };

  growthMetrics: {
    revenueGrowth: number;
    customerGrowth: number;
    orderGrowth: number;
  };
}
```

## Components Used

### shadcn/ui Components

- `Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Badge`
- `Button`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Skeleton`
- `ChartContainer`, `ChartTooltip`, `ChartLegend`

### Recharts Components

- `LineChart`, `Line`
- `BarChart`, `Bar`
- `AreaChart`, `Area`
- `PieChart`, `Pie`, `Cell`
- `XAxis`, `YAxis`, `CartesianGrid`

### Custom Components

Located in `components/analytics/AnalyticsComponents.tsx`:

- `MetricCard`: Reusable KPI card with trend indicators
- `EmptyState`: User-friendly empty state component
- `StatBadge`: Status badge with variants
- `ProgressBar`: Progress indicator with variants

## Industry Standards Implemented

### Business Intelligence Metrics

✅ Revenue Analytics & KPIs
✅ Customer Lifetime Value (CLV) ready
✅ Month-over-Month (MoM) Growth
✅ Average Order Value (AOV)
✅ Customer Retention Rate
✅ Inventory Turnover
✅ Fulfillment Rate
✅ Customer Segmentation

### UX/UI Best Practices

✅ Loading states with skeletons
✅ Error handling with retry mechanism
✅ Responsive design (mobile-first)
✅ Accessibility (ARIA labels ready)
✅ Dark mode support
✅ Professional color scheme
✅ Clear visual hierarchy
✅ Intuitive navigation

### Professional ERP/CRM Features

✅ Multi-tenant organization support
✅ Time period filtering
✅ Real-time data refresh
✅ Export capabilities (ready)
✅ Comprehensive charts
✅ Trend indicators
✅ Comparative analytics
✅ Drill-down ready architecture

## Future Enhancements

### Phase 1 (Recommended)

- [ ] Real-time WebSocket updates
- [ ] Custom date range picker
- [ ] Advanced filters (by category, customer segment, etc.)
- [ ] Drill-down into specific metrics
- [ ] Comparison mode (multiple periods side-by-side)

### Phase 2 (Advanced)

- [ ] Predictive analytics (forecasting)
- [ ] Custom dashboard builder
- [ ] Scheduled reports via email
- [ ] PDF/Excel export with charts
- [ ] Saved filter presets
- [ ] Alert thresholds (low stock, revenue targets)

### Phase 3 (Enterprise)

- [ ] AI-powered insights
- [ ] Anomaly detection
- [ ] Cohort analysis
- [ ] A/B testing results
- [ ] Advanced segmentation
- [ ] Custom calculated metrics

## Performance Optimization

- Chart rendering optimized with React.memo (ready for implementation)
- Data caching strategy (ready for implementation)
- Lazy loading for chart components
- Debounced API calls
- Progressive data loading for large datasets

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast mode compatible
- Focus indicators
- ARIA labels on interactive elements

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Android)

## File Structure

```
apps/frontend/
├── app/(dashboard)/dashboard/analytics/
│   └── page.tsx                    # Main analytics page
├── components/
│   └── analytics/
│       └── AnalyticsComponents.tsx # Reusable analytics components
└── lib/
    └── api-client.ts               # API integration
```

## Development

### Running Locally

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Testing Analytics

1. Ensure backend is running
2. Select an organization
3. Navigate to Analytics
4. Test different time periods
5. Verify all charts render correctly

## Troubleshooting

### Issue: Charts not rendering

**Solution**: Ensure recharts is properly installed and chart data is in correct format

### Issue: No data showing

**Solution**:

1. Check organization is selected
2. Verify backend API is running
3. Check browser console for errors
4. Ensure API endpoint returns correct data structure

### Issue: Loading indefinitely

**Solution**:

1. Check network tab for failed requests
2. Verify authentication tokens
3. Check organization ID in request headers

## Contributing

When adding new analytics:

1. Follow existing component patterns
2. Use TypeScript for type safety
3. Implement loading and error states
4. Add appropriate chart types
5. Ensure responsive design
6. Update this documentation

## License

MIT License - See LICENSE file for details

---

**Built with ❤️ using Next.js, shadcn/ui, and Recharts**
