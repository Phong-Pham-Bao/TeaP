'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Warehouse, Truck, PackagePlus, AlertTriangle, 
  ClipboardCheck, LogOut, ArrowLeft, Layers 
} from 'lucide-react';

import WarehouseHeader from './components/warehouse-header';
import WarehouseDispatchTab from './components/warehouse-dispatch-tab';
import WarehouseReceiptsTab from './components/warehouse-receipts-tab';
import WarehouseExpiryTab from './components/warehouse-expiry-tab';
import WarehouseStocktakeTab from './components/warehouse-stocktake-tab';

export type WarehouseTab = 'dispatch' | 'receipts' | 'expiry' | 'stocktake';

export default function WarehousePortalPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<WarehouseTab>('dispatch');

  const navItems: { key: WarehouseTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'dispatch', label: 'Xuất Cấp 5 Chi Nhánh', icon: <Truck className="w-4 h-4" />, badge: '2 Đơn' },
    { key: 'receipts', label: 'Nhập Kho Nhà Cung Cấp', icon: <PackagePlus className="w-4 h-4" /> },
    { key: 'expiry', label: 'Cận Date & Lô Hàng (FEFO)', icon: <AlertTriangle className="w-4 h-4" />, badge: 'Gấp' },
    { key: 'stocktake', label: 'Kiểm Kê & Hao Hụt', icon: <ClipboardCheck className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col justify-between shadow-xl">
        <div>
          {/* Logo & Brand */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
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
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Nghiệp Vụ Kho Vận F&B
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-amber-900' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User profile & logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-white truncate">{user?.fullName || 'Trần Văn Thủ Kho'}</div>
              <div className="text-[10px] text-amber-400 font-mono truncate">{user?.email || 'warehouse@teap.vn'}</div>
            </div>
            <button
              onClick={logout}
              title="Đăng xuất"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        <WarehouseHeader
          pendingDispatchCount={2}
          criticalExpiryCount={2}
          coldTemp="3.2°C"
          freezerTemp="-18.5°C"
          dryHumidity="54%"
          userName={user?.fullName || 'Trần Văn Thủ Kho'}
        />

        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dispatch' && <WarehouseDispatchTab />}
            {activeTab === 'receipts' && <WarehouseReceiptsTab />}
            {activeTab === 'expiry' && <WarehouseExpiryTab />}
            {activeTab === 'stocktake' && <WarehouseStocktakeTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
