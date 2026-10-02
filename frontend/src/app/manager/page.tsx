'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useUrlEnumState } from '@/lib/use-url-enum-state';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';
import { 
  Activity, Calendar, CircleDashed,
  Users, Coffee, LogOut, Store,
} from 'lucide-react';

import ManagerHeader from './components/manager-header';
import ManagerExcelSchedule from './components/manager-excel-schedule';
import ManagerOperationsTab from './components/manager-operations-tab';
import ManagerStaffTab from './components/manager-staff-tab';

export type ManagerTab = 'operations' | 'schedule' | 'staff';
type Branch = components['schemas']['BranchResponseDto'];
const MANAGER_TABS: readonly ManagerTab[] = ['operations', 'schedule', 'staff'];

export default function ManagerPortalPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useUrlEnumState<ManagerTab>(
    'view',
    'operations',
    MANAGER_TABS,
  );
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState(user?.branchId ?? '');

  useEffect(() => {
    api.get<Branch[]>('/branches').then((response) => {
      setBranches(response.data);
      setSelectedBranchId((current) =>
        response.data.some((branch) => branch.id === current)
          ? current
          : response.data[0]?.id ?? '',
      );
    }).catch(() => setBranches([]));
  }, []);

  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);

  const navItems: { key: ManagerTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'operations', label: 'Vận hành trực tiếp', icon: <Activity className="w-4 h-4" /> },
    { key: 'schedule', label: 'Lịch làm việc', icon: <Calendar className="w-4 h-4" /> },
    { key: 'staff', label: 'Đội ngũ nhân sự', icon: <Users className="w-4 h-4" /> },
  ];

  const plannedModules = [
    { label: 'Checklist vận hành', roadmap: 'OPS-01' },
    { label: 'Đào tạo nhân viên', roadmap: 'EXT-02' },
    { label: 'Camera an ninh', roadmap: 'EXT-02' },
    { label: 'Bàn giao & kết ca', roadmap: 'SHIFT-01' },
  ];

  return (
    <div className="app-shell">
      {/* SIDEBAR NAVIGATION */}
      <aside className="app-sidebar flex flex-col justify-between">
        <div>
          {/* Logo & Brand */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 text-white">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-white">TeaP Manager</div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Store className="w-3.5 h-3.5" /> {selectedBranch?.name ?? 'Chọn chi nhánh'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 lg:hidden"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {branches.length > 0 && <div className="px-4 pt-3"><label htmlFor="manager-branch" className="block text-[10px] font-bold uppercase tracking-wide text-slate-400">Chi nhánh đang làm việc</label><select id="manager-branch" value={selectedBranchId} onChange={(event) => setSelectedBranchId(event.target.value)} className="mt-1 w-full rounded-xl border border-white/10 bg-slate-800 px-3 py-2 text-xs font-bold text-white"><option value="" disabled>Chọn chi nhánh</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div>}

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5">
            <div className="hidden lg:block px-3 pb-1 text-xs font-semibold text-emerald-200">
              Quản Trị Chi Nhánh
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  aria-pressed={isActive}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white text-emerald-900' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="mx-4 hidden rounded-xl border border-white/10 bg-white/5 p-3 lg:block">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
              Chưa mở trong hệ thống
            </div>
            <ul className="mt-2 space-y-2">
              {plannedModules.map((module) => (
                <li key={module.label} className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                  <span>{module.label}</span>
                  <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-amber-300">
                    {module.roadmap}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* User profile & logout */}
        <div className="hidden lg:block p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-white truncate">{user?.fullName || 'Quản lý cửa hàng'}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{user?.email || 'manager@teap.vn'}</div>
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
        {/* Dynamic Header */}
        <ManagerHeader
          branchName={selectedBranch?.name ?? 'Chưa chọn chi nhánh'}
          userName={user?.fullName || 'Quản lý cửa hàng'}
          userRole="Quản lý chi nhánh"
        />

        {/* Tab Body */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'operations' && <ManagerOperationsTab branchId={selectedBranchId} />}
            {activeTab === 'schedule' && <ManagerExcelSchedule branchId={selectedBranchId} />}
            {activeTab === 'staff' && <ManagerStaffTab branchId={selectedBranchId} />}
          </div>
        </main>
      </div>
    </div>
  );
}
