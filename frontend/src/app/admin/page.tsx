'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { 
  ShieldCheck, LayoutDashboard, Store, Users, 
  Coffee, Video, Zap 
} from 'lucide-react';

import AdminRoleHub from './components/admin-role-hub';
import AdminExecutiveDashboard from './components/admin-executive-dashboard';
import AdminBranchesTab from './components/admin-branches-tab';
import AdminUsersTab from './components/admin-users-tab';
import AdminMenuBomTab from './components/admin-menu-bom-tab';
import AdminCctvCenter from './components/admin-cctv-center';

export type SuperAdminTab = 'roles' | 'overview' | 'branches' | 'users' | 'menu' | 'cctv';

export default function SuperAdminPortalPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('roles'); // Default to the All-Access Role Hub!

  const tabs: { key: SuperAdminTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'roles', label: 'Toàn Quyền Mọi Vai Trò', icon: <Zap className="w-4 h-4 text-amber-500" />, badge: 'Quyền Tối Cao' },
    { key: 'overview', label: 'Doanh Thu Toàn Chuỗi', icon: <LayoutDashboard className="w-4 h-4" /> },
    { key: 'branches', label: 'Quản Lý 5 Chi Nhánh', icon: <Store className="w-4 h-4" />, badge: '5 Quán' },
    { key: 'users', label: 'Người Dùng & Phân Quyền', icon: <Users className="w-4 h-4" /> },
    { key: 'menu', label: 'Menu & Định Lượng BOM', icon: <Coffee className="w-4 h-4" /> },
    { key: 'cctv', label: 'Camera Toàn Chuỗi', icon: <Video className="w-4 h-4" />, badge: 'Multi-Cam' },
  ];

  return (
    <div className="space-y-6">
      {/* Navigation Tab Bar */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-1.5">
        {tabs.map(tab => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                  isActive ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      <div>
        {activeTab === 'roles' && <AdminRoleHub />}
        {activeTab === 'overview' && <AdminExecutiveDashboard />}
        {activeTab === 'branches' && <AdminBranchesTab />}
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'menu' && <AdminMenuBomTab />}
        {activeTab === 'cctv' && <AdminCctvCenter />}
      </div>
    </div>
  );
}
