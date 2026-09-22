'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Boxes, AlertTriangle, CheckCircle, RefreshCcw, ArrowUpDown } from 'lucide-react';

export default function AdminInventoryPage() {
  const [inventories, setInventories] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    if (selectedBranch) {
      loadInventory(selectedBranch);
    }
  }, [selectedBranch]);

  const loadBranches = async () => {
    try {
      const res = await api.get('/branches');
      setBranches(res.data);
      if (res.data.length > 0) {
        setSelectedBranch(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadInventory = async (branchId: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/inventory?branchId=${branchId}`);
      setInventories(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Quản lý Tồn kho Nguyên liệu</h2>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi số lượng trà, sữa, syrup, ly, ống hút tự động trừ theo công thức khi POS bán hàng.
          </p>
        </div>

        {/* Filter Branch */}
        <div className="flex items-center gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 shadow-sm focus:outline-none"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadInventory(selectedBranch)}
            className="p-2 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 text-slate-600 transition shadow-sm"
            title="Tải lại"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Inventory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Mã nguyên liệu</th>
              <th className="py-3.5 px-4">Tên nguyên vật liệu</th>
              <th className="py-3.5 px-4 text-center">Đơn vị</th>
              <th className="py-3.5 px-4 text-right">Tồn kho hiện tại</th>
              <th className="py-3.5 px-4 text-right">Mức tối thiểu (Min)</th>
              <th className="py-3.5 px-4 text-center">Tình trạng kho</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventories.map((inv) => {
              const current = Number(inv.currentStock);
              const min = Number(inv.minStock);
              const isLow = current <= min;

              return (
                <tr key={inv.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-400">
                    {inv.material?.sku || 'MAT'}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800">
                    {inv.material?.name || 'Nguyên liệu'}
                  </td>
                  <td className="py-3 px-4 text-center font-semibold text-slate-500">{inv.unit}</td>
                  <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                    {current.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400">{min.toLocaleString()}</td>
                  <td className="py-3 px-4 text-center">
                    {isLow ? (
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" /> Cảnh báo sắp hết
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Đủ hàng
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
