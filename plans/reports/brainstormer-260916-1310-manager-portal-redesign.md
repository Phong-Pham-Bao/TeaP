# Solution Analysis & Architecture — Store Manager Portal Redesign

**Date**: 2026-09-16 13:10  
**Slug**: `manager-portal-redesign-and-excel-schedule`  
**Status**: Plan Ready for Review

---

## 1. Objectives & Scope
1. **Modernize & Polish Manager Portal UI**:
   - Professional, vibrant, high-contrast dashboard with emerald/slate theme.
   - Clean navigation tabs: *Vận hành trực tiếp (Live Operations)*, *Camera an ninh (CCTV Surveillance)*, *Lịch làm việc Excel (Excel Schedule Matrix)*, *Đội ngũ nhân sự (Staff)*, *Đào tạo & Thi bậc (Training)*, *Checklist & Kiểm tra (Store Audit)*.
2. **Interactive Live CCTV Surveillance Grid**:
   - Multi-camera angle system for the branch manager (POS counter, Bar/Kitchen, Dining floor, Raw storage, Entrance).
   - Real-time timestamp, REC indicator, PTZ controls, fullscreen, camera switcher, snapshot simulation.
3. **Excel-Style 31-Day Shift Matrix (Matching User Image 1)**:
   - Sticky frozen columns: `STT`, `BẬC` (A2, B, C...), `HỌ & TÊN`, `VỊ TRÍ` (ĐB, TN, KK, PCC...), `CHẾ ĐỘ` (CA12, CA8...).
   - Day-of-month columns (01-31) with Day-of-Week headers (color-coded weekends).
   - Click-to-toggle `OFF` (`X` in yellow badge, identical to Image 1) or assign work stations (`ĐB`, `TN`, `KK`, `10-18H`).
   - Monthly statistical summary: Total shifts, days off (`X`), working hours per employee.
   - Excel export & local persistence.
4. **Realistic Store Management Features**:
   - In-store staff presence status (Ai đang trong ca).
   - Urgent inventory shortages with 1-click requisition to central warehouse.
   - Daily store inspection & food safety checklist (Mở ca / Đóng ca).
5. **Code Modularization**:
   - Refactor `frontend/src/app/manager/page.tsx` from 1274 lines down to <150 lines by extracting focused components into `frontend/src/app/manager/components/`.
