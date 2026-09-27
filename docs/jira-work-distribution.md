# Hướng Dẫn Phân Bổ Công Việc Dự Án TeaP Trên JIRA

Tài liệu này cung cấp toàn bộ cấu trúc phân rã công việc (Work Breakdown Structure - WBS), danh mục Epics, User Stories, Tasks kỹ thuật, điểm Story Points, phân bổ Sprint và hướng dẫn nhập (import) tự động vào Jira.

---

## 1. Tổng Quan Cấu Trúc Dự Án Trên JIRA

* **Tên Dự Án (Project Name)**: `TeaP - POS & F&B ERP Management System`
* **Mã Dự Án (Project Key)**: `TEAP`
* **Mô Hình (Methodology)**: Scrum (3 Sprints, mỗi Sprint 2 tuần)
* **Các Vai Trò Phân Bổ (Project Roles)**:
  * **TL**: Tech Lead / Solution Architect
  * **BE**: Backend Developer (NestJS, Prisma, PostgreSQL, Redis)
  * **FE**: Frontend Developer (Next.js, React, TailwindCSS)
  * **FS**: Fullstack Developer
  * **QA**: QA / Manual & Automation Tester

---

## 2. Danh Mục 7 Epics Trọng Tâm

| Mã Epic | Tên Epic | Phạm Vi Phân Hệ | Mục Tiêu Chính |
|---------|----------|-----------------|----------------|
| **TEAP-EPIC-1** | Core Foundation & Auth | Hạ tầng & Phân quyền | CSDL PostgreSQL, NestJS API Gateway, JWT RBAC, Docker |
| **TEAP-EPIC-2** | POS & Kitchen Display (KDS) | Bán hàng & Bếp | Giao diện Order 5/5, thanh toán, kết ca, màn hình bếp |
| **TEAP-EPIC-3** | Inventory & BOM Recipes | Kho & Công thức | Nhập/xuất kho, định lượng nguyên liệu trừ tự động, hạn dùng |
| **TEAP-EPIC-4** | Store Manager Operations | Quản lý cửa hàng | Lịch Excel, KPI nhân viên, đào tạo C-B-A, camera, checklist |
| **TEAP-EPIC-5** | Staff Self-Service Portal | Cổng nhân sự | Xem ca làm, chấm công, bảng lương, hồ sơ, thông báo |
| **TEAP-EPIC-6** | Customer Portal & Loyalty | Khách hàng & Kiosk | Menu điện tử, đặt món tại bàn/kiosk, tích điểm thành viên |
| **TEAP-EPIC-7** | Central Admin & Executive ERP | Quản trị chuỗi | Dashboard P&L, quản lý chi nhánh, phân quyền RoleHub, CCTV |

---

## 3. Chi Tiết Danh Sách User Stories & Tiêu Chí Nghiệm Thu (AC)

### 🌟 EPIC 1: Core Foundation & Auth (`TEAP-EPIC-1`)

#### `TEAP-101`: Thiết kế Database Schema hoàn chỉnh với Prisma ORM
* **Loại**: Task | **Điểm**: 5 | **Phụ trách**: BE / TL | **Sprint**: Sprint 1
* **Mô tả**: Xây dựng toàn bộ schema dữ liệu: Users, Roles, Branches, Products, Recipes, Stock, Orders, HR, Finance.
* **Tiêu chí nghiệm thu (AC)**:
  1. File `schema.prisma` đầy đủ quan hệ giữa các bảng.
  2. Tạo migration `prisma migrate dev` chạy mượt mà không lỗi foreign key.
  3. Seed dữ liệu mẫu (`prisma/seed.ts`) cho đầy đủ 6 vai trò: Super Admin, Manager, Cashier, Warehouse, Accountant, HR.

#### `TEAP-102`: Hệ thống xác thực JWT & Phân quyền RBAC Guard
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: BE | **Sprint**: Sprint 1
* **Mô tả**: Là người dùng hệ thống, tôi cần đăng nhập bằng email/mật khẩu và nhận token chứa quyền hạn (roles) để truy cập đúng các trang được phép.
* **Tiêu chí nghiệm thu (AC)**:
  1. API `/auth/login` trả về access token & refresh token.
  2. Guard `@Roles()` chặn các truy cập trái phép với mã lỗi 403 Forbidden.
  3. Frontend tự động điều hướng đúng trang theo role (ví dụ: Staff vào `/staff`, Manager vào `/manager`).

---

### 🌟 EPIC 2: POS & Kitchen Display (`TEAP-EPIC-2`)

#### `TEAP-201`: Giao diện Bán hàng POS chia tỷ lệ 5/5 tối ưu trải nghiệm
* **Loại**: Story | **Điểm**: 8 | **Phụ trách**: FE | **Sprint**: Sprint 1
* **Mô tả**: Là thu ngân, tôi cần giao diện bán hàng chia đôi 5/5 cân đối (50% danh mục/món, 50% giỏ hàng & thanh toán) để thao tác nhanh không bị che khuất.
* **Tiêu chí nghiệm thu (AC)**:
  1. Màn hình phân cuộn dọc mượt mà cho danh sách sản phẩm.
  2. Bấm vào sản phẩm mở tùy chọn chọn size, topping, đường/đá mà không bị nhảy cuộn trang.
  3. Thao tác thêm/bớt/xóa món cập nhật ngay tổng tiền tạm tính.

#### `TEAP-202`: Xử lý Đơn hàng & Thanh toán đa phương thức
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FS | **Sprint**: Sprint 1
* **Mô tả**: Là thu ngân, tôi muốn chọn hình thức thanh toán (Tiền mặt, QR Chuyển khoản, Tích điểm) và in hóa đơn cho khách.
* **Tiêu chí nghiệm thu (AC)**:
  1. Tính chính xác tiền thừa trả lại cho khách khi nhập tiền mặt.
  2. Hiển thị mã QR động theo đúng số tiền đơn hàng khi chọn chuyển khoản.
  3. Lưu trạng thái đơn hàng thành `COMPLETED` và lưu lịch sử hóa đơn.

#### `TEAP-203`: Màn hình Điều phối Bếp / Pha chế (KDS)
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FE / BE | **Sprint**: Sprint 2
* **Mô tả**: Là nhân viên pha chế, tôi muốn xem danh sách các đơn vừa order theo thời gian thực để tiến hành pha chế theo thứ tự.
* **Tiêu chí nghiệm thu (AC)**:
  1. Đơn mới xuất hiện tức thì trên màn hình `/kitchen`.
  2. Bấm nút chuyển trạng thái từ `Chờ làm` $\rightarrow$ `Đang pha chế` $\rightarrow$ `Đã xong`.
  3. Đơn đã xong tự động chuyển sang trạng thái chờ giao khách.

#### `TEAP-204`: Báo cáo Kết ca (Shift Close) và Kiểm kê két tiền
* **Loại**: Story | **Điểm**: 3 | **Phụ trách**: FE / BE | **Sprint**: Sprint 1
* **Mô tả**: Là thu ngân hết ca, tôi cần khai báo số tiền mặt thực tế trong két và đối soát với doanh thu hệ thống để bàn giao cho ca sau.
* **Tiêu chí nghiệm thu (AC)**:
  1. Tính chênh lệch giữa tiền thực tế và tiền hệ thống ghi nhận.
  2. Lưu biên bản kết ca vào CSDL và xuất phiếu in kết ca.

---

### 🌟 EPIC 3: Inventory & BOM Recipes (`TEAP-EPIC-3`)

#### `TEAP-301`: Thiết lập Công thức Định lượng (Bill of Materials - BOM)
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: BE / FE | **Sprint**: Sprint 2
* **Mô tả**: Là quản lý menu, tôi muốn cài đặt mỗi món (ví dụ Trà sữa Oolong L) gồm bao nhiêu ml cốt trà, gam sữa bột, ml nước đường và trân châu.
* **Tiêu chí nghiệm thu (AC)**:
  1. Giao diện quản lý công thức cho phép thêm nhiều nguyên vật liệu với định lượng và đơn vị đo chuẩn (ml, g).
  2. Validate công thức không được để trống số lượng hoặc nguyên liệu trùng lặp.

#### `TEAP-302`: Xử lý trừ kho tự động qua Queue khi POS bán hàng
* **Loại**: Task | **Điểm**: 8 | **Phụ trách**: BE | **Sprint**: Sprint 2
* **Mô tả**: Khi có đơn hàng POS hoàn thành, hệ thống tự động đưa sự kiện vào Redis Queue để trừ kho nguyên liệu theo BOM.
* **Tiêu chí nghiệm thu (AC)**:
  1. Áp dụng Bull Queue / Background processor để trừ kho bất đồng bộ, không làm đơ POS.
  2. Tạo bản ghi biến động trong bảng `StockLedger` (ghi rõ lý do: Bán hàng đơn #ID).
  3. Gửi cảnh báo về giao diện quản lý nếu tồn kho xuống dưới mức an toàn.

#### `TEAP-303`: Nghiệp vụ Nhập - Xuất - Chuyển kho & Kiểm kê
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FS | **Sprint**: Sprint 2
* **Mô tả**: Là nhân viên kho, tôi cần tạo phiếu nhập nguyên liệu từ nhà cung cấp, chuyển kho giữa các chi nhánh và tạo phiếu kiểm kê định kỳ.
* **Tiêu chí nghiệm thu (AC)**:
  1. Phiếu nhập tự động cộng tồn kho và cập nhật giá vốn trung bình.
  2. Kiểm kê (Stocktake) hiển thị chênh lệch thừa/thiếu giữa sổ sách và thực tế.
  3. Cảnh báo các lô hàng sắp hết hạn sử dụng (Expiry tracking).

---

### 🌟 EPIC 4: Store Manager Operations (`TEAP-EPIC-4`)

#### `TEAP-401`: Bảng phân bổ Lịch làm việc Excel trực quan
* **Loại**: Story | **Điểm**: 8 | **Phụ trách**: FE / BE | **Sprint**: Sprint 2
* **Mô tả**: Là Quản lý cửa hàng, tôi muốn xem và xếp ca làm việc cho nhân sự của riêng cửa hàng mình theo dạng lưới Excel 7 ngày trong tuần.
* **Tiêu chí nghiệm thu (AC)**:
  1. Hiển thị lưới thứ 2 đến Chủ nhật với các ca: Sáng, Chiều, Tối.
  2. Gán vị trí cho từng nhân sự trong ca (Pha chế chính, Thu ngân, Đọc bill...).
  3. Cho phép copy lịch tuần trước sang tuần này và xuất dữ liệu ra file Excel.

#### `TEAP-402`: Quản lý Nhân sự tại điểm, Điểm KPI, Chuyên cần & Vi phạm
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FS | **Sprint**: Sprint 2
* **Mô tả**: Là Quản lý cửa hàng, tôi cần theo dõi danh sách nhân viên của cửa hàng, chấm điểm KPI, theo dõi giờ đi trễ và ghi nhận biên bản vi phạm nội quy.
* **Tiêu chí nghiệm thu (AC)**:
  1. Chỉ hiển thị nhân viên thuộc chi nhánh mà Manager đó quản lý (multi-tenant branch scope).
  2. Ghi nhận điểm chuyên cần (dựa trên dữ liệu chấm công) và điểm đánh giá thái độ.

#### `TEAP-403`: Quản lý Lộ trình Đào tạo & Bài test nâng bậc C - B - A
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FS | **Sprint**: Sprint 2
* **Mô tả**: Là Quản lý cửa hàng, tôi muốn phân loại nhân sự mới (Hội nhập, Thử việc) và theo dõi lộ trình bài test thi tay nghề thăng bậc C $\rightarrow$ B $\rightarrow$ A.
* **Tiêu chí nghiệm thu (AC)**:
  1. Hiển thị danh sách nhân sự thử việc và tiến độ hoàn thành các học phần hội nhập.
  2. Lưu kết quả thi lý thuyết pha chế và đánh giá thực hành của Quản lý.

#### `TEAP-404`: Checklist Vận hành hàng ngày (Mở ca, Giữa ca, Đóng ca) & Soát Bill POS
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FE / BE | **Sprint**: Sprint 2
* **Mô tả**: Là Quản lý, tôi cần kiểm tra danh sách checklist vệ sinh an toàn, máy móc và có công cụ tra cứu lại hóa đơn POS để giải quyết khiếu nại khách hàng.
* **Tiêu chí nghiệm thu (AC)**:
  1. Checklist chia theo các khung giờ: Đầu ca (vệ sinh, kiểm tra tủ lạnh), Đóng ca (tắt điện, rửa máy).
  2. Công cụ tra cứu bill POS cho phép tìm theo mã bill, giờ bán và xem chi tiết danh sách món để xử lý nếu có món bị sót.

---

### 🌟 EPIC 5: Staff Self-Service Portal (`TEAP-EPIC-5`)

#### `TEAP-501`: Trang tổng quan & Xem Lịch làm việc cá nhân
* **Loại**: Story | **Điểm**: 3 | **Phụ trách**: FE | **Sprint**: Sprint 1
* **Mô tả**: Là nhân viên, tôi muốn vào tài khoản của mình thấy ngay ca làm việc hôm nay và toàn bộ lịch làm trong tuần đã được Quản lý duyệt.
* **Tiêu chí nghiệm thu (AC)**:
  1. Giao diện đơn giản, thân thiện trên điện thoại di động.
  2. Hiển thị rõ giờ bắt đầu, giờ kết thúc, vị trí phân công (Ví dụ: Pha chế chính - Ca chiều).

#### `TEAP-502`: Chấm công điện tử & Bảng công tháng
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FS | **Sprint**: Sprint 1
* **Mô tả**: Là nhân viên, tôi cần bấm nút Check-in khi tới quán và Check-out khi hết ca làm để hệ thống tự động ghi nhận giờ công.
* **Tiêu chí nghiệm thu (AC)**:
  1. Chặn bấm check-in nếu chưa tới ca hoặc đã hết ca.
  2. Tổng hợp tổng số công chuẩn, số giờ làm thêm (OT) trong tháng.

#### `TEAP-503`: Tra cứu Bảng lương, Hồ sơ cá nhân & Thông báo nội bộ
* **Loại**: Story | **Điểm**: 3 | **Phụ trách**: FE / BE | **Sprint**: Sprint 1
* **Mô tả**: Là nhân viên, tôi có thể xem thông tin hợp đồng, tra cứu chi tiết phiếu lương hàng tháng và đọc các thông báo, chỉ đạo từ cấp trên.
* **Tiêu chí nghiệm thu (AC)**:
  1. Phiếu lương bảo mật, hiển thị lương cơ bản, phụ cấp, thưởng KPI và các khoản khấu trừ.
  2. Bảng tin thông báo đánh dấu trạng thái "Đã đọc".

---

### 🌟 EPIC 6: Customer Portal & Loyalty (`TEAP-EPIC-6`)

#### `TEAP-601`: Menu điện tử & Đặt món tại Kiosk
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FE | **Sprint**: Sprint 3
* **Mô tả**: Là khách hàng, tôi có thể tự xem menu hình ảnh bắt mắt, chọn mức đường đá, topping và tạo đơn hàng tại màn hình Kiosk tự phục vụ.
* **Tiêu chí nghiệm thu (AC)**:
  1. Phân nhóm danh mục rõ ràng (Trà sữa, Trà trái cây, Cà phê).
  2. Đồng bộ tồn kho: Món nào hết nguyên liệu sẽ tự động ẩn hoặc báo "Tạm hết món".

#### `TEAP-602`: Tra cứu thành viên & Tích điểm đổi quà
* **Loại**: Story | **Điểm**: 3 | **Phụ trách**: FS | **Sprint**: Sprint 3
* **Mô tả**: Là khách hàng thân thiết, tôi nhập số điện thoại để tra cứu hạng thẻ (Bạc, Vàng, Kim Cương), số điểm hiện có và dùng điểm trừ tiền trực tiếp trên đơn.
* **Tiêu chí nghiệm thu (AC)**:
  1. Tích lũy điểm tự động theo tỷ lệ (ví dụ: 10,000đ = 1 điểm).
  2. Cho phép quy đổi điểm thưởng sang voucher giảm giá hoặc quà tặng.

---

### 🌟 EPIC 7: Central Admin & Executive ERP (`TEAP-EPIC-7`)

#### `TEAP-701`: Dashboard Báo cáo Doanh thu & Dòng tiền Toàn chuỗi
* **Loại**: Story | **Điểm**: 8 | **Phụ trách**: FE / BE | **Sprint**: Sprint 3
* **Mô tả**: Là Chủ chuỗi / Ban điều hành, tôi cần xem biểu đồ doanh thu theo thời gian thực, chi nhánh có doanh số cao nhất và dòng tiền thu/chi lãi lỗ.
* **Tiêu chí nghiệm thu (AC)**:
  1. Biểu đồ trực quan hóa dữ liệu theo ngày/tuần/tháng/quý.
  2. So sánh hiệu quả kinh doanh giữa các chi nhánh khác nhau.
  3. Xuất báo cáo tài chính ra file Excel / PDF.

#### `TEAP-702`: Quản lý Chi nhánh, Phân quyền Phức hợp (RoleHub) & Camera CCTV
* **Loại**: Story | **Điểm**: 5 | **Phụ trách**: FS | **Sprint**: Sprint 3
* **Mô tả**: Là Super Admin, tôi muốn thêm mới chi nhánh cửa hàng, phân bổ tài khoản quản lý và giám sát luồng camera trung tâm của các cửa hàng.
* **Tiêu chí nghiệm thu (AC)**:
  1. Thêm/sửa/khóa chi nhánh và thiết lập thông tin máy in bill, két tiền.
  2. Cấp phát và thu hồi quyền hạn chi tiết cho từng nhóm nhân viên qua RoleHub.
  3. Màn hình CCTV giám sát trạng thái kết nối camera các điểm.

---

## 4. Phân Bổ Sprint 1 - 2 - 3 (Sprint Roadmap)

| Sprint | Thời gian (Dự kiến) | Mục Tiêu Sprint | Danh Sách Tickets | Tổng Story Points |
|---|---|---|---|---|
| **Sprint 1** | Tuần 1 - 2 | **Cốt Lõi & Bán Hàng Cơ Bản**: CSDL, Auth, POS 5/5, Thanh toán, Portal Nhân sự cơ bản | TEAP-101, TEAP-102, TEAP-201, TEAP-202, TEAP-204, TEAP-501, TEAP-502, TEAP-503 | **37 Points** |
| **Sprint 2** | Tuần 3 - 4 | **Vận Hành Điểm & Kho Bãi**: Portal Quản lý (Lịch Excel, Đào tạo C-B-A, KPI), Định lượng BOM, KDS Bếp, Quản lý Kho | TEAP-203, TEAP-301, TEAP-302, TEAP-303, TEAP-401, TEAP-402, TEAP-403, TEAP-404 | **44 Points** |
| **Sprint 3** | Tuần 5 - 6 | **Mở Rộng & Điều Hành**: Cổng Khách hàng Kiosk, Dashboard Admin Toàn chuỗi, Báo cáo P&L, CCTV, UAT & Triển khai | TEAP-601, TEAP-602, TEAP-701, TEAP-702, Testing & Hardening | **32 Points** |

---

## 5. Hướng Dẫn Import Tự Động File `.csv` Vào JIRA

Dự án đã tạo sẵn file mẫu chuẩn quốc tế: `docs/jira-import-teap.csv`. Bạn chỉ cần làm theo 4 bước sau để đẩy toàn bộ lên Jira trong 1 phút:

1. **Đăng nhập vào Jira Software** với quyền Admin dự án.
2. Bấm vào biểu tượng **Bánh răng (Settings)** ở góc trên bên phải $\rightarrow$ chọn **System** $\rightarrow$ chọn **External System Import** $\rightarrow$ chọn **CSV**.
3. Tải lên file: `D:\Dự Án\AI\TeaP\docs\jira-import-teap.csv`.
4. Trong bước cấu hình ánh xạ trường (Field Mapping):
   * `Issue Type` $\rightarrow$ Ánh xạ vào `Issue Type` (Epic, Story, Task)
   * `Summary` $\rightarrow$ Ánh xạ vào `Summary`
   * `Description` $\rightarrow$ Ánh xạ vào `Description`
   * `Epic Name` $\rightarrow$ Ánh xạ vào `Epic Name`
   * `Epic Link` $\rightarrow$ Ánh xạ vào `Epic Link`
   * `Story Points` $\rightarrow$ Ánh xạ vào `Story Points`
   * `Priority` $\rightarrow$ Ánh xạ vào `Priority`
   * `Sprint` $\rightarrow$ Ánh xạ vào `Sprint`
   * `Component` $\rightarrow$ Ánh xạ vào `Component/s`
5. Bấm **Begin Import** $\rightarrow$ Tất cả các Epics, User Stories và Sprints sẽ lập tức xuất hiện đầy đủ và ngay ngắn trên Jira Board của bạn!
