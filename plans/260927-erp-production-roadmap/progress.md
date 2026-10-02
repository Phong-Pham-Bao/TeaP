# TeaP ERP — Nhật ký triển khai

Cập nhật: 2026-09-29. Đây là bằng chứng tại workspace hiện tại, không phải tuyên bố production-ready. Trạng thái tuân theo mẫu trong `03-implementation-backlog.md`.

## Đánh giá hiện trạng

Dự án hiện ở mức **ERP foundation / hardened prototype**: nền auth, migration, POS idempotency, audit/outbox và business time đã tiến bộ rõ, nhưng chưa đủ điều kiện pilot bằng tiền thật vì các chuỗi kho–lô, refund, KDS, ca–quỹ, UI dữ liệu thật và kiểm thử cạnh tranh chưa khép kín. Đánh giá chi tiết, điểm yếu và cổng chặn pilot nằm tại [05-current-assessment-and-roadmap-update.md](05-current-assessment-and-roadmap-update.md).

## Trạng thái task

| Task | Trạng thái | Phạm vi đã làm | Bằng chứng | Còn thiếu / quyết định |
|---|---|---|---|---|
| BASE-01 | PARTIAL | Có initial baseline + migration auth/platform/security/document sequence/approval/platform-operations index; guard DB test; dựng sạch `teap_test`; migration deploy và drift check; platform DB smoke; seed demo idempotent cho 5 branch, role, menu/BOM, tồn và khách; lệnh type-check/build/test | 9 migration áp dụng thành công trên PostgreSQL 16; `No difference detected`; seed chạy hai lần giữ nguyên count và không reset tồn đã thay đổi; backend/frontend build và type-check đạt; Jest 21 suite/89 test đạt | Chưa có model/fixture Warehouse và Lot (phụ thuộc INV-01/02); chưa có browser E2E suite và CI. Node trên máy là 24.14.0; npm launcher lỗi nên evidence dùng binary trong `node_modules` |
| BASE-02 | PARTIAL | Seed chuyển sang upsert khóa ổn định, advisory lock và guard production/remote; chuẩn hóa dữ liệu dry-run mặc định, có collision report và cờ apply; thêm rehearsal clone `_test` kiểm orphan, migration, drift, count và tổng tiền/tồn/điểm trước-sau | `verify-seed-idempotency.ts` đạt với 5 branch/11 user/40 product/100 inventory; production seed guard từ chối đúng; `rehearse-database-upgrade.ts` PASS, 0 collision, 0 orphan, 3 migration, no drift, control totals giữ nguyên | Bằng chứng hiện chạy trên `teap_test` chứa fixture, chưa phải clone dữ liệu dev/production đã khử nhạy cảm; fixture Warehouse/Lot chờ schema INV-01/02; chưa diễn tập backup/restore và rollback/forward-fix |
| SEC-01 | PARTIAL | Actor thống nhất có `allowedBranchIds`; access token có type/issuer/audience/session; secret bắt buộc; refresh token hash + rotation + reuse detection; logout server; `/auth/me`; client refresh một-flight; rate-limit login/refresh dùng PostgreSQL chung | `auth.service.spec.ts`, `auth.controller.spec.ts`, `auth-throttle.service.spec.ts`; build/type-check đạt | Chưa có DB concurrency test hai refresh cùng token và SLA kiểm chứng cho việc chấm dứt session khi đổi quyền/khóa user |
| SEC-02 | PARTIAL | Guard quyền fail-closed: route phải có `@Public`, permission hoặc `@AuthenticatedAccess`; ma trận tập trung có 42 permission bảo vệ 75 endpoint trên 16 controller được bảo vệ, gồm platform operations chỉ SUPER_ADMIN; không còn `@Roles` rải rác tại controller; chỉ `/auth/me` và `/auth/logout` dùng quyền chung cho mọi tài khoản đã xác thực; route trộn role và permission bị từ chối; assignment user–branch nhiều-nhiều có primary/backfill; actor nạp mọi branch; multi-branch bắt buộc chọn scope; Manager không cấp role đặc quyền/branch ngoài phạm vi; vô hiệu hóa tài khoản kiểm lại SUPER_ADMIN tại service; thay đổi tài khoản/role/branch được audit trong cùng transaction; admin UI quản lý nhiều branch và manager UI có selector; helper scope dùng tại POS/kho/tài chính/báo cáo/branch/lịch | `permission-matrix.spec.ts`, `roles.guard.spec.ts`, `users.service.spec.ts`, `branch-scope.spec.ts`; HTTP integration kho kiểm fixture hai branch cho list/import/transfer, đổi `branchId`, thiếu branch, cả hai đầu transfer và role KITCHEN/WAREHOUSE; service test user kiểm ID ngoài scope cho detail/update và chặn delete không phải SUPER_ADMIN; `test:security:db` xác nhận assignment 2 branch và audit quyền trên PostgreSQL; toàn bộ 21/21 suite, 89/89 test, type-check/build/OpenAPI drift check đạt | Chưa có API integration đủ detail/update/delete/export trên tất cả domain; KDS chưa có API persisted để kiểm; `@Roles` legacy vẫn được guard hỗ trợ để tương thích nhưng không còn dùng tại controller nghiệp vụ |
| SEC-04 | DONE | Refresh credential chỉ ở cookie `HttpOnly/Secure/SameSite=Strict`; access token chỉ trong memory; CSRF secret được rotate và đối chiếu hash theo từng refresh session; frontend không giữ credential trong localStorage; rate limit login/refresh dùng UPSERT nguyên tử trong PostgreSQL dùng chung, key IP/account được hash; Helmet CSP mặc định; lỗi shared store từ chối request thay vì bỏ qua hạn mức | `auth.controller.spec.ts`, `auth.service.spec.ts`, `auth-throttle.service.spec.ts`; `test:security:db`; frontend production build; scan không còn `teap_access_token`/`teap_refresh_token` | Customer identity flow đang tắt theo SEC-03 nên chưa có endpoint customer-auth để rate-limit; sẽ áp cùng shared service khi CRM/OTP được xây |
| SEC-03 | PARTIAL | Xóa lookup/register/redeem public; POS lookup có role và response tối thiểu; số điện thoại chuẩn hóa; portal công khai không hiển thị tra cứu/đổi điểm giả | Anonymous bị guard chặn theo cấu hình global; contract test phone đạt; frontend type-check đạt | Chưa có customer identity/OTP/session, rate-limit customer flow, reward catalog backend; vì vậy self-service vẫn tắt theo đúng kế hoạch |
| CORE-01 | DONE | Error/pagination/validation/business time đã thống nhất; tiền VND trả JSON integer với `ROUND_HALF_UP`; số lượng/giờ công Decimal trả exact decimal string; OpenAPI 53 paths/74 schemas được sinh ổn định; generated type có drift check; response contract phủ menu/order/inventory/finance/HR/branch/user; frontend các lát cắt đang dùng API đã chuyển sang type sinh tự động | `vietnamese-dong.spec.ts`, `decimal-quantity.spec.ts`, `response-contract.spec.ts`, `core-contract.spec.ts`, `business-time.spec.ts`, `openapi-contract.spec.ts`; `npm run openapi:check`; 13 suite/53 test đạt; backend/frontend build và type-check đạt | Pricing quote/confirm duy nhất và BOM/price snapshot thuộc DATA-02/POS-01; không giữ CORE-01 mở vì dependency domain chưa triển khai |
| CORE-02 | PARTIAL | Thêm `AuditEvent`, `IdempotencyRecord`, `OutboxEvent`, `DocumentSequence`, `ApprovalRequest` và `ApprovalDecision`; index/FK/check constraint; cấp số chứng từ bằng UPSERT nguyên tử theo loại + chi nhánh + ngày nghiệp vụ ngay trong transaction; approval lưu requester/decision/version, khóa request khi quyết định, chặn tự duyệt/sai branch/version cũ và ghi audit cùng transaction; tạo đơn và checkout ghi audit + idempotency, checkout ghi low-stock outbox cùng transaction; DB worker dùng `FOR UPDATE SKIP LOCKED`, retry/backoff/dead-letter | `approval.service.spec.ts`, `document-sequence.service.spec.ts`, `idempotency.service.spec.ts`, `outbox.service.spec.ts`, `verify-approval-database.ts`, `verify-document-sequence-database.ts`, `verify-platform-database.ts`; hai transaction duyệt đồng thời chỉ một thành công; self/scope/stale đều bị từ chối; 24 transaction cấp số đồng thời không trùng/không hổng; 9 migration áp dụng, drift `No difference detected` | Approval mới là primitive nội bộ, chưa tích hợp vào refund/stocktake/expense; chưa phủ command quyền/kho/tài chính; vòng đời vận hành được tiếp tục ở CORE-03 |
| CORE-03 | PARTIAL | Thêm API metrics backlog/age/dead-letter, danh sách dead-letter phân trang cursor, replay chỉ SUPER_ADMIN có reason + audit cùng transaction; retention cấu hình bằng env và xóa theo batch ngắn dùng `SKIP LOCKED`; chỉ xóa audit quá hạn, idempotency `COMPLETED` đã hết hạn qua grace và outbox `PUBLISHED` quá hạn; worker phát structured error khi chuyển dead-letter; bổ sung composite index đúng access pattern | `platform-operations.service.spec.ts`, `outbox.service.spec.ts`, `verify-platform-operations-database.ts`; PostgreSQL test xác nhận record đủ điều kiện bị xóa, pending/dead-letter/PROCESSING/còn hiệu lực được giữ, cursor không lặp, replay reset đúng và tạo đủ audit; OpenAPI 57 paths/81 schemas; backend/frontend type-check và build backend đạt | Chưa có audit query UI, lịch cleanup tự động, alert sink/dashboard thực, replay theo branch cho operator ngoài SUPER_ADMIN, consumer dedup cho provider ngoài hệ thống và coverage audit/idempotency/outbox ở stock/finance |
| POS-01 | PARTIAL | Tạo đơn yêu cầu `Idempotency-Key`; server tính lại giá bằng Decimal/VND rounding; promotion chưa hỗ trợ trả lỗi rõ; audit cùng transaction; mã đơn không còn `Math.random`, dùng document sequence trong cùng transaction và unique theo `branchId + orderNumber`; idempotency create scope theo branch được chọn; frontend giữ fingerprint/orderId/key trong `ref` để retry timeout không tạo đơn mới; response order có contract OpenAPI và kiểu frontend sinh tự động | `pos.service.spec.ts` kiểm replay, scope branch, sequence trong transaction và từ chối `BUY_X_GET_Y`; DB concurrency 24 allocator; `openapi-contract.spec.ts` kiểm response create/checkout; backend/frontend type-check đạt | Chưa có pricing service/snapshot BOM-price chuẩn và persistence draft qua reload |
| POS-02 | PARTIAL | Checkout chỉ CASH; khóa order/tồn theo thứ tự; yêu cầu recipe/inventory; chặn âm; Serializable retry; `Idempotency-Key` replay response; audit/outbox nguyên tử; frontend giữ orderId/key để retry; không phụ thuộc Redis | `pos.service.spec.ts`, `verify-pos-checkout-race.ts`; PostgreSQL race hai transaction chỉ một checkout thành công, tạo đúng 1 payment + 1 ledger + 1 idempotency completed và tồn từ 10 xuống 9; backend build/type-check đạt | Chưa có reservation/lô/shift, tender/change fields và receipt snapshot chuẩn. Phụ thuộc POS-01, INV-02 và phần còn lại CORE-02 chưa hoàn tất |
| OPS-02 | TODO — RISK IDENTIFIED | Đã chạy dependency audit riêng cho production tree; chưa tự động chạy `audit fix` để tránh nâng major ngoài kiểm soát | `npm audit --omit=dev --json`: 20 cảnh báo trong cây production (1 low, 10 moderate, 8 high, 1 critical), tập trung ở Nest/Swagger/Prisma/Bull và chuỗi native dependency | Lập remediation theo nhóm: cập nhật patch/minor có kiểm thử trước; chuẩn bị nhánh nâng major Nest/Swagger; đánh giá thay thế/nâng `bcrypt` chain; đưa audit allowlist có hạn dùng vào CI |
| UI-02 | PARTIAL | Gỡ quick-login/mật khẩu mặc định và browser token localStorage; accountant, manager operations/schedule/staff, staff self-service, admin branch/user/menu và admin product/inventory dùng API thật + generated types; manager chọn được assignment branch; frontend proxy `/api/v1` cùng origin để mobile/tunnel chỉ cần một URL; login form fallback dùng POST để không đưa password lên query khi JS chưa hydrate; xóa dead code customer lookup/register/redeem gọi endpoint đã khóa; các màn hình chưa có backend bị disable rõ ràng | Frontend type-check và production build; smoke test qua tunnel HTTPS đăng nhập Manager thành công ở viewport 390×844 và đọc dữ liệu branch; scan app không còn marker sample/mock/localStorage/`Math.random` | KDS/order-history/shift-close còn N+1 hoặc thiếu trạng thái nghiệp vụ persisted; dashboard điều hành chờ BI-01; các feature disabled chờ task domain tương ứng |
| UI-03 | PARTIAL | Bỏ role-portal hub; Admin dùng một sidebar và route chuẩn; Manager/Kế toán chỉ cho bấm module đang hoạt động; Warehouse có tồn kho read-only từ API; lịch sử hóa đơn quay lại POS đúng ngữ cảnh; bổ sung logout mobile; policy route/default workspace/navigation edge gom vào contract dùng chung; Manager tab và bộ lọc hóa đơn đồng bộ query URL, hỗ trợ deep-link/Back và tự loại query sai | `test:navigation` đạt: 19 page, 13 policy, 13 static link, 7 role; frontend type-check + production build đạt 22 static routes; browser 390×844 xác nhận Manager deep-link → đổi tab → Back, query sai fail về mặc định; order status deep-link → đổi filter → Back; không có browser error; ảnh `mobile-navigation-manager.png` và `mobile-navigation-warehouse.png` | Chưa có browser E2E chạy tự động đủ 7 role trong CI và chưa kiểm trên thiết bị thật; các module domain bị khóa chỉ được mở khi API tương ứng hoàn tất |

Các task khác vẫn là `TODO` trừ phần code nền có thể đã tồn tại trước roadmap; không tự suy ra `DONE` từ giao diện hoặc schema hiện có.

## Lệnh kiểm chứng đã chạy

Chạy trong `backend`:

```powershell
node node_modules/prisma/build/index.js validate
node node_modules/typescript/bin/tsc --noEmit --incremental false
node node_modules/jest/bin/jest.js --runInBand
node node_modules/@nestjs/cli/bin/nest.js build
npm run openapi:check
```

Với `NODE_ENV=test` và `DATABASE_URL` trỏ tới database kết thúc bằng `_test`:

```powershell
node node_modules/ts-node/dist/bin.js scripts/assert-test-database.ts
node node_modules/prisma/build/index.js migrate deploy
node node_modules/prisma/build/index.js migrate diff --from-url $env:DATABASE_URL --to-schema-datamodel prisma/schema.prisma --exit-code
node node_modules/ts-node/dist/bin.js scripts/verify-platform-database.ts
node node_modules/ts-node/dist/bin.js scripts/verify-platform-operations-database.ts
node node_modules/ts-node/dist/bin.js scripts/verify-auth-security-database.ts
node node_modules/ts-node/dist/bin.js scripts/verify-approval-database.ts
node node_modules/ts-node/dist/bin.js scripts/verify-pos-checkout-race.ts
node node_modules/ts-node/dist/bin.js scripts/verify-seed-idempotency.ts
$env:UPGRADE_REHEARSAL_ACK = 'clone-test-only'
node node_modules/ts-node/dist/bin.js scripts/rehearse-database-upgrade.ts
```

Chạy trong `frontend`:

```powershell
node node_modules/typescript/bin/tsc --noEmit --incremental false
node scripts/verify-navigation-contract.mjs
node node_modules/next/dist/bin/next build
```

Kết quả gần nhất: Prisma schema hợp lệ; backend build/type-check exit 0; frontend navigation contract, production build/type-check exit 0 và sinh 22 static routes; OpenAPI 57 paths/81 schemas cùng generated frontend types không drift; Jest 21/21 suite, 89/89 test. HTTP security integration xác nhận permission + branch scope hai chi nhánh ở lớp route/controller. PostgreSQL `teap_test` nhận đủ 9 migration; security DB test xác nhận account hai branch, audit quyền và rate limit dùng chung; document sequence DB test xác nhận 24 allocation đồng thời không trùng và branch scope độc lập; approval DB race chỉ một quyết định thành công; POS DB race chỉ tạo một payment/movement và trừ kho đúng một lần; platform operations DB test xác nhận retention/replay/metrics/cursor; migration drift `No difference detected`. Platform database smoke, seed idempotency và upgrade rehearsal trước đó đều đạt. Browser smoke UI-03 ở viewport 390×844 không ghi nhận page error; deep-link/Back/query normalization đạt.

## Guard cho database test

Mọi integration/E2E test có ghi DB phải gọi `npm run test:db:guard` trước khi migrate/seed. Guard chỉ chấp nhận:

- `NODE_ENV=test`;
- host `localhost`, `127.0.0.1` hoặc service Docker `postgres`;
- tên database kết thúc bằng `_test`.

Platform đã có DB smoke test cho FK/unique, transaction và outbox claim/publish. Approval và checkout đều đã có integration race test nhiều connection; reservation/lot và các concurrency case của domain tương lai vẫn phải có test riêng trước khi tuyên bố toàn bộ chuỗi đạt.

## Browser session và chống abuse

- Backend chỉ gửi refresh credential qua cookie `teap_refresh`, path `/api/v1/auth`, `HttpOnly`, `SameSite=Strict`; production bắt buộc `Secure` và HTTPS. JSON chỉ trả access token ngắn hạn, CSRF token và profile.
- Frontend giữ access token trong memory. CSRF token không phải refresh credential và chỉ nằm trong `sessionStorage` để phục hồi tab sau reload; đóng tab sẽ yêu cầu đăng nhập lại nếu không còn CSRF token.
- Refresh rotation kiểm cả hash cookie và hash CSRF trong cùng session family. Token cũ dùng lại sẽ revoke family. Logout cần access token và xóa cookie cùng option/path.
- Login/refresh rate limit dùng bảng PostgreSQL chung, UPSERT nguyên tử và hash key IP/account. Nếu shared store lỗi, request xác thực trả lỗi 5xx (fail closed), không bỏ qua hạn mức. Customer self-service đang tắt; khi có OTP/session phải dùng lại shared limiter này.
- Không log cookie/token trong controller/filter. Helmet tiếp tục bật CSP mặc định. Bảng rate-limit cần cleanup theo batch/retention trong OPS-02/CORE-03 nhưng record hết hạn không ảnh hưởng cửa sổ mới.

## Thứ tự tiếp tục

1. Chạy lại BASE-02 trên clone dữ liệu dev/production đã khử nhạy cảm khi có bản clone được phê duyệt; bổ sung Warehouse/Lot fixture sau INV-01/02. Phần độc lập của BASE-02 đã có bằng chứng trên `teap_test`.
2. SEC-04 đã DONE. Tiếp tục SEC-02 bằng API integration đủ detail/update/delete/export trên fixture hai branch; bổ sung KDS khi KDS-01 có API persisted; mở rộng audit đổi quyền qua CORE-02/03. Phần permission matrix cho controller nghiệp vụ đã hoàn tất.
3. Hoàn tất UI-02/UI-03 cho KDS/order-history/shift-close/CCTV/dashboard khi API domain tương ứng sẵn sàng; thêm E2E crawl CTA theo role, deep-link/back/refresh; không bật lại feature đang disable bằng dữ liệu cục bộ.
4. Xử lý OPS-02 dependency remediation theo nhánh có kiểm thử; không dùng `npm audit fix --force` trên nhánh chính.
5. Tiếp tục CORE-02/03: document sequence, approval primitive, retention và DLQ metrics/replay đã qua DB test; bước kế là tích hợp approval/audit/idempotency/outbox vào refund/stocktake/expense và thêm consumer dedup/alert sink thực.
6. Chuẩn hóa DATA-01/DATA-02 rồi xây INV-01/INV-02 trước khi mở rộng checkout.
7. Hoàn tất POS-01/POS-02 → KDS-01 → POS-04 → SHIFT-01 → FIN-01; sau đó chạy QA-02 trên PostgreSQL thật.
8. Chỉ bật thanh toán điện tử khi POS-03 có provider sandbox và webhook verification thật.
