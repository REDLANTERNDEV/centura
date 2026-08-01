# Products page

Route: `/dashboard/products` ([`page.tsx`](./page.tsx)). Product catalogue and
stock management for the selected organisation.

## Components

Live in [`components/products/`](../../../../components/products/), not
colocated with the route:

| File                         | Role                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| `products-table.tsx`         | Data table — sortable, paginated (20/page)                                                    |
| `product-details-dialog.tsx` | Full product view: pricing, stock, metadata                                                   |
| `create-product-dialog.tsx`  | Creation form                                                                                 |
| `edit-product-dialog.tsx`    | Edit form                                                                                     |
| `product-category-badge.tsx` | Icon + colour per category (Electronics, Clothing, Food, Books, Sports, Home & Garden, Other) |
| `stock-status-badge.tsx`     | In stock / low stock / out of stock, derived from `stock_quantity` vs `low_stock_threshold`   |

Validation on the create/edit forms is hand-rolled, not the `product.schema.ts`
Zod schema in `lib/validations/` — that schema is unused, see
[validation.md](../../../../docs/architecture/validation.md).

## API functions

Tanım: [`lib/api-client.ts`](../../../../lib/api-client.ts)

```typescript
getProducts(filters?)        // GET /products
createProduct(data)          // POST /products
getProduct(id)                // GET /products/:id
updateProduct(id, data)      // PUT /products/:id
deleteProduct(id)            // DELETE /products/:id — soft delete, see below
updateProductStock(id, data) // PATCH /products/:id/stock
getLowStockProducts()        // GET /products/low-stock
```

Deleting a product does **not** remove the row — the backend sets
`deleted_at` and it drops out of active listings. A restore endpoint exists
(`POST /products/:id/restore`) but has no frontend entry point yet. See
[orders.md](../../../../../backend/docs/api/orders.md#products) for the full
API reference.

## CSV export

`handleExport()` in `page.tsx` builds a CSV client-side from the currently
loaded page of products and triggers a browser download — it does not call a
dedicated export endpoint, so it only exports what's currently loaded, not the
full unfiltered catalogue.

## Related

- [Orders page](../orders/README.md)
- [Products & Orders API](../../../../../backend/docs/api/orders.md)
- [Frontend validation](../../../../docs/architecture/validation.md)
