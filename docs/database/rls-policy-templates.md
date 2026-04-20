# RLS policy templates

Standard patterns for `public` tables using helpers from `schemas/04-security-policies.sql` (`is_admin()`, `is_staff()`, `is_customer()`, `get_user_customer_id()`, `(select auth.uid())` where initplan optimization matters).

## Read for members of an organization (future)

When `organization_id` exists on the row:

```sql
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT ul.organization_id FROM user_locations ul
    WHERE ul.profile_id = get_user_profile_id()
  )
);
```

Until `user_locations` is populated for all tenants, fall back to `is_staff()` for operational tables.

## Staff operational CRUD

```sql
FOR ALL TO authenticated
USING (is_staff())
WITH CHECK (is_staff());
```

Use for POS, procurement, and back-office tables that must not be writable by customers.

## Customer self-access

```sql
FOR SELECT TO authenticated
USING (customer_id = get_user_customer_id());
```

Pair with separate `INSERT`/`UPDATE` policies with `WITH CHECK (customer_id = get_user_customer_id())` when customers create their own rows.

## Admin-only destructive actions

```sql
FOR DELETE TO authenticated
USING (is_admin());
```

Prefer `FOR ALL USING (is_admin())` only when the table is strictly admin-scoped (e.g. `webhooks`).

## Audit and compliance

- `audit_logs`: insert via **service role** (application writer); `SELECT` restricted to `is_admin()` as in existing policies.
- Append-only tables: `FOR INSERT` allowed for service paths; deny `UPDATE`/`DELETE` for `authenticated` except `is_admin()` maintenance.

## Testing checklist

For each new policy set:

1. Positive: staff user in org A can `SELECT`/`UPDATE` rows for org A.
2. Negative: staff user in org A cannot read org B rows (when org columns exist).
3. Customer: can read only linked `customer_id` rows.

Record results in the PR and update the RLS matrix appendix when the track asks for it.
