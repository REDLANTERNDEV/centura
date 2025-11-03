# Zod Quick Reference Card

## 🚀 Quick Start

### Import Schema

```typescript
import { loginSchema, type LoginFormData } from '@/lib/validations';
```

### Validate Form

```typescript
const validation = validateForm(loginSchema, formData);
if (!validation.success) {
  setErrors(validation.errors);
  return;
}
// Use validation.data (type-safe!)
```

## 📝 Common Patterns

### String Validation

```typescript
z.string()
  .min(1, 'Required field')
  .min(2, 'Min 2 chars')
  .max(100, 'Max 100 chars')
  .regex(/pattern/, 'Invalid format');
```

### Number Validation

```typescript
z.number({ message: 'Valid number required' })
  .int('Must be integer')
  .positive('Must be positive')
  .nonnegative('Cannot be negative')
  .min(0.01, 'Min value')
  .max(100, 'Max value');
```

### Email Validation

```typescript
z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Valid email required');
```

### Optional Fields

```typescript
z.string().optional();
// or allow empty string
z.string().optional().or(z.literal(''));
```

### Arrays

```typescript
z.array(itemSchema).min(1, 'At least one item').max(100, 'Max 100 items');
```

### Enums

```typescript
z.enum(['option1', 'option2', 'option3']);
```

### Custom Validation

```typescript
.refine(data => data.password === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})
```

## 🎯 Form Integration

### State Setup

```typescript
const [errors, setErrors] = useState<Record<string, string>>({});
const [isLoading, setIsLoading] = useState(false);
```

### Form Handler

```typescript
const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setIsLoading(true);
  setErrors({});

  const formData = new FormData(e.currentTarget);
  const data = {
    field1: formData.get('field1') as string,
    field2: Number.parseInt(formData.get('field2') as string),
  };

  const validation = validateForm(mySchema, data);

  if (!validation.success) {
    setErrors(validation.errors);
    setIsLoading(false);
    toast.error('Please fix errors');
    return;
  }

  try {
    await apiClient.post('/endpoint', validation.data);
    toast.success('Success!');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setIsLoading(false);
  }
};
```

### JSX Template

```typescript
<Input
  name='fieldName'
  className={errors.fieldName ? 'border-red-500' : ''}
/>
{errors.fieldName && (
  <p className='text-sm text-red-500'>{errors.fieldName}</p>
)}
```

## 📦 Available Schemas

| Schema                     | Import              | Use Case         |
| -------------------------- | ------------------- | ---------------- |
| `loginSchema`              | `@/lib/validations` | Login form       |
| `signupSchema`             | `@/lib/validations` | Registration     |
| `createProductSchema`      | `@/lib/validations` | Add product      |
| `updateProductSchema`      | `@/lib/validations` | Edit product     |
| `createCustomerSchema`     | `@/lib/validations` | Add customer     |
| `createOrderSchema`        | `@/lib/validations` | Create order     |
| `createOrganizationSchema` | `@/lib/validations` | New organization |

## 🔧 Utilities

### validateForm(schema, data)

```typescript
const result = validateForm(loginSchema, data);
// Returns: { success: true, data } or { success: false, errors }
```

### validateField(schema, field, value)

```typescript
const error = validateField(signupSchema, 'email', value);
// Returns: string | null
```

### Type Inference

```typescript
type FormData = z.infer<typeof mySchema>;
```

## ⚡ Common Use Cases

### Login Form

```typescript
import { loginSchema, type LoginFormData } from '@/lib/validations';
// Fields: email, password
```

### Signup Form

```typescript
import { signupSchema, type SignupFormData } from '@/lib/validations';
// Fields: name, email, password, confirmPassword
```

### Product Form

```typescript
import {
  createProductSchema,
  type CreateProductFormData,
} from '@/lib/validations';
// Fields: name, price, stockQuantity, category, etc.
```

### Customer Form

```typescript
import {
  createCustomerSchema,
  type CreateCustomerFormData,
} from '@/lib/validations';
// Fields: name, email, phone, address, etc.
```

## 💡 Tips

1. **Parse Numbers**: Always parse string inputs to numbers

   ```typescript
   Number.parseInt(value, 10);
   Number.parseFloat(value);
   ```

2. **Handle Empty Strings**: Use `.optional().or(z.literal(''))`
3. **Error State**: Clear errors on form submit start

   ```typescript
   setErrors({});
   ```

4. **Loading State**: Prevent multiple submissions

   ```typescript
   disabled = { isLoading };
   ```

5. **Toast Feedback**: Always show user feedback
   ```typescript
   toast.error('Please fix errors');
   toast.success('Success!');
   ```

## 🐛 Troubleshooting

### Problem: "Type error" on schema

**Solution**: Import the type using `z.infer<typeof schema>`

### Problem: Empty string not validating as optional

**Solution**: Use `.optional().or(z.literal(''))`

### Problem: Number validation fails

**Solution**: Parse string to number before validation

### Problem: Errors not displaying

**Solution**: Check error key matches input name

## 📚 Documentation

- Full Guide: `ZOD_IMPLEMENTATION.md`
- Summary: `ZOD_SUMMARY.md`
- Example: `components/examples/CreateProductForm.example.tsx`
