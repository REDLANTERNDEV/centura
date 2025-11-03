/**
 * Order Validation Schemas
 * Using Zod for type-safe form validation
 */

import { z } from 'zod';

// Order Status Enum
export const orderStatusSchema = z.enum([
  'draft',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);

// Payment Status Enum
export const paymentStatusSchema = z.enum([
  'pending',
  'partial',
  'paid',
  'refunded',
]);

// Order Item Schema
export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Ürün seçimi gereklidir'),
  quantity: z
    .number({
      message: 'Geçerli bir miktar giriniz',
    })
    .int('Miktar tam sayı olmalıdır')
    .positive('Miktar pozitif bir sayı olmalıdır'),
  unitPrice: z
    .number({
      message: 'Geçerli bir fiyat giriniz',
    })
    .positive('Fiyat pozitif bir sayı olmalıdır')
    .optional(),
});

// Create Order Schema
export const createOrderSchema = z.object({
  customerId: z.string().min(1, 'Müşteri seçimi gereklidir'),
  items: z
    .array(orderItemSchema)
    .min(1, 'En az bir ürün eklemelisiniz')
    .max(100, 'En fazla 100 ürün ekleyebilirsiniz'),
  orderStatus: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  notes: z
    .string()
    .max(1000, 'Notlar en fazla 1000 karakter olabilir')
    .optional(),
  shippingAddress: z
    .string()
    .max(500, 'Teslimat adresi en fazla 500 karakter olabilir')
    .optional(),
  discount: z
    .number()
    .nonnegative('İndirim negatif olamaz')
    .max(100, "İndirim %100'den fazla olamaz")
    .optional(),
});

// Update Order Schema
export const updateOrderSchema = z.object({
  orderStatus: orderStatusSchema.optional(),
  paymentStatus: paymentStatusSchema.optional(),
  notes: z.string().max(1000).optional(),
  shippingAddress: z.string().max(500).optional(),
  discount: z.number().nonnegative().max(100).optional(),
});

// Type inference
export type CreateOrderFormData = z.infer<typeof createOrderSchema>;
export type UpdateOrderFormData = z.infer<typeof updateOrderSchema>;
export type OrderItem = z.infer<typeof orderItemSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

// API Response Schema
export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  customerId: z.string(),
  totalAmount: z.number(),
  discount: z.number().nullable().optional(),
  finalAmount: z.number(),
  orderStatus: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  notes: z.string().nullable().optional(),
  shippingAddress: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  organizationId: z.string(),
  items: z
    .array(
      z.object({
        id: z.string(),
        productId: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        totalPrice: z.number(),
      })
    )
    .optional(),
});

export type Order = z.infer<typeof orderSchema>;

// Edit Order Schema
export const editOrderSchema = z.object({
  orderStatus: orderStatusSchema,
  paymentStatus: paymentStatusSchema,
  paidAmount: z
    .number()
    .min(0, 'Ödenen tutar negatif olamaz')
    .nonnegative('Ödenen tutar 0 veya daha büyük olmalıdır'),
});

export type EditOrderFormData = z.infer<typeof editOrderSchema>;

// Edit Order Schema with total validation
export const createEditOrderSchema = (totalAmount: number) =>
  editOrderSchema.extend({
    paidAmount: z
      .number()
      .min(0, 'Ödenen tutar negatif olamaz')
      .max(totalAmount, `Ödenen tutar ${totalAmount} TL'den fazla olamaz`),
  });
