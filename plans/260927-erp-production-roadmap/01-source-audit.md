# TeaP — Đánh giá source code và khoảng cách tới ERP vận hành thực tế

Ngày đánh giá: 27/09/2026. Phạm vi mục tiêu: ERP cho một doanh nghiệp vận hành chuỗi trà sữa, nhiều chi nhánh và kho trung tâm.

## 1. Kết luận

TeaP có nền tảng backend dùng được để tiếp tục phát triển: NestJS, Prisma/PostgreSQL, JWT, 13 module nghiệp vụ, 20 model dữ liệu, giao dịch kho và sổ biến động kho. Frontend có các cổng theo vai trò và một số luồng đã gọi API thật.

Tuy nhiên, hệ thống hiện là **prototype ERP/POS có một phần nghiệp vụ thật**, chưa đủ điều kiện gọi là ERP production. Vấn đề chính là quyền truy cập và tính nhất quán nghiệp vụ; nhiều màn hình có vẻ hoàn chỉnh nhưng không ghi vào backend. Cần sửa nền tảng trước, sau đó nối các phân hệ thành quy trình xuyên suốt.

Không đưa ra phần trăm hoàn thiện: chưa có danh mục yêu cầu được nghiệm thu và chưa chạy UAT nên con số phần trăm sẽ gây hiểu nhầm.

## 2. Phạm vi và bằng chứng kiểm tra

- Kiểm kê 149 file trong `backend/src` và `frontend/src`: 102 `.ts`, 46 `.tsx`, 1 `.css`.
- Đọc logic backend của toàn bộ 13 module, controller/DTO, auth/guards, Prisma schema, cấu hình ứng dụng; đối chiếu logic UI, API calls, local state và localStorage ở các cổng.
- Kiểm tra seed/script chuẩn hóa, package manifests, Docker Compose, README và tài liệu kiến trúc/tiêu chuẩn hiện có. Danh mục file quét nằm trong `source-inventory.csv`.
- Đánh giá là static review; đọc sâu các luồng ghi dữ liệu, tiền, kho, quyền và tích hợp UI. Đây không phải cam kết kiểm toán bảo mật toàn diện từng dòng JSX/CSS.
- Loại khỏi phạm vi: dependencies, `.next`, build output, `.git`, kho skill, file nén và bộ tài liệu Word/Excel trong `Nhóm 1` (không phải source thực thi). Chưa đối chiếu yêu cầu hợp đồng/đồ án trong các file Office đó.
- Working tree có nhiều thay đổi từ trước; đánh giá dựa trên file hiện tại gồm cả file chưa commit, không chỉ HEAD.
- Đã chạy `tsc --noEmit --incremental false` bằng TypeScript cài sẵn trong **cả backend và frontend**: exit code 0.
- Chưa chạy production build, API integration, database migration, browser E2E hoặc tải đồng thời. Type-check thành công không xác nhận nghiệp vụ đúng.
- Không tìm thấy test `.spec.*`/`.test.*` của ứng dụng hoặc migration history trong các thư mục source/Prisma đã kiểm kê; có Jest config nhưng chưa có test nghiệp vụ. Có lockfile ở cả hai package. Không có thư mục `.github` tại thời điểm kiểm tra.

## 3. Ma trận hiện trạng

| Phân hệ | Backend hiện có | Frontend hiện có | Thiếu để vận hành thật |
|---|---|---|---|
| Đăng nhập, tài khoản | JWT, refresh token, CRUD user, role enum | Login, route guard, refresh interceptor | Quyền theo hành động/chi nhánh, quản trị role an toàn, session revocation, chống brute force |
| Chi nhánh | CRUD, soft delete | Tab chính dùng `INITIAL_BRANCHES`; một số trang con gọi API | Đồng bộ UI, mã chi nhánh duy nhất, kho độc lập với chi nhánh, cấu hình ngày kinh doanh |
| Menu, giá, BOM | Product/Size/RecipeItem, CRUD, menu public | POS/menu khách có API; tab BOM chính dùng mẫu | Phiên bản công thức, đơn vị quy đổi, giá theo chi nhánh, snapshot lịch sử, tồn khả dụng |
| POS | Tạo đơn, checkout, trừ BOM, cộng điểm | Luồng API thật | Idempotency, ca bán hàng, validation thống nhất, chống âm kho, trạng thái riêng cho tiền/bếp |
| Thanh toán | Bảng Payment, enum CASH/VNPAY/MOMO/BANK_TRANSFER | Chọn phương thức và gọi checkout | Provider integration, webhook xác minh, đối soát, hoàn tiền, chia phương thức |
| Bếp/KDS | Chưa có model/API trạng thái bếp | Poll đơn đã trả tiền; hoàn tất giữ trong React state | API riêng theo chi nhánh, lưu từng món, đồng bộ thiết bị, phục hồi sau reload |
| Kho | Tồn theo chi nhánh, import/adjust/transfer, StockLedger | `/admin/inventory` đọc API; portal kho chính dùng mẫu | Kho/vị trí/lô/HSD, FEFO, phiếu nhiều dòng, duyệt, hàng đang vận chuyển, kiểm kê |
| Mua hàng | Chưa có module/model | Nhập NCC là UI mẫu | NCC, yêu cầu mua, PO, nhận từng phần, trả NCC, công nợ và đối chiếu hóa đơn |
| CRM/loyalty | Customer/PointTransaction, cộng/đổi điểm | Tra cứu/đăng ký/đổi điểm gọi API | Xác thực khách, quyền sở hữu, reward/voucher thật, chống đổi trùng và giả điểm |
| Khuyến mãi | % và số tiền; enum BUY_X_GET_Y | POS đọc active promos | Điều kiện mặt hàng/chi nhánh, giới hạn lượt, voucher, hoàn/thu hồi quyền lợi |
| Nhân sự | User, Schedule, Attendance, SalarySlip, Announcement | Staff chủ yếu mẫu/localStorage; lịch manager localStorage | Cổng HR thật, hợp đồng, nhiều ca/ngày, nghỉ phép, OT, duyệt công, payroll có phiên bản |
| Thu chi/kế toán | CashFlow và summary | Accountant dùng `sampleCashFlows` | Quỹ/ca, sổ kép hoặc tích hợp kế toán, giá vốn, phải trả, khóa kỳ, đối soát |
| Báo cáo | Doanh thu, top sản phẩm, kho, cashier | Dashboard admin số cố định | Số liệu thật, định nghĩa chỉ tiêu, drill-down về chứng từ, lợi nhuận dựa trên giá vốn |
| Vận hành cửa hàng | Announcement cơ bản | Checklist, đào tạo, camera, cảm biến phần lớn mô phỏng | Lưu backend, người duyệt, sự cố, tài sản; camera/IoT là tích hợp tùy chọn |
| Production | Compose Postgres/Redis/Adminer, Helmet, Swagger | Next.js app | CI, migration release, backup/restore, logs/metrics, health/readiness, staging, rollback |

## 4. Các lỗi và rủi ro phải xử lý trước khi triển khai thật

Mức độ: **P0** chặn dùng dữ liệu/tiền thật; **P1** chặn nghiệm thu vận hành; **P2** cải thiện/mở rộng. Đây là mức ưu tiên kế hoạch, không phải điểm CVSS. Các mô tả dưới đây được suy ra từ source, chưa thực hiện khai thác trên hệ thống chạy thật.

### F01 — P0: Manager/HR có đường nâng quyền tài khoản

Bằng chứng: `backend/src/modules/users/users.controller.ts` đặt role ở cấp controller gồm SUPER_ADMIN/HR/MANAGER; `create` và `update` không có hạn chế riêng. `dto/create-user.dto.ts` nhận toàn bộ enum Role; `update-user.dto.ts` kế thừa trường role. `users.service.ts` truyền DTO vào Prisma và không nhận actor để kiểm quyền thao tác.

Hệ quả: Manager/HR có thể yêu cầu tạo/sửa tài khoản với quyền cao hoặc sửa tài khoản ngoài phạm vi. Giới hạn trong `findAll` không bảo vệ `findOne/update/create`.

Yêu cầu: ma trận cấp quyền ở server; chỉ SUPER_ADMIN quản trị quyền cấp cao; kiểm tra target branch và target role; không dựa vào việc ẩn nút UI. Task SEC-02.

### F02 — P0: Phạm vi chi nhánh chưa được cưỡng chế thống nhất

Bằng chứng: `pos.controller.ts`, `inventory.controller.ts`, `finance.controller.ts`, `reports.controller.ts` chuyển branchId từ request hoặc chỉ truyền id tới service; nhiều service không nhận actor. `reports.service.ts:getDashboardSummary` tổng hợp toàn hệ thống dù MANAGER được gọi.

Hệ quả: vai trò được phép dùng endpoint có thể đọc/ghi ngoài chi nhánh bằng cách đổi id/filter; bỏ filter có thể lấy toàn chuỗi. Task SEC-02, kiểm cả list/detail/mutation/export và hai đầu điều chuyển.

### F03 — P0: Khách hàng chưa được xác thực khi đọc dữ liệu và đổi điểm

Bằng chứng: `customers.controller.ts:34–52` có public lookup/redeem. `customers.service.ts:32` nhận `customerId`, `points`, `rewardTitle` từ client; kiểm số dư trước transaction, không có DTO runtime cho body redeem. Lookup trả hồ sơ, đơn và lịch sử điểm theo số điện thoại.

Hệ quả: thiếu chứng minh quyền sở hữu; số điểm âm có thể trở thành cộng điểm; hai yêu cầu đồng thời có thể vượt số dư. Voucher chỉ được tạo thành chuỗi và ghi trong lý do giao dịch, không có thực thể voucher để POS xác thực tiêu dùng. Task SEC-03, CRM-01.

### F04 — P0: Nhầm định danh actor làm hỏng luồng HR/finance

Bằng chứng: `auth/strategies/jwt.strategy.ts:16` trả `userId`, còn controller HR dùng `user.id`; finance và inventory dùng `@CurrentUser('id')`. Decorator chỉ đọc trường được yêu cầu, không ánh xạ.

Hệ quả: createdBy/authorId bị thiếu; truy vấn Prisma với điều kiện userId undefined ở API “me” có nguy cơ bỏ điều kiện, trả bản ghi không thuộc người gọi; chấm công có thể lỗi validation. POS có fallback nhưng không giải quyết toàn hệ thống. Task SEC-01; test bằng hai nhân viên khác nhau.

### F05 — P0: Payment COMPLETED chưa chứng minh đã nhận tiền

Bằng chứng: `pos.service.ts:147–165` chỉ so `amountPaid` client gửi với order total rồi tạo Payment COMPLETED cho mọi phương thức. Không thấy adapter/webhook/payment verification.

Hệ quả: lựa chọn MoMo/VNPay không đồng nghĩa tích hợp thật. Tách thanh toán tiền mặt khỏi trạng thái chờ xác nhận của cổng thanh toán. Task POS-03.

### F06 — P0: Checkout có thể âm kho hoặc bỏ qua nguyên liệu chưa có tồn

Bằng chứng: `pos.service.ts:216–223` chỉ xử lý khi tìm được inventory; không có else lỗi, không kiểm tra `newStock < 0`. Recipe rỗng cũng chưa bị chặn. Có row lock và Serializable là nền tảng tốt, nhưng chưa đủ cho các bất biến này.

Hệ quả: đơn PAID nhưng thiếu bút toán tiêu hao hoặc tồn âm. Cần gom nhu cầu vật tư, khóa theo thứ tự, kiểm đủ kho/công thức và rollback nguyên giao dịch. Task POS-02.

### F07 — P0: Hủy đơn chưa phải hoàn tiền và tự động hoàn nguyên liệu đã pha

Bằng chứng: `pos.service.ts:289` đổi trạng thái, hoàn mọi ledger âm và trừ điểm; không cập nhật Payment hay thực hiện Refund. Không có trạng thái bếp để biết nguyên liệu đã tiêu hao. Controller cho CASHIER hủy cả đơn đã thanh toán.

Hệ quả: báo cáo đơn và thanh toán lệch; tồn kho tăng giả sau khi đồ uống đã pha. Transaction hủy chưa có khóa/điều kiện chuyển trạng thái đủ chặt để loại trừ hai lần hủy đồng thời. Task POS-04.

### F08 — P1: Transaction DB còn phụ thuộc queue ngoài DB

Bằng chứng: `pos.service.ts:243` gọi Redis/Bull trong transaction; checkout dùng Serializable nhưng chưa có retry serialization failure/idempotency key.

Hệ quả: Redis lỗi làm checkout thất bại; job có thể được gửi trước khi DB commit. Dùng transactional outbox và consumer chống lặp. Không khẳng định hai checkout chắc chắn ghi trùng vì Serializable đã giúp ngăn một số xung đột. Task CORE-02, POS-02.

### F09 — P1: Token và session cần củng cố

Bằng chứng: access/refresh cùng JwtService; `JwtStrategy.validate` không kiểm token type/session/user active; refresh rotation là nhiều thao tác riêng; refresh token lưu nguyên giá trị. Frontend logout chỉ xóa localStorage, không gọi API logout. Strategy có fallback `defaultSecret`, trong khi module ký token yêu cầu config.

Hệ quả: refresh token có thể được chấp nhận tại endpoint chỉ yêu cầu xác thực; tài khoản bị khóa/đổi quyền chưa chắc mất hiệu lực access token ngay. Không suy diễn rằng fallback chắc chắn cho phép đăng nhập khi thiếu secret: hai phía cấu hình khác nhau. Task SEC-01.

### F10 — P1: UI/API contract đã lệch ở luồng bán hàng

- `frontend/src/app/pos/page.tsx:273` gửi `attributes.note` khi có ghi chú; `AttributesDto` chưa khai báo note, global pipe bật forbidNonWhitelisted → request có note có thể bị 400.
- `order-history/page.tsx:43` chỉ nhận menu là array trong khi backend trả object `{drinks,toppings,categories}` → chọn món bù không có danh sách.
- Các list endpoint trả nhiều kiểu envelope; filter inventory belowMin trả cột snake_case khác nhánh thông thường.
- KITCHEN_STAFF được vào `/kitchen` nhưng `GET /pos/orders` và detail không cho vai trò này.
- `/staff` giới hạn SUPER_ADMIN/MANAGER/HR, chưa cho các nhân viên cashier/kitchen/warehouse tự xem công/lịch.

Task CORE-01, UI-01, POS-01, KDS-01.

### F11 — P1: Món bù không cập nhật đầy đủ nghiệp vụ

Bằng chứng: `pos.service.ts:441` nhận item `any`, không kiểm trạng thái đơn phù hợp, chỉ thêm OrderItem và note. Không trừ kho; subtotal của dòng là giá bán nhưng total đơn giữ nguyên; size chưa kiểm thuộc product. Báo cáo top-products cộng subtotal dòng này.

Hệ quả: lệch giá vốn, tổng dòng so với tổng đơn và doanh thu món. Tạo nghiệp vụ compensation/remake riêng với số tiền khách phải trả bằng 0, có cost/stock và phê duyệt. Task POS-04.

### F12 — P1: Kết ca chưa có ca hay chứng từ kết ca

Bằng chứng: `shift-close/page.tsx:69` lấy tối đa 100 đơn theo ngày UTC, tải detail từng đơn; `:139–147` chỉ ghi chênh lệch nếu khác 0 rồi hiện thành công. Schema không có ShiftSession/ShiftClose.

Hệ quả: sai ngày địa phương, bỏ sót hơn 100 đơn, không có số dư đầu ca, không có receipt kết ca khi khớp tiền, đóng lặp có thể ghi thu chi trùng. CASHIER cũng không được gọi API tạo cash-flow hiện tại. Task SHIFT-01.

### F13 — P1: Thu chi chưa phản ánh đầy đủ hoạt động và chưa phải lợi nhuận

Bằng chứng: finance chỉ CRUD cash-flow thủ công; checkout/import/markAsPaid chưa tạo bản ghi tài chính tương ứng. `finance.service.ts:getSummary` gọi thu trừ chi là `netProfit`. `reports.service.ts` dùng createdAt của đơn, totalRevenue/netRevenue cùng số và chưa xử lý giá vốn/hoàn tiền như luồng riêng.

Hệ quả: bảng thu chi không đối soát được POS; chưa thể dùng để công bố lãi lỗ. Task FIN-01, FIN-02, BI-01.

### F14 — P1: Dữ liệu mẫu đang mang thông điệp “đã lưu/đã cập nhật”

Bằng chứng: các component `admin-branches-tab`, `admin-users-tab`, `admin-menu-bom-tab`, `admin-executive-dashboard`; toàn bộ tab nghiệp vụ warehouse; manager operations/checklist/training/staff; accountant sampleCashFlows; staff chấm công localStorage. `warehouse-stocktake-tab.tsx:32` chỉ setSaveSuccess nhưng thông báo đã chỉnh tồn; dispatch tương tự.

Hệ quả: reload/đổi máy mất trạng thái, dữ liệu khác POS. Cần thay bằng API theo từng gói nghiệp vụ, hiển thị chưa khả dụng khi backend chưa có. Không dùng fallback số mẫu nếu API lỗi. Task UI-01 và các task domain.

### F15 — P1: Master data và lịch sử chưa ổn định

- `products.service.ts:update` xóa toàn bộ size rồi tạo mới; size có order/recipe tham chiếu có thể lỗi FK và không bảo toàn identity.
- `recipes.service.ts` thay công thức trực tiếp, không version; POS dùng công thức lúc checkout, không snapshot lúc chấp nhận đơn.
- Unit là string tự do, thiếu quy đổi g/kg, ml/lít/hộp; recipe quantity chưa bắt buộc dương; uniqueness với sizeId nullable cần được quyết định rõ.
- `StockLedger.refId` vừa gợi ý đa loại chứng từ vừa FK tới Order; cần tách liên kết đơn với liên kết chứng từ kho trước khi mở rộng.
- `branches.service.ts:findAll` gộp chi nhánh trùng tên khi đọc, có thể che dữ liệu thực thay vì xử lý trùng bằng migration có mapping.
- Seed chính tạo user bằng create nên không chạy lại an toàn. Seed bánh gán DRINK, POS lọc bánh theo tên/SKU → chưa có quy tắc loại hàng thống nhất.

Task DATA-01, DATA-02, INV-01.

### F16 — P1: Nhân sự mới là mô hình tối giản

Bằng chứng: Attendance unique theo user/ngày; Schedule dùng chuỗi giờ, bulk bỏ qua mọi exception; SalarySlip = base + bonus - deduction; frontend schedule cố định 31 ngày và thứ trong tuần, staff checkout ghi 8 giờ cố định.

Thiếu: nhiều ca/ngày, ca qua đêm, sửa công có duyệt, nghỉ phép/OT, payroll từ công đã khóa, lịch sử chuyển chi nhánh/hợp đồng, chống tự duyệt. Task HR-01, HR-02.

### F17 — P1/P2: Khả năng triển khai và bảo trì chưa được chứng minh

Thiếu migration history, bộ test nghiệp vụ, pipeline build/release, health/readiness, backup/restore drill, metrics và cấu hình production tách khỏi demo. Compose chỉ có hạ tầng; credentials demo và cổng DB/Redis/Adminer phải giới hạn trong môi trường phát triển. Không chạy seed demo tự động trong production.

Frontend có các file lớn: POS 1.231 dòng, staff 1.309, customer 658, kitchen 586, order-history 605; vượt hướng dẫn 200 dòng của dự án. Fetch lặp detail ở bếp/kết ca, truy vấn báo cáo kéo mọi dòng về JS; cần phân trang/aggregate ở server và tách component theo chức năng. Task BASE-01, UI-01, BI-01, OPS-02.

## 5. Những phần ERP chưa có trong mô hình dữ liệu

1. Procurement: supplier, purchase request/order/receipt/return, hóa đơn NCC và phải trả.
2. Warehouse: kho/vị trí, batch/lot, hạn mở bao bì, FEFO, reservation, in-transit, stocktake/waste approval, valuation.
3. Sales operations: POS terminal/session, cash drawer, shift close, payment attempt, refund, KDS tickets, compensation.
4. Finance: account/journal/period, payable/settlement, stock cost, reconciliation; adapter hóa đơn điện tử nếu nằm trong phạm vi pháp lý thực tế.
5. Organization/HR: employee profile/contract/assignment, shift definition, leave/overtime, approved timesheet/payroll run.
6. Governance: permission scope, audit log, approval history, document numbering, attachments, idempotency và outbox.
7. CRM: customer identity/session, reward/voucher, redemption history, chương trình/tier có phiên bản.
8. Operations: checklist templates/runs, incidents, training assessment, equipment/maintenance.

Không cần xây ngay CRM bán hàng B2B, MRP nhà máy, đa tiền tệ, hợp nhất nhiều pháp nhân hay SaaS multi-tenant cho bản đầu. Nếu mở bán TeaP cho nhiều doanh nghiệp độc lập, phải thiết kế tenant boundary trước khi triển khai dữ liệu của khách hàng thứ hai.

## 6. Cơ sở đối chiếu ERP

Nguồn chính để tham khảo phạm vi, truy cập ngày 27/09/2026; không dùng các sản phẩm này làm danh sách phải sao chép toàn bộ:

- [Odoo — Lots](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/product_management/product_tracking/lots.html): tham chiếu quản lý lô và truy xuất giữa mua hàng/kho.
- [Odoo — Expiration dates](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/product_management/product_tracking/expiration_dates.html): tham chiếu hạn dùng cho hàng dễ hỏng.
- [ERPNext — Immutable Ledger](https://docs.frappe.io/erpnext/immutable-ledger-in-erpnext): tham chiếu giữ lịch sử và tạo bút toán đảo khi hủy.
- [ERPNext — Accounting Introduction](https://docs.frappe.io/erpnext/accounting-introduction): tham chiếu liên kết chứng từ nghiệp vụ với sổ kế toán cân đối.

Kiến trúc, thứ tự triển khai và acceptance criteria trong bộ plan là đề xuất riêng cho TeaP dựa trên source này. Chưa đánh giá tuân thủ pháp luật thuế, hóa đơn, lao động hoặc dữ liệu cá nhân; không mã hóa các mức thuế/lương pháp định nếu chưa xác minh quy định tại thời điểm triển khai.
