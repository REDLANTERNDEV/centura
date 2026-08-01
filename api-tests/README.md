# Centura API — Bruno collection

A [Bruno](https://www.usebruno.com/) collection covering the Centura API: 49 requests
across authentication, customers, products, orders, organisations, settings and
analytics.

## Setup

1. Install Bruno from <https://www.usebruno.com/>.
2. Open Bruno, choose **Open Collection**, and select `api-tests/centura-api`.
3. Pick the **Development** or **Production** environment in the top right.

Sync the base URL to whatever port your backend is on:

```bash
npm run sync:bruno
```

This reads `PORT` from the backend `.env` and rewrites `baseUrl` in
`environments/Development.bru`. Run it after cloning, and again whenever you change
the backend port. The Production environment is not touched — edit it by hand.

## Authentication

The API authenticates with cookies, so you need a token in the environment before
most requests will work.

**From the collection:** run `Auth > Login`, then copy the `token` cookie from the
response into the `token` environment variable.

**From the browser:** sign in to the web app, then DevTools → Application → Cookies →
copy `token`.

Access tokens expire after 15 minutes by default (`JWT_ACCESS_EXPIRES_IN`). A 401
usually means it has expired — log in again.

## Collection layout

```text
api-tests/centura-api/
├── bruno.json
├── environments/
│   ├── Development.bru        # synced by npm run sync:bruno
│   └── Production.bru         # edit manually
├── Auth/                      # 3 requests — login, signup, logout
├── Customers/                 # 2 requests
├── Products/                  # 8 requests — CRUD, stock adjustment, low-stock query
├── Orders/                    # 8 requests — CRUD, status and payment transitions
├── Organizations/             # 8 requests — organisation and membership management
├── Settings/                  # 6 requests
├── Analytics/                 # 3 requests — sales stats, top products, customer orders
└── Insights/                  # 11 requests — dashboard and analytics endpoints
```

Requests are ordered by their `seq` number, and each carries a `docs` block with
endpoint-specific notes.

## Suggested walkthrough

1. `Auth/Login`
2. `Customers/Create Customer`
3. `Products/Create Product` — create a few
4. `Orders/Create Order`
5. `Orders/Update Order Status` → `confirmed`
6. `Orders/Update Payment Status` → `paid`
7. `Analytics/Sales Statistics`
8. `Insights/...` — dashboard aggregates

## Behaviour worth knowing

- Creating an order decrements product stock; cancelling one restores it.
- Order totals are calculated server-side from line items, discounts and tax.
- Order numbers are generated automatically in the form `ORD-{orgId}-{year}-{sequence}`, e.g. `ORD-1-2025-000001`.

**Order status:** `draft` → `confirmed` → `processing` → `shipped` → `delivered`.
`cancelled` is reachable from any state except `delivered`.

**Payment status:** `pending` → `partial` → `paid`, plus `refunded`.

## Organisation context

Most requests need an `X-Organization-ID` header — the collection already sets
this to `{{orgId}}` on requests that need it. After logging in, get your
organisation id and update the environment variable:

```http
GET /organizations
```

Copy an `org_id` from the response into the `orgId` environment variable
(default is `1`).

Whether a missing header is fatal depends on the endpoint. Insights routes
reject the request outright with `400 ORG_CONTEXT_REQUIRED`. Products, orders,
and customers fall back to the organisation baked into your access token
instead of failing — convenient for quick testing, but it means a stale
`orgId` won't necessarily surface as an error, just wrong data. See
[security.md](../apps/backend/docs/architecture/security.md) for exactly which
middleware each route uses and why.

## Filtering

Disabled query parameters are prefixed with `~` and are not sent. Remove the prefix
to enable one:

```text
params:query {
  page: 1
  limit: 50
  ~category: Electronics      # disabled
}
```

| Resource  | Examples                                                                                                    |
| --------- | ----------------------------------------------------------------------------------------------------------- |
| Products  | `?category=Electronics`, `?min_price=100&max_price=500`, `?low_stock=true`, `?search=laptop`                |
| Orders    | `?status=confirmed`, `?payment_status=paid`, `?start_date=2025-10-01&end_date=2025-10-31`, `?customer_id=1` |
| Customers | `?city=Istanbul`, `?segment=Premium`, `?search=acme`                                                        |

## Troubleshooting

**401 Unauthorized** — the token is missing or expired. Log in again and update the
environment variable.

**404 Not Found** — check the backend is running, that `baseUrl` matches its port
(`npm run sync:bruno`), and that the endpoint path is right.

**ECONNREFUSED** — the backend isn't running, or Bruno is pointing at the wrong port.
Start it with `npm run dev:backend` and re-run `npm run sync:bruno`.

## Related documentation

- [Orders API](../apps/backend/docs/api/orders.md)
- [Organizations API](../apps/backend/docs/api/organizations.md)
- [Insights API](../apps/backend/docs/api/insights.md)
- [Database schema](../apps/backend/docs/architecture/database.md)
- [Organisation context security](../apps/backend/docs/architecture/security.md)
