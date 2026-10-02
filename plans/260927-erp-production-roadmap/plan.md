# TeaP — Kế hoạch xây dựng ERP vận hành thực tế

Ngày: 27/09/2026; cập nhật hiện trạng 28/09/2026. Trạng thái: đang triển khai theo roadmap, chưa production-ready. Đối tượng đọc: chủ sản phẩm, AI triển khai, người nghiệm thu.

## 1. Kết luận và cách sử dụng

TeaP đang là prototype ERP/POS có backend nghiệp vụ thật ở một số luồng. Có thể tiếp tục phát triển trên NestJS + Prisma/PostgreSQL + Next.js hiện tại; không cần viết lại toàn bộ. Khoảng cách lớn nhất tới vận hành thực tế là **tính đúng của tiền/kho/quyền, chứng từ xuyên suốt và dữ liệu thật trên giao diện**, không phải số lượng trang.

Đọc bộ tài liệu theo thứ tự:

1. [Đánh giá source hiện có](01-source-audit.md): ma trận phân hệ và các phát hiện F01–F17. Đây là tài liệu đã tồn tại trong workspace; lần rà soát này đối chiếu lại các luồng chính và giữ nguyên nội dung cũ.
2. [Kế hoạch tổng thể](plan.md): phạm vi, thứ tự, các mốc nghiệm thu và quyết định cần chốt.
3. [Thiết kế nghiệp vụ và nguyên tắc dữ liệu](02-domain-design.md): hợp đồng chung cho mọi task.
4. [Backlog triển khai cho AI](03-implementation-backlog.md): mã task, phụ thuộc, file/module, đầu ra và điều kiện hoàn thành.
5. [Kiểm thử, triển khai và prompt giao việc](04-verification-and-ai-handoff.md): quy trình AI thực thi và bộ tình huống nghiệm thu.
6. [Đánh giá hiện trạng và cập nhật roadmap](05-current-assessment-and-roadmap-update.md): mức trưởng thành hiện tại, điểm yếu còn lại, cổng chặn pilot và thứ tự thực hiện đã điều chỉnh sau các vòng triển khai.

Mọi đường dẫn source trong các bảng dưới đây tính từ root repository. Các model/API chưa tồn tại được ghi là đề xuất, không phải tính năng đã có.

## 2. Phạm vi đã kiểm tra và giới hạn

> Các mục 2–8 bên dưới là baseline lập ngày 27/09/2026. Không dùng các câu “chưa có test/migration” trong baseline để kết luận trạng thái hiện tại; xem `progress.md` và `05-current-assessment-and-roadmap-update.md` cho bằng chứng sau triển khai.

- Kiểm kê 149 file trong `backend/src` và `frontend/src`: 99 backend, 50 frontend. Danh mục tại [source-inventory.csv](source-inventory.csv).
- Đọc schema, logic service của 13 module backend, auth/guards, DTO và các controller nghiệp vụ; rà các route/component frontend, nguồn dữ liệu, handler và các luồng POS, bếp, kết ca, lịch, kho, tài khoản.
- Đọc cấu hình package, Docker Compose, tài liệu dự án và script chuẩn hóa. Đọc sâu logic nghiệp vụ; không coi đây là kiểm toán từng dòng JSX/CSS hay kiểm toán bảo mật đầy đủ.
- Không tính dependencies, build output, `.next`, `.git`, kho skill, file nén, tài liệu Office trong `Nhóm 1` là source ứng dụng. Yêu cầu trong tài liệu Office chưa được đối chiếu; nếu đó là đặc tả bắt buộc, BASE-01 phải bổ sung bước lập traceability.
- Working tree đang có nhiều thay đổi từ trước. Plan dựa trên file hiện tại, bao gồm thay đổi chưa commit; không khôi phục hoặc ghi đè chúng.
- Đã chạy lại `node node_modules/typescript/bin/tsc --noEmit --incremental false` ở cả backend và frontend: đều exit 0. Chưa chạy production build, API integration, migration, E2E trình duyệt hoặc tải đồng thời.
- Có cấu hình Jest nhưng không tìm thấy test ứng dụng trong source; chưa thấy migration history trong Prisma hoặc CI của repo. Không có bằng chứng nghiệm thu production.

## 3. Những gì còn thiếu

| Nhóm | Hiện trạng | Kết quả cần đạt |
|---|---|---|
| Quyền và bảo mật | Role guard; thiếu scope xuyên suốt, actor `id/userId` lệch | Quyền theo hành động + chi nhánh + tài nguyên; session thu hồi được; customer có identity |
| POS và tiền | Tạo đơn/checkout có DB transaction | Giá server, chống lặp, xác minh tiền, hoàn tiền riêng, ca bán hàng và bill lịch sử |
| Bếp | Đọc đơn PAID; hoàn tất ở state trình duyệt | Ticket lưu DB, trạng thái từng món, đồng bộ hai thiết bị, đúng chi nhánh |
| Kho | Nhập/điều chỉnh/điều chuyển + stock ledger | Kho/vị trí, lô/HSD, đơn vị quy đổi, FEFO, kiểm kê duyệt, hàng đang chuyển, giá vốn |
| Mua hàng | Chưa có backend | Nhà cung cấp → PO → nhận hàng → hóa đơn → công nợ → thanh toán |
| Tài chính | Thu chi thủ công | Quỹ, đối soát, phải trả, giá vốn; sổ kế toán hoặc tích hợp hệ thống kế toán |
| Nhân sự | Công/ngày, lịch, phiếu lương đơn giản | Hồ sơ, phân công theo thời gian, nhiều ca/qua đêm, nghỉ/OT, duyệt công và payroll |
| CRM/khuyến mãi | Điểm và %/số tiền; redeem public | Xác thực khách, reward/voucher thật, giới hạn sử dụng, hoàn điểm nhất quán |
| Quản trị/UI | Nhiều tab dùng mảng mẫu/localStorage | CRUD/API thật, dữ liệu bền vững, lỗi/rỗng/tải rõ ràng, tìm kiếm/phân trang ở server |
| Báo cáo | Một số API doanh thu; dashboard mẫu | Định nghĩa chỉ tiêu, liên kết tới chứng từ gốc, số liệu kho/tiền/giá vốn đối chiếu được |
| Vận hành | Checklist/đào tạo/camera mô phỏng | Checklist và sự cố lưu DB; camera/IoT chỉ bật khi có tích hợp thật |
| Production | Có Compose hạ tầng | Migration release, CI, staging, backup/restore, cảnh báo, rollback, runbook |

Các vấn đề chặn dùng tiền và dữ liệu thật cần ưu tiên:

1. Manager/HR có đường tạo/sửa role cao hơn và thao tác tài khoản ngoài phạm vi.
2. Truy vấn theo branchId/id chưa kiểm phạm vi người gọi thống nhất.
3. Tra cứu hồ sơ/đổi điểm khách public; số điểm đổi do client quyết định.
4. Actor JWT trả `userId`, nhiều controller đọc `id`.
5. Checkout đánh dấu thanh toán điện tử thành công dựa trên dữ liệu client.
6. Checkout có thể bỏ qua nguyên liệu không có inventory hoặc tạo tồn âm.
7. Hủy đơn đã thanh toán chưa hoàn tiền, nhưng tự hoàn nguyên liệu dù có thể đã pha.

Chi tiết và vị trí source nằm trong F01–F17. Các phát hiện là kết luận static review, chưa phải kết quả khai thác hoặc UAT runtime.

## 4. Phạm vi sản phẩm mục tiêu

Giả định để lập kế hoạch: một doanh nghiệp trà sữa, nhiều chi nhánh, kho trung tâm, VND, múi giờ `Asia/Ho_Chi_Minh`, vận hành online trước. Đây là giả định thiết kế cần xác nhận trước pilot.

**Bản pilot cửa hàng:** quyền an toàn; quản trị danh mục thật; POS tiền mặt; tồn/công thức/lô phù hợp hàng dễ hỏng; bếp; hủy/hoàn có kiểm soát; mở/kết ca; nhập hàng; kiểm kê; sổ quỹ; báo cáo doanh thu/kho; backup và giám sát. Thanh toán điện tử chỉ bật khi đã nghiệm thu provider.

**Bản ERP vận hành chuỗi:** thêm mua hàng/công nợ, điều chuyển nhiều bước, CRM, HR/payroll, đối soát, giá vốn, kế toán/tích hợp, dashboard thật và quy trình duyệt.

**Mở rộng theo nhu cầu:** sơ chế theo mẻ, bổ sung hàng gợi ý, tài sản/bảo trì, đào tạo, camera/IoT, giao hàng, đặt món online, offline POS. Không mặc định xây đa pháp nhân, SaaS nhiều doanh nghiệp, đa tiền tệ, MRP nhà máy hoặc CRM B2B trong bản đầu.

Không đánh đồng ERP vận hành với phần mềm kế toán đã đủ điều kiện pháp lý. Thuế, hóa đơn điện tử, lao động và dữ liệu cá nhân cần đặc tả riêng phù hợp thời điểm, doanh nghiệp và nhà cung cấp thực tế.

## 5. Lộ trình theo mốc nghiệm thu

| Mốc | Task | Điều kiện chuyển mốc |
|---|---|---|
| M0 — Baseline | BASE-01 | Có build/check có thể lặp lại, DB test riêng, danh sách phạm vi và quyết định |
| M1 — Nền tảng an toàn | SEC-01/02/03, CORE-01/02, UI-01 | Bít P0 về identity/quyền/khách; hợp đồng API thống nhất; test âm quyền qua |
| M2 — Danh mục và kho nền | DATA-01/02, INV-01/02 | Đơn vị/BOM version/lô/tồn nhất quán; UI quản trị nhập và đọc lại được |
| M3 — Vòng bán hàng | POS-01/02, KDS-01, POS-04, SHIFT-01, FIN-01, BI-01 phần pilot | Mở ca → bán → pha → hoàn/hủy → kết ca → đối chiếu; test đồng thời qua |
| M4 — Chuỗi cung ứng | PUR-01/02, INV-03/04, FIN-02 | Mua/nhận/trả/điều chuyển/công nợ/giá vốn có chứng từ và duyệt |
| M5 — Quản trị chuỗi | CRM-01, HR-01/02, FIN-03, BI-01 hoàn thiện, OPS-01 | Quyền riêng tư, payroll, báo cáo và liên kết kế toán nghiệm thu |
| M6 — Triển khai | OPS-02, QA-01 | Staging, restore drill, UAT hai chi nhánh, pilot và biên bản go-live |
| Tích hợp tùy chọn | POS-03, EXT-01/02/03 | Chỉ bật từng tích hợp khi đủ cấu hình, tài khoản và test thực tế |

OPS-02 bắt đầu chuẩn bị từ M0; không đợi cuối mới xây CI/backup. Test đi cùng từng task. Mốc chỉ là nhóm nghiệm thu; phụ thuộc chính xác nằm trong backlog. Pilot có thể bắt đầu sau M3 + phần QA/OPS bắt buộc nếu nhập mua/công nợ được quản lý qua quy trình ngoại vi đã thống nhất; không gọi đó là ERP hoàn chỉnh.

Không ấn định thời hạn khi chưa biết số chi nhánh, chất lượng dữ liệu cũ, người nghiệm thu và yêu cầu tích hợp. Sau M0–M1, ước lượng lại theo tốc độ task đã nghiệm thu; không dùng tốc độ sinh code làm tốc độ hoàn thành dự án.

## 6. Quyết định cần chốt trước các phần phụ thuộc

| ID | Quyết định | Mặc định khi làm môi trường phát triển | Chặn phần nào nếu chưa chốt |
|---|---|---|---|
| D01 | Một doanh nghiệp hay SaaS nhiều doanh nghiệp? | Một doanh nghiệp, nhiều chi nhánh | Phát hành cho doanh nghiệp thứ hai |
| D02 | Có kho trung tâm/sơ chế? Có bán bánh ở POS? | Mô hình kho độc lập; giữ hành vi ẩn bánh hiện tại cho tới khi chốt | Bật bán loại hàng mới, sơ chế thực tế |
| D03 | Trừ/reserve kho lúc nào, quản lý hao hụt ra sao? | Pilot tiền mặt: tiêu hao BOM tại checkout; phân biệt đã pha khi hoàn | Quy trình hoàn kho và payment bất đồng bộ |
| D04 | Ai duyệt hoàn tiền, kiểm kê, chi tiền; ngưỡng nào? | Manager yêu cầu/duyệt trong scope theo ma trận; người tạo không tự duyệt chứng từ cần tách nhiệm vụ | Go-live các nghiệp vụ duyệt |
| D05 | Cổng thanh toán, ngân hàng, máy in? | Tiền mặt; điện tử và thiết bị chưa tích hợp thì tắt | POS-03 và in thiết bị thật |
| D06 | Kế toán nội bộ hay tích hợp phần mềm hiện có? Phương pháp giá vốn? | Thiết kế adapter; đề xuất bình quân di động, chưa khẳng định được chấp thuận | FIN-02/03 posting production |
| D07 | Giờ cắt ngày kinh doanh, ca, nghỉ/OT/lương? | Timezone Việt Nam; business date cấu hình, test ca qua đêm | Chốt ca và payroll production |
| D08 | Tải mục tiêu, RPO/RTO, thời gian lưu hồ sơ? | Mục tiêu kiểm thử ban đầu trong tài liệu QA | Sizing, backup và go-live |
| D09 | Bộ tài liệu `Nhóm 1` có phải yêu cầu bắt buộc? | Là tài liệu tham chiếu chưa đối chiếu | Cam kết đủ yêu cầu đồ án/hợp đồng |

AI tiếp tục phần độc lập khi thiếu quyết định; ghi rõ block ở task liên quan. Không tự chọn nhà cung cấp, mức thuế, chính sách lương, xóa dữ liệu cũ hay kết nối production.

## 7. Nguyên tắc triển khai

- Giữ kiến trúc modular monolith: một backend, một PostgreSQL, worker cho tác vụ nền. Domain service sở hữu ghi dữ liệu của mình; tránh mọi module tự chỉnh tồn/quỹ.
- Mỗi task là một lát cắt hoàn chỉnh: dữ liệu/migration → API/authorization → UI → test → tài liệu. Không hoàn thành bằng UI mẫu.
- Chứng từ đã ghi sổ phải có lịch sử; sửa sai bằng reversal/phiếu bổ sung. Snapshot giá/BOM/tên sản phẩm bảo vệ lịch sử.
- Backend quyết định số tiền, điểm, scope và trạng thái. Frontend chỉ hỗ trợ nhập và hiển thị.
- Giao dịch DB ngắn; không gọi payment/Redis trong transaction. Outbox, idempotency và retry có giới hạn cho các side effect.
- Dùng skill PostgreSQL trước khi đổi schema/query; skill React khi sửa frontend. Hướng dẫn React đã được dùng để đưa loại bỏ N+1, fetch song song, cache theo scope và tách component vào UI-01. Hướng dẫn PostgreSQL đã được dùng để yêu cầu thứ tự khóa, FK/index và kiểm thử đồng thời.
- Không thay toàn bộ ID hiện hữu chỉ để tối ưu lý thuyết. Giữ tương thích dữ liệu, đánh giá index bằng tải đo được.
- Task DONE cần bằng chứng acceptance criteria. Task thiếu provider hoặc quyết định chỉ được PARTIAL/BLOCKED với phần thiếu rõ ràng.

## 8. Cơ sở đối chiếu

Đối chiếu với các năng lực ERP phù hợp thực phẩm/bán lẻ: truy xuất lô và hạn dùng theo [Odoo — Expiration dates](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/inventory/product_management/product_tracking/expiration_dates.html); kiểm soát mua hàng theo [Odoo — Bill control policies](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/purchase/manage_deals/control_bills.html). Đây là tham chiếu về phạm vi nghiệp vụ, không phải yêu cầu sao chép toàn bộ sản phẩm.

Lộ trình, kiến trúc, mức ưu tiên và tiêu chí nghiệm thu là đề xuất riêng cho TeaP dựa trên source hiện tại.
