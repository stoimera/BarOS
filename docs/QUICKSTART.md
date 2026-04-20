# Quickstart

## 1) Prerequisites

- Node.js 20 LTS
- npm
- A Supabase project

## 2) Install

```bash
git clone https://github.com/stoimenovskiv/barOS.git
cd barOS
npm install
```

Copy env template:

- Windows (PowerShell): `Copy-Item .env.example .env.local`
- macOS/Linux: `cp .env.example .env.local`

## 3) Configure environment

Edit `.env.local` and set at minimum:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

For production-required variables, use `docs/deployment/environment.md`.

## 4) Apply database schema

Run SQL files in Supabase SQL editor in this order:

1. `schemas/01-extensions.sql`
2. `schemas/02-enums-and-types.sql`
3. `schemas/03-tables.sql`
4. `schemas/04-foreign-keys.sql`
5. `schemas/05-indexes.sql`
6. `schemas/06-functions-and-triggers.sql`
7. `schemas/07-views.sql`
8. `schemas/08-rls-policies.sql`
9. `schemas/09-grants.sql`
10. `schemas/10-seed-menu.sql`
11. `schemas/11-seed-demo-users.sql`

## 5) Run app

```bash
npm run dev
```

Open `http://localhost:3000`.

## 6) Demo users

- Admin: `admin@example.com` / `admin123`
- Customer: `customer@example.com` / `customer123`

## 7) Verify before publishing

```bash
npm run verify:all
npm run test:ci
```

## 8) Common issues

- **Invalid API key / auth errors**: verify `.env.local` values match your Supabase project.
- **Database errors after startup**: ensure SQL files were applied in numeric order with no skipped file.
- **Schema mismatch in verification**:
  - Run `npm run verify:schema`.
  - If needed, regenerate canonical schema files from CSV:
    - `node scripts/tools/generate-canonical-schema-from-csv.mjs "C:\Users\<you>\Downloads\Supabase Snippet Schema Documentation Generator (Public Schema).csv"`
