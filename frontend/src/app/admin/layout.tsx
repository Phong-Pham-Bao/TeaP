'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, ROLE_LABELS } from '@/lib/auth-context';
import { ShieldCheck, LogOut, LayoutDashboard, Users, Coffee, Boxes, Building2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/admin', label: 'Tổng quan hệ thống', icon: LayoutDashboard, exact: true },
    { href: '/admin/branches', label: 'Chi nhánh', icon: Building2 },
    { href: '/admin/users', label: 'Tài khoản & phân quyền', icon: Users },
    { href: '/admin/products', label: 'Sản phẩm & menu', icon: Coffee },
    { href: '/admin/inventory', label: 'Tồn kho nguyên liệu', icon: Boxes },
  ];

  return (
    <div className="app-shell lg:h-screen lg:overflow-hidden">
      {/* Sidebar - Sáng sủa, tập trung chức năng Admin */}
      <aside className="app-sidebar flex flex-col justify-between">
        <div>
          {/* Logo & Tiêu đề */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 lg:p-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">TeaP Admin</div>
                <div className="text-[11px] text-emerald-200">Tổng quản trị</div>
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

          {/* Menu chức năng */}
          <nav className="p-3 space-y-1">
            <div className="hidden lg:block px-3 py-2 text-xs font-semibold text-emerald-200">
              Quản trị hệ thống
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-white text-emerald-950'
                      : 'text-emerald-50 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Thông tin người dùng & Đăng xuất */}
        <div className="hidden lg:block p-4 border-t border-white/10 bg-black/10">
          <div className="mb-3">
            <div className="text-sm font-semibold text-white truncate">
              {user?.fullName || 'Quản trị viên'}
            </div>
            <div className="text-[11px] text-emerald-200">
              {ROLE_LABELS[user?.role || 'SUPER_ADMIN']}
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 border border-white/15 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Nội dung chính */}
      <main className="app-content flex flex-col lg:overflow-y-auto">
        {/* Header trên cùng */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-base font-bold text-slate-900">Bảng điều khiển hệ thống</h2>
            <p className="text-xs text-slate-500">Quản lý toàn bộ chuỗi cửa hàng TeaP</p>
          </div>
          <div className="hidden sm:block text-xs text-slate-500 numeric">
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
        </header>

        <div className="p-3 sm:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
