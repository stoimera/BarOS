# Operations RBAC matrix (Track 5)

Source of truth for permission strings is `OperationsPermission` in `src/types/operations.ts`. Role grants are defined in `src/lib/security/permissions.ts` (`rolePermissions` and `OPERATIONS_PERMISSION_MATRIX`).

## Role grants

| Role       | Notes |
| ---------- | ----- |
| `admin`    | Full operations catalog including `locations.write`. |
| `staff`    | Operational day-to-day permissions; no `locations.write` by default. Has `compliance.read` / `compliance.write` for consent ledger and retention-related append flows where applicable. |
| `customer` | No operations permissions. |

## Location scope (5.5)

- **Staff**: Resolved from `staff.location_id`. Optional `X-Location-Id` or `?location_id=` must match assignment; mismatch returns **403**. If `staff.location_id` is null, APIs that use `requireLocationScoped: true` return **403** until an admin sets it (`PATCH /api/operations/admin/staff/[id]` with `locations.write` + admin).
- **Admin**: No row filter unless a location header/query is sent; value must exist in `locations` or **400**.

### Routes using `requireLocationScoped: true` (non-exhaustive)

- Orders: `GET/POST /api/operations/orders`, `GET/PATCH /api/operations/orders/[id]`, `GET /api/operations/orders/list`, items/split/tips/events sub-routes.
- Payments: `GET/POST /api/operations/payments`, `PATCH /api/operations/payments/[id]`.
- Tabs: `POST /api/operations/tabs` (when `order_id` is set, order must match scope).
- Procurement / stock: purchase orders, stocktakes, inventory-waste (lists and mutations scoped by `location_id` / joins).
- Event commerce: ticket sales, promo codes, check-in, ticket tiers (lists and mutations gated by `events.location_id` where set).
- Admin staff listing/assignment: `GET /api/operations/admin/staff`, `PATCH /api/operations/admin/staff/[id]` (admin + `locations.read` / `locations.write`).

## Partition keys (5.8)

Apply migrations in order (including legacy Track 5 slices):

- `schemas/22-track5-location-scoping.sql` — `orders.location_id`
- `schemas/23-track5-rbac-partitioning.sql` — `inventory.location_id`, `purchase_orders.location_id`
- `schemas/24-track5-events-location-partition.sql` — `events.location_id` (event-commerce venue scoping)
- `schemas/25-track6-event-commerce-inventory.sql` — ticket tier `reserved_count`, sale `purchase_source` / `checkin_token_hash`, promo `max_uses_per_customer` (Track 6; run for full event-commerce behavior)
- `schemas/26-track7-staff-time.sql` — attendance / timesheet lifecycle (Track 7)
- `schemas/27-track8-compliance-dsar.sql` — legal hold on `customers`, `compliance_retention_runs`, append-only staff policies on `marketing_consent_events` (Track 8)

`organization_id` is reserved for multi-tenant expansion; bar deployments may leave it null until a dedicated migration adds it.

## Payments note

Creating a payment (`POST /api/operations/payments`) requires **`orders.write`** (settlement flows may use `orders.settle` on other routes). See route `withSecurity` options in `src/app/api/operations/payments/route.ts`.

## Verification

```bash
npm run verify:all
npm run test:ci
```
