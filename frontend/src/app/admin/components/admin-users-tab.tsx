'use client';

import React, { useState } from 'react';
import { 
  Users, UserPlus, Shield, Key, Search, 
  Lock, Unlock, CheckCircle2, X 
} from 'lucide-react';

interface AccountUser {
  id: string;
  fullName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE_STAFF' | 'ACCOUNTANT' | 'HR';
  branchName: string;
  isActive: boolean;
}

const INITIAL_USERS: AccountUser[] = [
  { id: 'u1', fullName: 'Nguyễn Văn Admin', email: 'admin@teap.vn', role: 'SUPER_ADMIN', branchName: 'Toàn hệ thống', isActive: true },
  { id: 'u2', fullName: 'Trần Thị Quản Lý', email: 'manager.q1@teap.vn', role: 'MANAGER', branchName: 'TeaP Quận 1', isActive: true },
  { id: 'u3', fullName: 'Lê Văn Manager', email: 'manager@teap.vn', role: 'MANAGER', branchName: 'TeaP Quận 3', isActive: true },
  { id: 'u4', fullName: 'Phạm Minh Thu Ngân', email: 'cashier@teap.vn', role: 'CASHIER', branchName: 'TeaP Quận 1', isActive: true },
  { id: 'u5', fullName: 'Trần Văn Thủ Kho', email: 'warehouse@teap.vn', role: 'WAREHOUSE_STAFF', branchName: 'Kho Tổng Trung Tâm', isActive: true },
  { id: 'u6', fullName: 'Hoàng Thị Kế Toán', email: 'accountant@teap.vn', role: 'ACCOUNTANT', branchName: 'Văn Phòng Tổng', isActive: true },
  { id: 'u7', fullName: 'Đặng Tuyết HR', email: 'hr@teap.vn', role: 'HR', branchName: 'Khối Nhân Sự', isActive: true },
];

export default function AdminUsersTab() {
  const [users, setUsers] = useState<AccountUser[]>(INITIAL_USERS);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccountUser['role']>('CASHIER');
  const [branch, setBranch] = useState('TeaP Quận 1');

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newU: AccountUser = {
      id: `u_${Date.now()}`,
      fullName: name,
      email,
      role,
      branchName: branch,
      isActive: true,
    };
    setUsers(prev => [...prev, newU]);
    setShowModal(false);
    setName(''); setEmail('');
  };

  const toggleLock = (id: string) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u));
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-700" />
            Quản Trị Người Dùng & Phân Quyền Vai Trò (RBAC)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Cấp tài khoản đăng nhập, gán chi nhánh trực thuộc và phân quyền chặt chẽ theo chức vụ.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" /> Tạo Tài Khoản Mới
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Họ & Tên</th>
                <th className="py-3 px-4">Email đăng nhập</th>
                <th className="py-3 px-4">Vai trò (Role)</th>
                <th className="py-3 px-4">Chi nhánh phụ trách</th>
                <th className="py-3 px-4 text-center">Trạng thái</th>
                <th className="py-3 px-4 text-right">Khóa / Mở</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{u.fullName}</td>
                  <td className="py-3 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] ${
                      u.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                      u.role === 'MANAGER' ? 'bg-teal-100 text-teal-800' :
                      u.role === 'WAREHOUSE_STAFF' ? 'bg-orange-100 text-orange-800' :
                      u.role === 'CASHIER' ? 'bg-emerald-100 text-emerald-800' :
                      u.role === 'HR' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-slate-100 text-slate-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">{u.branchName}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {u.isActive ? 'HOẠT ĐỘNG' : 'ĐÃ KHÓA'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {u.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => toggleLock(u.id)}
                        className={`p-1.5 rounded-lg transition ${
                          u.isActive ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                        title={u.isActive ? 'Khóa tài khoản' : 'Mở khóa'}
                      >
                        {u.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Tạo Tài Khoản Mới</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Họ & Tên</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600" required />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Email đăng nhập</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-600" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vai trò</label>
                  <select value={role} onChange={e => setRole(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none">
                    <option value="MANAGER">Quản lý (MANAGER)</option>
                    <option value="CASHIER">Thu ngân (CASHIER)</option>
                    <option value="WAREHOUSE_STAFF">Thủ kho (WAREHOUSE)</option>
                    <option value="HR">Nhân sự (HR)</option>
                    <option value="ACCOUNTANT">Kế toán (ACCOUNTANT)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chi nhánh</label>
                  <select value={branch} onChange={e => setBranch(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2.5 py-2 outline-none">
                    <option value="TeaP Quận 1">TeaP Quận 1</option>
                    <option value="TeaP Quận 3">TeaP Quận 3</option>
                    <option value="TeaP Quận 7">TeaP Quận 7</option>
                    <option value="TeaP Thủ Đức">TeaP Thủ Đức</option>
                    <option value="TeaP Bình Thạnh">TeaP Bình Thạnh</option>
                    <option value="Kho Tổng Trung Tâm">Kho Tổng Trung Tâm</option>
                  </select>
                </div>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold shadow-xs hover:bg-emerald-700">Tạo người dùng</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
