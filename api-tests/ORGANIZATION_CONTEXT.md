# 🔐 Organization Context in API Tests

## **Important: Multi-Tenant Security Update**

All organization-scoped endpoints now **require** the `X-Organization-ID` header for security.

---

## **How to Test Organization-Scoped Endpoints**

### **Step 1: Login First**

```http
POST http://localhost:4974/api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Result:** Access token saved in HTTP-only cookie (automatically sent with subsequent requests)

---

### **Step 2: Get Your Organizations**

```http
GET http://localhost:4974/api/v1/organizations
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "org_id": 2,
      "org_name": "Acme Corporation",
      "role": "org_owner",
      "org_active": true
    }
  ]
}
```

**Copy the `org_id`** (e.g., `2`) from the response.

---

### **Step 3: Use Organization Header in Requests**

All organization-scoped endpoints now require:

```http
GET http://localhost:4974/api/v1/products
X-Organization-ID: 2
```

---

## **Endpoints That Require X-Organization-ID Header**

### ✅ **Required (Organization-Scoped Data)**

- **Products**
  - `GET /products` ← Get products from specific org
  - `POST /products` ← Create product in specific org
  - `PUT /products/:id`
  - `DELETE /products/:id`

- **Orders**
  - `GET /orders`
  - `POST /orders`
  - `PUT /orders/:id`
  - `DELETE /orders/:id`

- **Customers**
  - `GET /customers`
  - `POST /customers`
  - `PUT /customers/:id`
  - `DELETE /customers/:id`

- **Insights/Analytics**
  - `GET /insights/*`
  - `GET /analytics/*`

### ❌ **NOT Required (User-Level Operations)**

- **Auth**
  - `POST /auth/login` ← No org context needed
  - `POST /auth/signup`
  - `POST /auth/logout`

- **Organizations**
  - `GET /organizations` ← Lists user's orgs
  - `POST /organizations` ← Create new org
  - `GET /organizations/:id` ← Get specific org

---

## **Bruno Configuration**

### **Option 1: Set Header Per Request**

In each `.bru` file:

```plaintext
headers {
  X-Organization-ID: 2
}
```

### **Option 2: Use Bruno Environment Variables**

1. Open Bruno environment settings
2. Add variable:
   - Name: `orgId`
   - Value: `2`

3. Use in requests:

```plaintext
headers {
  X-Organization-ID: {{orgId}}
}
```

### **Option 3: Collection-Level Header (Recommended)**

In `bruno.json`:

```json
{
  "headers": {
    "X-Organization-ID": "2"
  }
}
```

This applies to ALL requests automatically.

---

## **Security Validation**

### **What Backend Checks:**

When you send `X-Organization-ID: 2`, the backend validates:

1. ✅ **User is authenticated** (JWT cookie valid)
2. ✅ **User has access to org 2** (checks `user_organization_roles` table)
3. ✅ **User's role is active** (`role_active = true`)
4. ✅ **Organization is active** (`org_active = true`)
5. ✅ **Returns data from org 2 ONLY**

### **Example Validation Flow:**

```
Request: GET /products
Headers: X-Organization-ID: 2

Backend:
  ↓
1. Check JWT → User ID 123 ✓
  ↓
2. Check user_organization_roles
   WHERE user_id = 123 AND org_id = 2
   → Found: role = "org_admin" ✓
  ↓
3. Query: SELECT * FROM products
   WHERE organization_id = 2
  ↓
Response: Products from Org 2 only
```

---

## **Error Responses**

### **Missing Header**

```http
GET /products
```

```json
{
  "success": false,
  "message": "Organization context is required. Please select an organization.",
  "code": "ORG_CONTEXT_REQUIRED"
}
```

### **Invalid Organization ID**

```http
GET /products
X-Organization-ID: abc
```

```json
{
  "success": false,
  "message": "Invalid organization ID format",
  "code": "INVALID_ORG_ID"
}
```

### **No Access to Organization**

```http
GET /products
X-Organization-ID: 999
```

```json
{
  "success": false,
  "message": "Access denied. You do not have access to this organization.",
  "code": "ORG_ACCESS_DENIED"
}
```

---

## **Updated Examples**

### **Example 1: Get Products**

```http
GET http://localhost:4974/api/v1/products?page=1&limit=50
X-Organization-ID: 2
```

### **Example 2: Create Product**

```http
POST http://localhost:4974/api/v1/products
Content-Type: application/json
X-Organization-ID: 2

{
  "name": "Laptop",
  "sku": "LAPTOP001",
  "price": 999.99,
  "stock_quantity": 10
}
```

### **Example 3: Get Orders**

```http
GET http://localhost:4974/api/v1/orders
X-Organization-ID: 2
```

---

## **Migration Checklist**

For all existing API tests:

1. ✅ Update `Create Organization.bru` - Use cookie auth instead of Bearer
2. ✅ Update `Get All Products.bru` - Add `X-Organization-ID` header
3. ⚠️ Update `Get All Orders.bru` - Add `X-Organization-ID` header
4. ⚠️ Update `Get All Customers.bru` - Add `X-Organization-ID` header
5. ⚠️ Update all Insights endpoints - Add `X-Organization-ID` header

---

## **Quick Start Script**

```bash
# 1. Login
POST /auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

# 2. Get your orgs
GET /organizations

# 3. Copy org_id from response (e.g., 2)

# 4. Set environment variable in Bruno
orgId = 2

# 5. All subsequent requests will include:
# X-Organization-ID: 2
```

---

## **Testing Multiple Organizations**

To test multi-tenant isolation:

1. Create two organizations:

```http
POST /organizations
{ "name": "Org A" }  → org_id: 1

POST /organizations
{ "name": "Org B" }  → org_id: 2
```

2. Create products in each:

```http
POST /products
X-Organization-ID: 1
{ "name": "Product A1" }

POST /products
X-Organization-ID: 2
{ "name": "Product B1" }
```

3. Verify isolation:

```http
GET /products
X-Organization-ID: 1
→ Returns: Product A1 only ✓

GET /products
X-Organization-ID: 2
→ Returns: Product B1 only ✓
```

---

## **Summary**

✅ All organization-scoped endpoints require `X-Organization-ID` header  
✅ Backend validates user has access to that organization  
✅ Data is completely isolated between organizations  
✅ Industry-standard multi-tenant security

Update your Bruno tests to include the header for all product, order, customer, and insights endpoints!
