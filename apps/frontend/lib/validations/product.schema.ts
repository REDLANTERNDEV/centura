/**
 * Product Validation Schemas
 * Using Zod for type-safe form validation
 */

import { z } from 'zod';

// Product Category Enum
export const productCategorySchema = z.enum([
  'Elektronik',
  'Giyim',
  'Gıda',
  'Mobilya',
  'Kozmetik',
  'Kitap',
  'Spor',
  'Oyuncak',
  'Diğer',
]);

// Create Product Schema
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Ürün adı gereklidir')
    .min(2, 'Ürün adı en az 2 karakter olmalıdır')
    .max(200, 'Ürün adı en fazla 200 karakter olabilir'),
  description: z
    .string()
    .max(1000, 'Açıklama en fazla 1000 karakter olabilir')
    .optional(),
  category: productCategorySchema.optional(),
  price: z
    .number({
      message: 'Geçerli bir fiyat giriniz',
    })
    .positive('Fiyat pozitif bir sayı olmalıdır')
    .min(0.01, 'Minimum fiyat 0.01 olmalıdır'),
  stockQuantity: z
    .number({
      message: 'Geçerli bir stok miktarı giriniz',
    })
    .int('Stok miktarı tam sayı olmalıdır')
    .nonnegative('Stok miktarı negatif olamaz'),
  sku: z
    .string()
    .min(1, 'SKU gereklidir')
    .max(50, 'SKU en fazla 50 karakter olabilir')
    .regex(
      /^[A-Z0-9-_]+$/,
      'SKU sadece büyük harf, rakam, tire ve alt çizgi içerebilir'
    )
    .optional(),
  barcode: z
    .string()
    .max(50, 'Barkod en fazla 50 karakter olabilir')
    .optional(),
  lowStockThreshold: z
    .number()
    .int('Düşük stok eşiği tam sayı olmalıdır')
    .nonnegative('Düşük stok eşiği negatif olamaz')
    .optional(),
});

// Update Product Schema
export const updateProductSchema = createProductSchema.partial();

// Update Stock Schema
export const updateStockSchema = z.object({
  quantity: z
    .number({
      message: 'Geçerli bir miktar giriniz',
    })
    .int('Miktar tam sayı olmalıdır')
    .positive('Miktar pozitif bir sayı olmalıdır'),
  reason: z.string().optional(),
});

// Type inference
export type CreateProductFormData = z.infer<typeof createProductSchema>;
export type UpdateProductFormData = z.infer<typeof updateProductSchema>;
export type UpdateStockFormData = z.infer<typeof updateStockSchema>;
export type ProductCategory = z.infer<typeof productCategorySchema>;

// API Response Schema
export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  price: z.number(),
  stockQuantity: z.number(),
  sku: z.string().nullable().optional(),
  barcode: z.string().nullable().optional(),
  lowStockThreshold: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  organizationId: z.string(),
});

export type Product = z.infer<typeof productSchema>;
