'use client';

import React from 'react';
import { Info, Warehouse } from 'lucide-react';

interface WarehouseHeaderProps {
  userName: string;
}

export default function WarehouseHeader({
  userName,
}: WarehouseHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title & Warehouse Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white shadow-md shadow-amber-700/20">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Kho nguyên liệu TeaP
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200">Theo phạm vi được phân công</span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Thủ kho phụ trách: <strong className="text-slate-800">{userName}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex max-w-md items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs leading-5 text-slate-600">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
          Cảm biến nhiệt độ, lô/HSD và yêu cầu điều chuyển chưa có nguồn dữ liệu nên không hiển thị số giả.
        </div>
      </div>
    </header>
  );
}
