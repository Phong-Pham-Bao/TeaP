# Database upgrade rehearsal

This workflow is for an approved, sanitized PostgreSQL clone only. It refuses any database whose name does not end in `_test`, any non-local host, or any run without `NODE_ENV=test`.

## Run

Set `DATABASE_URL` to the clone, then run from `backend`:

```powershell
$env:NODE_ENV = 'test'
$env:UPGRADE_REHEARSAL_ACK = 'clone-test-only'
node node_modules/ts-node/dist/bin.js scripts/rehearse-database-upgrade.ts
```

The rehearsal performs these gates without resetting the database:

1. records row counts and control totals for orders, payments, stock and points;
2. rejects known orphan relations;
3. runs normalization in dry-run mode and rejects collisions;
4. applies committed Prisma migrations with `migrate deploy`;
5. compares counts and control totals before/after;
6. checks migration drift against `schema.prisma`.

Do not use the demo seed as an upgrade mechanism. The seed is only for local/test fixtures and refuses `NODE_ENV=production`. A remote non-production seed additionally requires `ALLOW_REMOTE_DEMO_SEED=true`.

To verify that the fixture itself is repeatable on a local `_test` database:

```powershell
$env:NODE_ENV = 'test'
node node_modules/ts-node/dist/bin.js scripts/verify-seed-idempotency.ts
```

The seed verification runs the seed twice, compares entity counts, and proves that rerunning the seed does not reset an existing inventory balance.
