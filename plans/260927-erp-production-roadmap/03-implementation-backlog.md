# TeaP — Backlog triển khai cho AI

Tất cả task ban đầu là TODO. Đây là đầu việc đề xuất, không phải lịch sử thay đổi đã thực hiện. Đọc `02-domain-design.md` trước khi code. `BE` = backend/src/modules, `FE` = frontend/src/app; file mới phải được tạo trong module đúng trách nhiệm. Mọi task thay schema phải kèm migration/backfill/test dữ liệu cũ theo tài liệu QA.

P0: chặn dùng tiền/dữ liệu thật. P1: cần để vận hành ERP đúng phạm vi. P2: mở rộng. Phụ thuộc ghi ở từng task; không có nghĩa phải làm tuần tự mọi task trong cùng mốc. Không tự giao agent song song nếu người dùng chưa yêu cầu.

## M0 — Baseline và công cụ kiểm chứng

### BASE-01 — Môi trường tái lập và yêu cầu [P0]

- Phụ thuộc: không.
- Nơi làm: package manifests/lockfiles, `backend/prisma`, `docker-compose.yml`, cấu hình test/CI, docs.
- Công việc: chụp baseline git diff; ghi phiên bản Node/npm phù hợp lockfile; xác nhận build/start; DB test riêng có guard chống nhầm production; test runner backend/frontend/E2E; lint chỉ đọc không `--fix` trong CI. Tạo seed test idempotent gồm 2 chi nhánh, 2 kho, các role, khách, menu/BOM/lô. Thiết lập migration baseline từ schema hiện có và kiểm drift trên bản sao DB.
- Đầu ra: lệnh setup/build/typecheck/test có tài liệu; inventory route/API; decision log D01–D09; nếu D09 cần thì đối chiếu tài liệu yêu cầu Office bằng công cụ phù hợp.
- Nghiệm thu: từ DB trống dựng được môi trường test; seed chạy hai lần không nhân đôi; schema clone hiện tại có hướng nâng cấp không reset; chạy test không đụng dữ liệu dev/production. Ghi rõ test chưa có trước khi thêm, không dùng `passWithNoTests` để tuyên bố đạt.

## M1 — Bảo mật, hợp đồng và nền dùng chung

### SEC-01 — Identity và phiên đăng nhập [P0; F04/F09]

- Phụ thuộc: BASE-01.
- Nơi làm: `BE/auth`, `backend/src/common/{guards,decorators}`, controller HR/finance/inventory, `frontend/src/lib/api.ts`, `frontend/src/lib/auth-context.tsx`.
- Công việc: thống nhất `Actor { userId, role, allowedBranchIds, sessionId }`; loại `user.id`/fallback mơ hồ. Token type/audience/issuer và secret bắt buộc; strategy kiểm user active/session/version. Hash refresh token, rotation nguyên tử và phát hiện reuse; logout gọi server; `/auth/me` đồng bộ identity; rate limit login/refresh. Quyết định cookie HttpOnly/SameSite + CSRF cho refresh hoặc cơ chế bảo vệ tương đương có tài liệu.
- Nghiệm thu: employee A gọi mọi endpoint `/me` không thấy B; refresh token không dùng như access token; logout/khóa user/đổi quyền chấm dứt quyền theo SLA đã ghi; hai refresh cùng token không sinh hai chuỗi session hợp lệ; thiếu secret không khởi động production; không log token.

### SEC-02 — Permission, branch scope và quản trị role [P0; F01/F02]

- Phụ thuộc: SEC-01.
- Nơi làm: `BE/users`, guards/policy service mới, mọi controller/service có dữ liệu theo chi nhánh; frontend role guard/menu.
- Công việc: ma trận permission theo hành động; scope do server suy từ assignment; kiểm resource ID trước thao tác; Manager/HR không tạo/sửa role cao hơn quyền được cấp. Quy định master data toàn chuỗi chỉ role có quyền sửa. Endpoint thiếu policy phải fail closed hoặc được liệt kê public có chủ đích. Hạn chế trường nhạy cảm khi trả user/customer/payroll.
- Nghiệm thu: test đầy đủ list/detail/create/update/delete/export với 2 chi nhánh; đổi branchId, ID target, bỏ filter, thiếu branch không thoát scope; cả hai đầu transfer được kiểm; HR/Manager không cấp SUPER_ADMIN; KITCHEN chỉ thấy ticket cần thiết. Audit tối thiểu cho đổi quyền, mở rộng qua CORE-02.

### SEC-03 — Đóng lỗ hổng customer public [P0; F03]

- Phụ thuộc: SEC-01, SEC-02.
- Nơi làm: `BE/customers`, `FE/customer`, POS lookup.
- Công việc: ngừng lookup/redeem public dựa vào số điện thoại/customerId; tách endpoint staff lookup có quyền và response tối thiểu. Portal dùng customer session/chứng minh sở hữu. Trong lúc chưa có provider xác minh thì tắt tự phục vụ redeem, vẫn cho menu public. DTO redeem chỉ nhận rewardId trong luồng đầy đủ; không lấy points/rewardTitle làm giá trị tin cậy. Giới hạn tốc độ, chuẩn hóa số điện thoại, lỗi không tiết lộ tài khoản.
- Nghiệm thu: anonymous không đọc đơn/điểm/hồ sơ; khách A không dùng ID B; points âm/0/tùy ý bị từ chối; POS tra cứu qua quyền nhân viên. Chưa có OTP thật phải ghi task portal PARTIAL và không hiển thị thành công giả; loyalty đầy đủ ở CRM-01.

### CORE-01 — API contract, validation, thời gian và tiền [P1; F10/F13]

- Phụ thuộc: BASE-01, SEC-01.
- Nơi làm: `backend/src/common`, DTO toàn bộ module, OpenAPI, `frontend/src/lib/api.ts`, domain types mới.
- Công việc: thống nhất list/error/Decimal/date; sửa mismatch `attributes.note`, menu object, inventory belowMin shape; validation dates/array/quantity/boolean runtime. Chỉ bật exception filter sau khi bỏ trả raw exception message cho client. Sinh hoặc kiểm type API; định nghĩa business-date/timezone utility; một quy tắc rounding. Contract migration đồng thời client/server, không bật interceptor khiến response lồng đôi.
- Nghiệm thu: snapshot/contract test cho menu, order, inventory, finance, HR; payload note hợp lệ đi qua; boolean false không thành true; nhập array rỗng/NaN/âm sai policy bị từ chối; 23:59 và 00:01 theo Việt Nam được phân ngày đúng; server là nguồn giá.

### CORE-02 — Audit, chứng từ, idempotency, outbox và duyệt [P1; F08]

- Phụ thuộc: SEC-02, CORE-01, BASE-01.
- Nơi làm: `BE/platform` và `BE/approvals` mới; Prisma migrations; worker.
- Công việc: AuditEvent có actor/scope/resource/action/reason/correlation; numbering an toàn đồng thời; IdempotencyRecord có payload hash và response; outbox cùng transaction domain; worker retry/backoff/dead-letter có dedup. Approval lưu người yêu cầu/quyết định/version, kiểm chống tự duyệt và scope theo D04. Không xây generic workflow engine vượt nhu cầu.
- Nghiệm thu: 2 command cùng key chỉ có 1 tác động; cùng key khác payload 409; Redis tắt không mất commit DB hoặc phát sinh job mồ côi; worker chết giữa xử lý/retry không nhân đôi tác động; sequence không trùng; audit che secret/PII không cần thiết; stale approval không duyệt phiên bản đã sửa.

### UI-01 — Giao diện dùng dữ liệu thật và nền frontend [P1; F10/F14/F17]

- Phụ thuộc: CORE-01, SEC-02. Được triển khai tăng dần cùng các task domain.
- Nơi làm: `FE/admin/components`, `FE/manager`, `FE/warehouse`, `FE/accountant`, `FE/staff`, `frontend/src/components`, lib.
- Công việc: lập ma trận mỗi nút/CRUD ↔ endpoint ↔ permission ↔ persistence; thay mẫu khi API domain đã sẵn sàng; chức năng chưa có hiển thị chưa khả dụng. Tách trang lớn thành domain components/hooks; API có type; loading/error/empty/retry; invalidation/cache theo user/scope; fetch song song request độc lập; bỏ N+1 bằng API aggregate. Keyboard/focus/form label, bảng phân trang/filter server; kiểm mobile/tablet.
- Nghiệm thu: mutation thành công thì reload và thiết bị khác thấy cùng dữ liệu; backend 403/500 không hiện thành công hoặc fallback dữ liệu mẫu; logout/đổi branch không lộ cache cũ. Các portal được tick theo từng domain; UI-01 chỉ DONE khi tất cả portal trong scope phát hành đã nối thật. Dữ liệu demo chỉ ở fixture/test hoặc chế độ demo tách biệt rõ ràng.

## M2 — Danh mục và kho nền

### DATA-01 — Danh mục chuẩn và định danh ổn định [P1; F15]

- Phụ thuộc: CORE-01/02, SEC-02.
- Nơi làm: `BE/{branches,categories,products,users}`, Prisma, `FE/admin`.
- Công việc: branch code unique; user assignments; unit/conversion theo dimension; loại hàng và cờ kênh bán chuẩn (quyết định D02 trước đổi hành vi bánh); SKU/size/variant ID ổn định. Update size không delete/recreate toàn bộ; soft deactivate. Thay gộp chi nhánh khi đọc bằng phát hiện trùng và mapping được rà soát. Chuẩn hóa email/phone có dry-run và báo collision.
- Nghiệm thu: đổi tên/giá/size không làm hỏng đơn cũ; API/UI danh mục ghi đọc thật; race tạo branch/SKU trùng bị constraint chặn; quy đổi 1kg = 1000g nhưng không tự đổi kg sang lít; không tự gộp hai chi nhánh chỉ vì trùng tên.

### DATA-02 — BOM version, giá chi nhánh và snapshot [P1; F15]

- Phụ thuộc: DATA-01.
- Nơi làm: `BE/{recipes,products,promotions}`, `FE/admin/components/admin-menu-bom-tab.tsx`, order schema.
- Công việc: BOM draft/published/effective version theo sản phẩm/size; quantity dương, unit hợp lệ, size thuộc product; topping/bao bì; giá hiệu lực theo branch. Chốt BOM mặc định là cộng thêm hay thay thế theo từng mô hình và thực hiện duy nhất một quy tắc. Snapshot menu/price/BOM khi confirm; không bán món cần BOM nhưng chưa có bản publish.
- Nghiệm thu: order dùng version A giữ nguyên khi publish B; giá đúng branch/ngày; recipe khác size không bị cộng nhầm; nguyên liệu/size không hợp lệ bị chặn; lịch sử tên/giá không đổi theo master data mới.

### INV-01 — Kho, chứng từ và stock posting tập trung [P1; F06/F15]

- Phụ thuộc: DATA-01, CORE-02.
- Nơi làm: `BE/inventory`, Prisma migrations, `FE/admin/inventory`, `FE/warehouse`.
- Công việc: Warehouse/Location độc lập Branch; StockDocument/Line nguồn của movement; chuyển quan hệ `refId` cũ an toàn; balance/ledger chung; gom quantity, khóa thứ tự cố định, retry xung đột giới hạn, chống âm. Nhập ban đầu và import nhiều dòng có dry-run/validate. Duyệt chứng từ điều chỉnh không chỉnh balance trực tiếp.
- Nghiệm thu: opening + movement = closing; chứng từ post hai lần không nhân đôi; transaction lỗi giữa chừng rollback mọi dòng; tạo balance chưa tồn tại đồng thời không mất số lượng; hai phiếu khóa ngược thứ tự không gây lỗi chưa được xử lý; dữ liệu order cũ vẫn truy ledger.

### INV-02 — Lô, hạn sử dụng, FEFO và truy xuất [P1]

- Phụ thuộc: INV-01, DATA-02.
- Nơi làm: inventory lot/allocation service, receiving DTO, `FE/warehouse/components/warehouse-expiry-tab.tsx`.
- Công việc: lô NCC/nội bộ, receivedAt/expiresAt/openedAt/useBy khi cần, trạng thái available/quarantine/expired; FEFO allocation theo base unit; reservation interface cho điện tử; cảnh báo thật; trace lot đến receipt/transfer/order. Tồn cũ thiếu HSD phải đánh dấu unknown và có quy trình rà soát.
- Nghiệm thu: lấy hết lô sớm trước rồi chia lô; lô hết hạn/cách ly không vào khả dụng; hai checkout không dùng cùng quantity vượt tồn; mở bao bì làm thay đổi hạn khả dụng theo policy; truy xuất lô trả đúng chứng từ, không đoán HSD cho dữ liệu cũ.

## M3 — Bán hàng, bếp và kết ca

### POS-01 — Tạo đơn/quote nhất quán và phục hồi lỗi [P1; F10]

- Phụ thuộc: DATA-02, CORE-01/02, SEC-02.
- Nơi làm: `BE/pos`, DTO, `FE/pos`, `FE/order-history`.
- Công việc: quote/confirm chung pricing service; validate sellable/active/size/topping/branch; promotion unsupported trả lỗi thay vì im lặng. Snapshot chuẩn; server order number; idempotency tạo đơn; ghi chú từng món; giữ draft/orderId để retry checkout; bill và lịch sử từ server. Chuyển tìm kiếm/phân trang lịch sử lên server.
- Nghiệm thu: client sửa giá không đổi giá tính; timeout sau create rồi retry chỉ có một order; sản phẩm MATERIAL không bán nhầm; topping inactive bị chặn; note không lỗi whitelist; minimum order promo thống nhất UI/server.

### POS-02 — Checkout tiền mặt an toàn [P0; F06/F08]

- Phụ thuộc: POS-01, INV-02, CORE-02.
- Nơi làm: `BE/pos/pos.service.ts` tách checkout service; inventory posting; `FE/pos`.
- Công việc: transaction khóa đơn + tồn theo thứ tự; kiểm tồn/công thức trước hoàn tất; payment tiền mặt/stock/điểm/outbox nguyên tử; idempotency + retry serialization; lưu tender/change; queue sau commit qua outbox; không cho điện tử dùng nhánh tiền mặt. Tích hợp shiftId khi SHIFT-01 sẵn sàng, chưa có ca thì chưa mở pilot.
- Nghiệm thu: double click/timeout retry không nhân đôi payment/kho/điểm; tồn đủ đúng một đơn khi hai quầy tranh mua thì chỉ một đơn thành công; thiếu inventory/recipe rollback; Redis down checkout vẫn lưu đúng; receipt totals do server xác nhận.

### KDS-01 — Bếp có trạng thái thật [P1; F10/F14]

- Phụ thuộc: POS-02, SEC-02, CORE-02.
- Nơi làm: `BE/kitchen` mới, `FE/kitchen/page.tsx`, ticket schema.
- Công việc: ticket/item từ order snapshot; endpoint riêng theo branch và role; QUEUED/PREPARING/READY/SERVED; actor/timestamp/version. SSE/WebSocket hoặc polling có cursor/reconnect; endpoint trả đủ dữ liệu, không N+1. Bỏ fallback đơn cũ để test giao diện; hỗ trợ backlog qua ngày/ca.
- Nghiệm thu: tài khoản bếp dùng được API; A không thấy B; reload/thiết bị thứ hai giữ trạng thái; cập nhật xung đột có 409 hoặc transition idempotent; đơn còn chờ không mất do limit 20/40 hay sang ngày mới; món bù có ticket riêng.

### POS-04 — Hủy, hoàn tiền và món bù [P0; F07/F11]

- Phụ thuộc: POS-02, KDS-01, CORE-02. Nhánh hoàn provider phụ thuộc POS-03.
- Nơi làm: `BE/pos`, refund/compensation service, `FE/order-history`, inventory/point posting.
- Công việc: tách void/refund/stock return/remake; lý do, approval theo D04; hoàn toàn phần/một phần; amount/quantity còn được hoàn do server tính; tác động điểm/usage theo policy; không sửa ledger gốc. Món bù doanh thu 0 có cost và ticket, BOM allocation mới. Chặn cancel paid cũ bỏ qua quy trình này.
- Nghiệm thu: hủy đơn chưa thu không sinh hoàn tiền; hoàn sau pha không tăng nguyên liệu; hoàn trước pha đúng phần chưa tiêu hao; hai refund đồng thời không vượt số tiền đã thu; refund lỗi vẫn hiển thị chờ/lỗi; bù món giảm kho mà doanh thu không tăng; không tạo điểm âm ngoài policy được chốt.

### SHIFT-01 — Ca bán hàng, quỹ và bàn giao [P1; F12]

- Phụ thuộc: POS-02, POS-04, CORE-02.
- Nơi làm: `BE/shifts` mới, POS checkout integration, `FE/shift-close`, terminal/session schema.
- Công việc: mở ca/đầu ca, terminal/cashier, thu chi trong ca, kiểm đếm mệnh giá, tổng hợp server, chênh lệch/giải trình/duyệt/bàn giao. Một ca OPEN/terminal theo policy; mọi payment gắn shift; chống race close/checkout. Ca đóng luôn có chứng từ và lịch sử.
- Nghiệm thu: >100 đơn vẫn tổng đúng; refund/cash-out/đầu ca được tính; close lặp chỉ 1 chứng từ; variance 0 vẫn lưu; giao dịch đến lúc đóng có kết quả nhất quán; hai ca qua nửa đêm báo đúng business date; cashier không cần quyền tạo thu chi tùy ý.

### FIN-01 — Sổ quỹ và đối soát POS [P1; F13/F14]

- Phụ thuộc: SHIFT-01, CORE-02.
- Nơi làm: `BE/finance`, `FE/accountant`, reconciliation/report endpoints.
- Công việc: cash account, source posting từ payment/refund/shift/movement; khóa source chống ghi trùng; phiếu thu chi thủ công có approval; chênh lệch nằm hàng chờ xử lý; đổi `netProfit` thu-chi thành chỉ tiêu cash flow đúng nghĩa. Dashboard kế toán bỏ sampleCashFlows.
- Nghiệm thu: sổ quỹ khớp tiền thực thu/thực hoàn; post event lại không cộng hai lần; không đếm chênh lệch ca như sales; chứng từ quỹ truy về ca/đơn; reload giữ dữ liệu; tổng theo từng branch đúng quyền.

## M4 — Chuỗi cung ứng và giá vốn

### PUR-01 — Nhà cung cấp và đơn mua [P1]

- Phụ thuộc: DATA-01, CORE-02, SEC-02.
- Nơi làm: `BE/purchasing` mới, trang mua hàng trong portal kho/quản trị, Prisma.
- Công việc: NCC/liên hệ/điều khoản, purchase request đơn giản, PO nhiều dòng/đơn vị/giá, submit/approve/reject/cancel theo scope/ngưỡng. Số PO an toàn; snapshot giá; không sửa PO đã duyệt mà không version/phê duyệt lại.
- Nghiệm thu: draft chưa tăng tồn/công nợ; người tạo không tự duyệt nếu policy cấm; sửa sau duyệt invalidates approval; NCC deactivate không phá lịch sử; số lượng/đơn vị hợp lệ.

### PUR-02 — Nhận/trả hàng, hóa đơn và phải trả [P1]

- Phụ thuộc: PUR-01, INV-02, FIN-01.
- Nơi làm: purchasing receiving/billing, `FE/warehouse/components/warehouse-receipts-tab.tsx`, finance payable.
- Công việc: nhận từng phần theo PO line, reject/quarantine và lô/HSD; receipt post qua inventory; bill và credit note; đối chiếu PO/receipt/bill với tolerance; trả NCC; công nợ đến hạn và settlement một phần/toàn phần. Đơn nhập không PO chỉ qua quyền/approval riêng.
- Nghiệm thu: PO 100 nhận 60 rồi 40 đúng 100, không nhận thừa ngoài tolerance duyệt; retry receipt không tăng kho lặp; hóa đơn trùng NCC bị phát hiện; trả 10 giảm tồn/công nợ theo chứng từ; thanh toán 2 lần không vượt phải trả ngoài nghiệp vụ ứng trước được thiết kế riêng.

### INV-03 — Yêu cầu hàng và điều chuyển nhiều bước [P1]

- Phụ thuộc: INV-02, CORE-02.
- Nơi làm: inventory transfer service, `FE/warehouse/components/warehouse-dispatch-tab.tsx`, manager nhận hàng.
- Công việc: request/approve/pick/dispatch/receive, stock in-transit, lô, nhận từng phần, hỏng/thiếu/hoàn trả, ký nhận và phiếu in. Kiểm scope nguồn/đích theo vai trò; không dùng transfer tức thì cũ cho vận chuyển thực.
- Nghiệm thu: xuất 20 thì nguồn -20, in-transit +20, đích chưa tăng; nhận 18 thì đích +18, transit còn 2 chờ xử lý; nhận lặp không cộng lại; tổng toàn chuỗi bảo toàn trừ loss được duyệt.

### INV-04 — Kiểm kê, hao hụt và duyệt chênh lệch [P1; F14]

- Phụ thuộc: INV-02, CORE-02.
- Nơi làm: stocktake/waste service, `FE/warehouse/components/warehouse-stocktake-tab.tsx`, manager approval.
- Công việc: phiên kiểm kê/phạm vi/snapshot, count/recount, lý do, approval, post delta; cơ chế khóa phạm vi hoặc reconcile movement khi đang bán; waste/hết hạn có chứng từ và giá vốn. API không cho bypass qua adjustStock cũ.
- Nghiệm thu: count cũ không ghi đè tồn mới sau sale; người đếm không tự duyệt nếu policy cấm; phiếu post một lần; waste trừ đúng lô; ledger và balance khớp sau kiểm kê.

### FIN-02 — Định giá tồn, giá vốn và công nợ đối chiếu [P1]

- Phụ thuộc: PUR-02, INV-03/04, POS-04; D06.
- Nơi làm: inventory valuation, finance, cost snapshot/migration.
- Công việc: triển khai một phương pháp giá vốn được chọn; đề xuất bình quân di động cho bản đầu, FEFO là chọn lô vật lý độc lập. Cost entry theo movement, chi phí mua phân bổ nếu trong scope; cost của waste/remake/return; số dư công nợ và tuổi nợ. Khóa/backdate policy tránh tính lại lịch sử âm thầm.
- Nghiệm thu: bộ dữ liệu mua 100×10 + 100×20, xuất 50 cho kết quả đúng phương pháp đã chọn; transfer không tạo doanh thu/giá vốn bán hai lần; return/reversal truy cost gốc theo policy; không giả định giá vốn 0 khi thiếu giá mở đầu—báo thiếu dữ liệu.

## M5 — Quản trị chuỗi

### CRM-01 — Loyalty và promotion engine thật [P1]

- Phụ thuộc: SEC-03, POS-04, CORE-02, DATA-02; provider identity nếu bật tự phục vụ.
- Nơi làm: `BE/customers/promotions`, `FE/customer`, POS promotion adapter.
- Công việc: reward catalog backend, voucher phát hành/expire/redeem, point ledger, rule version/eligibility/usage theo branch/customer; một pricing engine. Chốt policy trả điểm và voucher khi refund; anti-replay, consent/retention và masking PII; không dùng tên voucher trong text làm nguồn trạng thái.
- Nghiệm thu: hai redeem tranh cùng số dư chỉ giao dịch đủ điểm thắng; voucher chỉ dùng một lần; giảm giá vượt trần/ngày/branch/customer không áp dụng; quote và checkout cùng rule cho cùng input; refund không hoàn usage/điểm hai lần; anonymous không đọc hồ sơ.

### HR-01 — Nhân viên, lịch và công thật [P1; F16]

- Phụ thuộc: SEC-02, DATA-01, CORE-01/02.
- Nơi làm: `BE/hr`, `FE/staff`, `FE/hr`, manager schedule/staff; employee/assignment/attendance schema.
- Công việc: tách HR portal quản trị khỏi staff self-service; profile/contract/assignment theo thời gian; lịch theo tháng thực, nhiều ca/qua đêm, chống trùng; check-in/out server; correction/leave/OT có approval; timesheet lock. Bulk API trả kết quả từng dòng, không nuốt mọi lỗi.
- Nghiệm thu: tháng 2/năm nhuận, tháng 30/31 đúng; ca 22:00–06:00 đúng giờ/ngày; A chỉ thấy công/lương của A; Manager chỉ chi nhánh được giao; refresh không mất chấm công; transfer employee không làm biến dạng lịch sử branch; lịch trùng có lỗi cụ thể.

### HR-02 — Payroll và thanh toán lương [P1]

- Phụ thuộc: HR-01, FIN-01, CORE-02; D07.
- Nơi làm: salary/payroll service, HR/payroll UI, accountant settlement.
- Công việc: payroll run theo kỳ từ timesheet đã duyệt + chính sách có hiệu lực; earning/deduction breakdown, preview/approve/lock; snapshot công/rate; phiếu lương cá nhân; payment/settlement kết nối quỹ. Thuế/bảo hiểm chỉ theo đặc tả đã xác minh, không hard-code giả định pháp định.
- Nghiệm thu: tính lại draft không nhân bản; kỳ khóa không đổi khi rate hiện tại đổi; người không có quyền không đọc/export lương; payment retry không chi lặp; unpaid/partial/paid phản ánh settlement; tổng chi khớp payroll được duyệt.

### FIN-03 — Sổ kế toán hoặc adapter kế toán [P1; có quyết định]

- Phụ thuộc: FIN-02, HR-02, CORE-02; D06 và đặc tả tài chính được chủ nghiệp vụ duyệt.
- Nơi làm: finance/accounting hoặc integrations/accounting; UI mapping/reconciliation.
- Công việc: chọn một hướng theo thiết kế; mapping nguồn sales/refund/inventory/purchase/payroll; period lock; posting immutable/reversal; đối soát và hàng lỗi. Adapter có delivery/ack/retry độc lập. Sổ nội bộ có journal/account/tổng nợ có và report tối thiểu đã đặc tả.
- Nghiệm thu: source không post hai lần; dữ liệu thiếu mapping không bị bỏ qua; internal journal không cân bằng bị từ chối; kỳ khóa không sửa trực tiếp; export có ack đối soát số lượng/tổng tiền. Thiếu provider/quy tắc kế toán thì BLOCKED phần production, không đánh dấu hoàn thành bằng CSV mẫu.

### BI-01 — Báo cáo có định nghĩa và truy về chứng từ [P1; F13/F17]

- Phụ thuộc: FIN-01 cho pilot; FIN-02/03, HR-02 cho bộ ERP đầy đủ.
- Nơi làm: `BE/reports`, `FE/admin/components/admin-executive-dashboard.tsx`, accountant/manager dashboard.
- Công việc: metric dictionary (business date, paidAt/refundAt, gross/net/tax/COGS/cash); aggregate/pagination ở DB; sales, top items, refund/remake/waste, inventory aging, công nợ, labor cost. Filter branch/date nhất quán, drill-down và export có scope. Performance bằng index/query plan đo được.
- Nghiệm thu: số tổng đúng fixture cố định; tổng branch khớp chain khi cùng filter; bill/refund/ca/quỹ reconcile; món bù không thổi doanh thu; không gắn nhãn profit cho cash; không kéo toàn lịch sử về browser. Pilot không hiển thị lãi gộp như dữ liệu đã xác thực khi chưa có cost.

### OPS-01 — Checklist, thông báo và sự cố [P2; bắt buộc nếu đưa vào menu vận hành]

- Phụ thuộc: HR-01, CORE-02, SEC-02.
- Nơi làm: `BE/operations`, announcement mở rộng; manager checklist/operations, staff notices.
- Công việc: template checklist/version, run theo ca/branch, assignee/evidence, incident workflow và acknowledgement; notification có nguồn và permission. Thay trạng thái mô phỏng bằng API. Upload có giới hạn MIME/size, private access và vòng đời file.
- Nghiệm thu: mở/đóng checklist trên thiết bị khác cùng dữ liệu; incident có owner/lịch sử; sai branch không xem ảnh; thông báo đúng đối tượng; file lỗi không tạo thành công giả.

## M6 — Production và nghiệm thu

### OPS-02 — CI, triển khai, giám sát và khôi phục [P1; F17]

- Phụ thuộc: BASE-01; bắt đầu sớm, hoàn tất trước QA-01 go-live.
- Nơi làm: CI, Dockerfile/app deployment, config, health endpoints, monitoring/runbook.
- Công việc: build artifact bất biến, env validation, migration deploy riêng, staging, HTTPS/CORS, secret management, tắt quick-login/demo production; health/readiness, structured logs/metrics/tracing; outbox/queue alert; backup mã hóa/retention/restore; giới hạn DB/Redis/Adminer; dependency audit và bản vá có kiểm chứng. Không tự nâng major dependency khi chưa có phạm vi/test.
- Nghiệm thu: clean build/lint/test CI; release staging lặp lại; app không có demo credentials/seed tự chạy; rollback app tương thích schema; restore DB và đối chiếu ledger thành công; đo RPO/RTO; cảnh báo lỗi payment/kho/worker hoạt động. Chỉ dùng số liệu đo, không tuyên bố SLA từ cấu hình.

### QA-01 — UAT, tải, chuyển đổi dữ liệu và pilot [P1]

- Phụ thuộc: toàn bộ task trong scope release; OPS-02; không bắt buộc các EXT nếu không bật.
- Nơi làm: E2E/API integration fixtures, scripts kiểm đối soát, docs UAT/cutover.
- Công việc: thực hiện bộ test trong `04-verification-and-ai-handoff.md`; chuyển dữ liệu trên bản sao; backup trước cutover; đối chiếu opening balances, orders/payments/points, công nợ; pilot một chi nhánh rồi hai chi nhánh; hướng dẫn người dùng và quy trình sự cố. Ghi chấp thuận của chủ nghiệp vụ cho số dư/chính sách.
- Nghiệm thu: mọi P0 và test bắt buộc qua; chưa đạt nào thì ghi rõ, không gọi production-ready; pilot hoàn thành cả ngày bán/kết ca/đối soát/restore rehearsal, không sai lệch chưa giải thích; người vận hành xác nhận luồng thực tế.

## Các gói tích hợp/mở rộng có điều kiện

### POS-03 — Thanh toán điện tử và đối soát provider [P1 nếu bật]

- Phụ thuộc: POS-02, INV-02, CORE-02, FIN-01; D05 và merchant sandbox thật.
- Nơi làm: integrations/payment adapter, webhook, PaymentAttempt/ProviderEvent, POS pending UI.
- Công việc: chỉ tích hợp một provider đầu tiên; tạo attempt, verify webhook, unique event/transaction, trạng thái không xác định, query provider/reconcile, reservation/late success handling, refund API. Chuyển khoản thủ công có workflow xác nhận/bằng chứng riêng, không coi chọn phương thức là đã thu.
- Nghiệm thu: sai signature/amount/currency/order bị chặn; callback trùng/đảo thứ tự/đến muộn không thu/trừ kho lặp; timeout sau provider nhận tiền phục hồi được; refund có xác nhận thật; thiếu cấu hình thì phương thức không khả dụng. Không tuyên bố tích hợp live chỉ từ mock provider tests.

### EXT-01 — Sơ chế, mẻ sản xuất và bổ sung hàng [P2]

- Phụ thuộc: INV-02/03/04, FIN-02; D02.
- Công việc: BOM sơ chế, input/output lots, yield/waste, expiry và truy xuất; min/max/reorder proposal có duyệt.
- Nghiệm thu: sản xuất → bán không trừ nguyên liệu thô hai lần; giá vốn từ input phân bổ output đúng policy; hàng đề nghị không tự tạo PO/stock nếu chưa duyệt.

### EXT-02 — Đào tạo, tài sản, camera/IoT [P2]

- Phụ thuộc: OPS-01; spec thiết bị/provider và permission.
- Công việc: training/assessment thật, asset/maintenance; camera signed access và retention nếu có nhà cung cấp; IoT alert qua adapter. Có thể tách thành task con theo thiết bị thực tế.
- Nghiệm thu: điểm đào tạo có bài/nguồn; bảo trì có lịch sử; camera offline hiển thị offline, không dùng hình mẫu làm live; người ngoài scope không xem luồng/ảnh.

### EXT-03 — Kênh online, thiết bị in và offline POS [P2; phải tách trước triển khai]

- Phụ thuộc: POS/KDS/inventory ổn định, decision về kênh/provider/thiết bị.
- Công việc: đặc tả riêng cho đặt món/thanh toán/delivery, printer retries và chống in trùng, hoặc offline command queue/resolution. Không gộp ba sản phẩm này vào một lần code. Phân tích offline stock reservation, quyền hết hạn, giá/promotion stale và payment không có mạng trước.
- Nghiệm thu: có backlog con và E2E theo kênh; đồng bộ không sinh đơn/tiền lặp; hóa đơn thiết bị kiểm trên thiết bị thật; khi mất mạng mà offline chưa triển khai thì app báo rõ không thể hoàn tất bán, không hiện thanh toán thành công.

## Gói bổ sung và thứ tự tiếp tục

### Gói đóng khoảng trống bổ sung sau đánh giá 28/09/2026

Các task dưới đây bổ sung phần cross-cutting bị thiếu trong backlog gốc. Chúng không thay thế acceptance criteria của task domain.

#### BASE-02 — Diễn tập nâng cấp và an toàn dữ liệu cũ [P0]

- Phụ thuộc: BASE-01.
- Công việc: clone database hiện hữu đã khử nhạy cảm; chạy toàn bộ migration không reset; dry-run normalize email/phone/code; báo collision/orphan/backfill; seed test idempotent có 2 branch, 2 warehouse, lot/BOM/order/payment; đối chiếu count và số dư trước/sau.
- Nghiệm thu: nâng cấp clone thành công bằng đúng release command; seed chạy hai lần không nhân đôi; mọi collision có báo cáo và quyết định, không tự gộp/xóa; rollback ứng dụng hoặc forward-fix được diễn tập và ghi thời gian.

#### SEC-04 — Session phía browser và chống abuse phân tán [P0 nếu truy cập qua Internet]

- Phụ thuộc: SEC-01, OPS-02 phần hạ tầng.
- Công việc: chuyển refresh credential khỏi `localStorage` sang cookie HttpOnly/Secure/SameSite + CSRF hoặc BFF tương đương; access token ngắn hạn chỉ trong memory khi phù hợp; rate limit login/refresh/customer flow dùng shared store và key có IP/account/device; CSP và log redaction.
- Nghiệm thu: script phía browser không đọc được refresh credential; cross-site refresh/logout bị chặn; hai replica chia sẻ limit; Redis/shared store lỗi có hành vi fail-safe đã tài liệu hóa; không log cookie/token.

#### CORE-03 — Vòng đời audit, idempotency và outbox [P1]

- Phụ thuộc: CORE-02, OPS-02 monitoring.
- Công việc: mở rộng audit/idempotency/outbox cho quyền, stock, finance và approval; cấu hình retention/cleanup theo batch; metrics age/backlog/retry/dead-letter; màn hình hoặc command operator để xem/replay có quyền, reason và audit; dedup consumer.
- Nghiệm thu: cleanup không xóa record còn hiệu lực hoặc event chưa xử lý; dead-letter tạo alert; replay cùng event không nhân đôi tác động; operator sai scope không xem/replay; audit truy được correlation từ API tới worker.

#### UI-02 — Loại bỏ đường demo và khóa contract frontend [P0 trong phạm vi pilot]

- Phụ thuộc: CORE-01, UI-01 và API domain tương ứng.
- Công việc: inventory mọi `sample/mock/localStorage/Math.random` tạo dữ liệu nghiệp vụ; thay bằng API thật hoặc disable rõ; production build không có quick-login/demo credential; generated client hoặc type contract chung; loại dead code customer; thay N+1 bằng endpoint aggregate; loading/error/empty không fallback giả.
- Nghiệm thu: reload và thiết bị thứ hai thấy cùng dữ liệu; backend 403/500 không hiện thành công; không có số chứng từ do browser sinh; CI chặn import fixture/demo vào production bundle; các portal trong pilot không còn nguồn dữ liệu mẫu.

#### UI-03 — Điều hướng theo vai trò và luồng nghiệp vụ thật [P0 trong phạm vi pilot]

- Phụ thuộc: SEC-02, UI-01, UI-02 và trạng thái API của từng domain.
- Công việc: duy trì ma trận `CTA → đích/hành động → vai trò → API/persistence`; mỗi vai trò có một workspace chính; không dùng “hub mở mọi giao diện vai trò”; link chuyển ngữ cảnh phải ghi rõ đích và có đường quay lại đúng luồng; module chưa đủ backend chỉ hiện trạng thái roadmap, không là tab/nút có thể bấm. URL cũ phải redirect về màn hình chuẩn; trạng thái tab/filter có giá trị chia sẻ phải phản ánh trên URL. Kiểm tra bàn phím, focus và vùng chạm tối thiểu trên mobile.
- Nghiệm thu: không CTA nào đưa người dùng sang cổng không liên quan hoặc trang 403; nhãn nút mô tả đúng kết quả; refresh/back giữ đúng ngữ cảnh nghiệp vụ; mọi route private fail-closed; crawler/test browser kiểm toàn bộ link nội bộ theo từng role và viewport; module chưa triển khai không thể phát sinh mutation hoặc trạng thái thành công giả.

#### QA-02 — Chứng nhận invariant và cạnh tranh giao dịch [P0]

- Phụ thuộc: POS-02, POS-04, INV-02, SHIFT-01, FIN-01; chạy liên tục trong CI sau khi có fixture BASE-02.
- Công việc: integration test nhiều connection cho refresh rotation, sequence, checkout tranh tồn, post chứng từ, refund đồng thời, close-shift/checkout race, redeem/voucher khi bật; property/invariant check ledger, payment, stock, points; browser E2E cho critical path.
- Nghiệm thu: mỗi test chạy lặp nhiều vòng trên PostgreSQL thật không flaky; tổng movement khớp balance, refund không vượt payment, một idempotency key chỉ một tác động, sequence không trùng; lưu artifact/log/correlation khi fail.

Thứ tự critical path đã điều chỉnh:

BASE-02 → CORE-01 → SEC-02 → SEC-04 → UI-02 → UI-03 → CORE-02 → CORE-03 → DATA-01 → DATA-02 → INV-01 → INV-02 → POS-01 → POS-02 → KDS-01 → POS-04 → SHIFT-01 → FIN-01 → QA-02.

UI-01 đi cùng từng domain, OPS-02 đi từ baseline. Sau vòng bán hàng ổn định, làm PUR/INV/FIN, HR/CRM/BI theo phụ thuộc. POS-03 chỉ khi có provider và thiết kế reserve/late success; không ngăn hoàn thiện tiền mặt.

## Mẫu log tiến độ cho mỗi task

`Task ID | TODO/IN_PROGRESS/PARTIAL/BLOCKED/DONE | commit hoặc diff phạm vi | test đã chạy + kết quả | migration/backfill | quyết định còn thiếu | task tiếp theo`

Chưa tạo commit/PR/deploy trong lượt lập kế hoạch này. AI triển khai không được đánh dấu task DONE dựa trên plan có sẵn hoặc nội dung summary của task trước; phải xem source và bằng chứng test tại thời điểm thực hiện.
