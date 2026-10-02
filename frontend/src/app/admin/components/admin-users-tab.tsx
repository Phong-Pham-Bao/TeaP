'use client';

import React, { useEffect, useState } from 'react';
import { Lock, RefreshCcw, Shield, UserPlus, X } from 'lucide-react';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';

type AccountUser = components['schemas']['UserResponseDto'];
type CreateUser = components['schemas']['CreateUserDto'];
type Branch = components['schemas']['BranchResponseDto'];
type UserPage = { data?: AccountUser[] };

const EMPTY_USER: CreateUser = {
  email: '',
  password: '',
  fullName: '',
  role: 'CASHIER',
};

export default function AdminUsersTab() {
  const [users, setUsers] = useState<AccountUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState<CreateUser>(EMPTY_USER);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResponse, branchesResponse] = await Promise.all([
        api.get<UserPage>('/users?limit=100'),
        api.get<Branch[]>('/branches'),
      ]);
      setUsers(usersResponse.data.data ?? []);
      setBranches(branchesResponse.data ?? []);
    } catch {
      setUsers([]);
      setBranches([]);
      setError('Không thể tải người dùng và chi nhánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post<AccountUser>('/users', form);
      setForm(EMPTY_USER);
      setShowModal(false);
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Không thể tạo người dùng.');
    } finally {
      setSaving(false);
    }
  };

  const deactivate = async (target: AccountUser) => {
    if (!window.confirm(`Khóa tài khoản ${target.email}?`)) return;
    setError('');
    try {
      await api.delete(`/users/${target.id}`);
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Không thể khóa tài khoản.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div><h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Shield className="h-5 w-5 text-emerald-700" /> Người dùng và vai trò</h2><p className="mt-0.5 text-xs text-slate-500">Tài khoản được đọc và ghi trực tiếp qua API có kiểm tra quyền.</p></div>
        <div className="flex gap-2"><button onClick={() => void loadData()} disabled={loading} className="rounded-xl border p-2 disabled:opacity-50" aria-label="Tải lại"><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button><button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white"><UserPlus className="h-3.5 w-3.5" /> Tạo tài khoản</button></div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr><th className="px-4 py-3">Họ tên</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Vai trò</th><th className="px-4 py-3">Chi nhánh</th><th className="px-4 py-3 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">
          {users.map((account) => <tr key={account.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-bold">{account.fullName}</td><td className="px-4 py-3 font-mono text-slate-600">{account.email}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold">{account.role}</span></td><td className="px-4 py-3">{account.branchAssignments.length > 0 ? account.branchAssignments.map((assignment) => assignment.branch.name).join(', ') : account.branch?.name ?? 'Toàn hệ thống'}</td><td className="px-4 py-3 text-right">{account.role !== 'SUPER_ADMIN' && <button onClick={() => void deactivate(account)} className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50" title="Khóa tài khoản"><Lock className="h-4 w-4" /></button>}</td></tr>)}
          {!loading && users.length === 0 && !error && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Chưa có người dùng.</td></tr>}
        </tbody></table></div>
      </div>

      {showModal && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"><div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl"><div className="flex items-center justify-between border-b pb-3"><h3 className="text-sm font-extrabold">Tạo tài khoản</h3><button onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button></div><form onSubmit={handleCreate} className="mt-4 grid gap-3 text-xs sm:grid-cols-2">
        <label className="font-bold sm:col-span-2">Họ tên<input value={form.fullName} onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))} required className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" /></label>
        <label className="font-bold">Email<input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" /></label>
        <label className="font-bold">Mật khẩu<input type="password" minLength={6} value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} required className="mt-1 w-full rounded-xl border px-3 py-2 font-normal" /></label>
        <label className="font-bold">Vai trò<select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as CreateUser['role'] }))} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"><option value="MANAGER">MANAGER</option><option value="CASHIER">CASHIER</option><option value="KITCHEN_STAFF">KITCHEN_STAFF</option><option value="WAREHOUSE_STAFF">WAREHOUSE_STAFF</option><option value="HR">HR</option><option value="ACCOUNTANT">ACCOUNTANT</option></select></label>
        <label className="font-bold">Chi nhánh chính<select value={form.branchId ?? ''} onChange={(event) => { const branchId = event.target.value || undefined; setForm((current) => ({ ...current, branchId, branchIds: branchId ? Array.from(new Set([...(current.branchIds ?? []), branchId])) : current.branchIds })); }} className="mt-1 w-full rounded-xl border px-3 py-2 font-normal"><option value="">Toàn hệ thống / chưa gán</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></label>
        <fieldset className="rounded-xl border border-slate-200 p-3 sm:col-span-2"><legend className="px-1 font-bold">Chi nhánh được phép truy cập</legend><div className="mt-1 grid gap-2 sm:grid-cols-2">{branches.map((branch) => { const checked = (form.branchIds ?? []).includes(branch.id); return <label key={branch.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 font-normal"><input type="checkbox" checked={checked} onChange={(event) => setForm((current) => ({ ...current, branchIds: event.target.checked ? Array.from(new Set([...(current.branchIds ?? []), branch.id])) : (current.branchIds ?? []).filter((id) => id !== branch.id), branchId: !event.target.checked && current.branchId === branch.id ? undefined : current.branchId }))} /><span>{branch.name}</span></label>; })}</div><p className="mt-2 text-[10px] text-slate-500">Tài khoản nhiều chi nhánh phải chọn chi nhánh khi thao tác để tránh đọc nhầm dữ liệu.</p></fieldset>
        <div className="flex justify-end gap-2 pt-2 sm:col-span-2"><button type="button" onClick={() => setShowModal(false)} className="rounded-xl border px-3 py-2 font-bold">Hủy</button><button disabled={saving} className="rounded-xl bg-emerald-800 px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Tạo tài khoản'}</button></div>
      </form></div></div>}
    </div>
  );
}
