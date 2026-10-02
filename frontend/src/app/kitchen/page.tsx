'use client';

import Link from 'next/link';
import { ArrowLeft, ChefHat, LogOut, ShieldAlert } from 'lucide-react';
import { FeatureUnavailable } from '@/components/feature-unavailable';
import { ROLE_DEFAULT_ROUTES, useAuth } from '@/lib/auth-context';

export default function KitchenBarPage() {
  const { user, logout } = useAuth();
  const returnHref = user ? ROLE_DEFAULT_ROUTES[user.role] : '/login';
  const hasSeparateWorkspace = returnHref !== '/kitchen';

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6">
      <main className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-900 text-emerald-200">
              <ChefHat className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">Điều phối bar & bếp</h1>
              <p className="text-sm text-slate-500">Kitchen Display System</p>
            </div>
          </div>
          {hasSeparateWorkspace ? (
            <Link
              href={returnHref}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Về trang làm việc
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Đăng xuất
            </button>
          )}
        </div>

        <FeatureUnavailable
          title="Màn hình bar và bếp"
          description="API hiện chưa cấp luồng ticket KDS cho vai trò bếp và chưa lưu trạng thái từng món/đơn. Màn hình cũ chỉ đánh dấu hoàn tất trong bộ nhớ trình duyệt, mất khi tải lại và có thể khiến quầy tưởng món đã làm xong. Luồng đó đã được khóa."
          roadmap="KDS-01"
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Điều kiện để mở lại</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Backend cần trả ticket theo đúng chi nhánh, lưu transition nhận–đang làm–hoàn tất,
                chống ghi đè đồng thời và cung cấp API aggregate thay cho tải chi tiết từng đơn.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
