/**
 * Redis Caching Layer
 * 
 * Provides distributed caching for production environments.
 * Falls back to in-memory cache if Redis is not available.
 * 
 * For single-tenant apps, in-memory caching is sufficient.
 * Redis is recommended for production multi-instance deployments.
 */

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

interface CacheInterface {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

class InMemoryCache implements CacheInterface {
  private store: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired entries every minute
    if (typeof window === 'undefined') {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    this.store.set(key, {
      data: value,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiry) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Redis client (will be initialized if Redis is available)
let redisClient: any = null;
let inMemoryCache: InMemoryCache | null = null;
let useRedis: boolean = false;

/**
 * Initialize Redis client if available
 */
async function initRedis(): Promise<boolean> {
  try {
    // Check if Redis URL is provided
    const redisUrl = process.env.REDIS_URL;
    const redisToken = process.env.REDIS_TOKEN;
    
    if (!redisUrl) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Cache] Redis not configured, using in-memory cache');
      }
      return false;
    }

    // Try to use @upstash/redis if available (serverless-friendly)
    try {
      // Dynamic import to avoid build errors if package is not installed
      const { Redis } = await import('@upstash/redis');
      
      if (!redisToken) {
        console.warn('[Cache] REDIS_URL provided but REDIS_TOKEN missing, using in-memory cache');
        return false;
      }

      redisClient = new Redis({
        url: redisUrl,
        token: redisToken,
      });

      // Test connection
      await redisClient.ping();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Cache] Redis connected successfully');
      }
      return true;
    } catch {
      // If @upstash/redis is unavailable, use in-memory fallback.
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Cache] Redis URL provided but @upstash/redis is not installed');
        console.warn('[Cache] Falling back to in-memory cache');
      }
      return false;
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Cache] Failed to initialize Redis, using in-memory cache:', error);
    }
    return false;
  }
}

/**
 * Redis cache adapter
 */
class RedisCache implements CacheInterface {
  constructor(private client: any, private isUpstash: boolean) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value === null || value === undefined) return null;
      
      // Upstash returns parsed JSON, ioredis returns strings
      if (this.isUpstash) {
        return value as T;
      } else {
        return JSON.parse(value) as T;
      }
    } catch (error) {
      console.error('[Cache] Redis get error:', error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const serialized = this.isUpstash ? value : JSON.stringify(value);
      
      if (this.isUpstash) {
        await this.client.set(key, serialized, { ex: ttlSeconds });
      } else {
        await this.client.setex(key, ttlSeconds, serialized);
      }
    } catch (error) {
      console.error('[Cache] Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('[Cache] Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error) {
      console.error('[Cache] Redis clear error:', error);
    }
  }
}

/**
 * Get cache instance (Redis if available, otherwise in-memory)
 */
function getCache(): CacheInterface {
  if (useRedis && redisClient) {
    const isUpstash = redisClient.constructor.name === 'Redis' && 'set' in redisClient;
    return new RedisCache(redisClient, isUpstash);
  }
  
  if (!inMemoryCache) {
    inMemoryCache = new InMemoryCache();
  }
  return inMemoryCache;
}

/**
 * Get cached value or compute and cache it
 */
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cache = getCache();
  
  // Try to get from cache
  const cached = await cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch data
  const data = await fetcher();
  
  // Store in cache
  await cache.set(key, data, ttlSeconds);
  
  return data;
}

/**
 * Set a value in cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = 300
): Promise<void> {
  const cache = getCache();
  await cache.set(key, value, ttlSeconds);
}

/**
 * Get a value from cache
 */
export async function getCacheValue<T>(key: string): Promise<T | null> {
  const cache = getCache();
  return await cache.get<T>(key);
}

/**
 * Delete a value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  const cache = getCache();
  await cache.delete(key);
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  const cache = getCache();
  await cache.clear();
}

/**
 * Invalidate cache by pattern (for related keys)
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  const cache = getCache();
  
  // For Redis, use pattern matching
  if (useRedis && redisClient) {
    try {
      const isUpstash = redisClient.constructor.name === 'Redis' && 'set' in redisClient;
      
      if (isUpstash) {
        // Upstash Redis - use keys method
        const keys = await redisClient.keys(pattern);
        if (keys && keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        // ioredis - use scan
        const stream = redisClient.scanStream({
          match: pattern,
          count: 100,
        });
        
        const keys: string[] = [];
        for await (const resultKeys of stream) {
          keys.push(...resultKeys);
        }
        
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      }
    } catch (error) {
      console.error('[Cache] Redis pattern invalidation error:', error);
      // Fallback to clearing all cache
      await cache.clear();
    }
  } else {
    // For in-memory cache, we can't do pattern matching efficiently
    // Clear all cache if pattern matching is needed
    if (pattern.includes('*')) {
      await cache.clear();
    }
  }
}

/**
 * Check if Redis is being used
 */
export function isUsingRedis(): boolean {
  return useRedis && redisClient !== null;
}

/**
 * Get cache statistics (for monitoring)
 */
export async function getCacheStats(): Promise<{
  type: 'redis' | 'memory';
  connected: boolean;
}> {
  return {
    type: useRedis && redisClient ? 'redis' : 'memory',
    connected: useRedis && redisClient !== null,
  };
}

// Initialize on module load (server-side only)
if (typeof window === 'undefined') {
  initRedis()
    .then((success) => {
      useRedis = success;
    })
    .catch((error) => {
      console.error('[Cache] Failed to initialize cache:', error);
      useRedis = false;
    });
}

