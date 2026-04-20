# Canonical Database Schema

This directory contains the canonical SQL schema for UBCRM, aligned to:

`Supabase Snippet Schema Documentation Generator (Public Schema).csv`

## Install Order

Apply files in numeric order:

1. `01-extensions.sql`
2. `02-enums-and-types.sql`
3. `03-tables.sql`
4. `04-foreign-keys.sql`
5. `05-indexes.sql`
6. `06-functions-and-triggers.sql`
7. `07-views.sql`
8. `08-rls-policies.sql`
9. `09-grants.sql`
10. `10-seed-menu.sql`
11. `11-seed-demo-users.sql`

## Notes

- `03-tables.sql` is generated from the CSV table definitions.
- `04-foreign-keys.sql` includes both check constraints and foreign keys from the CSV.
- `06-functions-and-triggers.sql` includes extracted function bodies and table triggers.
- `08-rls-policies.sql` is generated from CSV policy definitions.
- `07-views.sql` and `09-grants.sql` are generated from the same source payload.
- Demo credentials live only in `11-seed-demo-users.sql`.

## Regeneration

Regenerate canonical files from the CSV:

```bash
node scripts/tools/generate-canonical-schema-from-csv.mjs "C:\Users\<you>\Downloads\Supabase Snippet Schema Documentation Generator (Public Schema).csv"
```

## Validation

Run:

```bash
npm run verify:schema
```

This checks tables, policies, foreign keys, checks, indexes, triggers, views, and functions against the CSV source.
