# Báo Cáo Triển Khai: Phân Bổ Công Việc Dự Án TeaP Lên JIRA

- **Ngày thực hiện**: 27/09/2026
- **Thời gian**: 10:02
- **Mã định danh**: `jira-backlog-and-work-distribution`
- **Người thực hiện**: Antigravity Assistant

---

## 1. Mục Tiêu & Kết Quả Đạt Được

Chuyển hóa toàn bộ kiến trúc mã nguồn và nghiệp vụ của dự án **TeaP** (Fullstack POS, Kitchen KDS, Warehouse BOM, Store Manager Operations, Staff Portal, Admin ERP) thành hệ thống quản lý công việc chuẩn Agile / Scrum trên **JIRA**.

Đã tạo thành công 2 tài nguyên phục vụ trực tiếp cho đội ngũ:
1. [jira-work-distribution.md](file:///d:/D%E1%BB%B1%20%C3%81n/AI/TeaP/docs/jira-work-distribution.md): Tài liệu đặc tả WBS, chi tiết từng Epic, User Story, Tiêu chí nghiệm thu (AC), phân bổ vai trò và kế hoạch 3 Sprints.
2. [jira-import-teap.csv](file:///d:/D%E1%BB%B1%20%C3%81n/AI/TeaP/docs/jira-import-teap.csv): File dữ liệu định dạng chuẩn của Jira External System Import, cho phép nhập tự động toàn bộ Epics, Stories, Task, Points, Components và Sprints vào Jira trong 1 cú click.

---

## 2. Bảng Phân Bổ Epics & Story Points

| Epic ID | Tên Epic | Số Stories/Tasks | Tổng Story Points | Sprint |
|---|---|---|---|---|
| `TEAP-EPIC-1` | Core Foundation & Auth | 2 | 10 pts | Sprint 1 |
| `TEAP-EPIC-2` | POS & Kitchen Display (KDS) | 4 | 21 pts | Sprint 1 & 2 |
| `TEAP-EPIC-3` | Inventory & BOM Recipes | 3 | 18 pts | Sprint 2 |
| `TEAP-EPIC-4` | Store Manager Operations | 4 | 23 pts | Sprint 2 |
| `TEAP-EPIC-5` | Staff Self-Service Portal | 3 | 11 pts | Sprint 1 |
| `TEAP-EPIC-6` | Customer Portal & Loyalty | 2 | 8 pts | Sprint 3 |
| `TEAP-EPIC-7` | Central Admin & Executive ERP | 3 | 18 pts | Sprint 3 |
| **Tổng cộng** | **7 Epics** | **21 Items Lõi** | **109 Story Points** | **6 Tuần (3 Sprints)** |

---

## 3. Các Bước Thao Tác Với File CSV

1. Truy cập Jira Software $\rightarrow$ **Settings** $\rightarrow$ **System** $\rightarrow$ **External System Import** $\rightarrow$ Chọn **CSV**.
2. Tải lên file [jira-import-teap.csv](file:///d:/D%E1%BB%B1%20%C3%81n/AI/TeaP/docs/jira-import-teap.csv).
3. Khớp các trường tự động theo hướng dẫn trong [jira-work-distribution.md](file:///d:/D%E1%BB%B1%20%C3%81n/AI/TeaP/docs/jira-work-distribution.md).
4. Bấm **Begin Import**.
