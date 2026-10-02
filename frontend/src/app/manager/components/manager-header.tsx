'use client';

import React from 'react';
import { 
  Store, User, Info,
} from 'lucide-react';

interface ManagerHeaderProps {
  branchName: string;
  userName: string;
  userRole: string;
}

export default function ManagerHeader({
  branchName,
  userName,
  userRole,
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
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-200">
                Dữ liệu theo chi nhánh
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {userName} ({userRole})
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2 items-center gap-2 text-xs text-slate-600">
            <Info className="h-4 w-4 text-slate-400" aria-hidden="true" />
            Chỉ hiển thị dữ liệu của chi nhánh đang chọn
          </div>
        </div>
      </div>
    </header>
  );
}
