# TeaP ERP — Đánh giá hiện trạng và cập nhật roadmap

Ngày đánh giá: 29/09/2026. Phạm vi: source và bằng chứng kiểm thử đang có trong workspace. Tài liệu này là ảnh chụp hiện trạng sau các vòng triển khai đầu tiên; `01-source-audit.md` vẫn là baseline ban đầu.

## 1. Kết luận điều hành

TeaP **không còn là một bản demo CRUD đơn giản**. Dự án đã có nền tảng kỹ thuật tốt để tiếp tục phát triển thành ERP cho chuỗi đồ uống: modular monolith rõ module, PostgreSQL/Prisma, phân vai theo portal, POS có transaction, session có rotation/revocation, branch scope bước đầu, migration có thể dựng từ DB rỗng, idempotency/audit/outbox và quy tắc business time Việt Nam.

Tuy nhiên, dự án hiện chỉ nên được gọi là **ERP foundation / hardened prototype**, chưa phải ERP production. Lý do không nằm ở giao diện mà ở các chuỗi nghiệp vụ chưa khép kín: tồn kho chưa có chứng từ/lô/FEFO; bán hàng chưa gắn ca và tender; hủy đơn đã thu tiền chưa có refund; bếp chưa lưu trạng thái; mua hàng, công nợ, giá vốn và payroll chưa thành sổ. Các đường demo đã được gỡ hoặc khóa nhưng domain backend tương ứng vẫn phải được xây trước khi bật lại.

Đánh giá thực dụng sau lát cắt SEC-02 + CORE-02/POS-01 hiện tại:

| Góc nhìn | Mức hiện tại | Nhận xét |
|---|---:|---|
| Nền kiến trúc và khả năng tiếp tục phát triển | 4.6/5 | Có migration, DB rehearsal, document sequence nguyên tử, approval primitive có version/SoD, platform retention/DLQ operations, OpenAPI 57 paths/81 schemas và generated type có drift check; không cần viết lại toàn bộ |
| Bảo mật và phân quyền | 4.0/5 | Browser session/CSRF và rate limit nhiều replica đã khép; policy fail-closed, multi-branch và permission matrix cho 75 endpoint đã có; thao tác retention/replay chỉ SUPER_ADMIN và có audit; còn test API đủ action/KDS, audit quyền mở rộng và dependency vulnerabilities |
| POS tiền mặt | 3.7/5 | Có giá server, idempotency, transaction, document sequence và checkout race đã qua PostgreSQL thật, contract tiền VND nhất quán; còn ca, tender, receipt và refund |
| Kho và chuỗi cung ứng | 1.5/5 | Có balance/movement cơ bản; thiếu chứng từ, kho/vị trí, lô/HSD, FEFO, mua hàng và kiểm kê chuẩn |
| Tài chính và kế toán quản trị | 1.2/5 | Cash-flow đã dùng contract tiền chính xác hơn; chưa có đối soát, công nợ, giá vốn và posting bất biến |
| HR/CRM/vận hành | 1.5/5 | Có khung chức năng nhưng nhiều luồng chưa bền vững hoặc chưa có quy trình duyệt |
| Frontend và dữ liệu thật | 3.6/5 | Các portal chính dùng API thật; feature thiếu backend bị disable; điều hướng theo role có contract, deep-link/Back cho Manager và order filter; còn N+1 và workflow domain chưa persisted |
| Kiểm thử và vận hành production | 3.5/5 | Có 89 test, HTTP authorization integration hai branch, security/platform DB integration, document-sequence/approval/checkout concurrency trên PostgreSQL, retention/replay DB test, navigation contract, backend/frontend type-check, backend build, DB smoke/rehearsal và OpenAPI drift check; thiếu CI, E2E đủ role, staging, alert sink, observability và restore drill |

**Điểm trưởng thành ERP tổng hợp hiện tại: khoảng 2.8/5 (57/100).** Permission matrix đã phủ controller nghiệp vụ và vận hành platform; rủi ro trùng số đơn, duyệt kép, checkout kép và cleanup nhầm record đang hiệu lực đã có cơ chế khóa/constraint cùng kiểm chứng PostgreSQL. Dự án vẫn chưa pilot-ready vì kho, tài chính, refund, KDS và ca-quỹ chưa khép chuỗi end-to-end.

Điểm số chỉ thể hiện độ trưởng thành tương đối, không phải phần trăm công việc đã hoàn thành.

## 2. Điểm mạnh nên giữ

- Giữ kiến trúc modular monolith NestJS + PostgreSQL; chưa có lý do kỹ thuật để tách microservice.
- Backend đã bắt đầu giữ quyền quyết định đối với giá, scope, trạng thái và tồn; đây là hướng đúng cho ERP.
- Refresh session được hash/rotate/revoke; logout phía server và actor thống nhất đã giảm rủi ro identity đáng kể.
- POS create/checkout có idempotency và audit; checkout dùng transaction, khóa dữ liệu và outbox thay vì phụ thuộc Redis để commit nghiệp vụ.
- Có baseline migration, migration auth/platform, DB guard và smoke test trên PostgreSQL riêng.
- Business date/timezone Việt Nam và khoảng ngày end-exclusive đã được chuẩn hóa bước đầu.
- OpenAPI spec, generated frontend types và drift check đã trở thành contract có thể lặp lại; POS đã trả tiền VND bằng số nguyên theo response DTO thay vì để kiểu Decimal rò ra tùy ý.
- Bộ kiểm thử hiện có 21 suite/89 test, có HTTP authorization integration và security/platform DB integration cho hai branch/shared rate limit/retention/replay, test ID target ngoài scope cho user detail/update/delete, document-sequence/approval/checkout concurrency trên PostgreSQL thật, cùng contract test cho route/operation ID/schema tiền/Decimal/response các domain cốt lõi.
- Platform operations đã có metrics backlog/age/dead-letter, cursor pagination, retention theo batch và replay có reason/audit; cleanup dùng transaction ngắn + `SKIP LOCKED` và giữ nguyên event chưa publish/idempotency còn hiệu lực.
- Approval primitive đã lưu requester/decision/resource version, chặn tự duyệt và sai branch, khóa row khi quyết định và ghi audit cùng transaction; thiết kế dừng ở primitive thay vì tạo workflow engine chung quá sớm.
- Permission matrix tập trung gồm 39 quyền đã thay `@Roles` rải rác trên 71 endpoint thuộc toàn bộ 15 controller nghiệp vụ; guard từ chối route trộn hai kiểu policy để tránh quyền hiệu lực mơ hồ. Chỉ `/auth/me` và `/auth/logout` dùng quyền chung cho mọi tài khoản đã xác thực.
- Quick-login, mật khẩu mẫu và các mảng dữ liệu nghiệp vụ giả đã được gỡ khỏi frontend app; feature chưa có backend được khóa và gắn task roadmap thay vì báo thành công cục bộ.
- Điều hướng frontend có contract dùng chung cho 7 vai trò; route mới không có policy, link tĩnh chưa được duyệt, đích không tồn tại hoặc prefix vượt ranh giới đều làm verification fail. Manager tab và trạng thái lọc hóa đơn đã hỗ trợ deep-link/Back.
- Roadmap hiện tại có dependency và acceptance criteria, đủ tốt để AI thực hiện theo lát cắt nghiệp vụ thay vì sinh thêm màn hình rời rạc.

## 3. Điểm yếu, vị trí cần khắc phục và hướng xử lý

| Mức | Điểm yếu đã thấy trong source | Rủi ro thực tế | Cách khắc phục | Task roadmap |
|---|---|---|---|---|
| Đã xử lý | Số đơn trước đây ghép thời gian với `Math.random()` | Trùng số khi nhiều quầy hoặc khó đối soát | Đã dùng `DocumentSequence` với UPSERT nguyên tử theo loại chứng từ, branch và business date; unique `branchId + orderNumber`; 24 allocation đồng thời đã qua DB test | CORE-02, POS-01 |
| Đã giảm rủi ro | Promotion `BUY_X_GET_Y` trước đây có thể bị bỏ qua im lặng | UI và hóa đơn có thể khác nhau; mất doanh thu/tranh chấp | Hiện rule chưa hỗ trợ đã fail rõ; bước còn lại là pricing service duy nhất và bộ rule được duyệt | DATA-02, POS-01 |
| P0 | Hủy đơn đã thanh toán có thể đảo kho/điểm trực tiếp, chưa có refund/approval/KDS state | Hoàn tiền sai, hoàn nguyên liệu đã pha, ledger không truy vết | Tách void, refund, stock return và remake; reversal bất biến, hạn mức duyệt và chống refund vượt | POS-04 |
| P0 | Checkout chưa gắn ca, terminal, tender/change và receipt snapshot; race test hai kết nối DB đã đạt | Không kết ca/đối soát được dù double checkout cơ bản đã được chặn và kiểm chứng | Hoàn thành ca bán hàng, tender/change, receipt snapshot và mở rộng race test cho reservation/lô | POS-02, SHIFT-01, QA-02 |
| P0 | Approval mới là primitive nội bộ, chưa gắn vào refund, stocktake hoặc expense | Luồng nhạy cảm hiện vẫn có thể thiếu separation of duties dù hạ tầng duyệt đã đúng | Tích hợp approval theo hạn mức/quyền vào từng command; kiểm version nghiệp vụ tại thời điểm quyết định | CORE-02, POS-04, INV-03, FIN-01 |
| Đã xử lý | Refresh token từng ở `localStorage`; rate limiter từng ở memory | XSS có thể lấy session; nhiều replica không chia sẻ hạn mức | Đã chuyển cookie HttpOnly + CSRF binding, access token memory và rate limit PostgreSQL chung; giữ regression test | SEC-04 DONE |
| P0 | Policy đã fail-closed, user có assignment nhiều branch và 71 endpoint nghiệp vụ dùng permission matrix; test HTTP hai branch mới phủ lát cắt kho, chưa phủ mọi action/export/KDS | Endpoint hiện tại an toàn hơn nhưng regression trong service/domain chưa được kiểm end-to-end vẫn có thể rò dữ liệu chéo chi nhánh | Mở rộng API integration 2 branch cho detail/update/delete/export/KDS; audit đổi quyền | SEC-02 |
| Đã giảm rủi ro | Portal từng dùng sample/localStorage và sinh số chứng từ ở frontend | Người dùng có thể thấy thành công nhưng dữ liệu không tồn tại hoặc không đối soát được | Các lát cắt có API đã nối thật; document sequence POS đã hoàn tất; feature thiếu backend vẫn bị disable cho tới khi FIN-01/HR-01/PUR-02 tương ứng hoàn tất | UI-02 PARTIAL |
| P1 | Kho đang cập nhật balance/movement trực tiếp, chưa có StockDocument, Warehouse/Location, lot/expiry/FEFO/reservation | Tồn không truy xuất được, bán lô hết hạn hoặc âm khi hai quầy tranh hàng | Tập trung stock posting qua chứng từ; lô/HSD/FEFO; kiểm kê và chuyển kho nhiều bước | INV-01–04 |
| P1 | Menu/BOM/giá chưa version và snapshot đầy đủ | Sửa danh mục làm sai lịch sử đơn và cost | BOM publish/effective version, branch price và snapshot khi confirm | DATA-01/02 |
| P1 | Bếp lấy danh sách đơn rồi gọi chi tiết từng đơn, giới hạn top 20; trạng thái chủ yếu ở browser | Mất ticket qua reload/ngày mới, N+1 và sai branch | KDS ticket/item persisted, transition versioned và API aggregate/cursor | KDS-01 |
| P1 | CashFlow chưa phải sổ quỹ; chưa có purchase/AP/valuation/accounting posting | Không thể đối soát tiền, công nợ và lợi nhuận thật | Source ledger bất biến, reconciliation, PO/receipt/bill/AP, cost method và accounting adapter | FIN-01–03, PUR-01/02 |
| P1 | Attendance/schedule/payroll còn đơn giản; bulk schedule có thể nuốt lỗi | Sai công/lương, khó sửa lịch sử | Assignment theo hiệu lực, ca qua đêm, correction/leave/OT approval, payroll run snapshot/lock | HR-01/02 |
| P1 | `any`, raw result và `$queryRawUnsafe` còn trong các luồng quan trọng; generated API contract mới phủ sâu lát cắt POS | Lỗi contract ở menu/kho/tài chính/HR vẫn có thể chỉ lộ lúc runtime; tăng nguy cơ query sai | Bổ sung response DTO, áp dụng generated types theo domain, query parameterized và contract snapshot | CORE-01, UI-02 |
| P1 | Retention, DLQ metrics/list/replay có quyền và structured dead-letter error đã có; audit/idempotency/outbox vẫn chủ yếu phủ POS, chưa có alert sink/UI/lịch cleanup/consumer dedup | Event chết đã quan sát và replay được qua API nhưng chưa tự báo tới hệ thống trực; stock/finance còn thiếu truy vết chuẩn | Tích hợp alert sink + scheduler, audit query UI, consumer dedup và mở rộng command coverage | CORE-03 |
| P0 | Rehearsal mới chạy trên `teap_test`, chưa phải clone dữ liệu thật đã khử nhạy cảm; chưa CI/E2E/restore drill | Migration có thể vẫn hỏng trên hình dạng dữ liệu thực tế | Chạy lại rehearsal trên clone được duyệt; CI, staging và restore rehearsal | BASE-02, OPS-02, QA-01/02 |
| P0 | Production dependency audit đang báo 20 cảnh báo, gồm 1 critical và 8 high; một số fix gợi ý yêu cầu nâng major Nest/Swagger | Có thể tồn tại DoS, parsing/upload hoặc supply-chain risk; auto-fix có thể làm vỡ ứng dụng | Triage theo đường khai thác; nâng patch/minor trước, tách nhánh nâng major, thêm audit policy/allowlist có ngày hết hạn vào CI | OPS-02, QA-01 |

## 4. Các cổng chặn trước khi pilot dùng tiền thật

Không pilot cửa hàng nếu còn bất kỳ điều kiện nào dưới đây:

1. Chưa có test quyền hai chi nhánh cho list/detail/create/update/delete/export.
2. Thanh toán không phải tiền mặt vẫn có thể được đánh dấu thành công mà không có provider xác minh.
3. ~~Hai checkout cạnh tranh chưa được kiểm thử bằng hai kết nối DB thực.~~ Đã đạt trên `teap_test`; giữ test này trong regression gate.
4. Đơn đã thanh toán còn đi qua cancel cũ thay vì refund/reversal có approval.
5. Chưa có ca bán hàng, tender/change, receipt server và đối soát quỹ cuối ca.
6. Màn hình trong phạm vi pilot còn dùng sample/mock/localStorage mà không gắn nhãn demo hoặc bị disable.
7. Chưa có staging, backup/restore rehearsal, health/readiness, log có correlation và cảnh báo outbox/dead-letter.
8. Migration chưa được chạy thử trên bản sao dữ liệu hiện hữu và đối chiếu số dư sau nâng cấp.

Thanh toán điện tử, customer self-service, payroll và accounting chỉ được bật khi các provider/chính sách liên quan đã được chủ nghiệp vụ duyệt và có test tích hợp thật.

## 5. Roadmap điều chỉnh

Thứ tự thực hiện mới tập trung đóng các chuỗi đang dở, không mở thêm portal mới:

1. **Đóng nền P0:** CORE-01 và SEC-04 đã DONE; tiếp tục phần còn lại SEC-02, UI-02 và dependency remediation OPS-02; sau đó CORE-02/03. BASE-02 được chạy lại khi có clone dữ liệu đã khử nhạy cảm.
2. **Chuẩn hóa dữ liệu và kho:** DATA-01 → DATA-02 → INV-01 → INV-02.
3. **Chứng nhận vòng bán hàng tiền mặt:** POS-01 → POS-02 → KDS-01 → POS-04 → SHIFT-01 → FIN-01 → QA-02.
4. **Hoàn thiện chuỗi cung ứng:** PUR-01 → PUR-02 → INV-03/04 → FIN-02.
5. **Quản trị chuỗi:** CRM-01, HR-01/02, FIN-03, BI-01, OPS-01 theo dependency.
6. **Go-live:** OPS-02 và QA-01; pilot một chi nhánh trước, sau đó mới mở hai chi nhánh.

Trong giai đoạn 1–3, UI-01 chạy song song với từng domain nhưng chỉ nối API đã có; không tạo thành công giả. POS-03 và các EXT không được chen vào critical path trừ khi người dùng chốt provider/phạm vi.

## 6. Tiêu chí để nâng mức đánh giá

TeaP có thể được đánh giá là **pilot-ready** khi toàn bộ P0 ở trên qua test và hoàn tất một kịch bản: mở ca → bán tiền mặt → bếp nhận/hoàn tất → refund có duyệt → kết ca → sổ quỹ khớp → restore rehearsal.

TeaP chỉ nên được gọi là **ERP vận hành chuỗi** khi thêm chuỗi: PO → nhận lô → công nợ → thanh toán NCC → giá vốn; điều chuyển/kiểm kê; CRM/HR/payroll theo phạm vi đã chốt; báo cáo drill-down khớp chứng từ nguồn; có CI, staging, monitoring và quy trình rollback/khôi phục được diễn tập.
