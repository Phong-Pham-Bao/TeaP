'use client';

import React, { useEffect, useState } from 'react';
import { Coffee, RefreshCcw } from 'lucide-react';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';

type Menu = components['schemas']['MenuResponseDto'];

const EMPTY_MENU: Menu = { drinks: [], toppings: [], categories: [] };

export default function AdminMenuBomTab() {
  const [menu, setMenu] = useState<Menu>(EMPTY_MENU);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadMenu = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<Menu>('/products/menu');
      setMenu(response.data);
    } catch {
      setMenu(EMPTY_MENU);
      setError('Không thể tải danh mục menu.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMenu();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900"><Coffee className="h-5 w-5 text-emerald-700" /> Menu và định lượng</h2><p className="mt-0.5 text-xs text-slate-500">Menu hiện tại được đọc trực tiếp từ backend.</p></div>
        <button onClick={() => void loadMenu()} disabled={loading} className="rounded-xl border p-2 disabled:opacity-50" aria-label="Tải lại menu"><RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></button>
      </div>
      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b bg-slate-50 text-[10px] font-bold uppercase text-slate-500"><tr><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Tên món</th><th className="px-4 py-3">Loại</th><th className="px-4 py-3">Danh mục</th><th className="px-4 py-3 text-right">Giá</th></tr></thead><tbody className="divide-y divide-slate-100">
        {[...menu.drinks, ...menu.toppings].map((product) => <tr key={product.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-mono">{product.sku}</td><td className="px-4 py-3 font-bold">{product.name}</td><td className="px-4 py-3">{product.type}</td><td className="px-4 py-3">{product.category?.name ?? '—'}</td><td className="px-4 py-3 text-right font-bold text-emerald-800">{product.basePrice.toLocaleString('vi-VN')} đ</td></tr>)}
        {!loading && menu.drinks.length + menu.toppings.length === 0 && !error && <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Chưa có sản phẩm đang bán.</td></tr>}
      </tbody></table></div></div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Chỉnh sửa BOM đang tắt cho tới khi DATA-02 bổ sung version, trạng thái publish và effective date; không còn sửa định lượng mẫu chỉ trong trình duyệt.</div>
    </div>
  );
}
