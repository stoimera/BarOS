# Caching Layer

This module provides a unified caching interface that supports both Redis and in-memory caching.

## Current Status

✅ **Fully Implemented** - The caching layer is complete and functional.

## How It Works

1. **Automatic Detection**: The system automatically detects if Redis is configured
2. **Fallback**: If Redis is not available, it falls back to in-memory caching
3. **Single-Tenant Support**: For single-tenant applications, in-memory caching is sufficient

## Configuration

### Option 1: In-Memory Cache (Default - No Configuration Needed)

For single-tenant applications, no configuration is required. The system will automatically use in-memory caching.

### Option 2: Redis Cache (Optional - For Production)

To enable Redis caching, add these environment variables:

```env
REDIS_URL=your-redis-url
REDIS_TOKEN=your-redis-token  # Required for Upstash Redis
```

Then install one of these Redis client packages:

**Option A: Upstash Redis (Recommended for Serverless)**
```bash
npm install @upstash/redis
```

**Option B: ioredis (Traditional Redis)**
```bash
npm install ioredis
```

## Usage

```typescript
import { getCached, setCache, getCacheValue, deleteCache } from '@/lib/cache/redis';

// Get cached value or fetch and cache it
const data = await getCached(
  'users:list',
  async () => {
    // Fetch function - only called on cache miss
    return await fetchUsers();
  },
  300 // TTL in seconds (default: 300)
);

// Set a value directly
await setCache('key', { data: 'value' }, 300);

// Get a value
const value = await getCacheValue('key');

// Delete a value
await deleteCache('key');

// Check if Redis is being used
import { isUsingRedis } from '@/lib/cache/redis';
const usingRedis = isUsingRedis();
```

## Cache vs DataStore

- **`src/lib/cache/redis.ts`**: Server-side caching for API routes and data fetching
- **`src/stores/dataStore.ts`**: Client-side Zustand store for UI state and optimistic updates

Both serve different purposes:
- Use `redis.ts` for server-side API caching
- Use `dataStore.ts` for client-side state management

## For Single-Tenant Apps

**In-memory caching is sufficient** for single-tenant applications. Redis is only needed if:
- You're running multiple server instances
- You need distributed caching across servers
- You want persistent cache across server restarts

The current implementation works perfectly with in-memory caching for single-tenant use cases.

