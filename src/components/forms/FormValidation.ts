import { ValidationRule } from './FormField'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export class FormValidator {
  private static emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  private static urlRegex = /^https?:\/\/.+\..+/
  private static phoneRegex = /^[\+]?[1-9][\d]{0,15}$/

  /**
   * Validate a single field
   */
  static validateField(
    fieldName: string,
    value: any,
    rules: ValidationRule
  ): ValidationError | null {
    // Required validation
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return {
        field: fieldName,
        message: `${fieldName} is required`
      }
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null
    }

    // String length validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return {
          field: fieldName,
          message: `${fieldName} must be at least ${rules.minLength} characters`
        }
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        return {
          field: fieldName,
          message: `${fieldName} must be no more than ${rules.maxLength} characters`
        }
      }
    }

    // Number validations
    if (typeof value === 'number' || !isNaN(Number(value))) {
      const numValue = Number(value)
      
      if (rules.min !== undefined && numValue < rules.min) {
        return {
          field: fieldName,
          message: `${fieldName} must be at least ${rules.min}`
        }
      }

      if (rules.max !== undefined && numValue > rules.max) {
        return {
          field: fieldName,
          message: `${fieldName} must be no more than ${rules.max}`
        }
      }
    }

    // Email validation
    if (rules.email && typeof value === 'string') {
      if (!this.emailRegex.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid email address`
        }
      }
    }

    // URL validation
    if (rules.url && typeof value === 'string') {
      if (!this.urlRegex.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} must be a valid URL`
        }
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string') {
      if (!rules.pattern.test(value)) {
        return {
          field: fieldName,
          message: `${fieldName} format is invalid`
        }
      }
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value)
      if (customError) {
        return {
          field: fieldName,
          message: customError
        }
      }
    }

    return null
  }

  /**
   * Validate multiple fields
   */
  static validateForm(
    data: Record<string, any>,
    rules: Record<string, ValidationRule>
  ): ValidationResult {
    const errors: ValidationError[] = []

    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
      const error = this.validateField(fieldName, data[fieldName], fieldRules)
      if (error) {
        errors.push(error)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Create validation rules object
   */
  static createRules(rules: Record<string, ValidationRule>): Record<string, ValidationRule> {
    return rules
  }

  /**
   * Common validation presets
   */
  static presets = {
    email: (required = true): ValidationRule => ({
      required,
      email: true,
      maxLength: 255
    }),

    password: (required = true, minLength = 8): ValidationRule => ({
      required,
      minLength,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      custom: (value) => {
        if (typeof value === 'string') {
          if (!/(?=.*[a-z])/.test(value)) {
            return 'Password must contain at least one lowercase letter'
          }
          if (!/(?=.*[A-Z])/.test(value)) {
            return 'Password must contain at least one uppercase letter'
          }
          if (!/(?=.*\d)/.test(value)) {
            return 'Password must contain at least one number'
          }
        }
        return undefined
      }
    }),

    phone: (required = true): ValidationRule => ({
      required,
      pattern: this.phoneRegex,
      custom: (value) => {
        if (typeof value === 'string') {
          const cleanValue = value.replace(/[\s\-\(\)]/g, '')
          if (!this.phoneRegex.test(cleanValue)) {
            return 'Please enter a valid phone number'
          }
        }
        return undefined
      }
    }),

    url: (required = true): ValidationRule => ({
      required,
      url: true,
      maxLength: 2048
    }),

    name: (required = true, maxLength = 100): ValidationRule => ({
      required,
      minLength: 2,
      maxLength,
      pattern: /^[a-zA-Z\s\-'\.]+$/,
      custom: (value) => {
        if (typeof value === 'string' && value.trim().split(' ').length < 2) {
          return 'Please enter your full name'
        }
        return undefined
      }
    }),

    required: (): ValidationRule => ({
      required: true
    }),

    optional: (): ValidationRule => ({
      required: false
    })
  }

  /**
   * Format validation errors for display
   */
  static formatErrors(errors: ValidationError[]): Record<string, string> {
    const formatted: Record<string, string> = {}
    errors.forEach(error => {
      formatted[error.field] = error.message
    })
    return formatted
  }

  /**
   * Check if a specific field has errors
   */
  static hasFieldError(fieldName: string, errors: ValidationError[]): boolean {
    return errors.some(error => error.field === fieldName)
  }

  /**
   * Get error message for a specific field
   */
  static getFieldError(fieldName: string, errors: ValidationError[]): string | undefined {
    const error = errors.find(error => error.field === fieldName)
    return error?.message
  }
}

// Export common validation schemas
export const validationSchemas = {
  customer: FormValidator.createRules({
    name: FormValidator.presets.name(),
    email: FormValidator.presets.email(),
    phone: FormValidator.presets.phone(false),
    notes: { maxLength: 500 }
  }),

  event: FormValidator.createRules({
    title: { required: true, minLength: 3, maxLength: 100 },
    description: { required: true, minLength: 10, maxLength: 1000 },
    date: { required: true },
    time: { required: true },
    location: { required: true, maxLength: 200 },
    capacity: { required: true, min: 1, max: 1000 }
  }),

  booking: FormValidator.createRules({
    customer_id: { required: true },
    date: { required: true },
    time: { required: true },
    party_size: { required: true, min: 1, max: 20 },
    notes: { maxLength: 500 }
  }),

  login: FormValidator.createRules({
    email: FormValidator.presets.email(),
    password: { required: true }
  }),

  register: FormValidator.createRules({
    name: FormValidator.presets.name(),
    email: FormValidator.presets.email(),
    password: FormValidator.presets.password(),
    confirmPassword: {
      required: true,
      custom: (value, formData) => {
        if (value !== formData?.password) {
          return 'Passwords do not match'
        }
        return undefined
      }
    }
  })
} 