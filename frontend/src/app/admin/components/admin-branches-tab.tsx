'use client';

import React, { useState } from 'react';
import { 
  Store, Plus, Edit2, Phone, MapPin, 
  CheckCircle2, AlertCircle, X, Save 
} from 'lucide-react';

interface BranchItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  managerName: string;
  isActive: boolean;
  todayRevenue: number;
}

const INITIAL_BRANCHES: BranchItem[] = [
  { id: 'b1', name: 'TeaP Chi Nhánh Quận 1', address: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP.HCM', phone: '028-1234-5001', managerName: 'Trần Thị Quản Lý (manager.q1@teap.vn)', isActive: true, todayRevenue: 8450000 },
  { id: 'b2', name: 'TeaP Chi Nhánh Quận 3', address: '456 Võ Văn Tần, P.5, Quận 3, TP.HCM', phone: '028-1234-5003', managerName: 'Lê Văn Manager (manager@teap.vn)', isActive: true, todayRevenue: 6210000 },
  { id: 'b3', name: 'TeaP Chi Nhánh Quận 7', address: '789 Nguyễn Thị Thập, P. Tân Phú, Quận 7, TP.HCM', phone: '028-1234-5007', managerName: 'Nguyễn Văn Q7', isActive: true, todayRevenue: 5120000 },
  { id: 'b4', name: 'TeaP Chi Nhánh TP. Thủ Đức', address: '321 Võ Văn Ngân, P. Linh Chiểu, TP. Thủ Đức', phone: '028-1234-5009', managerName: 'Phạm Thị Thủ Đức', isActive: true, todayRevenue: 7340000 },
  { id: 'b5', name: 'TeaP Chi Nhánh Bình Thạnh', address: '654 Xô Viết Nghệ Tĩnh, P.25, Bình Thạnh', phone: '028-1234-5010', managerName: 'Đặng Bình Thạnh', isActive: true, todayRevenue: 4890000 },
];

export default function AdminBranchesTab() {
  const [branches, setBranches] = useState<BranchItem[]>(INITIAL_BRANCHES);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [manager, setManager] = useState('');

  const handleCreateBranch = (e: React.FormEvent) => {
    e.preventDefault();
    const newB: BranchItem = {
      id: `b_${Date.now()}`,
      name,
      address,
      phone,
      managerName: manager || 'Chưa gán quản lý',
      isActive: true,
      todayRevenue: 0,
    };
    setBranches(prev => [...prev, newB]);
    setShowModal(false);
    setName(''); setAddress(''); setPhone(''); setManager('');
  };

  const toggleStatus = (id: string) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, isActive: !b.isActive } : b));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-700" />
            Quản Lý Danh Sách 5 Chi Nhánh Toàn Chuỗi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Giám sát hoạt động, doanh số ca và chỉ định Quản lý cửa hàng phụ trách từng quán.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Thêm Chi Nhánh Mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {branches.map(b => (
          <div key={b.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">{b.name}</h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400" /> {b.address}
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" /> {b.phone}
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  b.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {b.isActive ? 'ĐANG MỞ CỬA' : 'TẠM DỪNG'}
                </span>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Quản lý:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[170px]">{b.managerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doanh thu hôm nay:</span>
                  <span className="font-mono font-extrabold text-emerald-800">{b.todayRevenue.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => toggleStatus(b.id)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition ${
                  b.isActive ? 'text-amber-700 hover:bg-amber-50' : 'text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {b.isActive ? 'Tạm ngưng hoạt động' : 'Kích hoạt mở cửa'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Thêm Chi Nhánh Quán Mới</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateBranch} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Chi Nhánh</label>
                <input type="text" placeholder="TeaP Chi Nhánh..." value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600" required />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Địa Chỉ</label>
                <input type="text" placeholder="Số nhà, đường, quận..." value={address} onChange={e => setAddress(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600" required />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Số Điện Thoại</label>
                <input type="text" placeholder="028-xxxx-xxxx" value={phone} onChange={e => setPhone(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600" required />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Quản Lý Phụ Trách</label>
                <input type="text" placeholder="Họ tên quản lý..." value={manager} onChange={e => setManager(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600" />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold shadow-xs hover:bg-emerald-700">Tạo chi nhánh</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
