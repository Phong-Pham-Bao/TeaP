'use client';

import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Package, Plus, Coffee, Tag } from 'lucide-react';

export default function AdminProductsPage() {
  const [drinks, setDrinks] = useState<any[]>([]);
  const [toppings, setToppings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'DRINK' | 'TOPPING'>('DRINK');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menuRes, catRes] = await Promise.all([
        api.get('/products/menu'),
        api.get('/categories'),
      ]);
      const menuData = menuRes.data;
      if (menuData && menuData.drinks) {
        setDrinks(menuData.drinks || []);
        setToppings(menuData.toppings || []);
      } else if (Array.isArray(menuData)) {
        const allDrinks: any[] = [];
        const allToppings: any[] = [];
        menuData.forEach((cat: any) => {
          (cat.products || []).forEach((p: any) => {
            if (p.type === 'TOPPING') allToppings.push(p);
            else allDrinks.push(p);
          });
        });
        setDrinks(allDrinks);
        setToppings(allToppings);
      }
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const list = activeTab === 'DRINK' ? drinks : toppings;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">Danh mục Sản phẩm & Menu</h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý danh sách đồ uống, giá bán, size và topping dùng cho quầy POS.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('DRINK')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'DRINK'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Coffee className="w-4 h-4" /> Đồ uống ({drinks.length})
        </button>
        <button
          onClick={() => setActiveTab('TOPPING')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
            activeTab === 'TOPPING'
              ? 'border-emerald-700 text-emerald-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" /> Topping thêm ({toppings.length})
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Mã SKU</th>
              <th className="py-3.5 px-4">Tên món</th>
              <th className="py-3.5 px-4">Danh mục</th>
              <th className="py-3.5 px-4">Kích cỡ (Size)</th>
              <th className="py-3.5 px-4 text-right">Giá bán cơ bản</th>
              <th className="py-3.5 px-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-500">{item.sku}</td>
                <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                <td className="py-3 px-4 text-slate-500">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                    {item.category?.name || 'Trà'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {item.sizes && item.sizes.length > 0 ? (
                    <div className="flex gap-1.5">
                      {item.sizes.map((s: any) => (
                        <span key={s.id} className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {s.name} (+{Number(s.priceAdj).toLocaleString()}đ)
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Mặc định</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                  {Number(item.basePrice).toLocaleString('vi-VN')} đ
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Đang bán
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
