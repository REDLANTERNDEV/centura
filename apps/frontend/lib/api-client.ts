/**
 * API Client using Axios
 * Simple and clean API wrapper
 */

import axios, { AxiosError } from 'axios';

// Get base URL from environment variable
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4974/api/v1';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for authentication
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  (error: AxiosError<{ error?: string; message?: string }>) => {
    // Extract error message from response
    // Backend sends: { "error": "Invalid credentials" }
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred';

    // You can add global error handling here
    // For example: refresh token logic, redirect to login, etc.

    return Promise.reject(new Error(message));
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
  // Add more endpoints as needed
} as const;
