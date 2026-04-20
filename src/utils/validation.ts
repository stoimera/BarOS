import { z } from 'zod'
import { createValidationError } from './error-handling'

// Common validation functions
export function validateRequired(value: any, fieldName: string): void {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    throw createValidationError(fieldName, `${fieldName} is required`)
  }
}

export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createValidationError('email', 'Please enter a valid email address')
  }
}

export function validatePhone(phone: string): void {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  if (phone && !phoneRegex.test(phone.replace(/\s/g, ''))) {
    throw createValidationError('phone', 'Please enter a valid phone number')
  }
}

export function validateMinLength(value: string, minLength: number, fieldName: string): void {
  if (value.length < minLength) {
    throw createValidationError(fieldName, `${fieldName} must be at least ${minLength} characters`)
  }
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): void {
  if (value.length > maxLength) {
    throw createValidationError(fieldName, `${fieldName} must be no more than ${maxLength} characters`)
  }
}

export function validateMinValue(value: number, minValue: number, fieldName: string): void {
  if (value < minValue) {
    throw createValidationError(fieldName, `${fieldName} must be at least ${minValue}`)
  }
}

export function validateMaxValue(value: number, maxValue: number, fieldName: string): void {
  if (value > maxValue) {
    throw createValidationError(fieldName, `${fieldName} must be no more than ${maxValue}`)
  }
}

export function validateDateRange(date: Date, minDate?: Date, maxDate?: Date, fieldName: string = 'date'): void {
  if (minDate && date < minDate) {
    throw createValidationError(fieldName, `${fieldName} must be after ${minDate.toLocaleDateString()}`)
  }
  
  if (maxDate && date > maxDate) {
    throw createValidationError(fieldName, `${fieldName} must be before ${maxDate.toLocaleDateString()}`)
  }
}

export function validateTimeFormat(time: string): void {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  if (!timeRegex.test(time)) {
    throw createValidationError('time', 'Please enter a valid time (HH:MM)')
  }
}

export function validateUUID(id: string, fieldName: string = 'id'): void {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    throw createValidationError(fieldName, `Invalid ${fieldName} format`)
  }
}

// Form validation helpers
export function validateFormData<T extends Record<string, any>>(
  data: T,
  validations: Record<keyof T, (value: any) => void>
): void {
  for (const [field, validator] of Object.entries(validations)) {
    try {
      validator(data[field])
    } catch (error) {
      // Re-throw validation errors
      throw error
    }
  }
}

// Async validation helpers
export async function validateAsync<T>(
  value: T,
  validator: (value: T) => Promise<void>
): Promise<void> {
  try {
    await validator(value)
  } catch (error) {
    throw error
  }
}

// Schema validation helpers
export function validateWithSchema<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0]
      throw createValidationError(
        firstError.path.map(String).join('.'),
        firstError.message
      )
    }
    throw error
  }
}

// Custom validators
export function validateStockAdjustment(
  currentQuantity: number,
  change: number
): void {
  if (change === 0) {
    throw createValidationError('change', 'Change amount cannot be zero')
  }
  
  const newQuantity = currentQuantity + change
  if (newQuantity < 0) {
    throw createValidationError('change', `Cannot remove more than current stock (${currentQuantity})`)
  }
}

export function validatePartySize(size: number): void {
  validateMinValue(size, 1, 'party size')
  validateMaxValue(size, 50, 'party size')
}

export function validateCapacity(capacity: number): void {
  validateMinValue(capacity, 1, 'capacity')
  validateMaxValue(capacity, 1000, 'capacity')
}

export function validatePrice(price: number): void {
  validateMinValue(price, 0, 'price')
  validateMaxValue(price, 10000, 'price')
} 