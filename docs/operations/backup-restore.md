# Backup and Restore Playbook

## Targets
- **RPO**: 15 minutes
- **RTO**: 60 minutes

## Backup Strategy
- Daily full logical backup of PostgreSQL.
- 15-minute WAL/archive continuous backup.
- Weekly restore validation in non-production.

## Restore Procedure
1. Freeze writes at application layer.
2. Select restore point timestamp.
3. Restore full backup to clean instance.
4. Replay WAL/archive to target timestamp.
5. Run data-integrity smoke checks:
   - row counts on critical tables
   - referential integrity checks
   - API health and login checks
6. Re-enable traffic progressively.

## Validation Checklist
- `profiles`, `customers`, `bookings`, `events`, `inventory` readable.
- Latest 24h writes present.
- Auth and role checks functioning.
- Error rate and latency baseline recovered.

## Rollback
- Keep source instance untouched until cutover is verified.
- If validation fails, switch traffic back and rerun restore with earlier snapshot.

## Drill cadence (Track 9.5)

- **Quarterly**: full restore to an isolated Supabase branch or staging project from the latest daily backup + WAL point no older than RPO.
- **Monthly**: logical export integrity check (checksum sample on critical tables) without full cutover.

## Evidence template (dry-run)

| Field | Value |
| --- | --- |
| Drill date | |
| Operator | |
| Backup source id / snapshot | |
| Restore target (project ref) | |
| RPO achieved (max data lag) | |
| RTO achieved (time to ready queries) | |
| Smoke checks (login, booking list, order open) | pass / fail |
| Notes | |
