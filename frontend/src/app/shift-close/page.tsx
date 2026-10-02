'use client';

import Link from 'next/link';
import { ArrowLeft, Calculator, ShieldAlert } from 'lucide-react';
import { FeatureUnavailable } from '@/components/feature-unavailable';
import { ROLE_DEFAULT_ROUTES, useAuth } from '@/lib/auth-context';

export default function ShiftClosePage() {
  const { user } = useAuth();
  const returnHref = user ? ROLE_DEFAULT_ROUTES[user.role] : '/login';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <main className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-900 text-emerald-200">
              <Calculator className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Bàn giao & kết ca</h1>
              <p className="text-sm text-slate-500">Nghiệp vụ ca bán hàng của TeaP</p>
            </div>
          </div>
          <Link
            href={returnHref}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Về trang làm việc
          </Link>
        </div>

        <FeatureUnavailable
          title="Bàn giao và kết ca"
          description="TeaP chưa có ca mở theo terminal, số dư đầu ca, payment gắn ca, tổng hợp server, phê duyệt chênh lệch và chứng từ bàn giao. Màn hình cũ đã được khóa vì tự cộng đơn rồi ghi chênh lệch thành phiếu thu/chi có thể làm sai sổ quỹ."
          roadmap="SHIFT-01 → FIN-01"
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Điều kiện để mở lại</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Chỉ mở nút kết ca sau khi checkout bắt buộc có ca, server tự tổng hợp tiền mặt,
                đóng ca chống lặp và mọi chênh lệch đi qua quy trình giải trình/phê duyệt có audit.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
