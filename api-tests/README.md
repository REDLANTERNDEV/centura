# 📁 Mini SaaS API - Bruno Collection

This folder contains the professional Bruno API collection for the Mini SaaS ERP/CRM application.

## 📂 Folder Structure

```text
api-tests/mini-saas-api/
├── bruno.json                    # Collection config
├── environments/                 # Environment variables
│   ├── Development.bru          # Development environment
│   └── Production.bru           # Production environment
├── Auth/                        # Authentication endpoints
│   ├── Login.bru
│   ├── Register.bru
│   └── Logout.bru
├── Products/                    # Product management (8 endpoints)
│   ├── Get All Products.bru
│   ├── Get Product by ID.bru
│   ├── Create Product.bru
│   ├── Update Product.bru
│   ├── Update Stock - Add.bru
│   ├── Update Stock - Subtract.bru
│   ├── Get Low Stock Products.bru
│   └── Delete Product.bru
├── Orders/                      # Order management (8 endpoints)
│   ├── Get All Orders.bru
│   ├── Get Order by ID.bru
│   ├── Create Order.bru
│   ├── Create Order - Auto Pricing.bru
│   ├── Update Order Status.bru
│   ├── Update Payment Status.bru
│   ├── Cancel Order.bru
│   └── Delete Order.bru
├── Analytics/                   # Sales analytics (3 endpoints)
│   ├── Sales Statistics.bru
│   ├── Top Selling Products.bru
│   └── Customer Orders.bru
└── Customers/                   # Customer management
    ├── Get All Customers.bru
    └── Create Customer.bru
```

## 🚀 Usage

### 1. Download and Install Bruno

Download from: <https://www.usebruno.com/>

### 2. Open Collection

1. Launch Bruno
2. Click **"Open Collection"** button
3. Select the `api-tests/mini-saas-api` folder

### 3. Select Environment

Choose **Development** or **Production** environment from the top right corner.

**Important:** After cloning the project or if backend port changes, sync the environment:

```bash
# Sync Bruno environment with backend .env PORT
npm run sync:bruno
```

This ensures Bruno's `baseUrl` matches your backend server port automatically!

### 4. Set Up Token

#### Method 1: Get Token from Login Request

1. Run the `Auth > Login` request
2. Copy the cookie value from the response
3. Save to environment:
   - Top right → Environment settings
   - Paste into `token` variable

#### Method 2: Get Token from Browser

1. Login to the web application
2. Developer Tools → Application → Cookies
3. Copy the `token` cookie value
4. Save to environment

### 5. Run Requests

You can test each request in the folders sequentially!

## 🎯 Test Scenario

### Complete Workflow

1. **Auth/Login** → Get token
2. **Customers/Create Customer** → Create customer
3. **Products/Create Product** → Create products (several)
4. **Orders/Create Order** → Create order
5. **Orders/Update Order Status** → confirmed
6. **Orders/Update Payment Status** → paid
7. **Analytics/Sales Statistics** → View statistics
8. **Analytics/Top Selling Products** → Top sellers

## 🔧 Environment Variables

### Development

**Auto-Sync Available!** Run `npm run sync:bruno` to automatically sync with backend `.env` file.

```env
baseUrl: http://localhost:4974/api/v1  # Auto-synced from backend PORT
token: [Token will be placed here after login]
```

**How it works:**

1. Backend `.env` has `PORT=4974`
2. Run `npm run sync:bruno`
3. Bruno `Development.bru` automatically updates `baseUrl`

**Manual sync:** If port changes in backend `.env`, always run:

```bash
npm run sync:bruno
```

### Production

```env
baseUrl: https://api.yourapp.com/v1
token: [Production token]
```

## 💡 Tips

### Query Parameters

Disabled parameters (with `~` prefix) are not sent by default. Remove the `~` to activate them.

Example:

```text
params:query {
  page: 1                     # Active
  limit: 50                   # Active
  ~category: Electronics      # Disabled
}
```

### Request Sequence

Each request has a `seq` number. Bruno displays them in order.

### Documentation

Each request has a `docs` section. Open the request for detailed explanations.

## 📊 Features

### Automatic Operations

- ✅ Stock automatically decreases when order is created
- ✅ Stock automatically restores when order is cancelled
- ✅ Total amounts are calculated automatically
- ✅ Order number is generated automatically (ORD2025000001)

### Workflows

**Order Status:**

```text
draft → confirmed → processing → shipped → delivered
           ↓
       cancelled (anytime, except delivered)
```

**Payment Status:**

```text
pending → partial → paid → refunded
```

## 🔍 Filter Examples

### Products

- By category: `?category=Electronics`
- Price range: `?min_price=100&max_price=500`
- Low stock: `?low_stock=true`
- Search: `?search=laptop`

### Orders

- By status: `?status=confirmed`
- Payment status: `?payment_status=paid`
- Date range: `?start_date=2025-10-01&end_date=2025-10-31`
- By customer: `?customer_id=1`

### Customers

- By city: `?city=Istanbul`
- By segment: `?segment=Premium`
- Search: `?search=acme`

## 🛠️ Troubleshooting

### 401 Unauthorized

- Make sure the token is correct
- Token expires in 15 minutes, login again
- Check if token variable is set in environment

### 404 Not Found

- Check if backend server is running
- Verify port number matches backend (run `npm run sync:bruno` if needed)
- Verify endpoint URL is correct

### ECONNREFUSED

- Start backend server: `npm start` or `npm run dev:backend`
- Check if correct port is being used
- **Run `npm run sync:bruno`** to ensure Bruno uses the correct port
- Check if port is used by another application

## 📚 More Information

- **API Documentation**: `apps/backend/docs/ORDERS_API_GUIDE.md`
- **Database Schema**: `apps/backend/docs/DATABASE.md`

---

**🎉 You're ready!** Start testing your API with Bruno! 🚀
