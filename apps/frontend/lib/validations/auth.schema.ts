/**
 * Authentication Validation Schemas
 * Using Zod for type-safe form validation
 */

import { z } from 'zod';

// Login Schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'E-posta adresi gereklidir')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Geçerli bir e-posta adresi giriniz'),
  password: z.string().min(1, 'Şifre gereklidir'),
});

// Signup Schema
export const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Ad Soyad gereklidir')
      .min(2, 'Ad Soyad en az 2 karakter olmalıdır')
      .max(100, 'Ad Soyad en fazla 100 karakter olabilir'),
    email: z
      .string()
      .min(1, 'E-posta adresi gereklidir')
      .regex(
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Geçerli bir e-posta adresi giriniz'
      ),
    password: z
      .string()
      .min(1, 'Şifre gereklidir')
      .min(8, 'Şifre en az 8 karakter olmalıdır')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Şifre en az bir küçük harf, bir büyük harf ve bir rakam içermelidir'
      ),
    confirmPassword: z.string().min(1, 'Şifre tekrarı gereklidir'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Şifreler eşleşmiyor',
    path: ['confirmPassword'],
  });

// Type inference from schemas
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;

// API Response Schemas (optional but recommended for runtime validation)
export const authResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
    createdAt: z.string().optional(),
  }),
  message: z.string().optional(),
});

export type AuthResponse = z.infer<typeof authResponseSchema>;
