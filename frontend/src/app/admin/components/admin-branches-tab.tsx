'use client';

import React, { useEffect, useState } from 'react';
import { MapPin, Phone, Plus, RefreshCcw, Store, X } from 'lucide-react';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';

type Branch = components['schemas']['BranchResponseDto'];
type CreateBranch = components['schemas']['CreateBranchDto'];

const EMPTY_FORM: CreateBranch = { name: '', address: '', phone: '' };

export default function AdminBranchesTab() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState<CreateBranch>(EMPTY_FORM);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadBranches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<Branch[]>('/branches');
      setBranches(response.data ?? []);
    } catch {
      setBranches([]);
      setError('Không thể tải danh sách chi nhánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBranches();
  }, []);

  const handleCreateBranch = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post<Branch>('/branches', form);
      setShowModal(false);
      setForm(EMPTY_FORM);
      await loadBranches();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Không thể tạo chi nhánh.');
    } finally {
      setSaving(false);
    }
  };

  const deactivateBranch = async (branch: Branch) => {
    if (!window.confirm(`Ngừng hoạt động chi nhánh “${branch.name}”?`)) return;
    setError('');
    try {
      await api.delete(`/branches/${branch.id}`);
      await loadBranches();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Không thể ngừng chi nhánh.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Store className="h-5 w-5 text-emerald-700" /> Quản lý chi nhánh</h2>
          <p className="mt-0.5 text-xs text-slate-500">Danh mục chi nhánh đọc và ghi trực tiếp qua backend.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadBranches()} disabled={loading} className="rounded-xl border border-slate-200 p-2 text-slate-600 disabled:opacity-50" aria-label="Tải lại"><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-3.5 py-2 text-xs font-bold text-white"><Plus className="h-3.5 w-3.5" /> Thêm chi nhánh</button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => (
          <article key={branch.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-extrabold text-slate-900">{branch.name}</h3>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800">HOẠT ĐỘNG</span>
            </div>
            <div className="mt-3 space-y-1 text-[11px] text-slate-500">
              <div className="flex gap-1"><MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {branch.address}</div>
              <div className="flex gap-1"><Phone className="mt-0.5 h-3 w-3 shrink-0" /> {branch.phone ?? 'Chưa cập nhật'}</div>
            </div>
            {branch._count && <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{branch._count.users ?? 0} nhân sự · {branch._count.inventories ?? 0} mặt hàng tồn</div>}
            <button onClick={() => void deactivateBranch(branch)} className="mt-4 text-xs font-bold text-rose-700 hover:underline">Ngừng hoạt động</button>
          </article>
        ))}
      </div>

      {!loading && branches.length === 0 && !error && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-400">Chưa có chi nhánh.</div>}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3"><h3 className="text-sm font-extrabold">Thêm chi nhánh</h3><button onClick={() => setShowModal(false)}><X className="h-4 w-4" /></button></div>
            <form onSubmit={handleCreateBranch} className="mt-4 space-y-3 text-xs">
              <label className="block font-bold">Tên chi nhánh<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" /></label>
              <label className="block font-bold">Địa chỉ<input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} required className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" /></label>
              <label className="block font-bold">Điện thoại<input value={form.phone ?? ''} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 font-normal" /></label>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowModal(false)} className="rounded-xl border px-3 py-2 font-bold">Hủy</button><button disabled={saving} className="rounded-xl bg-emerald-800 px-4 py-2 font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu…' : 'Tạo chi nhánh'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
