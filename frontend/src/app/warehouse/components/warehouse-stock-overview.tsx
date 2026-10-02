'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Boxes, CheckCircle2, RefreshCcw } from 'lucide-react';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';

type Branch = components['schemas']['BranchResponseDto'];
type InventoryItem = components['schemas']['InventoryResponseDto'];
type InventoryPage = { data?: InventoryItem[] };

export default function WarehouseStockOverview() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBranches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<Branch[]>('/branches');
      setBranches(response.data);
      setSelectedBranchId((current) =>
        response.data.some((branch) => branch.id === current)
          ? current
          : response.data[0]?.id ?? '',
      );
      if (response.data.length === 0) setLoading(false);
    } catch {
      setBranches([]);
      setItems([]);
      setError('Không thể tải danh sách kho được phân công. Hãy thử lại.');
      setLoading(false);
    }
  };

  const loadInventory = async (branchId: string) => {
    if (!branchId) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.get<InventoryPage>(
        `/inventory?branchId=${encodeURIComponent(branchId)}&limit=100`,
      );
      setItems(response.data.data ?? []);
    } catch {
      setItems([]);
      setError('Không thể tải tồn kho hiện tại. Hãy kiểm tra kết nối và thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranchId) void loadInventory(selectedBranchId);
  }, [selectedBranchId]);

  const lowStockCount = useMemo(
    () => items.filter((item) => Number(item.currentStock) <= Number(item.minStock)).length,
    [items],
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <Boxes className="h-5 w-5 text-amber-700" aria-hidden="true" />
            Tồn kho hiện tại
          </h2>
          <p className="mt-1 text-xs text-slate-500">Dữ liệu đọc trực tiếp từ kho của chi nhánh được phân công.</p>
        </div>
        <div className="flex items-end gap-2">
          <div className="min-w-0 flex-1 sm:w-64">
            <label htmlFor="warehouse-branch" className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Kho / chi nhánh
            </label>
            <select
              id="warehouse-branch"
              value={selectedBranchId}
              onChange={(event) => setSelectedBranchId(event.target.value)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              {branches.length === 0 && <option value="">Không có kho được phân công</option>}
              {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void (selectedBranchId ? loadInventory(selectedBranchId) : loadBranches())}
            disabled={loading}
            aria-label="Tải lại tồn kho"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
          </button>
        </div>
      </div>

      {error && (
        <div role="alert" aria-live="polite" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Nguyên liệu</div>
          <div className="numeric mt-1 text-2xl font-black text-slate-900">{items.length}</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-[11px] font-bold uppercase tracking-wide text-amber-800">Dưới mức tối thiểu</div>
          <div className="numeric mt-1 text-2xl font-black text-amber-900">{lowStockCount}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Nguyên liệu</th>
                <th className="px-4 py-3 text-right">Tồn hiện tại</th>
                <th className="px-4 py-3 text-right">Mức tối thiểu</th>
                <th className="px-4 py-3 text-center">Tình trạng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => {
                const isLow = Number(item.currentStock) <= Number(item.minStock);
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-500">{item.material.sku}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.material.name}</td>
                    <td className="numeric px-4 py-3 text-right font-extrabold text-slate-900">
                      {Number(item.currentStock).toLocaleString('vi-VN')} {item.unit}
                    </td>
                    <td className="numeric px-4 py-3 text-right text-slate-500">
                      {Number(item.minStock).toLocaleString('vi-VN')} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold ${isLow ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>
                        {isLow ? <AlertTriangle className="h-3 w-3" aria-hidden="true" /> : <CheckCircle2 className="h-3 w-3" aria-hidden="true" />}
                        {isLow ? 'Cần bổ sung' : 'Đủ hàng'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {!loading && !error && items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-slate-400">Kho này chưa có số dư nguyên liệu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
        Phiếu nhập, điều chuyển, lô/HSD và kiểm kê vẫn bị khóa cho đến khi INV-01–04 có chứng từ,
        phê duyệt và stock ledger bất biến. Màn hình này chỉ cho phép đọc tồn hiện tại.
      </div>
    </div>
  );
}
