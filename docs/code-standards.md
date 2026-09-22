# TeaP Code Standards & Agent Guidelines

## 1. Modularization & File Size Policy
- **Maximum 200 Lines**: Any code file approaching or exceeding 200 lines must be split into dedicated, focused sub-modules.
- **Component Breakdown**:
  - Break monolithic pages into separate widgets and feature folders.
  - Isolate business logic into service classes or custom hooks.
  - Keep utilities, DTOs, and types in distinct files.

## 2. Naming Conventions
- **Files & Folders**: Always use lowercase `kebab-case` with descriptive names that make the file's responsibility obvious.
- **TypeScript Symbols**:
  - PascalCase for Classes, Interfaces, Types, Enums, and React Components.
  - camelCase for functions, variables, methods, and properties.
  - UPPER_SNAKE_CASE for constants.

## 3. Architecture & Coding Principles
- **KISS, DRY, YAGNI**: Keep designs focused on immediate requirements without unnecessary over-engineering.
- **No Simulation / Mocks**: All implementation must be genuine, working, and compilable code.
- **Data Integrity**: Wrap multi-step database mutations in Prisma `$transaction` blocks.
- **Error Handling**: Use explicit NestJS HTTP exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`).
- **Security**: Never expose or commit credentials, secrets, or raw passwords. Always hash passwords with bcrypt.

## 4. Workspaces & Agent Rules
- Follow guidelines in `.agents/skills`:
  - `frontend-design`: Craft tailored, distinctive, and accessible UI.
  - `vercel-react-best-practices`: Keep client components lightweight, memoize when necessary.
  - `supabase-postgres-best-practices`: Adhere to relational integrity, indexing, and performant SQL queries.
  - `agent-browser`: Validate user flows via automated browser inspections.
