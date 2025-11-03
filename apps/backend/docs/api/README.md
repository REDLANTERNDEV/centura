# API Setup

## Quick Start

1. **Install dependencies** (if not already installed):

   ```bash
   npm install
   ```

2. **Set your backend URL** in `.env`:

   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:4974/api/v1
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

## Usage

### Making API Calls

```typescript
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';

// POST request
try {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    email: 'user@example.com',
    password: 'password123',
  });
  console.log(response.data);
} catch (error) {
  console.error(error.message);
}

// GET request
const response = await apiClient.get('/organizations');

// PUT request
await apiClient.put('/organizations/123', { name: 'New Name' });

// DELETE request
await apiClient.delete('/organizations/123');
```

### Adding New Endpoints

Edit `lib/api-client.ts`:

```typescript
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
  },
  // Add your endpoints here
  PRODUCTS: {
    LIST: '/products',
    CREATE: '/products',
  },
} as const;
```

## File Structure

```
apps/frontend/
├── .env                 # Environment variables
├── lib/
│   └── api-client.ts   # Axios instance + endpoints
└── app/
    └── (public)/
        ├── login/page.tsx
        └── signup/page.tsx
```

## Features

✅ **Axios** - Popular HTTP client  
✅ **Auto error handling** - Extracts error messages  
✅ **Cookies included** - withCredentials: true  
✅ **Environment variables** - Easy to change backend URL  
✅ **Toast notifications** - Already integrated

That's it! Simple and clean. 🚀
