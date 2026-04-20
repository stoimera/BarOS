/**
 * API Security Middleware
 *
 * Combines rate limiting, validation, and audit logging for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, apiRateLimiter, authRateLimiter, strictRateLimiter } from './rate-limit'
import { validateAndSanitize, validationErrorResponse } from './validation'
import { auditLog, type AuditAction, type ResourceType } from './audit'
import { createUserSupabaseClient } from '@/utils/supabase/server-user'
import { createClient } from '@/utils/supabase/server'
import type { z } from 'zod'
import type { OperationsPermission } from '@/types/operations'
import { hasPermission } from './permissions'
import { createLogger } from '@/lib/logger'
import {
  getRequestedLocationIdFromRequest,
  resolveOperationsLocationScope,
} from '@/lib/security/location-scope'
import { resolveCorrelationIdFromRequest } from '@/lib/observability/correlation-id'
import { correlationContext } from '@/lib/observability/correlation-store'
import { attachCorrelationIdHeader } from '@/lib/observability/correlation-response'

const securityLog = createLogger('security.api-middleware')

function toHandlerError(error: unknown): Error {
  if (error instanceof Error) return error
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return new Error((error as { message: string }).message)
  }
  try {
    return new Error(JSON.stringify(error))
  } catch {
    return new Error(String(error))
  }
}

interface ApiMiddlewareOptions {
  rateLimitType?: 'default' | 'auth' | 'strict'
  requireAuth?: boolean
  requireRole?: 'admin' | 'staff' | 'customer'
  requirePermission?: OperationsPermission
  requireLocationScoped?: boolean
  validateBody?: z.ZodSchema
  auditAction?: AuditAction
  auditResourceType?: ResourceType
}

/**
 * Get current user from request
 */
async function getCurrentUser(
  req: NextRequest
): Promise<{ id: string; role: string; profileId: string } | null> {
  try {
    const supabase = await createUserSupabaseClient()
    const authHeader = req.headers.get('authorization')

    async function profileForUser(userId: string) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, role')
        .eq('user_id', userId)
        .single()

      if (!profile) {
        return null
      }

      return {
        id: userId,
        role: profile.role,
        profileId: profile.id,
      }
    }

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token)

      if (error || !user) {
        return null
      }

      return await profileForUser(user.id)
    }

    const {
      data: { user: cookieUser },
      error: cookieError,
    } = await supabase.auth.getUser()

    if (cookieError || !cookieUser) {
      return null
    }

    return await profileForUser(cookieUser.id)
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    securityLog.error('get_current_user_failed', { errorMessage: err.message })
    return null
  }
}

/**
 * API Security Middleware
 *
 * Wraps API route handlers with security features:
 * - Rate limiting
 * - Authentication/authorization
 * - Input validation
 * - Audit logging
 */
export function withSecurity<T = unknown>(
  handler: (
    req: NextRequest,
    context: {
      user: { id: string; role: string; profileId: string }
      validatedBody?: T
      routeContext?: unknown
      /** Set when `requireLocationScoped` resolves a location filter for list queries */
      scopedLocationId?: string
    }
  ) => Promise<Response>,
  options: ApiMiddlewareOptions = {}
) {
  return async (req: NextRequest, routeContext?: unknown): Promise<Response> => {
    const correlationId = resolveCorrelationIdFromRequest(req)
    const execute = async (): Promise<Response> => {
    // 1. Rate Limiting
    const limiter =
      options.rateLimitType === 'auth'
        ? authRateLimiter
        : options.rateLimitType === 'strict'
          ? strictRateLimiter
          : apiRateLimiter

    let rateLimitResponse: Response | null = null
    try {
      rateLimitResponse = await rateLimit(req, limiter)
    } catch (rlErr) {
      securityLog.error('rate_limit_failed', {
        errorMessage: rlErr instanceof Error ? rlErr.message : String(rlErr),
      })
    }
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // 2. Authentication Check
    let user: { id: string; role: string; profileId: string } | null = null

    if (options.requireAuth || options.requireRole) {
      user = await getCurrentUser(req)

      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized', message: 'Authentication required' },
          { status: 401 }
        )
      }

      // 3. Role-based Authorization
      if (options.requireRole) {
        const roleHierarchy: Record<string, number> = {
          customer: 1,
          staff: 2,
          admin: 3,
        }

        const userRoleLevel = roleHierarchy[user.role] || 0
        const requiredRoleLevel = roleHierarchy[options.requireRole] || 0

        if (userRoleLevel < requiredRoleLevel) {
          // Log unauthorized access attempt
          await auditLog(
            {
              user_id: user.profileId,
              action: 'view',
              resource_type: 'user',
              metadata: {
                attempted_route: req.nextUrl.pathname,
                required_role: options.requireRole,
                user_role: user.role,
              },
            },
            req
          )

          return NextResponse.json(
            { error: 'Forbidden', message: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      if (options.requirePermission && !hasPermission(user.role, options.requirePermission)) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'Missing required permission' },
          { status: 403 }
        )
      }
    }

    let scopedLocationId: string | undefined
    if (options.requireLocationScoped && user) {
      const supabase = await createClient()
      const requested = getRequestedLocationIdFromRequest(req)
      const scope = await resolveOperationsLocationScope({
        supabase,
        role: user.role,
        profileId: user.profileId,
        requestedFromClient: requested,
      })
      if (!scope.ok) {
        return NextResponse.json({ error: scope.message }, { status: scope.status })
      }
      scopedLocationId = scope.scopedLocationId
    }

    // 4. Input Validation
    let validatedBody: T | undefined

    if (options.validateBody && req.method !== 'GET') {
      try {
        const body = await req.json()
        const result = validateAndSanitize(options.validateBody, body)

        if (!result.success) {
          return validationErrorResponse(result.error)
        }

        validatedBody = result.data as T
      } catch {
        // If body parsing fails, continue without validation (for GET requests)
        if (req.method === 'GET') {
          // No body to validate
        } else {
          return NextResponse.json(
            { error: 'Invalid request body', message: 'Failed to parse request body' },
            { status: 400 }
          )
        }
      }
    }

    // Basic JSON body guard for secured write endpoints without explicit schema.
    // This still enforces parse safety and prevents malformed payloads.
    if (!options.validateBody && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'DELETE') {
      try {
        const body = await req.json()
        if (!body || typeof body !== 'object' || Array.isArray(body)) {
          return NextResponse.json(
            { error: 'Invalid request body', message: 'Request body must be a JSON object' },
            { status: 400 }
          )
        }
        validatedBody = body as T
      } catch {
        return NextResponse.json(
          { error: 'Invalid request body', message: 'Failed to parse request body' },
          { status: 400 }
        )
      }
    }

    // 5. Execute handler
    try {
      const response = await handler(req, {
        user: user!,
        validatedBody,
        routeContext,
        scopedLocationId,
      })

      // 6. Audit Logging (after successful operation)
      if (options.auditAction && options.auditResourceType && user) {
        // Extract resource ID from response or request
        let resourceId: string | undefined

        try {
          const responseData = await response.clone().json()
          resourceId = responseData?.id || responseData?.data?.id
        } catch {
          // If response is not JSON, try to get from URL
          const pathParts = req.nextUrl.pathname.split('/')
          resourceId = pathParts[pathParts.length - 1]
        }

        await auditLog(
          {
            user_id: user.profileId,
            action: options.auditAction,
            resource_type: options.auditResourceType,
            resource_id: resourceId,
          },
          req
        )
      }

      return response
    } catch (error) {
      const err = toHandlerError(error)
      securityLog.error('api_handler_error', { errorMessage: err.message })

      // Log error in audit
      if (user && options.auditAction && options.auditResourceType) {
        await auditLog(
          {
            user_id: user.profileId,
            action: options.auditAction,
            resource_type: options.auditResourceType,
            metadata: {
              error: err.message,
            },
          },
          req
        )
      }

      return NextResponse.json(
        {
          error: 'Internal server error',
          message: err.message,
        },
        { status: 500 }
      )
    }
    }

    const response = await correlationContext.run(correlationId, execute)
    return attachCorrelationIdHeader(response, correlationId)
  }
}
