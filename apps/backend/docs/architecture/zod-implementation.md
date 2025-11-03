# Zod Validation Implementation

This document explains the Zod validation implementation in the frontend application.

## Overview

Zod is a TypeScript-first schema validation library that provides:

- Type-safe form validation
- Runtime validation
- Type inference from schemas
- Excellent TypeScript integration

## Installation

Zod is already installed in this project:

```json
"zod": "^4.1.12"
```

## Project Structure

```
lib/
├── validations/
│   ├── auth.schema.ts          # Authentication schemas
│   ├── organization.schema.ts  # Organization schemas
│   ├── product.schema.ts       # Product schemas
│   ├── customer.schema.ts      # Customer schemas
│   ├── order.schema.ts         # Order schemas
│   ├── form-validation.ts      # Validation utilities
│   └── index.ts                # Central export
```

## Available Schemas

### 1. Authentication (`auth.schema.ts`)

#### Login Schema

```typescript
import { loginSchema, type LoginFormData } from '@/lib/validations';

// Validates:
// - email: Required, valid email format
// - password: Required, min 8 characters
```

#### Signup Schema

```typescript
import { signupSchema, type SignupFormData } from '@/lib/validations';

// Validates:
// - name: Required, 2-100 characters
// - email: Required, valid email format
// - password: Required, min 8 chars, must contain uppercase, lowercase, and number
// - confirmPassword: Must match password
```

### 2. Organization (`organization.schema.ts`)

```typescript
import {
  createOrganizationSchema,
  updateOrganizationSchema,
  type CreateOrganizationFormData,
  type Organization,
} from '@/lib/validations';

// Validates organization data with optional fields like website, description, industry
```

### 3. Product (`product.schema.ts`)

```typescript
import {
  createProductSchema,
  updateProductSchema,
  updateStockSchema,
  type CreateProductFormData,
  type Product,
} from '@/lib/validations';

// Validates:
// - name, description, category
// - price: Positive number, min 0.01
// - stockQuantity: Non-negative integer
// - SKU, barcode (optional)
```

### 4. Customer (`customer.schema.ts`)

```typescript
import {
  createCustomerSchema,
  updateCustomerSchema,
  type CreateCustomerFormData,
  type Customer,
} from '@/lib/validations';

// Validates customer information including contact details and address
```

### 5. Order (`order.schema.ts`)

```typescript
import {
  createOrderSchema,
  updateOrderSchema,
  type CreateOrderFormData,
  type OrderItem,
  type OrderStatus,
} from '@/lib/validations';

// Validates orders with items, status, payment info
```

## Usage Examples

### Basic Form Validation

```typescript
import { validateForm } from '@/lib/validations/form-validation';
import { loginSchema, type LoginFormData } from '@/lib/validations';

const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const formData = new FormData(e.currentTarget);
  const data: LoginFormData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // Validate with Zod
  const validation = validateForm(loginSchema, data);

  if (!validation.success) {
    // Handle validation errors
    setErrors(validation.errors);
    toast.error('Please fix form errors');
    return;
  }

  // Use validated data (type-safe!)
  await apiClient.post('/auth/login', validation.data);
};
```

### Displaying Validation Errors

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});

// In your JSX
<Input
  id='email'
  name='email'
  type='email'
  className={errors.email ? 'border-red-500' : ''}
/>
{errors.email && (
  <p className='text-sm text-red-500'>{errors.email}</p>
)}
```

### Field-Level Validation

```typescript
import { validateField } from '@/lib/validations/form-validation';
import { signupSchema } from '@/lib/validations';

const handleBlur = (fieldName: string, value: unknown) => {
  const error = validateField(signupSchema, fieldName, value);
  if (error) {
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  } else {
    setErrors(prev => {
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
  }
};
```

### Type Inference

Zod automatically infers TypeScript types from schemas:

```typescript
import { z } from 'zod';

const userSchema = z.object({
  name: z.string(),
  age: z.number(),
});

// Automatically typed as { name: string; age: number }
type User = z.infer<typeof userSchema>;
```

## Validation Utilities

### `validateForm(schema, data)`

Validates entire form data and returns either success with data or errors.

```typescript
const result = validateForm(loginSchema, formData);
if (result.success) {
  // result.data is typed and validated
} else {
  // result.errors contains field-specific error messages
}
```

### `validateField(schema, fieldName, value)`

Validates a single field and returns error message or null.

```typescript
const error = validateField(signupSchema, 'email', 'test@example.com');
// Returns: null (valid) or string (error message)
```

### `getErrorMessages(zodError)`

Converts Zod errors to a friendly format.

```typescript
try {
  schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    const errors = getErrorMessages(error);
    // { email: "Invalid email", password: "Too short" }
  }
}
```

## Best Practices

### 1. **Keep Schemas Close to Components**

Schemas are in `lib/validations` for easy import across components.

### 2. **Use Type Inference**

Always use `z.infer<typeof schema>` for TypeScript types:

```typescript
type FormData = z.infer<typeof mySchema>;
```

### 3. **Validate Early**

Validate on form submit and optionally on blur for better UX.

### 4. **Custom Error Messages**

All schemas include Turkish error messages for better user experience:

```typescript
z.string().min(8, 'Şifre en az 8 karakter olmalıdır');
```

### 5. **Partial Schemas for Updates**

Use `.partial()` for update schemas:

```typescript
const updateSchema = createSchema.partial();
```

### 6. **Schema Refinement**

Use `.refine()` for complex validations:

```typescript
.refine(data => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})
```

## Common Validation Patterns

### Email Validation

```typescript
z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Valid email required');
```

### Phone Validation

```typescript
z.string().regex(/^[\d\s()+-]+$/, 'Valid phone number required');
```

### Price Validation

```typescript
z.number()
  .positive('Price must be positive')
  .min(0.01, 'Minimum price is 0.01');
```

### Optional Fields

```typescript
z.string().optional();
// or
z.string().optional().or(z.literal(''));
```

### Arrays

```typescript
z.array(itemSchema)
  .min(1, 'At least one item required')
  .max(100, 'Maximum 100 items allowed');
```

### Enums

```typescript
const statusSchema = z.enum(['pending', 'active', 'completed']);
type Status = z.infer<typeof statusSchema>;
```

## Integration with React Hook Form (Future)

For more complex forms, consider integrating with `react-hook-form`:

```bash
npm install react-hook-form @hookform/resolvers
```

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const {
  register,
  handleSubmit,
  formState: { errors },
} = useForm({
  resolver: zodResolver(loginSchema),
});
```

## Error Handling

### Form-Level Errors

```typescript
if (!validation.success) {
  setErrors(validation.errors);
  // Display toast or general error message
}
```

### Field-Level Errors

```typescript
{errors.fieldName && (
  <p className='text-sm text-red-500'>{errors.fieldName}</p>
)}
```

### API Response Validation (Optional)

```typescript
import { authResponseSchema } from '@/lib/validations';

const response = await apiClient.post('/auth/login', data);
const validatedResponse = authResponseSchema.parse(response.data);
```

## Testing Schemas

```typescript
import { describe, it, expect } from 'vitest';
import { loginSchema } from '@/lib/validations';

describe('loginSchema', () => {
  it('should validate correct data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });
});
```

## Migration Notes

### Zod v4 Changes

This project uses Zod v4, which has some API changes from v3:

- `.email()` → `.regex(/email-pattern/)`
- `.datetime()` → `.string()`
- `error.errors` → `error.issues`
- `required_error` → `message` in number params

## Resources

- [Zod Documentation](https://zod.dev)
- [Zod GitHub](https://github.com/colinhacks/zod)
- [React Hook Form + Zod](https://react-hook-form.com/get-started#SchemaValidation)

## Next Steps

1. Add more schemas as needed (e.g., reports, analytics)
2. Consider integrating react-hook-form for complex forms
3. Add unit tests for schemas
4. Implement API response validation for type safety
5. Add custom error messages for better UX
