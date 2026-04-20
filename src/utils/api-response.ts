import { NextResponse } from 'next/server'

export interface ApiResponseData<T = any> {
  data?: T
  message?: string
  success: boolean
  error?: string
}

export function createApiResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponseData<T>> {
  return NextResponse.json({
    data,
    message,
    success: true
  }, { status })
}

export function createApiError(
  error: string,
  status: number = 500
): NextResponse<ApiResponseData> {
  return NextResponse.json({
    error,
    success: false
  }, { status })
}

export function createSuccessResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponseData<T>> {
  return createApiResponse(data, message, 200)
}

export function createCreatedResponse<T>(
  data: T,
  message?: string
): NextResponse<ApiResponseData<T>> {
  return createApiResponse(data, message, 201)
}

export function createNotFoundResponse(
  resource: string
): NextResponse<ApiResponseData> {
  return createApiError(`${resource} not found`, 404)
}

export function createValidationErrorResponse(
  field: string,
  message: string
): NextResponse<ApiResponseData> {
  return createApiError(`Validation error: ${field} - ${message}`, 400)
}

export function createUnauthorizedResponse(
  message?: string
): NextResponse<ApiResponseData> {
  return createApiError(message || 'Unauthorized', 401)
}

export function createForbiddenResponse(
  message?: string
): NextResponse<ApiResponseData> {
  return createApiError(message || 'Forbidden', 403)
} 