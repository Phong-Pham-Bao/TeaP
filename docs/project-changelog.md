# TeaP Project Changelog

## [2026-09-16] - Super Admin All-Access Hub & Central Warehouse Portal Overhaul

### Added
- **Super Admin Master All-Access Command Hub** (`admin-role-hub.tsx`, `admin/layout.tsx`):
  - Granted Super Admin full operational authority to switch to and operate all other system portals directly: POS Cashier (`/pos`), Kitchen KDS (`/kitchen`), Store Manager (`/manager`), Warehouse (`/warehouse`), Staff HR (`/staff`), Shift Close (`/shift-close`), Customer Kiosk (`/customer`), and Order History (`/order-history`).
  - Chain Executive Dashboard (`admin-executive-dashboard.tsx`): Real-time consolidated metrics across 5 branches (revenue, order counts, COGS %, loyalty members).
  - Multi-Branch CCTV Surveillance Center (`admin-cctv-center.tsx`): Centralized monitoring of all 5 branch camera streams with branch switcher and live feeds.
  - Multi-Branch Management (`admin-branches-tab.tsx`): Real-time store status control (open/close) and store manager assignments.
  - RBAC User & Role Administration (`admin-users-tab.tsx`): User account management, role permissions, and one-click account locking.
  - Master Recipe & Menu BOM Management (`admin-menu-bom-tab.tsx`): Master drink catalog with exact raw material subtraction recipes (tea base, syrup, milk, creamer).
- **Central F&B Warehouse Portal** (`/warehouse`):
  - IoT Storage Condition Monitoring (`warehouse-header.tsx`): Cold room (3.2°C), Freezer (-18.5°C), and Dry room humidity (54%) environmental tracking.
  - Branch Requisition & Dispatching (`warehouse-dispatch-tab.tsx`): Direct dispatch order processing for 5 chain stores with 1-click transit creation and packing slip printing.
  - Supplier Inward PO Receipts (`warehouse-receipts-tab.tsx`): Raw material receiving with mandatory Lot/Batch Number and Expiry Date tracking.
  - FEFO Expiry Date Tracker (`warehouse-expiry-tab.tsx`): First-Expired-First-Out management with automatic critical warnings (< 7 days) and prioritized dispatch routing.
  - Periodic Stocktake & Variance Audit (`warehouse-stocktake-tab.tsx`): Physical vs system stock reconciliation with spillage/shrinkage cause recording.

### Refactored
- **Clean Overhaul**:
  - Removed all old, generic, and unspecialized placeholder functions in `/admin` and `/warehouse`.
  - Fully modularized all components: every single code file in `/admin/components/` and `/warehouse/components/` strictly adheres to the < 200 lines limit.
  - Extracted login hero demo account panel into `login-hero-panel.tsx` (< 90 lines) and updated routing logic in `login/page.tsx` and `app/page.tsx`.

## [2026-09-16] - Store Manager Portal Redesign & Excel Shift Matrix

### Added
- **Excel-Style 31-Day Shift Matrix** (`manager-excel-schedule.tsx`):
  - Formatted strictly according to operational specs with fixed sticky columns: `STT`, `BẬC`, `HỌ & TÊN`, `VỊ TRÍ`, `CHẾ ĐỘ / GIỜ`.
  - 31 day columns with day-of-week header rows (highlighting weekends in red).
  - Single-click toggle for `OFF` (Yellow `X` badge) as requested.
  - Multi-shift badge selection: `ĐB` (Green), `TN` (Pink), `KK` (Blue), `10-18H` (Orange), `PCP` (Teal).
  - Auto-calculated summary columns: Total work shifts and Total OFF count per employee.
  - CSV/Excel export and local persistence.
- **Store CCTV Surveillance Center** (`manager-camera-monitor.tsx`):
  - Multi-camera surveillance system with 5 store camera feeds (POS Counter, Drink Bar & Kitchen, Dining Hall, Cold Storage, Entrance/Parking).
  - Live timestamp overlay, blinking REC status, 1080p 30fps resolution indicators.
  - Grid view (4/5 cams) and Focused single-cam view with fullscreen expansion and snapshot capability.
- **Live Branch Operations Tab** (`manager-operations-tab.tsx`):
  - Real-time in-store attendance tracking (checked-in staff and active stations).
  - Urgent stock shortage alerts with 1-click reorder requests sent to central warehouse.
  - Live branch order stream.
- **Store Safety & Shift Checklist** (`manager-checklist-tab.tsx`):
  - Standardized opening and closing shift inspection checklists.
  - HACCP hygiene protocols and in-store incident logging.

### Refactored
- **Code Modularization**:
  - Modularized `frontend/src/app/manager/page.tsx` from 1,274 lines down to 110 lines.
  - Extracted 7 dedicated components into `frontend/src/app/manager/components/`, each strictly complying with the < 200 lines limit.
