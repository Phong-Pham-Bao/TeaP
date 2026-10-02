# TeaP — Kiểm thử, phát hành và hướng dẫn giao việc cho AI

## 1. Cách thực thi một task

1. Đọc `plan.md`, thiết kế domain, task mục tiêu và decision log. Kiểm tra trạng thái git; bảo toàn thay đổi người dùng.
2. Kiểm source hiện tại và bằng chứng task phụ thuộc. Nếu thiếu quyết định/provider, chỉ dừng phần phụ thuộc và ghi rõ; làm phần độc lập trong scope được giao.
3. Lập checklist nhỏ: schema/migration, service/API/permission, UI, test, tài liệu. Không tự mở rộng sang viết lại stack.
4. Với lỗi nghiệp vụ, tạo tình huống tái hiện/test thất bại trước; với tính năng, dùng acceptance criteria làm đầu vào test. Không chỉ test happy path hoặc mock mọi transaction.
5. Implement từng lát cắt; migration forward-compatible; DTO/OpenAPI/type client nhất quán. Đọc skill liên quan và kiểm API thư viện theo version thực tế.
6. Chạy kiểm tra có tỷ lệ với rủi ro: typecheck/build, unit cho rule, integration PostgreSQL cho transaction/constraint/scope, E2E cho hành trình người dùng. Không gọi test là đã qua khi chỉ mới viết file test.
7. Cập nhật task log: file thay đổi, quy tắc đã bảo vệ, lệnh đã chạy/exit code, phần chưa xác minh, screenshot hoặc report nếu có.
8. Chỉ DONE khi tiêu chí task đã có bằng chứng. Nếu chỉ xong backend, trạng thái PARTIAL; nếu provider thiếu, BLOCKED phần tích hợp. Không triển khai production, reset DB hoặc tạo dữ liệu thật từ yêu cầu chỉ lập kế hoạch.

## 2. Chiến lược test

- Unit: pricing, rounding, unit conversion, promotion eligibility, business date, transition/refund rules, payroll formula được đặc tả.
- Integration trên PostgreSQL riêng: row locks, rollback, unique/check constraints, idempotency, scope, ledger, concurrency. Không thay bằng SQLite cho kiểm thử khóa/Decimal/Postgres.
- Contract: DTO validation, response envelope, generated types, note/menu/boolean/date và lỗi client/server.
- Browser E2E: tài khoản thật trong DB test, UI → API → DB, reload và hai browser context để kiểm persistence/scope.
- Provider: mock deterministic để kiểm lỗi và sandbox thật để kiểm chữ ký/giao thức; hai loại bằng chứng được ghi riêng.
- Operational: clean install/build, migration từ empty và bản sao dữ liệu cũ, restore, worker restart, outage, tải đồng thời.

Không cần ép coverage 100% hoặc snapshot mọi JSX. Mọi invariant tiền/kho/quyền và mọi lỗi P0 phải có test phù hợp. CI thất bại nếu suite bắt buộc bị skip hoặc không tìm thấy test.

## 3. Bộ tình huống nghiệm thu bắt buộc

Fixture chuẩn: chi nhánh A/B, kho trung tâm C, Manager A/B, Cashier A/B, Kitchen A/B, Warehouse C, HR, Accountant, Admin; khách X/Y; đồ uống có size/BOM khác nhau, topping và bao bì; hai lô hạn khác nhau và một lô cách ly; thời gian cố định để test qua ngày.

| ID | Tình huống | Kết quả cần chứng minh |
|---|---|---|
| T01 | Manager A đổi branchId/ID đơn thành B; bỏ filter | Không trả/sửa dữ liệu B, không query toàn chuỗi do undefined |
| T02 | HR/Manager tạo/sửa SUPER_ADMIN, tự đổi role | Bị từ chối ở backend; không chỉ ẩn nút |
| T03 | Employee X gọi công/lương/lịch `/me` | Chỉ bản thân, không rò sang Y |
| T04 | Refresh làm access; logout/disable rồi dùng token; refresh đồng thời | Token sai loại bị chặn; session thu hồi; không sinh hai nhánh refresh hợp lệ |
| T05 | Anonymous tra phone/redeem; customer X dùng ID Y | Không lộ hồ sơ, đơn, điểm; redeem trái quyền không ghi ledger |
| T06 | Đơn có ghi chú, size sai product, item rỗng, quantity âm | Note hợp lệ qua; dữ liệu sai bị 400/code rõ; DB không ghi một phần |
| T07 | Timeout sau tạo đơn/checkout rồi retry | Cùng logical command có một order/payment/stock/point effect |
| T08 | Hai quầy cùng mua lượng tồn chỉ đủ một đơn | Chỉ một thành công; tồn không âm; bên thua không PAID/điểm/payment giả |
| T09 | Thiếu BOM/inventory hoặc lô hết hạn/cách ly | Không checkout thành công, không bỏ qua dòng thiếu |
| T10 | Redis ngắt lúc checkout, worker chết sau xử lý trước ack | DB nhất quán; outbox chạy lại không nhân đôi side effect |
| T11 | Webhook giả/trùng/đảo thứ tự/đến sau hết reservation | Xác minh đúng, chống lặp; late success đưa về xử lý tiền thật có kiểm soát |
| T12 | Hai màn hình bếp thao tác cùng món, reload, đổi ngày | State bền vững, version kiểm xung đột; backlog không biến mất |
| T13 | Hủy trước thu, hoàn trước pha, hoàn sau pha | Tác động payment/stock/kitchen/point đúng từng trường hợp |
| T14 | Hai yêu cầu refund đồng thời, hoàn một phần nhiều lần | Tổng hoàn không vượt net captured; mỗi dòng qty đúng, không refund lặp |
| T15 | Bù/làm lại món | Tiêu hao/cost/ticket được ghi; doanh thu không cộng giá niêm yết |
| T16 | >100 đơn, tiền đầu ca/rút quỹ/refund/qua nửa đêm | Expected cash đúng; không lệch UTC/pagination; close luôn có chứng từ |
| T17 | Kết ca lặp và checkout cùng lúc close | Một close có hiệu lực; mọi payment thuộc ca hợp lệ; không bỏ sót |
| T18 | Đổi tên/giá/size/BOM sau bán | Bill và cost allocation lịch sử giữ snapshot đúng |
| T19 | Nhập 1kg, tiêu hao 100g; 2 lô FEFO | Quy đổi đúng; chọn lô hợp lệ hạn sớm; balance khớp ledger |
| T20 | PO 100 nhận 60+40, retry receipt, trả NCC 10 | Nhận không lặp, tồn/net received/công nợ truy đúng chứng từ |
| T21 | Điều chuyển 20 nhận 18 | Nguồn/đích/in-transit/loss cân bằng, không tăng đích trước nhận |
| T22 | Kiểm kê trong lúc POS bán, post hai lần | Không ghi đè balance mới; đúng delta; chỉ một posting |
| T23 | Điểm đủ một reward, hai redeem đồng thời; voucher dùng hai lần | Một giao dịch hợp lệ; điểm/voucher/usage nhất quán |
| T24 | Lịch tháng 2 năm nhuận, ca qua đêm, chuyển branch | Giờ/ngày đúng, không lịch trùng; lịch sử không chạy theo branch hiện tại |
| T25 | Payroll tính lại/khóa kỳ, trả lương retry | Breakdown tái lập; kỳ khóa bất biến; settlement không lặp |
| T26 | Tổng báo cáo sales/refund/quỹ/COGS theo A+B | Các tổng đối chiếu cùng định nghĩa/thời điểm; drill-down giải thích được |
| T27 | API 403/500, mất mạng, đổi user/branch | Không báo lưu thành công giả, không fallback sample, không cache chéo |
| T28 | Migration từ DB cũ, seed lặp và restore backup | Không mất FK/history; kiểm đếm/số dư khớp; khôi phục theo runbook |
| T29 | Export/lồng object/attachment nhạy cảm ngoài scope | Bị từ chối hoặc trường được ẩn theo policy; có audit khi cần |
| T30 | Sổ kế toán mất cân bằng/kỳ khóa hoặc adapter ack lỗi | Không post sai; retry có dedup; có hàng lỗi đối soát |

T11/T30 và các test tính năng chưa bật chỉ được ghi N/A nếu release scope nêu rõ và UI/API không cho sử dụng. Không coi N/A là tích hợp đã hoàn thành.

## 4. Quy trình migration và dữ liệu cũ

1. Kiểm database thực tế qua bản sao được phép; schema file không chứng minh DB đã giống schema. Không chạy script chuẩn hóa hoặc seed demo lên DB hiện hữu để thử.
2. Backup và thử restore trước chuyển đổi; ghi số lượng record, tổng sales/payments/points, stock balances, orphan/duplicate và dữ liệu thiếu cost/HSD.
3. Migration mở rộng: thêm cột/bảng nullable hoặc default có ý nghĩa; backfill theo batch idempotent, dry-run có report. Không đổi mọi ID hoặc merge chi nhánh bằng tên.
4. Lập mapping tồn cũ → kho/lô chuyển đổi; đánh dấu unknown HSD/cost/fulfillment. Người vận hành xác nhận dữ liệu thiếu trước bật xuất kho/lợi nhuận dựa vào nó.
5. Đối chiếu và thêm constraint/index sau khi dữ liệu hợp lệ; đọc/ghi chuyển sang mô hình mới qua một lộ trình có kiểm soát, tránh hai nguồn balance.
6. Giữ tương thích phiên bản app trước trong giai đoạn rollout. Chỉ bỏ trường cũ sau thời gian ổn định và xác nhận không còn consumer.
7. Rollback app ưu tiên schema tương thích; lỗi migration dùng forward fix có kiểm chứng hoặc restore theo quy trình. Restore sẽ làm mất thay đổi sau backup, phải ghi rõ điểm phục hồi và cách đối soát giao dịch ngoài DB.

## 5. Hiệu năng và vận hành

Mục tiêu ban đầu để đo trên staging, không phải SLA đã cam kết: 10 quầy hoạt động đồng thời; p95 checkout tiền mặt <2 giây không tính in; p95 danh sách phổ biến <1 giây; bếp thấy đơn trong 3 giây nếu dùng realtime hoặc chu kỳ polling đã công bố. Benchmark phải ghi hardware, dataset, concurrency, warm/cold và tỷ lệ lỗi. Chốt lại theo D08 trước mua hạ tầng.

Test dữ liệu có nhiều tháng đơn hàng và nhiều lô; không chỉ 10 record seed. Đo query count và execution plan của KDS/kết ca/report; không dùng query count tăng theo số order khi có thể aggregate. Có giới hạn export, timeout và background jobs cho tác vụ lớn.

Theo dõi: API error/latency, DB lock/connection, payment UNKNOWN/refund failures, outbox lag/dead-letter, stock reconciliation mismatch, failed login/rate limiting, backup age và disk. Log có correlationId, tránh PII/password/token.

Đề xuất ban đầu để thảo luận: RPO 15 phút, RTO 2 giờ; chưa được bảo đảm. Muốn đạt phải có chiến lược WAL/PITR hoặc tương đương và restore drill có đo. Backup hằng ngày đơn thuần không chứng minh đạt RPO 15 phút.

## 6. Gate phát hành

- Dev done: acceptance task, typecheck/build/test liên quan qua, không giả UI, migration có rollback/forward plan.
- Staging ready: clean deployment, data migration rehearsal, permissions và T01–T30 thuộc scope qua; dependency/security review và secrets đúng môi trường.
- Pilot ready: số dư đầu kỳ được xác nhận, người vận hành được hướng dẫn; tất cả P0 đã xử lý; payment chỉ bật phương thức đã nghiệm thu; có backup restore/runbook/sự cố/kênh hỗ trợ.
- Go-live: hoàn thành bán/pha/hoàn/kết ca/đối soát tại pilot; sai lệch chưa giải thích bằng 0; doanh nghiệp xác nhận policy/roles và phạm vi kế toán. Triển khai thêm chi nhánh theo từng đợt.

Doanh nghiệp xác nhận tiền/tồn/công nợ thực tế; AI cung cấp bằng chứng kiểm chứng, không tự xác nhận số dư thay người vận hành.

## 7. Prompt khởi động triển khai

Sao chép đoạn dưới vào AI khi muốn bắt đầu xây dựng:

```text
Hãy triển khai TeaP theo bộ tài liệu trong plans/260927-erp-production-roadmap/.
Đọc plan.md, 02-domain-design.md, 03-implementation-backlog.md và
04-verification-and-ai-handoff.md; đối chiếu 01-source-audit.md với source hiện tại.

Bắt đầu BASE-01, sau đó SEC-01 nếu BASE-01 đã có bằng chứng hoàn thành.
Giữ NestJS/Prisma/PostgreSQL/Next.js hiện có và bảo toàn thay đổi chưa commit.
Phạm vi lần này là các task trên, không phải toàn bộ roadmap trong một lần.

Trước khi sửa, kiểm dependencies, AGENTS.md và skill liên quan.
Thực hiện đầy đủ backend + frontend liên quan + migration + test + docs.
Không dùng mock/localStorage làm nguồn nghiệp vụ production; không báo thành công
nếu backend chưa lưu. Quyền và số tiền phải kiểm ở server.
Không reset DB, chạy seed demo lên DB có dữ liệu, hoặc triển khai production.

Với quyết định thiếu, ghi rõ giả định và chặn phần phụ thuộc; tiếp tục việc độc lập.
Mỗi task chỉ DONE khi đạt acceptance criteria và có kết quả test đã chạy.
Cuối lượt ghi file đã sửa, test/lệnh/kết quả, rủi ro còn lại và task tiếp theo.
Lưu tiến độ vào progress.md trong cùng thư mục plan.
```

## 8. Prompt tiếp tục từng task

```text
Tiếp tục task <TASK-ID> trong plans/260927-erp-production-roadmap/03-implementation-backlog.md.
Đọc progress.md nếu có và kiểm lại bằng chứng task phụ thuộc trong source.
Triển khai hết acceptance criteria của task, theo 02-domain-design.md.
Chạy các test Txx liên quan trong 04-verification-and-ai-handoff.md.
Không sửa ngoài scope hoặc bỏ qua lỗi P0 để làm giao diện trước.
Cập nhật progress.md bằng kết quả thực tế; phân biệt DONE, PARTIAL và BLOCKED.
```

## 9. Mẫu yêu cầu review sau một mốc

```text
Review mốc <M1/M2/...> của TeaP theo plan và diff thực tế.
Đối chiếu từng acceptance criterion và invariant tiền/kho/quyền.
Kiểm source, test đã chạy và lỗi còn lại; không chỉ đọc progress.md.
Trả các phát hiện theo mức ưu tiên với file/vị trí và tình huống tái hiện.
Không triển khai sửa hay deploy trong lượt review này.
```
