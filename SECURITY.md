# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| `main` branch (rolling) | Yes |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive findings.

1. Email the maintainers with subject `[SECURITY] urban-bar-crm` and include:
   - Description and impact
   - Steps to reproduce
   - Affected components (e.g. API route, Supabase RLS, auth flow)
2. Allow reasonable time for triage before any public disclosure.

## Practices in this repository

- API routes use `withSecurity` (auth, rate limits, audit hooks) unless explicitly exempted.
- Production env validation runs at Node boot (`instrumentation.ts`).
- `npm run verify:all` and `npm run security:enforce` are expected to pass in CI.

## Secrets

Never commit real Supabase keys, encryption keys, or third-party API tokens. Use `.env.local` and CI secrets stores only.
