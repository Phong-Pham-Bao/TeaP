'use client';

import React, { useState } from 'react';
import { 
  Users, AlertTriangle, Clock, CheckCircle2, 
  Send, Package, Coffee, ChevronRight, Store 
} from 'lucide-react';

export default function ManagerOperationsTab() {
  const [requestedItems, setRequestedItems] = useState<string[]>([]);

  // Live in-store staff presence mock
  const liveStaff = [
    { id: '1', name: 'Phạm Minh Thu Ngân', role: 'CASHIER', station: 'Quầy Thu Ngân #1', checkIn: '07:55 AM', status: 'ACTIVE' },
    { id: '2', name: 'Nguyễn Thị Kim Thuý', role: 'BARISTA', station: 'Quầy Bar Đứng Bếp', checkIn: '08:02 AM', status: 'ACTIVE' },
    { id: '3', name: 'Vũ Ngọc Quỳnh Như', role: 'BARISTA', station: 'Pha Chế Topping & Trà', checkIn: '08:15 AM', status: 'ACTIVE' },
    { id: '4', name: 'Trần Thanh Tâm', role: 'STAFF', station: 'Tiếp Thực & Dọn Bàn', checkIn: '10:00 AM', status: 'ACTIVE' },
  ];

  // Urgent low-stock inventory alerts at store level
  const stockAlerts = [
    { id: 'mat1', name: 'Sữa tươi thanh trùng Dalat Milk', current: 4, min: 15, unit: 'Hộp 1L', urgency: 'CRITICAL' },
    { id: 'mat2', name: 'Trân châu đen hoàng kim Ô Long', current: 2.5, min: 10, unit: 'Kg', urgency: 'CRITICAL' },
    { id: 'mat3', name: 'Trà Đen Lạc Xương Thượng Hạng', current: 1.8, min: 5, unit: 'Kg', urgency: 'WARNING' },
    { id: 'mat4', name: 'Đường bắp lỏng cô đặc Fructose', current: 6, min: 12, unit: 'Can 5L', urgency: 'WARNING' },
  ];

  // Recent in-store orders
  const recentOrders = [
    { id: 'ORD-260916-4192', items: 'Trà Sữa Oolong Nướng (L) + Trân Châu Đen', amount: 55000, time: '2 phút trước', status: 'Đang pha chế' },
    { id: 'ORD-260916-4191', items: 'Trà Đào Cam Sả (M), Trà Sữa Kem Trứng (M)', amount: 98000, time: '6 phút trước', status: 'Hoàn tất' },
    { id: 'ORD-260916-4190', items: 'Lục Trà Macchiato (L) + Sương Sáo', amount: 48000, time: '11 phút trước', status: 'Hoàn tất' },
  ];

  const handleRequestStock = (id: string, name: string) => {
    setRequestedItems(prev => [...prev, id]);
  };

  return (
    <div className="space-y-6">
      {/* 2-Column Operational Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Live Staff Presence */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Nhân Sự Đang Có Mặt Trong Ca</h3>
                  <p className="text-xs text-slate-500">Điểm danh trực tiếp tại chi nhánh hôm nay</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {liveStaff.length} người đang trực
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {liveStaff.map(staff => (
                <div key={staff.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">{staff.name}</div>
                    <div className="text-[11px] text-emerald-700 font-medium">{staff.station}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1 justify-end">
                      <Clock className="w-3 h-3 text-slate-400" /> Vào ca: {staff.checkIn}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đúng giờ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Urgent Stock Alerts with 1-Click Reorder */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Cảnh Báo Tồn Kho Khẩn Cấp</h3>
                  <p className="text-xs text-slate-500">Nguyên vật liệu dưới định mức tối thiểu tại quầy</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {stockAlerts.length} món thiếu hụt
              </span>
            </div>

            <div className="mt-4 divide-y divide-slate-100">
              {stockAlerts.map(item => {
                const requested = requestedItems.includes(item.id);
                return (
                  <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.name}</div>
                      <div className="text-[11px] text-rose-600 font-bold">
                        Còn: {item.current} {item.unit} (Định mức tối thiểu: {item.min})
                      </div>
                    </div>
                    <button
                      disabled={requested}
                      onClick={() => handleRequestStock(item.id, item.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        requested 
                          ? 'bg-emerald-100 text-emerald-800 cursor-default' 
                          : 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                      }`}
                    >
                      {requested ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                      {requested ? 'Đã yêu cầu' : 'Yêu cầu kho'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Recent Branch Orders Feed */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 text-slate-800 rounded-xl">
              <Coffee className="w-5 h-5 text-emerald-800" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Luồng Đơn Hàng Mới Nhất</h3>
              <p className="text-xs text-slate-500">Theo dõi tiến độ làm món và bàn giao cho khách tại chi nhánh</p>
            </div>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100">
          {recentOrders.map(order => (
            <div key={order.id} className="py-3 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-extrabold text-slate-900">{order.id}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    order.status === 'Hoàn tất' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{order.items}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold text-slate-900">{order.amount.toLocaleString('vi-VN')} đ</div>
                <div className="text-[10px] text-slate-400">{order.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
