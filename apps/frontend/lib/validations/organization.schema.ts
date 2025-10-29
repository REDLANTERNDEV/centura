/**
 * Organization Validation Schemas
 * Using Zod for type-safe form validation
 */

import { z } from 'zod';

// Create Organization Schema
export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, 'Organizasyon adı gereklidir')
    .min(2, 'Organizasyon adı en az 2 karakter olmalıdır')
    .max(100, 'Organizasyon adı en fazla 100 karakter olabilir'),
  description: z
    .string()
    .max(500, 'Açıklama en fazla 500 karakter olabilir')
    .optional(),
  industry: z.string().optional(),
  website: z
    .string()
    .regex(
      /^(https?:\/\/)?([\da-z.-]+\.)+[a-z.]{2,6}(\/[\w .-]*)*\/?$/,
      'Geçerli bir web sitesi adresi giriniz'
    )
    .optional()
    .or(z.literal('')),
});

// Update Organization Schema
export const updateOrganizationSchema = createOrganizationSchema.partial();

// Type inference
export type CreateOrganizationFormData = z.infer<
  typeof createOrganizationSchema
>;
export type UpdateOrganizationFormData = z.infer<
  typeof updateOrganizationSchema
>;

// API Response Schema
export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Organization = z.infer<typeof organizationSchema>;
