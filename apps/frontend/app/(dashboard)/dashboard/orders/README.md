# Orders page

Route: `/dashboard/orders` ([`page.tsx`](./page.tsx)).

## Components

Live in [`components/orders/`](../../../../components/orders/):

| File                             | Role                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `orders-table.tsx`               | Data table — filter, search, pagination (20/page)                             |
| `order-status-badge.tsx`         | `draft` / `confirmed` / `processing` / `shipped` / `delivered` / `cancelled`  |
| `payment-status-badge.tsx`       | `pending` / `partial` / `paid` / `refunded`                                   |
| `order-details-dialog.tsx`       | Full order view: items, addresses, payment summary                            |
| `order-item-row.tsx`             | Single line item, used inside the create/edit dialogs                         |
| `create-order-dialog.tsx`        | Creation form                                                                 |
| `edit-order-dialog.tsx`          | Zod-validated edit dialog — defined but **not** the one wired into `page.tsx` |
| `advanced-edit-order-dialog.tsx` | The dialog `page.tsx` actually renders for edits                              |

`edit-order-dialog.tsx` uses the `createEditOrderSchema` Zod schema, but since
`page.tsx` imports `AdvancedEditOrderDialog` instead, neither the component nor
its schema is reachable from the UI — both are dead code. See
[validation.md](../../../../docs/architecture/validation.md) for the full
used-vs-unused schema list.

## API functions

Tanım: [`lib/api-client.ts`](../../../../lib/api-client.ts)

```typescript
getOrders(filters?)              // GET /orders
getOrderById(id)                  // GET /orders/:id
createOrder(data)                // POST /orders
updateOrderStatus(id, status)    // PATCH /orders/:id/status
updatePaymentStatus(id, data)    // PATCH /orders/:id/payment
cancelOrder(id)                  // PATCH /orders/:id/cancel
```

Full request/response shapes, the pricing formula, and the known
`unit_price` gap are documented in
[orders.md](../../../../../backend/docs/api/orders.md).

## Related

- [Products page](../products/README.md)
- [Orders & Products API](../../../../../backend/docs/api/orders.md)
- [Frontend validation](../../../../docs/architecture/validation.md)
