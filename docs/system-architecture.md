# TeaP System Architecture

## Architecture Diagram

```
+-------------------------------------------------------------+
|                      Clients / Frontend                     |
|                 Next.js 14 (Port 3001)                      |
|   POS Terminal | Kitchen Display | Customer Kiosk | Admin   |
+------------------------------+------------------------------+
                               | REST API (HTTP / JSON)
                               v
+-------------------------------------------------------------+
|                     NestJS Backend (Port 3000)              |
|   +-----------------------------------------------------+   |
|   |  Global Guards: JwtAuthGuard, RolesGuard            |   |
|   |  Global Pipes: ValidationPipe (whitelist, transform)|   |
|   +-----------------------------------------------------+   |
|   | Modules: Auth, Users, Branches, Products, Recipes,  |   |
|   |          POS, Inventory, Customers, Promos, HR,     |   |
|   |          Finance, Reports                           |   |
|   +-----------------------------------------------------+   |
+--------------+-------------------------------+--------------+
               |                               |
               v                               v
+------------------------------+ +----------------------------+
|     PostgreSQL 16 Database   | |     Redis 7 + Bull Queue   |
| (Prisma ORM, Row Locks, BOM) | |  (Inventory alerts, cache) |
+------------------------------+ +----------------------------+
```

## Security & Authentication
- **Authentication**: JWT Access Token (15 mins lifespan) paired with cryptographically secure Refresh Tokens (7 days, stored in database with revocation capabilities).
- **Authorization**: Role-Based Access Control (RBAC) via `@Roles()` decorator and `RolesGuard`.
- **API Protection**: Helmet middleware, Gzip compression, strict request DTO validation.

## Data Consistency & Concurrency
- Concurrency in high-volume POS environments is addressed via **Pessimistic Row Locking** (`SELECT ... FOR UPDATE`) in raw SQL transaction segments when writing to `inventories` and `stock_ledgers`.
