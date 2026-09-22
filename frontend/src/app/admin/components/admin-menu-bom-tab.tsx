'use client';

import React, { useState } from 'react';
import { 
  Coffee, Layers, Plus, Edit2, 
  CheckCircle2, ChevronRight, Search 
} from 'lucide-react';

interface MenuItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  basePrice: number;
  sizeM: number;
  sizeL: number;
  bomIngredients: { material: string; qty: string }[];
}

const INITIAL_MENU: MenuItem[] = [
  {
    id: 'm1',
    sku: 'TS-001',
    name: 'Trà Sữa Oolong Nướng',
    category: 'Trà Sữa Truyền Thống',
    basePrice: 45000,
    sizeM: 45000,
    sizeL: 55000,
    bomIngredients: [
      { material: 'Cốt Trà Oolong Tứ Quý', qty: '150 ml' },
      { material: 'Sữa tươi Dalat Milk', qty: '60 ml' },
      { material: 'Bột béo Non-Dairy Creamer', qty: '25 g' },
      { material: 'Đường bắp Fructose', qty: '20 ml' },
    ],
  },
  {
    id: 'm2',
    sku: 'TT-002',
    name: 'Trà Đào Cam Sả Tươi',
    category: 'Trà Trái Cây Tươi',
    basePrice: 48000,
    sizeM: 48000,
    sizeL: 58000,
    bomIngredients: [
      { material: 'Cốt Trà Đen Lạc Xương', qty: '120 ml' },
      { material: 'Mứt si-rô đào Boduo', qty: '30 ml' },
      { material: 'Cam vàng tươi', qty: '1 lát' },
      { material: 'Đào miếng Kronos', qty: '2 miếng' },
    ],
  },
  {
    id: 'm3',
    sku: 'TS-003',
    name: 'Trà Sữa Macchiato Kem Trứng',
    category: 'Trà Sữa Truyền Thống',
    basePrice: 52000,
    sizeM: 52000,
    sizeL: 62000,
    bomIngredients: [
      { material: 'Cốt Trà Đen Lạc Xương', qty: '140 ml' },
      { material: 'Sữa tươi thanh trùng', qty: '50 ml' },
      { material: 'Kem béo thực vật Richs', qty: '30 ml' },
      { material: 'Bột custard kem trứng', qty: '20 g' },
    ],
  },
];

export default function AdminMenuBomTab() {
  const [menu, setMenu] = useState<MenuItem[]>(INITIAL_MENU);
  const [search, setSearch] = useState('');

  const filtered = menu.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Coffee className="w-5 h-5 text-emerald-700" />
            Menu Đồ Uống & Công Thức Định Lượng Nguyên Liệu (BOM Master)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cài đặt giá bán Size M/L và định lượng nguyên liệu chuẩn. Khi quầy POS bán 1 ly, hệ thống sẽ tự động trừ kho chi nhánh theo công thức này.
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm món, mã SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {item.sku}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-1">{item.name}</h3>
                  <div className="text-[11px] text-slate-400 font-medium">{item.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-emerald-800 font-mono">
                    {item.sizeM.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">Size L: +10.000 đ</div>
                </div>
              </div>

              {/* Recipe BOM */}
              <div className="mt-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 mb-2">
                  <Layers className="w-3 h-3 text-emerald-700" />
                  Định lượng trừ kho (BOM Formula):
                </div>
                <div className="space-y-1 text-xs">
                  {item.bomIngredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>• {ing.material}</span>
                      <span className="font-mono font-bold text-emerald-900">{ing.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-[11px] text-emerald-700 font-semibold">Tự động trừ kho POS 100%</span>
              <button 
                onClick={() => alert(`Chỉnh sửa công thức BOM cho ${item.name}`)}
                className="flex items-center gap-1 font-bold text-slate-700 hover:text-emerald-700"
              >
                <Edit2 className="w-3.5 h-3.5" /> Sửa công thức
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
