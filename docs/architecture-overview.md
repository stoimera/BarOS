# Architecture overview (Track 11.3)

## System shape

- **Next.js App Router** (`src/app`) for marketing, customer portal, staff dashboard, and API routes under `src/app/api`.
- **Supabase** for Postgres, Auth, and RLS-protected data access from the browser and server.
- **Operational domain** (POS, inventory, staff time, event commerce) colocated under `src/app/(dashboard)/operations` and `src/app/api/operations/*`.

## Security model

- Dashboard/API mutations go through `withSecurity` (`src/lib/security/api-middleware.ts`): auth, optional role/permission, optional location scope, rate limits, correlation ids, and audit hooks.
- Service-role access is restricted to an explicit allowlist (`scripts/verify/allowlists/service-role-imports.json`).

## Data flow

1. Browser → Next route handler (server) → Supabase user-scoped client or service role for privileged jobs.
2. Structured logs via `createLogger` (`src/lib/logger.ts`); SLI hooks in `src/lib/observability/sli.ts`.

## Where to extend

- New operations tables: add a **forward-only** migration in `schemas/`, enable RLS, register in `scripts/verify/rls-registry.json`, then expose APIs with `withSecurity` and tests.
