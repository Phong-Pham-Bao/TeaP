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

## API Documentation

Swagger UI available at: `http://localhost:3000/api/docs`

## Default Accounts (Seed Data)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@teap.vn | Admin@123 |
| Manager | manager@teap.vn | Manager@123 |
| Cashier | cashier@teap.vn | Cashier@123 |
| Warehouse | warehouse@teap.vn | Warehouse@123 |
| Accountant | accountant@teap.vn | Accountant@123 |
| HR | hr@teap.vn | Hr@123 |
