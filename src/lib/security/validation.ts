/**
 * Input Validation and Sanitization Utilities
 *
 * Provides Zod schemas and sanitization functions for API input validation
 */

import { z } from 'zod'

/**
 * Sanitize string input - remove HTML tags and trim whitespace
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }

  // Remove HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '')

  // Decode HTML entities
  const decoded = withoutTags
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

  // Trim whitespace
  return decoded.trim()
}

/**
 * Sanitize email - validate and normalize
 */
export function sanitizeEmail(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null
  }

  const email = input.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return null
  }

  return email
}

/**
 * Sanitize phone number - remove non-digit characters
 */
export function sanitizePhone(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null
  }

  // Remove all non-digit characters except +
  const cleaned = input.replace(/[^\d+]/g, '')

  if (cleaned.length < 10) {
    return null
  }

  return cleaned
}

/**
 * Sanitize UUID
 */
export function sanitizeUUID(input: unknown): string | null {
  if (typeof input !== 'string') {
    return null
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (!uuidRegex.test(input)) {
    return null
  }

  return input.toLowerCase()
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): Partial<T> {
  const sanitized: Partial<T> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key as keyof T] = sanitizeString(value) as T[keyof T]
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key as keyof T] = sanitizeObject(value) as T[keyof T]
    } else if (Array.isArray(value)) {
      sanitized[key as keyof T] = value.map((item) =>
        typeof item === 'string' ? sanitizeString(item) : item
      ) as T[keyof T]
    } else {
      sanitized[key as keyof T] = value
    }
  }

  return sanitized
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email().toLowerCase().trim(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/)
    .optional(),
  pagination: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  datetime: z.string().datetime(),
  positiveInteger: z.coerce.number().int().positive(),
  nonNegativeInteger: z.coerce.number().int().nonnegative(),
}

/**
 * Validate request body with Zod schema
 */
export function validateRequest<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, error: result.error }
}

/**
 * Validate and sanitize request body
 */
export function validateAndSanitize<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  // First sanitize if it's an object
  const sanitized =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? sanitizeObject(data as Record<string, any>)
      : data

  return validateRequest(schema, sanitized)
}

/**
 * Create error response for validation failures
 */
export function validationErrorResponse(error: z.ZodError): Response {
  return new Response(
    JSON.stringify({
      error: 'Validation error',
      message: 'Invalid request data',
      details: error.issues.map((err) => ({
        path: err.path.map(String).join('.'),
        message: err.message,
      })),
    }),
    {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}
