'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Users, Clock, DollarSign, CalendarCheck, Building2 } from 'lucide-react';

export default function AdminHrPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, bRes] = await Promise.all([
        api.get('/users?limit=50'),
        api.get('/branches'),
      ]);
      setUsers(uRes.data.data || []);
      setBranches(bRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getBranchName = (bId: string) => {
    const b = branches.find((item) => item.id === bId);
    return b ? b.name : 'Trụ sở chính';
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Super Admin</span>;
      case 'MANAGER':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Quản lý</span>;
      case 'CASHIER':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Thu ngân</span>;
      case 'WAREHOUSE_STAFF':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Thủ kho</span>;
      case 'ACCOUNTANT':
        return <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Kế toán</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{role}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">Quản lý Nhân sự & Phân quyền</h2>
        <p className="text-sm text-slate-500 mt-1">
          Danh sách nhân viên, ca làm việc và phân công tại các chi nhánh trong chuỗi.
        </p>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Họ và tên</th>
              <th className="py-3.5 px-4">Email đăng nhập</th>
              <th className="py-3.5 px-4">Số điện thoại</th>
              <th className="py-3.5 px-4">Vai trò (Role)</th>
              <th className="py-3.5 px-4">Chi nhánh phân công</th>
              <th className="py-3.5 px-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    {u.fullName?.charAt(0) || 'N'}
                  </div>
                  {u.fullName}
                </td>
                <td className="py-3 px-4 font-mono text-slate-500">{u.email}</td>
                <td className="py-3 px-4 text-slate-600">{u.phone || 'Chưa cập nhật'}</td>
                <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                <td className="py-3 px-4 text-slate-700 font-medium">{getBranchName(u.branchId)}</td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Hoạt động
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
