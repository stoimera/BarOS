import { toast } from 'sonner'
import { ERROR_MESSAGES } from '@/lib/constants'

// Shape for application error metadata
export interface AppErrorPayload {
  message: string
  code?: string
  details?: any
  status?: number
}

// Custom error class for application-specific errors
export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: any
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Standard error handler for API routes with status code mapping
export function handleApiError(error: unknown): { error: string; status: number } {
  console.error('API Error:', error)
  
  if (error instanceof AppError) {
    return {
      error: error.message,
      status: error.status || 500
    }
  }
  
  if (error instanceof Error) {
    return {
      error: error.message,
      status: 500
    }
  }
  
  return {
    error: ERROR_MESSAGES.SERVER_ERROR,
    status: 500
  }
}

// Standard error handler for React components with toast notifications
export function handleComponentError(error: unknown, context: string = 'operation'): void {
  console.error(`${context} error:`, error)
  
  if (error instanceof AppError) {
    toast.error(error.message)
    return
  }
  
  if (error instanceof Error) {
    toast.error(error.message)
    return
  }
  
  toast.error(`Failed to ${context}. Please try again.`)
}

// Handle form validation errors with user-friendly messages
export function handleValidationError(errors: Record<string, string>): void {
  const firstError = Object.values(errors)[0]
  if (firstError) {
    toast.error(firstError)
  } else {
    toast.error('Please fix the errors in the form')
  }
}

// Handle network connectivity errors
export function handleNetworkError(error: unknown): void {
  console.error('Network error:', error)
  toast.error(ERROR_MESSAGES.NETWORK_ERROR)
}

// Handle authentication and authorization errors
export function handleAuthError(error: unknown): void {
  console.error('Authentication error:', error)
  toast.error(ERROR_MESSAGES.UNAUTHORIZED)
}

// Handle database operation errors with context
export function handleDatabaseError(error: unknown, operation: string): void {
  console.error(`Database ${operation} error:`, error)
  toast.error(`Failed to ${operation}. Please try again.`)
}

// Create validation error for form field validation
export function createValidationError(field: string, message: string): AppError {
  return new AppError(message, 'VALIDATION_ERROR', 400, { field })
}

// Create not found error for missing resources
export function createNotFoundError(resource: string): AppError {
  return new AppError(`${resource} not found`, 'NOT_FOUND', 404)
}

// Create unauthorized error for authentication failures
export function createUnauthorizedError(message?: string): AppError {
  return new AppError(message || ERROR_MESSAGES.UNAUTHORIZED, 'UNAUTHORIZED', 401)
}

// Create server error for internal server issues
export function createServerError(message?: string): AppError {
  return new AppError(message || ERROR_MESSAGES.SERVER_ERROR, 'SERVER_ERROR', 500)
} 