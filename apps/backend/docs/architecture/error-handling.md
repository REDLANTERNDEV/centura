# Error Handling with Toast Notifications

## Backend Error Format

Your backend responds with errors in this format:

```json
{
  "error": "Invalid credentials"
}
```

## How It Works

### 1. **API Client Interceptor** (`lib/api-client.ts`)

The axios interceptor now checks for both `error` and `message` fields:

```typescript
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    // Extract error message from response
    const message =
      error.response?.data?.error || // ✅ Checks "error" field first
      error.response?.data?.message || // Fallback to "message" field
      error.message || // Fallback to axios error
      'An error occurred'; // Final fallback

    return Promise.reject(new Error(message));
  }
);
```

### 2. **Toast Display** (Login/Signup Pages)

The error is caught and displayed in a toast:

```typescript
try {
  await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  toast.success('Giriş başarılı!');
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Giriş başarısız oldu';
  toast.error(message); // ✅ Shows "Invalid credentials" from backend
}
```

## Examples

### Backend Response Examples

**Invalid Credentials:**

```json
{
  "error": "Invalid credentials"
}
```

→ Toast shows: **"Invalid credentials"**

**Email Already Exists:**

```json
{
  "error": "Email already exists"
}
```

→ Toast shows: **"Email already exists"**

**Validation Error:**

```json
{
  "error": "Password must be at least 6 characters"
}
```

→ Toast shows: **"Password must be at least 6 characters"**

## Supported Error Formats

The interceptor supports multiple backend error formats:

1. `{ "error": "message" }` ✅ (Your format)
2. `{ "message": "message" }` ✅ (Alternative format)
3. Network errors ✅ (Shows axios error message)

## Testing

To test the error handling:

1. **Try wrong credentials:**
   - Email: `test@test.com`
   - Password: `wrongpassword`
   - Should show: "Invalid credentials" toast

2. **Try existing email (signup):**
   - Should show: "Email already exists" toast

3. **Network error (backend offline):**
   - Should show: "Network Error" or similar toast

## Customizing Toast Position/Duration

To customize toast appearance, edit the `<Toaster />` in `app/layout.tsx`:

```typescript
<Toaster
  position="top-right"     // Position: top-left, top-center, top-right, etc.
  duration={4000}          // Duration in ms
  richColors               // Colorful toasts
  closeButton              // Add close button
/>
```

## All Done! ✅

Your toast notifications now correctly display backend error messages:

- ✅ Shows `error` field from backend
- ✅ Fallback to `message` field if `error` doesn't exist
- ✅ Clean error handling
- ✅ User-friendly notifications
