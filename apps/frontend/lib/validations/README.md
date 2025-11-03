# Validation Schemas

This directory contains all Zod validation schemas for the frontend application.

## 📁 Files

- **`auth.schema.ts`** - Authentication (login, signup)
- **`organization.schema.ts`** - Organization management
- **`product.schema.ts`** - Product CRUD operations
- **`customer.schema.ts`** - Customer management
- **`order.schema.ts`** - Order processing
- **`form-validation.ts`** - Validation utility functions
- **`index.ts`** - Central export point

## 🚀 Quick Start

```typescript
// Import schema and types
import { loginSchema, type LoginFormData } from '@/lib/validations';
import { validateForm } from '@/lib/validations/form-validation';

// Validate data
const validation = validateForm(loginSchema, formData);

if (!validation.success) {
  console.log(validation.errors); // { email: "error message", ... }
  return;
}

// Use validated data (type-safe!)
await apiClient.post('/login', validation.data);
```

## 📝 Available Schemas

### Authentication

- `loginSchema` - Email and password validation
- `signupSchema` - Registration with password strength requirements

### Organization

- `createOrganizationSchema` - Create organization
- `updateOrganizationSchema` - Update organization (partial)

### Product

- `createProductSchema` - Create product
- `updateProductSchema` - Update product (partial)
- `updateStockSchema` - Stock adjustment

### Customer

- `createCustomerSchema` - Create customer
- `updateCustomerSchema` - Update customer (partial)

### Order

- `createOrderSchema` - Create order with items
- `updateOrderSchema` - Update order status
- `orderItemSchema` - Order item validation

## 🔧 Utility Functions

### `validateForm(schema, data)`

Validates form data and returns typed result.

```typescript
const result = validateForm(loginSchema, data);
// Returns: { success: true, data: T } | { success: false, errors: Record<string, string> }
```

### `validateField(schema, fieldName, value)`

Validates a single field.

```typescript
const error = validateField(signupSchema, 'email', 'test@example.com');
// Returns: string | null
```

### `getErrorMessages(zodError)`

Converts Zod error to friendly format.

```typescript
const errors = getErrorMessages(zodError);
// Returns: { email: "Invalid email", ... }
```

## 📚 Documentation

For complete documentation, see:

- **Full Guide**: `../ZOD_IMPLEMENTATION.md`
- **Quick Reference**: `../ZOD_QUICK_REFERENCE.md`
- **Summary**: `../ZOD_SUMMARY.md`
- **Checklist**: `../ZOD_CHECKLIST.md`

## 💡 Example Usage

See `../components/examples/CreateProductForm.example.tsx` for a complete working example.
