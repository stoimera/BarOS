# Production environment variables (Track 0.1)

Validated at Node server boot when `NODE_ENV=production` (see `validateProductionEnv` in `src/lib/security/env.ts` and `assertProductionEnvAtBoot` in `instrumentation.ts`).

## Required in production

| Variable | Notes |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Absolute `http` or `https` URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `UPSTASH_REDIS_REST_URL` | Must be `https` |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token |
| `ENCRYPTION_KEY` | PII encryption; hex (64 chars) or passphrase (see `src/lib/security/encryption.ts`) |

Optional and dev-only keys are listed in `.env.example`.

## Verification

```bash
npm run verify:all
npm run test:ci
```
