# Contributing

Thank you for helping improve this project.

## Development setup

- **Node.js:** use the version in [`.nvmrc`](.nvmrc) (currently 20 LTS). Match [CI](.github/workflows/ci.yml).
- **Environment:** copy [`.env.example`](.env.example) to `.env.local` and fill values. Never commit secrets.
- **Install:** `npm ci`
- **Checks before a PR:** `npm run format:check`, `npm run lint`, `npx tsc --noEmit`, `npm run verify:all`, `npm run test:ci`, `npm run build`

## Database and migrations

- SQL sources live under [`schemas/`](schemas/). Apply in Supabase in numeric order for new environments.
- **Do not edit** migration files that have already been applied in production; add a new forward migration instead.
- New sensitive tables must ship with **RLS enabled** and policies, plus tests where practical. Update [`scripts/verify/rls-registry.json`](scripts/verify/rls-registry.json) when adding required tables.

## API routes

- Use [`withSecurity`](src/lib/security/api-middleware.ts) for handlers in `src/app/api/**/route.ts`.
- Mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`) must set `auditAction` / `auditResourceType` in the wrapper options.
- Prefer [`createLogger`](src/lib/logger.ts) over `console.*` in server code. Keep log messages structured, redact sensitive fields, and include correlation IDs where available.

## PR checklist

- [ ] Tests added or updated for behavior changes
- [ ] `npm run verify:all` passes
- [ ] Screenshots or short notes for user-visible UI changes
- [ ] Docs updated when behavior or env vars change

## Code of conduct

Please read [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
