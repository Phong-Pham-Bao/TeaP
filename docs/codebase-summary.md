# TeaP Codebase Summary

## Project Overview
TeaP is an enterprise-grade ERP & Point of Sale (POS) solution custom-built for multi-branch bubble tea chains. It links real-time sales transactions directly to Bill of Materials (BOM) inventory deductions, multi-branch operations, employee management, and centralized analytics.

## Directory Structure

```
TeaP/
├── .agent/              # Upstream skills repository & agentic tools catalog
├── .agents/             # Active workspace skills:
│   └── skills/          # - agent-browser, frontend-design, supabase-postgres-best-practices,
│                        #   vercel-react-best-practices, web-design-guidelines
├── backend/             # NestJS Backend API (Port 3000)
│   ├── prisma/          # Prisma schema & database seeds
│   └── src/
│       ├── common/      # Guards, interceptors, filters, decorators, DTOs
│       ├── prisma/      # PrismaService & Module
│       └── modules/     # 13 Core domain modules
│           ├── auth/
│           ├── branches/
│           ├── categories/
│           ├── customers/
│           ├── finance/
│           ├── hr/
│           ├── inventory/
│           ├── pos/
│           ├── products/
│           ├── promotions/
│           ├── recipes/
│           ├── reports/
│           └── users/
├── frontend/            # Next.js 14 App Router (Port 3001)
│   └── src/
│       ├── app/         # Routes: admin, customer, hr, kitchen, login, manager,
│       │                # order-history, pos, shift-close, staff
│       └── lib/         # Axios API client, AuthContext
├── docker-compose.yml   # Postgres 16, Redis 7, Adminer
├── plans/               # Task plans and structured reports
├── docs/                # System documentation and guidelines
└── README.md            # Quick start and seed credentials
```

## Key Workflows
1. **POS Checkout & Inventory BOM Deduction**:
   - Cashier builds an order with drink options (size, ice, sugar, toppings).
   - Checkout acquires a row-level lock on branch inventory (`SELECT FOR UPDATE`).
   - Recipe items define raw material consumption; stock ledgers record the audit trail.
   - Low-stock events are dispatched to a Bull Queue for asynchronous notifications.
2. **Customer Loyalty**:
   - Automatic point calculation on checkout.
   - Point balance deduction upon voucher or discount redemption.
3. **HR & Work Schedules**:
   - Shift check-in/out with automated work hour computation.
   - Monthly salary slips calculation based on base wage, bonus, and deductions.
4. **Finance & Cash Flow**:
   - Tracking daily register movements, petty cash, revenue, and expenses per branch.
