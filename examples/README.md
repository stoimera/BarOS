# Examples (Track 11.7)

## Bootstrap database

1. Apply core migrations from `schemas/` in order on a fresh Supabase project.
2. Optionally load demo data with `schemas/seed-sample-data.sql` (review before running in shared environments).

## Create an admin user

Use the repo script after migrations:

```bash
npm run create-admin
```

Follow prompts; never commit resulting credentials.
