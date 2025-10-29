/**
 * Customer Validation Schemas
 * Using Zod for type-safe form validation
 */

import { z } from 'zod';

// Create Customer Schema
export const createCustomerSchema = z.object({
  name: z
    .string()
    .min(1, 'Müşteri adı gereklidir')
    .min(2, 'Müşteri adı en az 2 karakter olmalıdır')
    .max(100, 'Müşteri adı en fazla 100 karakter olabilir'),
  email: z
    .string()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Geçerli bir e-posta adresi giriniz')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(/^[\d\s()+-]+$/, 'Geçerli bir telefon numarası giriniz')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'Adres en fazla 500 karakter olabilir')
    .optional(),
  city: z.string().max(100, 'Şehir en fazla 100 karakter olabilir').optional(),
  country: z
    .string()
    .max(100, 'Ülke en fazla 100 karakter olabilir')
    .optional(),
  postalCode: z
    .string()
    .max(20, 'Posta kodu en fazla 20 karakter olabilir')
    .optional(),
  notes: z
    .string()
    .max(1000, 'Notlar en fazla 1000 karakter olabilir')
    .optional(),
});

// Update Customer Schema
export const updateCustomerSchema = createCustomerSchema.partial();

// Type inference
export type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;

// API Response Schema
export const customerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  organizationId: z.string(),
});

export type Customer = z.infer<typeof customerSchema>;
