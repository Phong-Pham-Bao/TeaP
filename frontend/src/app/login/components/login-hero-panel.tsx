'use client';

import React from 'react';
import { Coffee, ShieldCheck } from 'lucide-react';

export function LoginHeroPanel() {

  return (
    <div className="md:w-5/12 bg-teap-dark text-white p-7 md:p-12 flex flex-col justify-between border-b-4 md:border-b-0 md:border-r-4 border-emerald-600">

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-white/10 rounded-xl border border-white/10">
            <Coffee className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">TeaP ERP/POS</h1>
            <p className="text-xs text-emerald-200 font-medium">Vận hành chuỗi trà sữa</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            Mọi công việc trong một hệ thống
          </h2>
          <p className="text-emerald-100/80 text-xs md:text-sm leading-relaxed">
            Bán hàng, pha chế, kho, nhân sự và báo cáo được kết nối theo từng vai trò.
          </p>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-white/10">
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
          <div>
            <p className="text-xs font-semibold text-white">Đăng nhập an toàn theo vai trò</p>
            <p className="mt-1 text-[11px] leading-5 text-emerald-100/80">
              Tài khoản mẫu và mật khẩu mặc định không được nhúng trong giao diện. Liên hệ quản trị viên nếu bạn chưa có quyền truy cập.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
