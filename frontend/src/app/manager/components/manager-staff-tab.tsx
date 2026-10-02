'use client';

import React, { useEffect, useState } from 'react';
import { RefreshCcw, Users } from 'lucide-react';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';

type AccountUser = components['schemas']['UserResponseDto'];
type UserPage = { data?: AccountUser[] };

export default function ManagerStaffTab({ branchId }: { branchId: string }) {
  const [staff, setStaff] = useState<AccountUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    if (!branchId) {
      setStaff([]);
      setError('Hãy chọn chi nhánh để tải nhân sự.');
      setLoading(false);
      return;
    }
    try {
      const response = await api.get<UserPage>(`/users?branchId=${encodeURIComponent(branchId)}&limit=100`);
      setStaff(response.data.data ?? []);
    } catch {
      setStaff([]);
      setError('Không thể tải nhân sự của chi nhánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadStaff();
  }, [branchId]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Users className="h-5 w-5 text-emerald-700" /> Nhân sự chi nhánh</h2><p className="mt-0.5 text-xs text-slate-500">Backend tự giới hạn danh sách theo chi nhánh của quản lý.</p></div>
        <button onClick={() => void loadStaff()} disabled={loading} className="rounded-xl border p-2 disabled:opacity-50" aria-label="Tải lại"><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr><th className="px-4 py-3">Họ tên</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Điện thoại</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Trạng thái</th></tr></thead><tbody className="divide-y divide-slate-100">
        {staff.map((account) => <tr key={account.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-bold">{account.fullName}</td><td className="px-4 py-3 font-mono text-slate-600">{account.email}</td><td className="px-4 py-3">{account.phone ?? '—'}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{account.role}</span></td><td className="px-4 py-3 text-emerald-700">Hoạt động</td></tr>)}
        {!loading && staff.length === 0 && !error && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Chưa có nhân sự trong phạm vi.</td></tr>}
      </tbody></table></div></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">KPI, cấp bậc và giai đoạn đào tạo chưa có domain model nên không còn được chỉnh giả trên giao diện.</div>
    </div>
  );
}
