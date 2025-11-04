/**
 * API Client using Axios
 * Simple and clean API wrapper
 */

import axios, { AxiosError } from 'axios';

// Get base URL from environment variable
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:8765/api/v1';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Request interceptor to ensure organization header is always set
apiClient.interceptors.request.use(
  config => {
    // Ensure X-Organization-ID header is present for every request
    // This reads from localStorage to get the current organization
    // Only access localStorage in browser environment
    if (globalThis.window !== undefined) {
      const storedOrgId = localStorage.getItem('centura_selected_org_id');

      // Always set the header from localStorage if available
      // This ensures every request has the current organization context
      if (storedOrgId) {
        // Support both old and new Axios header methods
        if (config.headers.set) {
          config.headers.set('X-Organization-ID', storedOrgId);
        } else {
          config.headers['X-Organization-ID'] = storedOrgId;
        }
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

// Track if we're currently refreshing to prevent multiple refresh calls
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null = null) => {
  for (const prom of failedQueue) {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  }

  failedQueue = [];
};

// Response interceptor for error handling and automatic token refresh
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<{ error?: string; message?: string }>) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    // Extract error message from response
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred';

    // If we get a 401 and haven't retried yet, try to refresh the token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== API_ENDPOINTS.AUTH.REFRESH_TOKEN &&
      originalRequest.url !== API_ENDPOINTS.AUTH.LOGIN
    ) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch(err => {
            throw err;
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        await apiClient.post(API_ENDPOINTS.AUTH.REFRESH_TOKEN);

        // Token refreshed successfully
        processQueue(null);
        isRefreshing = false;

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear queue and redirect to login
        processQueue(new Error('Session expired'));
        isRefreshing = false;

        // Only redirect if we're in the browser
        if (globalThis.window !== undefined) {
          // Clear local storage
          localStorage.removeItem('centura_selected_org_id');

          // Redirect to login page
          globalThis.window.location.href = '/auth/login';
        }

        throw refreshError;
      }
    }

    // For other errors, just reject with the message
    throw new Error(message);
  }
);

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh-token',
  },
  ORGANIZATIONS: {
    LIST: '/organizations',
    CREATE: '/organizations',
    GET: (id: string) => `/organizations/${id}`,
    UPDATE: (id: string) => `/organizations/${id}`,
    DELETE: (id: string) => `/organizations/${id}`,
  },
  ORDERS: {
    LIST: '/orders',
    CREATE: '/orders',
    GET: (id: string) => `/orders/${id}`,
    UPDATE_STATUS: (id: string) => `/orders/${id}/status`,
    UPDATE_PAYMENT: (id: string) => `/orders/${id}/payment`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
    DELETE: (id: string) => `/orders/${id}`,
    STATISTICS: '/orders/statistics',
    TOP_PRODUCTS: '/orders/top-products',
    CUSTOMER_ORDERS: (customerId: string) => `/orders/customer/${customerId}`,
  },
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    GET: (id: string) => `/customers/${id}`,
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
  },
  PRODUCTS: {
    LIST: '/products',
    CREATE: '/products',
    GET: (id: string) => `/products/${id}`,
    UPDATE: (id: string) => `/products/${id}`,
    DELETE: (id: string) => `/products/${id}`,
    LOW_STOCK: '/products/low-stock',
    UPDATE_STOCK: (id: string) => `/products/${id}/stock`,
  },
  SETTINGS: {
    PROFILE: '/settings/profile',
    PASSWORD: '/settings/password',
    ORGANIZATION: (orgId: string) => `/settings/organization/${orgId}`,
    ORGANIZATION_TEAM: (orgId: string) =>
      `/settings/organization/${orgId}/users`,
    UPDATE_USER_ROLE: (orgId: string, userId: string) =>
      `/settings/organization/${orgId}/users/${userId}/role`,
    UPDATE_USER_STATUS: (orgId: string, userId: string) =>
      `/settings/organization/${orgId}/users/${userId}/status`,
    REMOVE_USER: (orgId: string, userId: string) =>
      `/settings/organization/${orgId}/users/${userId}`,
  },
  // Add more endpoints as needed
} as const;

// ============================================
// ORDER API FUNCTIONS
// ============================================

export interface OrderItem {
  product_id: number;
  quantity: number;
  unit_price?: number;
  tax_rate?: number;
  discount_amount?: number;
}

export interface CreateOrderData {
  customer_id: number;
  items: OrderItem[];
  order_date?: string;
  expected_delivery_date?: string;
  status?:
    | 'draft'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  payment_method?: string;
  shipping_address?: string;
  shipping_city?: string;
  billing_address?: string;
  billing_city?: string;
  discount_percentage?: number;
  discount_amount?: number;
  notes?: string;
}

export interface OrderFilters {
  status?: string;
  payment_status?: string;
  customer_id?: number;
  start_date?: string;
  end_date?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface Order {
  id: number;
  org_id: number;
  customer_id: number;
  customer_name?: string;
  order_number: string;
  order_date: string;
  expected_delivery_date?: string;
  status:
    | 'draft'
    | 'confirmed'
    | 'processing'
    | 'shipped'
    | 'delivered'
    | 'cancelled';
  payment_status: 'pending' | 'partial' | 'paid' | 'refunded';
  payment_method?: string;
  paid_amount: number;
  shipping_address?: string;
  shipping_city?: string;
  billing_address?: string;
  billing_city?: string;
  subtotal: number;
  discount_percentage: number;
  discount_amount: number;
  tax_amount: number;
  total: number;
  notes?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  items?: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: number;
  order_id: number;
  product_id: number;
  product_name?: string;
  product_sku?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  discount_amount: number;
  subtotal: number;
  tax_amount: number;
  total: number;
  created_at: string;
}

/**
 * Get all orders with optional filters and pagination
 */
export const getOrders = async (filters?: OrderFilters) => {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.payment_status)
    params.append('payment_status', filters.payment_status);
  if (filters?.customer_id)
    params.append('customer_id', filters.customer_id.toString());
  if (filters?.start_date) params.append('start_date', filters.start_date);
  if (filters?.end_date) params.append('end_date', filters.end_date);
  if (filters?.search) params.append('search', filters.search);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `${API_ENDPOINTS.ORDERS.LIST}?${queryString}`
    : API_ENDPOINTS.ORDERS.LIST;
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Get order by ID
 */
export const getOrderById = async (id: string | number) => {
  const response = await apiClient.get(API_ENDPOINTS.ORDERS.GET(id.toString()));
  return response.data;
};

/**
 * Create new order
 */
export const createOrder = async (data: CreateOrderData) => {
  const response = await apiClient.post(API_ENDPOINTS.ORDERS.CREATE, data);
  return response.data;
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  id: string | number,
  status: string
) => {
  const response = await apiClient.patch(
    API_ENDPOINTS.ORDERS.UPDATE_STATUS(id.toString()),
    { status }
  );
  return response.data;
};

/**
 * Update order (full update)
 */
export interface UpdateOrderData {
  status?: string;
  payment_status?: string;
  paid_amount?: number;
  notes?: string;
  items?: Array<{
    product_id: number;
    quantity: number;
  }>;
}

export const updateOrder = async (
  id: string | number,
  data: UpdateOrderData
) => {
  const response = await apiClient.put(`/orders/${id.toString()}`, data);
  return response.data;
};

/**
 * Update payment status
 */
export const updatePaymentStatus = async (
  id: string | number,
  payment_status: string,
  paid_amount?: number
) => {
  const response = await apiClient.patch(
    API_ENDPOINTS.ORDERS.UPDATE_PAYMENT(id.toString()),
    {
      payment_status,
      paid_amount,
    }
  );
  return response.data;
};

/**
 * Cancel order
 */
export const cancelOrder = async (id: string | number) => {
  const response = await apiClient.patch(
    API_ENDPOINTS.ORDERS.CANCEL(id.toString())
  );
  return response.data;
};

/**
 * Delete order
 */
export const deleteOrder = async (id: string | number) => {
  const response = await apiClient.delete(
    API_ENDPOINTS.ORDERS.DELETE(id.toString())
  );
  return response.data;
};

/**
 * Get order statistics
 */
export const getOrderStatistics = async (
  start_date?: string,
  end_date?: string
) => {
  const params = new URLSearchParams();
  if (start_date) params.append('start_date', start_date);
  if (end_date) params.append('end_date', end_date);

  const queryString = params.toString();
  const url = queryString
    ? `${API_ENDPOINTS.ORDERS.STATISTICS}?${queryString}`
    : API_ENDPOINTS.ORDERS.STATISTICS;
  const response = await apiClient.get(url);
  return response.data;
};

// ============================================
// CUSTOMER API FUNCTIONS
// ============================================

export interface Customer {
  customer_id: number;
  org_id: number;
  customer_code: string;
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  country?: string;
  address?: string;
  postal_code?: string;
  tax_number?: string;
  tax_office?: string;
  segment?: 'VIP' | 'Premium' | 'Standard' | 'Basic' | 'Potential';
  customer_type?: 'Corporate' | 'Individual' | 'Government' | 'Other';
  payment_terms?: number;
  credit_limit?: number;
  is_active: boolean;
  notes?: string;
  assigned_user_id?: number;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all customers
 */
export const getCustomers = async (filters?: {
  search?: string;
  segment?: string;
  customer_type?: string;
  is_active?: boolean;
  city?: string;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.segment) params.append('segment', filters.segment);
  if (filters?.customer_type)
    params.append('customer_type', filters.customer_type);
  if (filters?.is_active !== undefined)
    params.append('is_active', filters.is_active.toString());
  if (filters?.city) params.append('city', filters.city);
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `${API_ENDPOINTS.CUSTOMERS.LIST}?${queryString}`
    : API_ENDPOINTS.CUSTOMERS.LIST;
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Get customer by ID
 */
export const getCustomerById = async (id: string | number) => {
  const response = await apiClient.get(
    API_ENDPOINTS.CUSTOMERS.GET(id.toString())
  );
  return response.data;
};

/**
 * Create new customer
 */
export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  country?: string;
  address?: string;
  postal_code?: string;
  tax_number?: string;
  tax_office?: string;
  segment?: 'VIP' | 'Premium' | 'Standard' | 'Basic' | 'Potential';
  customer_type?: 'Corporate' | 'Individual' | 'Government' | 'Other';
  payment_terms?: number;
  credit_limit?: number;
  is_active?: boolean;
  notes?: string;
}

export const createCustomer = async (data: CreateCustomerData) => {
  const response = await apiClient.post(API_ENDPOINTS.CUSTOMERS.CREATE, data);
  return response.data;
};

/**
 * Update customer
 */
export interface UpdateCustomerData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  postal_code?: string | null;
  tax_number?: string | null;
  tax_office?: string | null;
  segment?: 'VIP' | 'Premium' | 'Standard' | 'Basic' | 'Potential';
  customer_type?: 'Corporate' | 'Individual' | 'Government' | 'Other';
  payment_terms?: number | null;
  credit_limit?: number | null;
  is_active?: boolean;
  notes?: string | null;
}

export const updateCustomer = async (
  id: string | number,
  data: UpdateCustomerData
) => {
  const response = await apiClient.put(
    API_ENDPOINTS.CUSTOMERS.UPDATE(id.toString()),
    data
  );
  return response.data;
};

/**
 * Delete customer
 */
export const deleteCustomer = async (id: string | number) => {
  const response = await apiClient.delete(
    API_ENDPOINTS.CUSTOMERS.DELETE(id.toString())
  );
  return response.data;
};

// ============================================
// PRODUCT API FUNCTIONS
// ============================================

export interface Product {
  id: number;
  org_id: number;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  base_price: number; // KDV hariç satış fiyatı (Base price excluding VAT)
  price: number; // KDV dahil satış fiyatı - müşterinin ödeyeceği (Price including VAT)
  cost_price?: number; // Tedarikçiden alış maliyeti - kar hesabı için (Supplier cost for profit calculation)
  tax_rate: number; // KDV oranı % (VAT rate percentage)
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  is_active: boolean;
  created_by?: number;
  created_at: string;
  updated_at: string;
}

/**
 * Get all products
 */
export const getProducts = async (filters?: {
  search?: string;
  category?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.search) params.append('search', filters.search);
  if (filters?.category) params.append('category', filters.category);
  if (filters?.is_active !== undefined)
    params.append('is_active', filters.is_active.toString());
  if (filters?.page) params.append('page', filters.page.toString());
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  const url = queryString
    ? `${API_ENDPOINTS.PRODUCTS.LIST}?${queryString}`
    : API_ENDPOINTS.PRODUCTS.LIST;
  const response = await apiClient.get(url);
  return response.data;
};

/**
 * Create a new product
 */
export const createProduct = async (data: {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  base_price: number; // KDV hariç satış fiyatı
  cost_price?: number; // Tedarikçi maliyeti
  tax_rate: number; // KDV oranı
  stock_quantity: number;
  low_stock_threshold: number;
  unit: string;
  is_active: boolean;
}) => {
  const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.CREATE, data);
  return response.data;
};

/**
 * Update a product
 */
export const updateProduct = async (
  id: number,
  data: {
    name?: string;
    description?: string;
    sku?: string;
    barcode?: string;
    category?: string;
    base_price?: number; // KDV hariç satış fiyatı
    cost_price?: number; // Tedarikçi maliyeti
    tax_rate?: number; // KDV oranı
    stock_quantity?: number;
    low_stock_threshold?: number;
    unit?: string;
    is_active?: boolean;
  }
) => {
  const response = await apiClient.put(
    API_ENDPOINTS.PRODUCTS.UPDATE(id.toString()),
    data
  );
  return response.data;
};

/**
 * Delete a product
 */
export const deleteProduct = async (id: number) => {
  const response = await apiClient.delete(
    API_ENDPOINTS.PRODUCTS.DELETE(id.toString())
  );
  return response.data;
};

/**
 * Get a single product by ID
 */
export const getProduct = async (id: number) => {
  const response = await apiClient.get(
    API_ENDPOINTS.PRODUCTS.GET(id.toString())
  );
  return response.data;
};

/**
 * Update product stock
 */
export const updateProductStock = async (
  id: number,
  data: {
    operation: 'add' | 'subtract' | 'set';
    quantity: number;
    reason?: string;
  }
) => {
  const response = await apiClient.patch(
    API_ENDPOINTS.PRODUCTS.UPDATE_STOCK(id.toString()),
    data
  );
  return response.data;
};

/**
 * Get low stock products
 */
export const getLowStockProducts = async () => {
  const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.LOW_STOCK);
  return response.data;
};

/**
 * ===========================================
 * INSIGHTS API
 * ===========================================
 */

export interface RevenueMetrics {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  averageOrderValue: number;
}

/**
 * Get comprehensive insights dashboard data
 */
export const getInsights = async () => {
  const response = await apiClient.get('/insights');
  return response.data;
};

export const getRevenueMetrics = async (): Promise<RevenueMetrics> => {
  const response = await apiClient.get('/insights/revenue/metrics');
  return response.data.data;
};
