'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  Warehouse, Boxes, CircleDashed, LogOut,
} from 'lucide-react';

import WarehouseHeader from './components/warehouse-header';
import WarehouseStockOverview from './components/warehouse-stock-overview';

export default function WarehousePortalPage() {
  const { user, logout } = useAuth();
  const plannedModules = [
    { label: 'Nhập kho nhà cung cấp', roadmap: 'PUR-01/02' },
    { label: 'Điều chuyển chi nhánh', roadmap: 'INV-03' },
    { label: 'Lô & hạn sử dụng', roadmap: 'INV-02' },
    { label: 'Kiểm kê & hao hụt', roadmap: 'INV-04' },
  ];

  return (
    <div className="app-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="app-sidebar flex flex-col justify-between">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-600 flex items-center justify-center shadow-lg shadow-amber-600/30 text-white">
                <Warehouse className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-white">TeaP Warehouse</div>
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1 mt-0.5">
                  Kho Tổng Trung Tâm
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 lg:hidden"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <nav className="p-3.5 space-y-1.5">
            <div className="hidden lg:block px-3 pb-1 text-xs font-semibold text-emerald-200">
              Nghiệp Vụ Kho Vận F&B
            </div>
            <div aria-current="page" className="flex w-full items-center gap-3 rounded-xl bg-amber-600 px-3.5 py-3 text-xs font-bold text-white shadow-md shadow-amber-600/30">
              <Boxes className="h-4 w-4" aria-hidden="true" />
              <span>Tồn kho hiện tại</span>
            </div>
          </nav>

          <div className="mx-4 hidden rounded-xl border border-white/10 bg-white/5 p-3 lg:block">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
              Chờ nghiệp vụ chứng từ
            </div>
            <ul className="mt-2 space-y-2">
              {plannedModules.map((module) => (
                <li key={module.label} className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                  <span>{module.label}</span>
                  <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-amber-300">{module.roadmap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* User profile & logout */}
        <div className="hidden lg:block p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-white truncate">{user?.fullName || 'Trần Văn Thủ Kho'}</div>
              <div className="text-[10px] text-amber-400 font-mono truncate">{user?.email || 'warehouse@teap.vn'}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="app-content flex flex-col">
        <WarehouseHeader
          userName={user?.fullName || 'Trần Văn Thủ Kho'}
        />

        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <WarehouseStockOverview />
          </div>
        </main>
      </div>
    </div>
  );
}
