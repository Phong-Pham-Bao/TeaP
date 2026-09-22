'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Store, User, ShoppingCart, History, 
  Calculator, Video, TrendingUp, AlertTriangle, Users 
} from 'lucide-react';

interface ManagerHeaderProps {
  branchName: string;
  userName: string;
  userRole: string;
  activeStaffCount: number;
  todayRevenue: number;
  pendingAlertsCount: number;
  onlineCamerasCount: number;
}

export default function ManagerHeader({
  branchName,
  userName,
  userRole,
  activeStaffCount,
  todayRevenue,
  pendingAlertsCount,
  onlineCamerasCount,
}: ManagerHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Branch & Manager Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center text-white shadow-md shadow-emerald-800/20">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{branchName}</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Đang mở cửa
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {userName} ({userRole})
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Video className="w-3.5 h-3.5" />
                {onlineCamerasCount}/5 Camera hoạt động
              </span>
            </div>
          </div>
        </div>

        {/* Live Operational Metrics & Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Doanh thu ca này</div>
              <div className="text-sm font-extrabold text-emerald-800">
                {todayRevenue.toLocaleString('vi-VN')} đ
              </div>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Nhân sự trong ca</div>
              <div className="text-sm font-extrabold text-slate-800 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-teal-600" />
                {activeStaffCount} người
              </div>
            </div>
            {pendingAlertsCount > 0 && (
              <>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 animate-bounce" />
                  <span>{pendingAlertsCount} cảnh báo</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/pos"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Quầy POS</span>
            </Link>
            <Link
              href="/shift-close"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-sm transition"
            >
              <Calculator className="w-3.5 h-3.5 text-slate-500" />
              <span>Đóng ca</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
