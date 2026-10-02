'use client';

import { BarChart3, CheckCircle2 } from 'lucide-react';
import { FeatureUnavailable } from '@/components/feature-unavailable';

export default function AdminExecutiveDashboard() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <BarChart3 className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          Tổng quan điều hành
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Báo cáo hợp nhất toàn chuỗi phải truy ngược được về chứng từ nguồn.
        </p>
      </div>

      <FeatureUnavailable
        title="Dashboard điều hành toàn chuỗi"
        description="Các thẻ doanh thu, COGS, tỷ lệ quay lại và bảng xếp hạng chi nhánh trước đây là số liệu hard-code nên đã được gỡ. Chỉ mở lại khi BI-01 có API tổng hợp theo business date, branch scope và drill-down về đơn/chứng từ."
        roadmap="BI-01 → FIN-01/02"
      />

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-sm font-extrabold text-slate-900">Dữ liệu quản trị đang khả dụng</h2>
        <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
          {[
            'Chi nhánh và phạm vi phân công',
            'Tài khoản và vai trò người dùng',
            'Sản phẩm, kích cỡ và công thức hiện có',
            'Tồn kho nguyên liệu theo API hiện tại',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-xl bg-white p-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
