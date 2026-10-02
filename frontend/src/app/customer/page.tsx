'use client';

import Link from 'next/link';
import { Award, BookOpen, Coffee, ShieldCheck } from 'lucide-react';

export default function CustomerPortalPage() {
  return (
    <div className="flex min-h-screen flex-col bg-teap-cream text-slate-900">
      <header className="bg-teap-dark px-4 py-4 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-800 text-emerald-200">
              <Coffee className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold tracking-tight">TeaP</h1>
              <p className="truncate text-xs text-emerald-200">Cổng thông tin khách hàng</p>
            </div>
          </div>
          <Link
            href="/customer/menu"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-900/60 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Xem menu
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-3xl flex-1 items-center px-4 py-12">
        <section className="w-full rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
            <Award className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-700">
            Bảo vệ tài khoản hội viên
          </p>
          <h2 className="text-pretty text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Tra cứu điểm đang chờ xác thực OTP
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
            TeaP chưa cho phép tra cứu bằng số điện thoại, đăng ký hoặc đổi voucher trực tuyến.
            Khi CRM-01 hoàn tất, khách hàng sẽ đăng nhập bằng OTP trước khi xem dữ liệu cá nhân.
          </p>

          <div className="mx-auto mt-6 flex max-w-xl items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Hiện có thể làm gì?</h3>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Xem menu công khai. Điểm, lịch sử mua hàng và voucher chỉ được nhân viên kiểm tra tại quầy
                cho đến khi luồng định danh khách hàng được triển khai đầy đủ.
              </p>
            </div>
          </div>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/customer/menu"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teap-dark px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              Xem menu TeaP
            </Link>
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              Đăng nhập nhân viên
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
