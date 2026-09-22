'use client';

import React from 'react';
import { Coffee, ShieldCheck, UserCheck, Store, Warehouse } from 'lucide-react';

interface LoginHeroPanelProps {
  currentEmail: string;
  onSelectAccount: (email: string, pass: string) => void;
}

export function LoginHeroPanel({ currentEmail, onSelectAccount }: LoginHeroPanelProps) {
  const accounts = [
    { email: 'admin@teap.vn', pass: 'Admin@123', label: 'Super Admin', sub: 'Toàn quyền chuỗi', icon: ShieldCheck, color: 'text-amber-300' },
    { email: 'warehouse@teap.vn', pass: 'Warehouse@123', label: 'Thủ kho F&B', sub: 'Nhập xuất & HSD FEFO', icon: Warehouse, color: 'text-rose-300' },
    { email: 'manager.q1@teap.vn', pass: 'Manager@123', label: 'Quản lý Q.1', sub: 'CCTV & Lịch Excel', icon: UserCheck, color: 'text-cyan-300' },
    { email: 'cashier@teap.vn', pass: 'Cashier@123', label: 'Thu ngân', sub: 'POS Bán hàng ca', icon: Store, color: 'text-emerald-300' },
    { email: 'hr@teap.vn', pass: 'Hr@123', label: 'Nhân sự (HR)', sub: 'Bảng lương & Chấm công', icon: UserCheck, color: 'text-violet-300' },
  ];

  return (
    <div className="md:w-5/12 bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-800 text-white p-8 md:p-12 flex flex-col justify-between relative overflow-hidden">
      <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -top-20 w-80 h-80 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-inner">
            <Coffee className="w-8 h-8 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-wide">TeaP ERP/POS</h1>
            <p className="text-xs text-emerald-300 font-medium tracking-wider uppercase">Chuỗi Cửa Hàng Trà Sữa</p>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
            Hệ thống Vận hành & Bán hàng Chuỗi F&B
          </h2>
          <p className="text-emerald-100/80 text-xs md:text-sm leading-relaxed">
            Giải pháp chuyên sâu: Điều phối kho tổng FEFO, Bán hàng POS, Pha chế KDS, Quản lý cửa hàng CCTV và Quản trị chuỗi Super Admin toàn quyền.
          </p>
        </div>
      </div>

      <div className="mt-6 pt-5 border-t border-white/10">
        <p className="text-xs font-semibold text-emerald-200/90 uppercase tracking-wider mb-2.5">
          Chọn nhanh tài khoản Demo chấm điểm:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {accounts.map((acc) => {
            const Icon = acc.icon;
            const isSelected = currentEmail === acc.email;
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => onSelectAccount(acc.email, acc.pass)}
                className={`p-2 rounded-xl text-left transition border ${
                  isSelected ? 'bg-white/20 border-emerald-300 shadow-md' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5 text-white truncate text-[11px]">
                  <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${acc.color}`} />
                  <span className="truncate">{acc.label}</span>
                </div>
                <div className="text-[10px] text-emerald-200 truncate mt-0.5">{acc.sub}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
