/**
 * Form Validation Utilities
 * Helper functions for form validation with Zod
 */

import { z } from 'zod';

/**
 * Validates form data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param data - Form data to validate
 * @returns Validation result with data or errors
 */
export function validateForm<T extends z.ZodType>(
  schema: T,
  data: unknown
):
  | { success: true; data: z.infer<T> }
  | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  // Convert Zod errors to a more friendly format
  const errors: Record<string, string> = {};
  for (const error of result.error.issues) {
    const path = error.path.join('.');
    errors[path] = error.message;
  }

  return { success: false, errors };
}

/**
 * Validates a single field against a Zod schema
 * @param schema - Zod schema to validate against
 * @param fieldName - Name of the field to validate
 * @param value - Value to validate
 * @returns Error message or null if valid
 */
export function validateField<T extends z.ZodType>(
  schema: T,
  fieldName: string,
  value: unknown
): string | null {
  try {
    // For partial validation, we need to extract the field schema
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape as Record<string, z.ZodTypeAny>;
      const fieldSchema = shape[fieldName];

      if (fieldSchema) {
        fieldSchema.parse(value);
        return null;
      }
    }

    // If we can't find the specific field, validate the whole object
    const result = schema.safeParse({ [fieldName]: value });
    if (result.success) {
      return null;
    }

    const fieldError = result.error.issues.find(
      error => error.path[0] === fieldName
    );
    return fieldError?.message || null;
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return error.issues[0]?.message || 'Geçersiz değer';
    }
    return 'Geçersiz değer';
  }
}

/**
 * Gets all error messages from a Zod error
 * @param error - Zod error object
 * @returns Object with field names as keys and error messages as values
 */
export function getErrorMessages(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const err of error.issues) {
    const path = err.path.join('.');
    errors[path] = err.message;
  }
  return errors;
}

/**
 * Hook to manage form validation state
 */
export interface UseFormValidationOptions<T extends z.ZodType> {
  schema: T;
  initialValues?: Partial<z.infer<T>>;
}

export interface FormValidationState<T> {
  values: Partial<T>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
}

/**
 * Creates a form validation manager
 * This is a simplified version - in production, consider using react-hook-form with Zod
 */
export function createFormValidator<T extends z.ZodType>(schema: T) {
  return {
    validate: (data: unknown) => validateForm(schema, data),
    validateField: (fieldName: string, value: unknown) =>
      validateField(schema, fieldName, value),
  };
}
