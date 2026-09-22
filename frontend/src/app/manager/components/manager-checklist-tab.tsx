'use client';

import React, { useState } from 'react';
import { 
  CheckSquare, ShieldCheck, AlertCircle, 
  FileText, Plus, Check, Clock, Save 
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: 'OPEN' | 'CLOSE' | 'HYGIENE';
  label: string;
  checked: boolean;
  time?: string;
}

const INITIAL_CHECKLIST: ChecklistItem[] = [
  // Mở ca
  { id: 'c1', category: 'OPEN', label: 'Kiểm tra nhiệt độ tủ đông (≤ -18°C) và tủ mát (≤ 4°C)', checked: true, time: '07:30' },
  { id: 'c2', category: 'OPEN', label: 'Khởi động máy đun nước nóng 100°C và máy dập nắp ly', checked: true, time: '07:35' },
  { id: 'c3', category: 'OPEN', label: 'Bàn giao quỹ tiền mặt đầu ngày (1.000.000 đ) tại két thu ngân', checked: true, time: '07:45' },
  { id: 'c4', category: 'OPEN', label: 'Kiểm tra date sữa tươi thanh trùng & nấu trân châu mẻ sáng', checked: true, time: '07:50' },
  // Đóng ca
  { id: 'c5', category: 'CLOSE', label: 'Vệ sinh cối xay sinh tố, đầu vòi chiết trà và cây đánh bọt', checked: false },
  { id: 'c6', category: 'CLOSE', label: 'Hủy bã trà và topping dư thừa cuối ngày, tuyệt đối không giữ qua đêm', checked: false },
  { id: 'c7', category: 'CLOSE', label: 'In phiếu chốt ca POS, niêm phong túi tiền nộp quản lý', checked: false },
  { id: 'c8', category: 'CLOSE', label: 'Tắt toàn bộ thiết bị điện công suất lớn, kích hoạt Camera an ninh đêm', checked: false },
  // Vệ sinh
  { id: 'c9', category: 'HYGIENE', label: 'Khử trùng bàn ghế khách ngồi sau mỗi lượt và quầy Bar', checked: true, time: '11:30' },
  { id: 'c10', category: 'HYGIENE', label: 'Đổ rác khu vực khách và thay túi rác bồn rửa quầy pha chế', checked: false },
];

export default function ManagerChecklistTab() {
  const [items, setItems] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);
  const [incidentText, setIncidentText] = useState('');
  const [incidents, setIncidents] = useState<{ id: string; text: string; time: string }[]>([
    { id: 'inc-1', text: 'Máy dập nắp quầy 1 hơi rít màng dập, đã tra dầu silicon vận hành trơn tru.', time: '09:15 AM' }
  ]);
  const [saveNote, setSaveNote] = useState(false);

  const toggleItem = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        return {
          ...item,
          checked: !item.checked,
          time: !item.checked ? new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : undefined
        };
      }
      return item;
    }));
  };

  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim()) return;
    setIncidents(prev => [
      { id: `inc-${Date.now()}`, text: incidentText.trim(), time: new Date().toLocaleTimeString('vi-VN') },
      ...prev
    ]);
    setIncidentText('');
  };

  const openItems = items.filter(i => i.category === 'OPEN');
  const closeItems = items.filter(i => i.category === 'CLOSE');
  const hygieneItems = items.filter(i => i.category === 'HYGIENE');

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            Kiểm Tra Vận Hành & An Toàn Vệ Sinh Cửa Hàng
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Tiêu chuẩn kiểm toán nội bộ hằng ngày dành cho Quản lý cửa hàng.</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
            {items.filter(i => i.checked).length} / {items.length} Hạng mục đạt
          </span>
        </div>
      </div>

      {/* 2-Column Checklist Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Mở ca & Vệ sinh */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider mb-3">1. Quy trình Mở Ca Sáng</h3>
            <div className="space-y-2.5">
              {openItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item.id)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-slate-100"
                >
                  <input 
                    type="checkbox" 
                    checked={item.checked} 
                    onChange={() => {}} 
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 pointer-events-none" 
                  />
                  <div className="flex-1">
                    <span className={`text-xs ${item.checked ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-semibold'}`}>
                      {item.label}
                    </span>
                    {item.time && <div className="text-[10px] text-emerald-700 font-mono mt-0.5">Xác nhận: {item.time}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase text-teal-800 tracking-wider mb-3">2. Vệ Sinh An Toàn Thực Phẩm (HACCP)</h3>
            <div className="space-y-2.5">
              {hygieneItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item.id)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-slate-100"
                >
                  <input 
                    type="checkbox" 
                    checked={item.checked} 
                    onChange={() => {}} 
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 pointer-events-none" 
                  />
                  <div className="flex-1">
                    <span className={`text-xs ${item.checked ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-semibold'}`}>
                      {item.label}
                    </span>
                    {item.time && <div className="text-[10px] text-emerald-700 font-mono mt-0.5">Xác nhận: {item.time}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 2: Đóng ca & Nhật ký sự cố */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase text-rose-800 tracking-wider mb-3">3. Quy trình Đóng Ca Tối & Kiểm Quỹ</h3>
            <div className="space-y-2.5">
              {closeItems.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => toggleItem(item.id)}
                  className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition border border-slate-100"
                >
                  <input 
                    type="checkbox" 
                    checked={item.checked} 
                    onChange={() => {}} 
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 pointer-events-none" 
                  />
                  <div className="flex-1">
                    <span className={`text-xs ${item.checked ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-semibold'}`}>
                      {item.label}
                    </span>
                    {item.time && <div className="text-[10px] text-emerald-700 font-mono mt-0.5">Xác nhận: {item.time}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sổ ghi chép sự cố */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-extrabold uppercase text-slate-800 tracking-wider mb-3">4. Sổ Ghi Nhận Sự Cố Cửa Hàng</h3>
            <form onSubmit={handleAddIncident} className="flex gap-2">
              <input
                type="text"
                value={incidentText}
                onChange={(e) => setIncidentText(e.target.value)}
                placeholder="Ghi nhận sự cố máy móc, khách hàng..."
                className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ghi lại
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {incidents.map(inc => (
                <div key={inc.id} className="p-3 bg-amber-50/50 border border-amber-200/60 rounded-xl text-xs flex justify-between gap-2">
                  <span className="text-slate-800">{inc.text}</span>
                  <span className="text-[10px] font-mono text-amber-800 whitespace-nowrap">{inc.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
