---
title: "Chuẩn hóa Design System và Dữ liệu"
description: "Xây dựng hệ thống UI Components chung, áp dụng đồng nhất toàn hệ thống, và chuẩn hóa cấu trúc dữ liệu người dùng"
status: "planning"
priority: "high"
effort: "large"
branch: "main"
tags: ["ui-ux", "design-system", "data-standardization", "refactoring"]
created: "2026-09-27"
---

# Kế hoạch triển khai

## Giai đoạn 1: Xây dựng Design System (UI Components)
- [ ] Khởi tạo thư mục src/components/ui
- [ ] Xây dựng Button, Input, Card, Table, Badge, Modal theo chuẩn màu sắc 	eap trong 	ailwind.config.js.
- [ ] Tối ưu responsive và animation (hover, focus, active).

## Giai đoạn 2: Áp dụng Design System lên các trang
- [ ] Áp dụng cho /admin (Quản trị hệ thống)
- [ ] Áp dụng cho /manager (Quản lý cửa hàng)
- [ ] Áp dụng cho /staff (Nhân sự / HR)
- [ ] Áp dụng cho /pos (Thu ngân)
- [ ] Áp dụng cho /customer (Khách hàng)

## Giai đoạn 3: Chuẩn hóa & Đồng bộ dữ liệu
- [ ] Kiểm tra và loại bỏ dữ liệu user/customer trùng lặp trong Database (Postgres).
- [ ] Thống nhất các API endpoint trả về cùng một cấu trúc JSON response (Response Interceptor).
- [ ] Chuẩn hóa schema Prisma (nếu cần tinh chỉnh các role và branch).

## Giai đoạn 4: Kiểm thử đa thiết bị & Đảm bảo toàn vẹn dữ liệu
- [ ] Sử dụng Agent Browser để chụp ảnh màn hình responsive (Mobile, Tablet, Desktop).
- [ ] Viết test hoặc chạy test thủ công các luồng CRUD để đảm bảo không lỗi dữ liệu.
