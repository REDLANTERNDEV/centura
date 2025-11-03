# Orders Management System - Documentation

## Overview

Professional orders management module for the Mini SaaS ERP/CRM application. Built with industry-standard practices and shadcn/ui components.

## Features

### ✅ Implemented

- **Orders List Page** - Professional data table with filtering, search, and pagination
- **Order Status Badges** - Visual indicators for order workflow stages
- **Payment Status Badges** - Clear payment status visualization
- **Order Details Dialog** - Comprehensive order information view
- **Real-time Filtering** - Filter by status, payment status, and search
- **Order Actions** - View, cancel, and delete orders
- **Responsive Design** - Mobile-friendly interface
- **Turkish Localization** - Full Turkish language support

### 📋 API Integration

All API endpoints are integrated via `lib/api-client.ts`:

- `GET /api/orders` - List orders with filters and pagination
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create new order
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/payment` - Update payment status
- `PATCH /api/orders/:id/cancel` - Cancel order
- `DELETE /api/orders/:id` - Delete order
- `GET /api/orders/statistics` - Get order statistics

## File Structure

```
apps/frontend/
├── app/(dashboard)/orders/
│   └── page.tsx                    # Main orders page
├── components/orders/
│   ├── index.ts                    # Component exports
│   ├── order-status-badge.tsx      # Order status badge component
│   ├── payment-status-badge.tsx    # Payment status badge component
│   ├── orders-table.tsx            # Data table component
│   └── order-details-dialog.tsx    # Order details dialog
└── lib/
    └── api-client.ts               # API client with order functions
```

## Components

### OrdersTable

Professional data table with industry-standard features.

**Props:**

- `orders: Order[]` - Array of orders to display
- `isLoading?: boolean` - Loading state
- `pagination?` - Pagination information
- `onPageChange?` - Page change handler
- `onViewOrder?` - View order callback
- `onEditOrder?` - Edit order callback (future)
- `onCancelOrder?` - Cancel order callback
- `onDeleteOrder?` - Delete order callback

**Features:**

- Responsive design
- Action dropdown menu
- Empty state
- Loading skeleton
- Turkish Lira formatting
- Turkish date formatting

### OrderStatusBadge

Visual status indicators for order workflow.

**Statuses:**

- `draft` - Taslak (Gray)
- `confirmed` - Onaylandı (Blue)
- `processing` - İşleniyor (Amber)
- `shipped` - Kargoya Verildi (Purple)
- `delivered` - Teslim Edildi (Green)
- `cancelled` - İptal Edildi (Red)

### PaymentStatusBadge

Payment status indicators.

**Statuses:**

- `pending` - Ödeme Bekliyor (Gray)
- `partial` - Kısmi Ödendi (Amber)
- `paid` - Ödendi (Green)
- `refunded` - İade Edildi (Purple)

### OrderDetailsDialog

Comprehensive order details view.

**Sections:**

- Order header with status badges
- Customer information
- Delivery address
- Order items table
- Payment summary
- Notes
- Timeline

## Usage

### Basic Usage

```tsx
import OrdersPage from '@/app/(dashboard)/orders/page';

// The page is automatically routed at /dashboard/orders
// Just navigate to the URL in your application
```

### Using Components Individually

```tsx
import {
  OrdersTable,
  OrderStatusBadge,
  PaymentStatusBadge,
  OrderDetailsDialog,
} from '@/components/orders';

// Use in your custom page
<OrdersTable
  orders={orders}
  isLoading={loading}
  pagination={pagination}
  onViewOrder={handleView}
/>;
```

### API Client Usage

```tsx
import { getOrders, getOrderById, cancelOrder } from '@/lib/api-client';

// Fetch orders with filters
const response = await getOrders({
  status: 'confirmed',
  payment_status: 'paid',
  page: 1,
  limit: 20,
});

// Get order details
const order = await getOrderById(123);

// Cancel order
await cancelOrder(123);
```

## Styling

All components use:

- **shadcn/ui** components for consistent design
- **Tailwind CSS** for styling
- **lucide-react** for icons
- **Turkish** language localization

### Color Scheme

- Primary: Blue (#3b82f6)
- Success: Green (#22c55e)
- Warning: Amber (#f59e0b)
- Danger: Red (#ef4444)
- Info: Purple (#a855f7)
- Muted: Gray (#64748b)

## Order Workflow

```
draft → confirmed → processing → shipped → delivered
                                      ↓
                                 cancelled (at any stage)
```

## Payment Workflow

```
pending → partial → paid
    ↓
refunded
```

## Security

- All API calls require authentication (JWT token in HTTP-only cookie)
- Organization-level data isolation
- Role-based access control (RBAC)
- Input validation on both frontend and backend

## Performance

- Pagination (20 items per page by default)
- Lazy loading for order details
- Optimized re-renders with React best practices
- Skeleton loading states

## Future Enhancements

### Phase 2 (Planned)

- [ ] Create Order Form Dialog
- [ ] Edit Order functionality
- [ ] Bulk actions (export, delete, status update)
- [ ] Advanced filters (date range, customer, amount range)
- [ ] Order notes and comments
- [ ] Order history/audit trail

### Phase 3 (Future)

- [ ] Order templates
- [ ] Recurring orders
- [ ] Order approval workflow
- [ ] Email notifications
- [ ] PDF invoice generation
- [ ] Order tracking integration

## Testing

### Manual Testing Checklist

- [ ] Load orders page
- [ ] Filter by status
- [ ] Filter by payment status
- [ ] Search by order number
- [ ] View order details
- [ ] Cancel order
- [ ] Delete draft order
- [ ] Pagination navigation
- [ ] Responsive design (mobile, tablet, desktop)

### Test Data

Use Bruno API tests in `api-tests/mini-saas-api/Orders/` to create test data:

- Create Order
- Create Order - Auto Pricing
- Get All Orders
- Get Order by ID

## Troubleshooting

### Orders not loading

- Check if organization is selected
- Verify authentication token
- Check browser console for errors
- Verify backend API is running

### Status/Payment badges not showing

- Ensure order status values match enum types
- Check console for type errors

### Pagination not working

- Verify `pagination` prop is passed correctly
- Check `onPageChange` callback is defined

## Support

For issues or questions:

- Check `apps/backend/docs/` for backend documentation
- Review `DATABASE.md` for schema information
- Check API endpoints in Bruno collections

## Changelog

### Version 1.0.0 (Current)

- ✅ Initial release
- ✅ Orders list with table
- ✅ Status and payment badges
- ✅ Order details dialog
- ✅ Filtering and search
- ✅ Cancel and delete actions
- ✅ API client integration
- ✅ Turkish localization

---

**Built with ❤️ using Next.js 14, shadcn/ui, and TypeScript**
