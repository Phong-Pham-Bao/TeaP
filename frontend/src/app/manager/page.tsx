'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { 
  Activity, Video, Calendar, ShieldCheck, 
  Users, GraduationCap, Coffee, LogOut, Store 
} from 'lucide-react';

import ManagerHeader from './components/manager-header';
import ManagerCameraMonitor from './components/manager-camera-monitor';
import ManagerExcelSchedule from './components/manager-excel-schedule';
import ManagerOperationsTab from './components/manager-operations-tab';
import ManagerChecklistTab from './components/manager-checklist-tab';
import ManagerStaffTab from './components/manager-staff-tab';
import ManagerTrainingTab from './components/manager-training-tab';

export type ManagerTab = 'operations' | 'camera' | 'schedule' | 'checklist' | 'staff' | 'training';

export default function ManagerPortalPage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<ManagerTab>('schedule'); // Default to schedule as requested!

  const navItems: { key: ManagerTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'schedule', label: 'Lịch làm việc Excel', icon: <Calendar className="w-4 h-4" />, badge: 'Hình 1' },
    { key: 'camera', label: 'Camera An Ninh', icon: <Video className="w-4 h-4" />, badge: '5 Cam' },
    { key: 'operations', label: 'Vận hành trực tiếp', icon: <Activity className="w-4 h-4" /> },
    { key: 'checklist', label: 'Checklist & An toàn', icon: <ShieldCheck className="w-4 h-4" /> },
    { key: 'staff', label: 'Đội ngũ nhân sự', icon: <Users className="w-4 h-4" /> },
    { key: 'training', label: 'Đào tạo & Thi bậc', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col justify-between shadow-xl">
        <div>
          {/* Logo & Brand */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-600/30 text-white">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <div className="text-base font-black tracking-tight text-white">TeaP Manager</div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5">
                  <Store className="w-3.5 h-3.5" /> TeaP Quận 1
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1.5">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Quản Trị Chi Nhánh
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
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
        </div>

        {/* User profile & logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-white truncate">{user?.fullName || 'Quản lý cửa hàng'}</div>
              <div className="text-[10px] text-slate-400 font-mono truncate">{user?.email || 'manager@teap.vn'}</div>
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
        {/* Dynamic Header */}
        <ManagerHeader
          branchName="TeaP Chi Nhánh Quận 1"
          userName={user?.fullName || 'Quản lý cửa hàng'}
          userRole="STORE MANAGER"
          activeStaffCount={4}
          todayRevenue={8450000}
          pendingAlertsCount={2}
          onlineCamerasCount={5}
        />

        {/* Tab Body */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'schedule' && <ManagerExcelSchedule />}
            {activeTab === 'camera' && <ManagerCameraMonitor />}
            {activeTab === 'operations' && <ManagerOperationsTab />}
            {activeTab === 'checklist' && <ManagerChecklistTab />}
            {activeTab === 'staff' && <ManagerStaffTab />}
            {activeTab === 'training' && <ManagerTrainingTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
