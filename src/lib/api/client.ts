import { createClient } from '@/utils/supabase/client'

// API Response wrapper
export interface ApiResponse<T = any> {
  data: T
  error?: string
  message?: string
  status: number
}

// API Error class
export class ApiError extends Error {
  public status: number
  public code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// Request configuration
export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
  params?: Record<string, any>
  timeout?: number
  retries?: number
}

/**
 * Centralized API Client with in-memory caching, interceptors, and error handling.
 *
 * Usage:
 *   import { api } from '@/lib/api/client';
 *   const { data, status } = await api.get<MyType>('/my-endpoint', { foo: 'bar' });
 *
 * Features:
 *   - In-memory cache for GET requests (default TTL: 5 min)
 *   - Request/response interceptors
 *   - Centralized error handling
 *   - Type-safe generics
 *   - Supabase Auth integration
 */

// API Client class
class ApiClient {
  private baseURL: string
  private _supabase: ReturnType<typeof createClient> | null = null
  private cache: Map<string, { data: any; expiry: number }> = new Map()
  
  // Lazy initialization of Supabase client
  private get supabase() {
    if (!this._supabase) {
      this._supabase = createClient()
    }
    return this._supabase
  }
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes
  private globalErrorHandler?: (error: ApiError) => void
  private customRequestInterceptor?: (config: RequestConfig) => Promise<RequestConfig> | RequestConfig
  private customResponseInterceptor?: (response: Response) => Promise<Response> | Response

  constructor(baseURL?: string) {
    // Determine the base URL based on environment
    if (baseURL) {
      this.baseURL = baseURL
    } else if (typeof window !== 'undefined') {
      // Client-side: use current origin
      this.baseURL = `${window.location.origin}/api`
    } else {
      // Server-side: try to get from environment or use default
      const envBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL
      this.baseURL = envBaseUrl || 'http://localhost:3000/api'
    }
  }

  /**
   * Set a custom request interceptor (runs after auth/token logic)
   */
  setRequestInterceptor(fn: (config: RequestConfig) => Promise<RequestConfig> | RequestConfig) {
    this.customRequestInterceptor = fn
  }

  /**
   * Set a custom response interceptor (runs after auth error logic)
   */
  setResponseInterceptor(fn: (response: Response) => Promise<Response> | Response) {
    this.customResponseInterceptor = fn
  }

  /**
   * Set a global error handler (called on every error)
   */
  setGlobalErrorHandler(fn: (error: ApiError) => void) {
    this.globalErrorHandler = fn
  }

  /**
   * Clear the in-memory cache (all or by key)
   */
  clearCache(key?: string) {
    if (key) {
      this.cache.delete(key)
    } else {
      this.cache.clear()
    }
  }

  /**
   * Build a cache key from endpoint and params (public)
   */
  public buildCacheKey(endpoint: string, params?: Record<string, any>): string {
    return `${endpoint}?${params ? JSON.stringify(params) : ''}`
  }

  // Request interceptor
  private async interceptRequest(config: RequestConfig): Promise<RequestConfig> {
    // Add auth token
    const { data: { session } } = await this.supabase.auth.getSession()
    if (session?.access_token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${session.access_token}`
      }
    }

    // Add content type for requests with body
    if (config.body && !config.headers?.['Content-Type']) {
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json'
      }
    }

    return config
  }

  // Response interceptor
  private async interceptResponse(response: Response): Promise<Response> {
    // Handle auth errors
    if (response.status === 401) {
      // Refresh token or redirect to login
      const { error } = await this.supabase.auth.refreshSession()
      if (error) {
        // Redirect to login
        window.location.href = '/login'
      }
    }

    return response
  }

  // Build URL with query parameters
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const normalizedBase = this.baseURL.replace(/\/+$/, '')

    // Accept both "/foo" and "/api/foo" style callsites without breaking.
    let cleanEndpoint = endpoint.replace(/^\/+/, '')
    if (cleanEndpoint.startsWith('api/')) {
      cleanEndpoint = cleanEndpoint.slice(4)
    }

    const url = new URL(`${normalizedBase}/${cleanEndpoint}`)
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)))
          } else {
            url.searchParams.append(key, String(value))
          }
        }
      })
    }

    return url.toString()
  }

  // Make HTTP request
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
    try {
      // Intercept request
      let interceptedConfig = await this.interceptRequest(config)
      if (this.customRequestInterceptor) {
        interceptedConfig = await this.customRequestInterceptor(interceptedConfig)
      }

      // Build URL
      const url = this.buildURL(endpoint, interceptedConfig.params)

      // Only cache GET requests
      const isGet = (interceptedConfig.method || 'GET').toUpperCase() === 'GET'
      const cacheKey = this.buildCacheKey(endpoint, interceptedConfig.params)
      if (isGet) {
        const cached = this.cache.get(cacheKey)
        if (cached && cached.expiry > Date.now()) {
          return { data: cached.data, status: 200 }
        } else if (cached) {
          this.cache.delete(cacheKey)
        }
      }

      // Prepare fetch options
      const fetchOptions: RequestInit = {
        method: interceptedConfig.method || 'GET',
        headers: interceptedConfig.headers,
        body: interceptedConfig.body ? JSON.stringify(interceptedConfig.body) : undefined,
      }

      // Add timeout
      if (interceptedConfig.timeout) {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), interceptedConfig.timeout)
        fetchOptions.signal = controller.signal
        const originalFetch = globalThis.fetch
        globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
          try {
            const response = await originalFetch(input, init)
            clearTimeout(timeoutId)
            return response
          } catch (error) {
            clearTimeout(timeoutId)
            throw error
          }
        }
      }

      // Make request
      let response = await fetch(url, fetchOptions)

      // Intercept response
      response = await this.interceptResponse(response)
      if (this.customResponseInterceptor) {
        response = await this.customResponseInterceptor(response)
      }

      // Parse response
      const contentType = response.headers.get('content-type')
      let data: T

      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text() as T
      }

      // Handle error responses
      if (!response.ok) {
        const errorMessage =
          typeof data === 'object' && data !== null
            ? String((data as { message?: string; error?: string }).message ||
                (data as { message?: string; error?: string }).error ||
                `HTTP ${response.status}: ${response.statusText}`)
            : `HTTP ${response.status}: ${response.statusText}`
        const apiError = new ApiError(errorMessage, response.status)
        if (this.globalErrorHandler) this.globalErrorHandler(apiError)
        throw apiError
      }

      // Cache GET responses
      if (isGet) {
        this.cache.set(cacheKey, { data, expiry: Date.now() + this.cacheTTL })
      }

      return {
        data,
        status: response.status
      }

    } catch (error) {
      let apiError: ApiError
      if (error instanceof ApiError) {
        apiError = error
      } else if (error instanceof Error) {
        if (error.name === 'AbortError') {
          apiError = new ApiError('Request timeout', 408)
        } else {
          apiError = new ApiError(error.message, 500)
        }
      } else {
        apiError = new ApiError('Unknown error occurred', 500)
      }
      if (this.globalErrorHandler) this.globalErrorHandler(apiError)
      throw apiError
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET', params })
  }

  async post<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body })
  }

  async put<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body })
  }

  async patch<T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body })
  }

  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  // Utility methods
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL
  }

  getBaseURL(): string {
    return this.baseURL
  }


}

// Create singleton instance
export const apiClient = new ApiClient()

// Export convenience methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, any>, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.get<T>(endpoint, params, config),
  
  post: <T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.post<T>(endpoint, body, config),
  
  put: <T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.put<T>(endpoint, body, config),
  
  patch: <T>(endpoint: string, body?: any, config?: Omit<RequestConfig, 'method'>) => 
    apiClient.patch<T>(endpoint, body, config),
  
  delete: <T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>) => 
    apiClient.delete<T>(endpoint, config),
} 