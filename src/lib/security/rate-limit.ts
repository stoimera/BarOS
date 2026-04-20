/**
 * Rate Limiting Utility
 *
 * Uses Upstash Redis in distributed environments and falls back
 * to in-memory rate limiting for local development.
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

class RateLimiter {
  private store: RateLimitStore = {}
  private cleanupInterval: NodeJS.Timeout

  constructor(
    private maxRequests: number = 100,
    private windowMs: number = 60000, // 1 minute default
    private cleanupIntervalMs: number = 60000 // Clean up every minute
  ) {
    // Clean up expired entries periodically
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, this.cleanupIntervalMs)
  }

  /**
   * Check if a request should be rate limited
   * @param identifier - Unique identifier (IP address, user ID, etc.)
   * @returns Object with allowed status and remaining requests
   */
  check(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now()
    const key = identifier
    const entry = this.store[key]

    // If no entry or window expired, create new entry
    if (!entry || now > entry.resetTime) {
      this.store[key] = {
        count: 1,
        resetTime: now + this.windowMs,
      }
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      }
    }

    // Increment count
    entry.count++

    // Check if limit exceeded
    if (entry.count > this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    Object.keys(this.store).forEach((key) => {
      if (now > this.store[key].resetTime) {
        delete this.store[key]
      }
    })
  }

  /**
   * Clear all entries (useful for testing)
   */
  clear(): void {
    this.store = {}
  }

  /**
   * Destroy the rate limiter and clear interval
   */
  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store = {}
  }
}

let distributedLimiter: Ratelimit | null = null

function getDistributedLimiter(limiter: RateLimiter): Ratelimit | null {
  if (distributedLimiter) return distributedLimiter

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    return null
  }

  try {
    const redis = new Redis({ url, token })
    distributedLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(
        limiter['maxRequests'],
        `${Math.floor(limiter['windowMs'] / 1000)} s`
      ),
      analytics: true,
      prefix: 'api-ratelimit',
    })
    return distributedLimiter
  } catch {
    return null
  }
}

// Create rate limiters for different endpoints
export const apiRateLimiter = new RateLimiter(100, 60000) // 100 requests per minute
export const authRateLimiter = new RateLimiter(10, 60000) // 10 requests per minute for auth
export const strictRateLimiter = new RateLimiter(20, 60000) // 20 requests per minute for sensitive operations

/**
 * Get client identifier from request
 */
export function getClientIdentifier(req: Request): string {
  // Try to get IP from various headers (for proxies/load balancers)
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  return ip
}

/**
 * Rate limit middleware for Next.js API routes
 */
export async function rateLimit(
  req: Request,
  limiter: RateLimiter = apiRateLimiter
): Promise<Response | null> {
  const identifier = getClientIdentifier(req)
  let distributed: Ratelimit | null = null
  try {
    distributed = getDistributedLimiter(limiter)
  } catch {
    distributed = null
  }
  const result = distributed ? (() => null)() : limiter.check(identifier)

  if (distributed) {
    let distributedResult: { success: boolean; reset: number; limit: number; remaining: number }
    try {
      distributedResult = await distributed.limit(identifier)
    } catch {
      return null
    }
    if (!distributedResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((distributedResult.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': distributedResult.limit.toString(),
            'X-RateLimit-Remaining': distributedResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(distributedResult.reset).toISOString(),
            'Retry-After': Math.ceil((distributedResult.reset - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    return null
  }

  if (result && !result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limiter['maxRequests'].toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
          'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
        },
      }
    )
  }

  return null // No rate limit violation
}
