'use client';

import React, { useState } from 'react';
import { 
  Users, Search, Award, Edit3, Check, X, 
  ShieldCheck, AlertCircle, Plus 
} from 'lucide-react';

export interface StaffItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  position: string;
  stage: 'Hội nhập' | 'Thử việc' | 'Chính thức';
  rank: 'Bậc A' | 'Bậc B' | 'Bậc C' | 'Chưa xếp bậc';
  kpiScore: number;
  attendanceScore: number;
}

const INITIAL_STAFF: StaffItem[] = [
  { id: '1', fullName: 'Nguyễn Thị Kim Thuý', email: 'thuy.nguyen@teap.vn', phone: '0901234501', position: 'Đứng Bếp, Thu Ngân', stage: 'Chính thức', rank: 'Bậc A', kpiScore: 98, attendanceScore: 100 },
  { id: '2', fullName: 'Nguyễn Trọng Hoá', email: 'hoa.nguyen@teap.vn', phone: '0901234502', position: 'Đứng Bếp, Kiểm Kho', stage: 'Chính thức', rank: 'Bậc C', kpiScore: 88, attendanceScore: 95 },
  { id: '3', fullName: 'Vũ Ngọc Quỳnh Như', email: 'nhu.vu@teap.vn', phone: '0901234503', position: 'Thu Ngân, Pha Chế', stage: 'Chính thức', rank: 'Bậc B', kpiScore: 92, attendanceScore: 98 },
  { id: '4', fullName: 'Trần Thanh Tâm', email: 'tam.tran@teap.vn', phone: '0901234504', position: 'Thu Ngân', stage: 'Thử việc', rank: 'Bậc C', kpiScore: 85, attendanceScore: 90 },
  { id: '5', fullName: 'Trịnh Minh Trường', email: 'truong.trinh@teap.vn', phone: '0901234505', position: 'Pha Chế Phụ', stage: 'Hội nhập', rank: 'Chưa xếp bậc', kpiScore: 80, attendanceScore: 88 },
];

export default function ManagerStaffTab() {
  const [staff, setStaff] = useState<StaffItem[]>(INITIAL_STAFF);
  const [search, setSearch] = useState('');
  const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);

  const filteredStaff = staff.filter(s => 
    s.fullName.toLowerCase().includes(search.toLowerCase()) || 
    s.position.toLowerCase().includes(search.toLowerCase())
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    setStaff(prev => prev.map(s => s.id === editingStaff.id ? editingStaff : s));
    setEditingStaff(null);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            Đội Ngũ Nhân Sự Chi Nhánh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi hồ sơ năng lực, xếp bậc tay nghề và chỉ số KPI nhân sự tại cửa hàng.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Tìm theo tên, vị trí..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-600 outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
            <tr>
              <th className="py-3 px-4">Nhân sự</th>
              <th className="py-3 px-4">Vị trí</th>
              <th className="py-3 px-4">Giai đoạn</th>
              <th className="py-3 px-4">Bậc tay nghề</th>
              <th className="py-3 px-4 text-center">Chuyên cần</th>
              <th className="py-3 px-4 text-center">KPI</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredStaff.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4">
                  <div className="font-bold text-slate-900">{s.fullName}</div>
                  <div className="text-[10px] text-slate-400">{s.email}</div>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-700">{s.position}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    s.stage === 'Chính thức' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                    s.stage === 'Thử việc' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    {s.stage}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {s.rank}
                  </span>
                </td>
                <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">{s.attendanceScore}%</td>
                <td className="py-3 px-4 text-center font-mono font-extrabold text-emerald-800">{s.kpiScore}</td>
                <td className="py-3 px-4 text-right">
                  <button 
                    onClick={() => setEditingStaff(s)}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Điều Chỉnh Hồ Sơ Nhân Sự</h3>
              <button onClick={() => setEditingStaff(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ & Tên</label>
                <input 
                  type="text" 
                  value={editingStaff.fullName} 
                  onChange={e => setEditingStaff({ ...editingStaff, fullName: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giai đoạn</label>
                  <select 
                    value={editingStaff.stage} 
                    onChange={e => setEditingStaff({ ...editingStaff, stage: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none"
                  >
                    <option value="Hội nhập">Hội nhập</option>
                    <option value="Thử việc">Thử việc</option>
                    <option value="Chính thức">Chính thức</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Bậc tay nghề</label>
                  <select 
                    value={editingStaff.rank} 
                    onChange={e => setEditingStaff({ ...editingStaff, rank: e.target.value as any })}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none"
                  >
                    <option value="Chưa xếp bậc">Chưa xếp bậc</option>
                    <option value="Bậc C">Bậc C</option>
                    <option value="Bậc B">Bậc B</option>
                    <option value="Bậc A">Bậc A</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Điểm KPI (0-100)</label>
                  <input 
                    type="number" 
                    value={editingStaff.kpiScore} 
                    onChange={e => setEditingStaff({ ...editingStaff, kpiScore: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" 
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chuyên cần (%)</label>
                  <input 
                    type="number" 
                    value={editingStaff.attendanceScore} 
                    onChange={e => setEditingStaff({ ...editingStaff, attendanceScore: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" 
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setEditingStaff(null)} 
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold shadow-xs hover:bg-emerald-700"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
