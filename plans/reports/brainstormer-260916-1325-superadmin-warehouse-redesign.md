# Requirements & Architecture Plan: Super Admin & Warehouse Portals

**Date**: 2026-09-16 13:25  
**Slug**: `superadmin-warehouse-redesign`  
**Status**: Plan Ready for Review

---

## 1. User Directives & Goals
1. **Reset & Clean Out**:
   - Clear out all existing generic/dummy functions in Super Admin (`/admin`) and Warehouse (`/warehouse`).
2. **Realistic Roles & Dedicated Workflows**:
   - **Thủ Kho (Warehouse Master - `/warehouse`)**:
     - *Nhập kho từ Nhà Cung Cấp*: Tiếp nhận nguyên liệu tươi & khô từ NCC (Dalat Milk, Trà Tân Cương, Syrup...), quản lý giá nhập, số lô (Batch No) và hạn sử dụng.
     - *Xuất kho & Điều phối cho 5 Chi nhánh*: Tiếp nhận các phiếu đặt hàng/yêu cầu khẩn từ các quán, duyệt lệnh xuất hàng (Transfer Dispatch), tạo phiếu giao nhận.
     - *Quản lý Hạn dùng & Quy tắc FEFO/FIFO*: Cảnh báo nguyên liệu cận date (< 7 ngày, < 15 ngày, an toàn) để ưu tiên xuất trước, chống hư hỏng lãng phí.
     - *Kiểm kê định kỳ & Báo cáo hao hụt*: Đối chiếu tồn sổ sách vs tồn thực tế, ghi nhận hao hụt, đổ vỡ, hư hỏng nguyên liệu pha chế.
     - *Giám sát điều kiện bảo quản*: Nhiệt độ kho mát (2-4°C), kho đông (-18°C), độ ẩm kho khô.
   - **Super Admin (Tổng Quản Trị Hệ Thống - `/admin`)**:
     - *"User Super Admin sẽ toàn quyền được sử dụng tất cả các chức năng user còn lại"*:
       - **All-Access Role Command Hub**: Super Admin có thể truy cập tức thì và thực hiện trọn vẹn mọi tác vụ của tất cả các vai trò khác:
         - 👉 Thu ngân POS (`/pos`)
         - 👉 Bếp & Pha chế (`/kitchen`)
         - 👉 Quản lý Cửa hàng (`/manager` với Camera 5 góc, Lịch làm việc Excel ma trận)
         - 👉 Kho Tổng & Điều phối (`/warehouse`)
         - 👉 Nhân sự & Tiền lương (`/staff` & `/admin/hr`)
         - 👉 Đóng ca & Kiểm quỹ (`/shift-close`)
         - 👉 Khách hàng tự gọi món (`/customer`)
       - **Executive Multi-Branch Overview**: Báo cáo tổng hợp doanh thu 5 chi nhánh, so sánh hiệu suất, tỷ suất lợi nhuận & COGS.
       - **Quản trị Chuỗi & Phân quyền RBAC**: Quản lý chi nhánh, quản lý danh sách tài khoản & cấp quyền, Master Menu & công thức BOM định lượng, quản trị Khuyến mãi.
       - **Camera Trung tâm Toàn chuỗi**: Theo dõi camera bất kỳ chi nhánh nào trong hệ thống.
3. **Modularization Standards**:
   - Tất cả các file code đều tuân thủ quy chuẩn **< 200 dòng/file**.
