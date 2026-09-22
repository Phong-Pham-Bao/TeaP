'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { 
  Coffee, ShieldCheck, ShoppingCart, Store, 
  Warehouse, ChefHat, LogOut, Users, Zap 
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const roleLinks = [
    { label: 'Tổng Quản Trị (Admin Hub)', href: '/admin', icon: ShieldCheck, active: true },
    { label: 'Quản Lý Cửa Hàng', href: '/manager', icon: Store },
    { label: 'Kho Tổng & Điều Phối', href: '/warehouse', icon: Warehouse },
    { label: 'Quầy Thu Ngân (POS)', href: '/pos', icon: ShoppingCart },
    { label: 'Bếp & Pha Chế (KDS)', href: '/kitchen', icon: ChefHat },
    { label: 'Nhân Sự & Tiền Lương', href: '/staff', icon: Users },
  ];

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shadow-xl flex-shrink-0">
        <div>
          {/* Brand */}
          <div className="p-5 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl text-slate-950 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-white text-base leading-tight">TeaP Chain HQ</h1>
              <p className="text-[10px] text-amber-400 font-extrabold tracking-wider uppercase mt-0.5">Super Admin Portal</p>
            </div>
          </div>

          {/* Direct Role Switching Menu */}
          <nav className="p-3.5 space-y-1.5 overflow-y-auto">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Điều Hành Mọi Vai Trò
            </div>
            {roleLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="truncate pr-2">
              <div className="text-xs font-bold text-white truncate">{user?.fullName || 'Nguyễn Văn Admin'}</div>
              <div className="text-[10px] text-amber-400 font-mono truncate">SUPER ADMIN (ROOT)</div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-xl transition"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto min-w-0 p-6">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
