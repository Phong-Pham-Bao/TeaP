# TeaP — Bubble Tea Chain ERP/POS System

A comprehensive ERP/POS system designed for multi-branch bubble tea chains.

## Tech Stack

- **Backend**: NestJS + TypeScript + Prisma + PostgreSQL
- **Cache/Queue**: Redis + Bull Queue
- **DevOps**: Docker Compose

## Quick Start

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Install backend dependencies
cd backend && npm install

# 3. Run database migrations
npx prisma migrate dev

# 4. Seed sample data
npx prisma db seed

# 5. Start development server
npm run start:dev
```

The sample seed is idempotent and intended only for local/test environments. It refuses `NODE_ENV=production`, and it never resets an existing inventory balance. Database clone upgrade rehearsal and seed verification are documented in [`backend/scripts/UPGRADE_REHEARSAL.md`](backend/scripts/UPGRADE_REHEARSAL.md).

## API Documentation

Swagger UI available at: `http://localhost:3000/api/docs`

The committed OpenAPI contract and generated frontend types are reproducible from the backend workspace:

```bash
cd backend
npm run openapi:generate
npm run openapi:check
```

`openapi:generate` updates `backend/openapi/openapi.json` and `frontend/src/lib/api-contract.generated.ts`. `openapi:check` is read-only and fails when either artifact is stale; it should run in CI before build/deploy.

## Mobile Preview

The frontend uses a same-origin `/api/v1` proxy, so a phone only needs one URL. Start the backend on port `3000`, then run the frontend on every interface:

```bash
cd frontend
npm run build
npm run start -- -H 0.0.0.0
```

For a phone on another network, create a temporary HTTPS tunnel to port `3001` (for example `npx localtunnel --port 3001 --local-host 127.0.0.1`). Use only a test database and stop the tunnel after review. LocalTunnel may show a one-time interstitial asking for the host public IP. Do not expose production seed credentials or a development database through a public tunnel.

## Default Accounts (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@teap.vn | Admin@123 |
| Manager | manager@teap.vn | Manager@123 |
| Cashier | cashier@teap.vn | Cashier@123 |
| Warehouse | warehouse@teap.vn | Warehouse@123 |
| Accountant | accountant@teap.vn | Accountant@123 |
| HR | hr@teap.vn | Hr@123 |
| Kitchen / Bar | kitchen@teap.vn | Kitchen@123 |
