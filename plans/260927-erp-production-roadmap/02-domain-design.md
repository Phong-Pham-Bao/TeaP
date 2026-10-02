# TeaP — Thiết kế nghiệp vụ và dữ liệu mục tiêu

Trạng thái: đặc tả đề xuất, không phải schema đã triển khai. Đọc cùng `plan.md` và backlog. Chốt D01–D09 ở phần liên quan trước production.

## 1. Các bất biến hệ thống

1. Mỗi thao tác có actor đã xác thực, permission, scope chi nhánh/kho và correlationId. Không chấp nhận actorId do client gửi làm người thực hiện.
2. Biết ID không đồng nghĩa có quyền. Kiểm scope cho list/detail/mutation/export, dữ liệu lồng nhau và cả hai đầu điều chuyển. User thiếu branch hợp lệ phải bị từ chối, không được trở thành query không filter.
3. Một lệnh nghiệp vụ được retry không làm phát sinh chứng từ, tiền, kho hoặc điểm lần hai.
4. Tồn khả dụng = tồn thực có thể dùng − lượng đã giữ; loại trừ lô hết hạn/cách ly. Chính sách pilot không cho âm kho.
5. Stock balance phải đối chiếu được với opening balance + ledger. Mỗi dòng ledger truy về một dòng chứng từ.
6. Thanh toán thành công chỉ khi có bằng chứng theo phương thức. Tổng hoàn thành công không vượt tiền đã thu thành công trừ phần đã hoàn.
7. Hủy đơn, hoàn tiền, trả kho và hủy món bếp là các tác động riêng; không suy ra tự động tất cả từ một trường CANCELLED.
8. Chứng từ ghi sổ không bị xóa/sửa trực tiếp. Ghi đảo có liên kết gốc, lý do, người thực hiện và người duyệt khi cần.
9. Lịch sử bán giữ nguyên tên/SKU/size/giá/thuế/giảm giá/BOM áp dụng. Đổi danh mục không đổi bill cũ.
10. Số dư điểm đối chiếu với point ledger; reward price do server đọc từ chương trình. Không cho số điểm đổi âm/0 hoặc tùy ý.
11. TeaP hiện chỉ dùng VND: tiền đi qua API dưới dạng số nguyên đồng, giới hạn trong safe integer/schema; backend tính bằng Decimal và làm tròn `ROUND_HALF_UP` tại biên nghiệp vụ. Decimal không phải tiền (số lượng/đơn vị) vẫn biểu diễn bằng chuỗi khi cần giữ precision.
12. Timestamp sự kiện lưu UTC, ngày nghiệp vụ suy từ timezone/cutoff cấu hình. Dùng khoảng ngày `[start, end)`; không lấy ngày UTC làm ngày bán tại Việt Nam.

## 2. Ranh giới module

Giữ `auth/users/branches/categories/products/recipes/pos/inventory/customers/promotions/hr/finance/reports`. Bổ sung dần `platform` (audit, idempotency, numbering, outbox), `kitchen`, `shifts`, `purchasing`, `approvals`, `operations`, `integrations`.

- Inventory service duy nhất thực hiện stock posting/valuation; POS, receiving và stocktake gọi API nội bộ này trong cùng transaction khi cần atomicity.
- Payment service quản lý payment attempt/provider event/refund. POS không tự gán COMPLETED cho điện tử.
- Finance sở hữu cash/accounting posting. Các nguồn khác gửi source event có khóa chống lặp.
- Reports chỉ đọc từ nguồn đã định nghĩa; không tạo trạng thái nghiệp vụ.
- API provider ở adapter; secrets ở cấu hình server. Khi chưa cấu hình, trả lỗi chưa khả dụng rõ ràng và ẩn/tắt hành động tương ứng.

## 3. Permission mặc định đề xuất

| Vai trò | Scope mặc định | Quyền chính | Giới hạn |
|---|---|---|---|
| SUPER_ADMIN | Toàn doanh nghiệp | Cấu hình, quyền, chi nhánh, xem toàn chuỗi | Mọi thay đổi nhạy cảm vẫn có audit |
| MANAGER | Chi nhánh được giao | Giám sát bán/bếp, lịch, yêu cầu hàng, duyệt nghiệp vụ được cấp | Không cấp SUPER_ADMIN; không truy cập chi nhánh khác |
| CASHIER | Ca/chi nhánh được giao | Bán, nhận tiền mặt, yêu cầu hoàn, mở/kết ca theo policy | Không tự duyệt hoàn tiền đã thu hoặc chỉnh tồn |
| KITCHEN_STAFF | Bếp chi nhánh được giao | Xem/chuyển trạng thái ticket | Không xem lương, doanh thu toàn chuỗi, sửa giá |
| WAREHOUSE_STAFF | Kho được giao | Nhận/xuất/đếm, đề nghị điều chỉnh | Không tự duyệt chênh lệch do mình lập |
| ACCOUNTANT | Chi nhánh/toàn chuỗi theo assignment | Quỹ, công nợ, đối soát, kỳ kế toán | Không sửa trực tiếp payment provider hoặc stock balance |
| HR | Scope nhân sự được giao | Hồ sơ, lịch/công/payroll theo permission | Không nâng quyền hệ thống; giới hạn dữ liệu lương |
| CUSTOMER | Bản thân qua customer session | Hồ sơ/điểm/voucher/lịch sử của mình | Không tra hồ sơ người khác bằng số điện thoại |

Đây là ma trận khởi đầu, D04 quyết định ngưỡng và người duyệt. Tách employee profile khỏi user login; nhân viên có quyền self-service không cần quyền HR. Customer identity tách khỏi enum role nhân viên.

## 4. Các thực thể đề xuất theo giai đoạn

| Nhóm | Thực thể bổ sung/mở rộng | Quan hệ/ràng buộc quan trọng |
|---|---|---|
| Nền tảng | Session, UserBranchAssignment, AuditEvent, IdempotencyRecord, OutboxEvent, ApprovalRequest/Decision, DocumentSequence | Scope bắt buộc; unique idempotency theo actor/scope/action/key; audit không chứa token/password |
| Danh mục | UnitOfMeasure, ProductUnitConversion, ProductVariant hoặc ProductSize mở rộng, BranchPrice, RecipeVersion/Line | Chọn một hướng variant, không tạo hai nguồn; conversion có dimension và precision; version đã dùng bất biến |
| Kho | Warehouse, Location, InventoryLot, StockDocument/Line, StockMovement, StockReservation, Stocktake/Line, WasteDocument | Unique balance theo kho/vị trí/product/lot; FK nguồn chứng từ; constraint qty; nullable lot phải có chiến lược uniqueness rõ |
| Mua | Supplier, PurchaseOrder/Line, GoodsReceipt/Line, PurchaseReturn/Line, SupplierBill/Line | Receipt liên kết PO line; tổng nhận/trả/tolerance; bill reference unique trong supplier |
| Bán | Order snapshot, OrderLineSnapshot, PaymentAttempt, ProviderEvent, Refund/Line, Compensation | Unique provider transaction/event; reference gốc; amount giới hạn; trạng thái bán tách thanh toán |
| Bếp/ca | KitchenTicket/Item, PosTerminal, ShiftSession, CashMovement, ShiftClose | Ticket theo order line + lần pha; một ca OPEN/terminal theo policy; một kết ca có hiệu lực |
| CRM | CustomerIdentity/Session, Reward, Voucher, Redemption, PromotionRule/Usage | Voucher single-use bằng atomic transition; point ledger source unique |
| HR | EmployeeProfile, EmploymentAssignment/Contract, ShiftDefinition, ScheduleAssignment, AttendanceEvent, Timesheet, Leave/OTRequest, PayrollRun/Line | Khoảng hiệu lực, chống ca trùng; công đã duyệt; payroll có version, snapshot và kỳ khóa |
| Tài chính | CashAccount, Settlement, Payable, ValuationEntry, AccountingExport/JournalEntry/Line, AccountingPeriod | Source unique; nợ/có cân bằng nếu có sổ kép; kỳ khóa; số phải trả đối chiếu bill/settlement |
| Vận hành | ChecklistTemplate/Run, Incident, TrainingAssignment/Result, Asset/Maintenance | Chi nhánh/actor, lịch sử duyệt, file bằng chứng có quyền truy cập |

Không tạo toàn bộ bảng ngay. Mỗi task kèm migration nhỏ, backfill, index cho FK/query theo scope và test constraint. Tránh FK đa hình không kiểm soát: `StockLedger.refId` hiện FK tới Order nên không dùng nó để nhét ID mọi loại phiếu. Thiết kế StockDocument làm nguồn posting chung hoặc các FK tường minh; giữ mapping order cũ.

Không bắt buộc chuyển sang Supabase: skill PostgreSQL áp dụng được cho DB hiện có. RLS là lớp phòng vệ có thể bổ sung sau đánh giá cách truyền context/connection pooling; application authorization vẫn bắt buộc.

## 5. Luồng bán, thanh toán, bếp và hoàn

### Pilot tiền mặt

Mở ca → tạo đơn có snapshot → server tính tiền → xác nhận tiền khách đưa/tiền thừa → transaction khóa đơn và kho theo thứ tự → kiểm đủ tồn/công thức → payment + stock ledger + điểm + ticket/outbox → commit → hiển thị bill từ server → bếp pha/giao → kết ca.

- Không phát lệnh thanh toán ngoài DB trong transaction. Ticket có thể tạo cùng DB transaction, sự kiện đồng bộ thiết bị đi qua outbox.
- POS giữ orderId và idempotency key khi timeout. Retry phải hỏi/khôi phục kết quả cũ trước khi tạo đơn mới.
- Khi nguyên liệu chưa có inventory hoặc không đủ, trả lỗi nghiệp vụ; transaction không để lại PAID/payment/điểm/ledger một phần.
- Chọn size/BOM mặc định và theo size theo quy tắc rõ ràng; không tự cộng cả hai nếu mô hình là thay thế. Topping và bao bì có mapping tiêu hao, không mặc định mọi topping bằng một đơn vị chính nó.

### Thanh toán điện tử

Tạo payment attempt → reserve kho có hạn nếu cần → gọi provider ngoài DB → webhook xác minh chữ ký/reference/amount/currency → transaction chống lặp để finalize → tiêu hao/giải phóng reservation → outbox.

Provider timeout không đồng nghĩa thất bại. Thêm trạng thái UNKNOWN/PENDING_RECONCILIATION và job query provider. Nếu thanh toán đến sau khi reservation hết hạn: ghi nhận khoản tiền đã nhận, chuyển NEEDS_REVIEW/REFUND_PENDING; không giả vờ chưa thu tiền hoặc tự bán âm kho. Browser redirect không phải bằng chứng tiền đã thu.

### Trạng thái đề xuất

| Đối tượng | Luồng |
|---|---|
| Đơn | DRAFT → CONFIRMED → COMPLETED; CANCELLED chỉ qua lệnh hợp lệ |
| Thanh toán | PENDING → SUCCEEDED/FAILED/EXPIRED; UNKNOWN cần đối soát; refund là chứng từ riêng |
| Bếp | QUEUED → PREPARING → READY → SERVED; CANCELLED theo policy và có lịch sử |
| Hoàn | REQUESTED → APPROVED/REJECTED → PROCESSING → SUCCEEDED/FAILED; có thể cần retry/query provider |

Migration OrderStatus cũ phải có mapping và cờ lịch sử; không suy ra đơn cũ đã SERVED khi không có bằng chứng.

### Hủy, hoàn tiền, món bù

- Chưa thu tiền: void đơn, giải phóng reservation và hủy ticket hợp lệ.
- Đã thu nhưng chưa pha: request refund; chỉ hoàn kho phần chưa tiêu hao thực tế theo policy.
- Đã pha: refund có thể xảy ra nhưng nguyên liệu không tự tăng lại; ghi waste/compensation phù hợp, tránh ghi tiêu hao hai lần.
- Hoàn một phần có line/quantity/discount/tax allocation và tổng đã hoàn. Điểm/voucher theo chính sách đã chốt, không âm điểm vô tình khi khách đã tiêu điểm.
- Món làm lại/bù: doanh thu khách trả thêm bằng 0 theo policy; có BOM/cost/ticket riêng liên kết đơn gốc; cần lý do/quyền; không cộng subtotal bán vào báo cáo doanh thu.

## 6. Kho, mua và sơ chế

PO: DRAFT → SUBMITTED → APPROVED → PARTIALLY_RECEIVED → RECEIVED/CLOSED. Rejected/cancelled chỉ khi thỏa điều kiện chưa hoặc đã xử lý phần nhận.

Nhận hàng: kiểm PO, quantity/đơn vị/lô/HSD, phần chấp nhận và cách ly; post receipt một lần. Không đồng nhất nhận hàng với trả tiền NCC. Supplier bill so với PO/receipt, chênh lệch có người duyệt. Trả NCC tạo stock reversal/return và công nợ tương ứng.

Điều chuyển: REQUESTED → APPROVED → DISPATCHED → PARTIALLY_RECEIVED → RECEIVED. Khi xuất giảm kho nguồn và tăng vị trí in-transit; kho đích chỉ tăng số thực nhận. Chênh lệch/hỏng được xử lý bằng phiếu riêng. Toàn chuỗi bảo toàn quantity nếu không có loss hợp lệ.

FEFO chọn lô khả dụng hạn sớm nhất; cấm lô hết hạn/cách ly. Theo dõi hạn mở bao bì nếu nguyên liệu cần. Thu hồi lô truy từ NCC/receipt đến kho/điều chuyển/đơn tiêu thụ. Không tạo hạn dùng giả cho tồn cũ.

Kiểm kê có snapshot thời điểm và version, blind count nếu yêu cầu; trong pilot khóa posting phạm vi kiểm kê ngắn hạn, hoặc reconciliation rõ các movement sau snapshot. Không ghi đè balance bằng số đếm cũ khi POS vẫn bán. Duyệt chênh lệch → post đúng một lần.

Sơ chế theo mẻ chỉ ở EXT-01: input lot → production batch → yield/output lot/HSD → waste. Không vừa trừ nguyên liệu thô lúc sơ chế vừa trừ cùng nguyên liệu lần nữa lúc bán.

## 7. Ca, quỹ và kế toán

Tiền mặt dự kiến cuối ca = tiền đầu ca + tiền bán CASH thực thu − tiền hoàn CASH thực trả + thu quỹ khác − chi/rút quỹ. Tiền khách đưa và tiền thừa lưu để đối chiếu; doanh thu không bằng tiền khách đưa.

Kết ca luôn có chứng từ, kể cả variance = 0. Server tổng hợp theo shiftId; không giới hạn 100 đơn và không N+1 detail. Ca đã đóng không nhận thêm posting; xử lý cuộc đua checkout/close bằng khóa/trạng thái. Chênh lệch là khoản cần giải trình/duyệt, không tự coi là doanh thu bán hàng.

Thu chi ≠ lợi nhuận. Báo cáo phân biệt gross sales, discount, refund, net sales, tax, COGS, gross profit, expense và cash movement. Giá vốn gắn movement thực tế và phương pháp D06; BOM chỉ là ước tính trước posting.

FIN-03 có hai hướng chọn một: tích hợp kế toán đã có (mapping, export/event, ack/retry/reconciliation) hoặc sổ kép tối thiểu (account/journal/period/posting/reversal). Nếu tự xây, chỉ journal cân bằng mới POSTED, kỳ khóa không sửa trực tiếp. Không để hai hệ thống cùng làm nguồn sự thật cho một bút toán.

## 8. HR, CRM và vận hành

HR: lịch theo ngày thật; ca qua đêm có start/end timestamp; check-in/out theo assignment; sửa công/nghỉ/OT có phê duyệt; khóa timesheet trước tính payroll. Salary payment chỉ PAID khi có settlement, không chỉ bấm checkbox. Lương, hợp đồng và dữ liệu cá nhân cần permission riêng và audit xuất dữ liệu.

CRM: customer session hoặc xác thực qua nhân viên được phép; tách lookup tối thiểu phục vụ POS khỏi portal tự phục vụ. Reward/voucher do backend sở hữu. Promotion engine dùng chung cho quote/checkout, rule version, validity và giới hạn global/customer/branch; áp dụng và hoàn usage nguyên tử.

Operations: checklist theo ca/chi nhánh, task có người phụ trách, bằng chứng, deadline; incident mở/đang xử lý/đóng với người xác nhận. Camera/IoT không giả lập live; chỉ cấu hình thật hoặc hiển thị chưa kết nối.

## 9. Hợp đồng API và giao diện

- Money contract: request/response tiền VND là JSON integer, không nhận phần lẻ; giới hạn hiện tại `0..9,999,999,999` cho số tiền không âm. Phần trăm có thể có tối đa 2 chữ số thập phân; kết quả chiết khấu làm tròn `ROUND_HALF_UP`, bị chặn không vượt subtotal. Frontend chỉ ước tính để hiển thị, kết quả server là nguồn sự thật.
- List: `{ data: T[], meta: { page, limit, total, totalPages } }`; detail trả resource nhất quán. Error: `{ code, message, fieldErrors?, correlationId }`. Không bọc lồng envelope ngoài dự kiến.
- DTO runtime kiểm array không rỗng, số dương/hữu hạn, độ dài, enum, UUID, quan hệ size/product, ngày/giờ, boolean query. Không nhận giá/điểm/người duyệt do client tự quyết.
- Command ghi nhạy cảm dùng `Idempotency-Key`; cùng key khác request hash trả 409. Cùng key cùng payload trả kết quả gốc. Persist command/result cùng transaction nghiệp vụ.
- Dùng version/If-Match hoặc equivalent với sửa chứng từ để phát hiện stale edit; 409 yêu cầu reload.
- Endpoint đề xuất: `/shifts/open`, `/shifts/:id/close`, `/kitchen/tickets`, `/kitchen/items/:id/status`, `/purchase-orders`, `/goods-receipts`, `/stocktakes/:id/post`, `/refunds`, `/customers/me`, `/reports/reconciliation`. Tên cuối cùng do task chốt trong OpenAPI; mọi endpoint phải có scope và permission.
- Frontend dùng domain hooks/API client có type; cache key gồm session/scope/filter, xóa cache khi logout/đổi scope. Fetch song song các request độc lập; API aggregate cho bếp/kết ca; không fetch detail từng dòng.
- Mỗi màn hình có loading/error/empty/success, retry và trạng thái chưa lưu. Thành công chỉ hiện sau khi backend xác nhận; refresh/đổi máy vẫn thấy dữ liệu.
- Tách page dài theo feature, giữ component gần quy tắc 200 dòng hiện có; lazy-load tab nặng, không memo mọi thứ vô điều kiện. Chỉ dùng API phù hợp phiên bản React/Next đang cài, không chép ví dụ API phiên bản mới một cách máy móc.
- Có tìm kiếm/phân trang server, bộ lọc ngày/scope, in/xuất nếu thật sự triển khai; keyboard/focus/label và tablet POS phải được kiểm thử.
