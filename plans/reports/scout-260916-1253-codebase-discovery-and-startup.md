# Codebase Discovery & Startup Report — TeaP ERP/POS

**Date**: 2026-09-16 12:53  
**Status**: Completed Initial Audit & Dev Server Startup

---

## 1. Project Overview & Architecture

TeaP is a multi-branch ERP/POS platform designed for bubble tea chains (F&B).

### Tech Stack
- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL (16-alpine), Redis (7-alpine) with Bull Queue, Passport/JWT auth, Swagger (`/api/docs`).
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, Lucide Icons, Axios.
- **DevOps**: Docker Compose (`teap-postgres`, `teap-redis`, `teap-adminer`).

### Services & Port Mapping
- **Frontend App**: `http://localhost:3001` (Active & running)
- **Backend API**: `http://localhost:3000` (Endpoints prefix: `/api/v1`)
- **Swagger Docs**: `http://localhost:3000/api/docs`
- **Database (Postgres)**: Port 5432
- **Cache/Queue (Redis)**: Port 6379
- **Adminer DB UI**: Port 8080

---

## 2. Infrastructure & Startup Status

1. **Frontend**: Successfully started in background via `next dev -p 3001`. Tested HTTP response: returns `TeaP — Hệ thống Quản trị & Bán hàng Chuỗi Trà Sữa`.
2. **Backend**: Built successfully (`nest build` passed with 0 errors). Starts all 13 modules, route resolvers, and controllers.
3. **Database / Docker**:
   - `Docker Desktop Service` is installed but was in `Stopped` state.
   - Non-elevated shell cannot start system services directly (`System error 5: Access is denied`).
   - Action needed: User starts Docker Desktop via Windows GUI or runs terminal as Administrator to launch `docker-compose up -d`.
   - Once Postgres (5432) and Redis (6379) are active, `npx prisma db seed` and `npm run start:dev` will connect immediately.

---

## 3. Deep Analysis of Modules & Features

### Backend (`backend/src/modules/`)
1. **Auth (`/auth`)**: JWT access token (15m) + refresh token (7d) stored in DB, bcrypt password hashing, role guard, public route decorator.
2. **Branches (`/branches`)**: Multi-branch support, active flag, branch-specific inventory, orders, and cash flow.
3. **Users (`/users`)**: Role-based access: `SUPER_ADMIN`, `MANAGER`, `CASHIER`, `WAREHOUSE_STAFF`, `ACCOUNTANT`, `HR`.
4. **Categories & Products (`/categories`, `/products`)**: Drink, Topping, Material types, product sizes (S, M, L) with price adjustments.
5. **Recipes / BOM (`/recipes`)**: Bill of Materials linking drinks and sizes to specific raw materials with consumption quantities and units (ml, g, pcs).
6. **POS (`/pos`)**: Order creation, discount calculation (percentage/fixed), pessimistic locking (`SELECT ... FOR UPDATE`), automated inventory deduction upon checkout, customer loyalty point accrual (1 point per 10,000 VND), Bull queue notification for low stock.
7. **Inventory (`/inventory`)**: Stock ledger tracking (inflows, outflows, balance_after), min_stock threshold alerts, imports, adjustments, and inter-branch transfers.
8. **Customers (`/customers`)**: Phone-based loyalty lookup, point balance, point history.
9. **Promotions (`/promotions`)**: Start/end validity dates, min order requirements, max discount caps.
10. **HR (`/hr`)**: Daily check-in/check-out, working hours calculation, weekly shift scheduling, monthly salary slip generation and payment tracking, branch announcements.
11. **Finance (`/finance`)**: Cash flow logging (income/expense), branch daily/monthly financial summaries.
12. **Reports (`/reports`)**: Executive dashboard metrics, revenue charts, bestsellers, inventory valuation, cashier performance.

### Frontend Pages (`frontend/src/app/`)
- `/login`: Role quick-selection demo accounts & JWT authentication.
- `/pos`: POS terminal for cashiers, menu navigation, cart, toppings/sugar/ice customization, payment methods (Cash, MoMo, VNPay).
- `/kitchen`: Real-time order preparation board.
- `/customer`: Self-ordering kiosk / customer membership portal.
- `/order-history`: Order search, receipt reprinting, status updates.
- `/shift-close`: Shift reconciliation, cash handover, sales summaries.
- `/manager`: Branch management dashboard, revenue tracking, shift schedules.
- `/admin`: Master chain administration, products, inventory, HR, financial analytics.
- `/staff`: Employee portal for schedule checking, check-in/out, and salary slip review.

---

## 4. Analysis of `.agent` and `.agents` Rules

### Workspace `.agents/skills`:
1. `frontend-design`: Directs unique, intentional UI design; avoids generic templates; stresses typography, balanced contrast, and micro-interactions.
2. `vercel-react-best-practices`: Performance optimization for React/Next.js (bundle size, client vs server component boundaries, avoidance of unnecessary re-renders).
3. `supabase-postgres-best-practices`: Database design, indexing, foreign keys, query safety, transactions.
4. `web-design-guidelines`: Usability, UX consistency, accessibility (a11y), responsive layouts.
5. `agent-browser`: Programmatic browser automation for testing and verifying user flows.

### Repository `.agent/skills/AGENTS.md` & User Global Rules (`GEMINI.md`):
1. **File Size Limit & Modularization**: Files exceeding 200 lines must be split into logical sub-modules (e.g. `pos/page.tsx`, `manager/page.tsx` will benefit from component extraction).
2. **Naming Convention**: Kebab-case with descriptive names for files and directories.
3. **Plan & Report Convention**:
   - Plans in `./plans/{YYMMDD}-{HHMM}-{slug}/`
   - Reports in `./plans/reports/{type}-{YYMMDD}-{HHMM}-{slug}.md`
4. **Documentation**: Maintain core project docs inside `./docs/`.
5. **No Mocking**: Always implement real, compilable, and working code.
6. **Code Quality**: Proper error handling with try-catch, security standards, compilable code without syntax errors.
