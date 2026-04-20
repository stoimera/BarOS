# API rate limits

Distributed limits use Upstash Redis when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set (required in production). Otherwise an in-memory limiter is used (development only).

## Policy matrix

| Policy (`rateLimitType`) | Approx. limit | Window | Use for |
|--------------------------|---------------|--------|---------|
| `default` | 100 requests | 1 minute | Standard authenticated CRUD, listings, analytics reads. |
| `auth` | 10 requests | 1 minute | Login, token refresh, password reset, invitation checks, role probes. |
| `strict` | 20 requests | 1 minute | Payments, refunds, GDPR export/delete, campaign send, inventory adjustments, commerce check-in, admin crypto/reencrypt. |

Handlers pass `rateLimitType` into `withSecurity` from `src/lib/security/api-middleware.ts`. When adding a sensitive route, prefer `strict`; when adding a login-adjacent route, use `auth`.

## Identifier

The limiter keys on the client IP from `x-forwarded-for` / `x-real-ip` (`getClientIdentifier` in `src/lib/security/rate-limit.ts`). User ID is not mixed into the key in the current implementation; consider tightening for authenticated abuse later.
