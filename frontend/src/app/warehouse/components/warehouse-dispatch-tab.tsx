'use client';

import React, { useState } from 'react';
import { 
  Truck, CheckCircle2, AlertCircle, PackageCheck, 
  Printer, ArrowUpRight, Search, Clock, Check 
} from 'lucide-react';
import { RequisitionOrder } from './warehouse-types';

const INITIAL_REQUISITIONS: RequisitionOrder[] = [
  {
    id: 'req-1',
    orderNumber: 'REQ-Q1-260916-01',
    branchName: 'TeaP Quận 1 (Nguyễn Huệ)',
    branchId: 'b1',
    requestedAt: 'Hôm nay lúc 09:30 AM',
    urgency: 'HIGH',
    status: 'PENDING',
    items: [
      { name: 'Sữa tươi Dalat Milk 1L', qty: 30, unit: 'Hộp' },
      { name: 'Trà Đen Lạc Xương', qty: 10, unit: 'Kg' },
      { name: 'Trân châu đen hoàng kim', qty: 25, unit: 'Kg' },
    ],
    note: 'Quán đang chạy giờ cao điểm trưa, xin xe xuất sớm trước 11h.',
  },
  {
    id: 'req-2',
    orderNumber: 'REQ-Q3-260916-02',
    branchName: 'TeaP Quận 3 (Võ Văn Tần)',
    branchId: 'b2',
    requestedAt: 'Hôm nay lúc 10:15 AM',
    urgency: 'NORMAL',
    status: 'PENDING',
    items: [
      { name: 'Đường bắp Fructose Can 5L', qty: 6, unit: 'Can' },
      { name: 'Ly nhựa PP 700ml', qty: 1000, unit: 'Cái' },
      { name: 'Cuộn màng dập nắp trà sữa', qty: 4, unit: 'Cuộn' },
    ],
  },
  {
    id: 'req-3',
    orderNumber: 'REQ-Q7-260915-08',
    branchName: 'TeaP Quận 7 (Nguyễn Thị Thập)',
    branchId: 'b3',
    requestedAt: 'Hôm qua lúc 16:00 PM',
    urgency: 'NORMAL',
    status: 'DISPATCHED',
    items: [
      { name: 'Bột kem béo thực vật Non-Dairy Creamer', qty: 50, unit: 'Kg' },
      { name: 'Trà Oolong Tứ Quý', qty: 15, unit: 'Kg' },
    ],
  },
];

export default function WarehouseDispatchTab() {
  const [orders, setOrders] = useState<RequisitionOrder[]>(INITIAL_REQUISITIONS);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApproveDispatch = (id: string, branchName: string) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'DISPATCHED' } : o));
    setSuccessMsg(`Đã duyệt lệnh xuất kho chuyển hàng cho ${branchName}! Tồn kho tổng đã được trừ tự động.`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Overview & Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-600" />
            Yêu Cầu Cung Ứng & Xuất Kho Cho 5 Chi Nhánh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Duyệt phiếu xuất hàng điều chuyển, in phiếu giao nhận và điều phối xe tải giao hàng cho các quán.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="bg-amber-50 text-amber-800 px-3 py-1.5 rounded-xl border border-amber-200">
            {orders.filter(o => o.status === 'PENDING').length} đơn chờ xuất xe
          </span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-900">{order.orderNumber}</span>
                    {order.urgency === 'HIGH' && (
                      <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> GẤP
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-900 mt-1">{order.branchName}</h3>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" /> {order.requestedAt}
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  order.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  order.status === 'DISPATCHED' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                  'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {order.status === 'PENDING' ? '⏳ Chờ xuất hàng' :
                   order.status === 'DISPATCHED' ? '🚚 Đang giao xe' : '✅ Đã nhận đủ'}
                </span>
              </div>

              {/* Items List */}
              <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-1.5 text-xs">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                  Danh mục nguyên liệu yêu cầu:
                </div>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-800 font-medium">
                    <span>{item.name}</span>
                    <span className="font-mono font-bold text-amber-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.qty} {item.unit}
                    </span>
                  </div>
                ))}
              </div>

              {order.note && (
                <div className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 mt-2 italic">
                  Ghi chú: {order.note}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => alert(`In phiếu xuất kho cho đơn ${order.orderNumber}`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                <Printer className="w-3.5 h-3.5" /> In phiếu giao nhận
              </button>

              {order.status === 'PENDING' ? (
                <button
                  onClick={() => handleApproveDispatch(order.id, order.branchName)}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition"
                >
                  <PackageCheck className="w-3.5 h-3.5" /> Duyệt xuất hàng
                </button>
              ) : (
                <span className="text-xs font-bold text-sky-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Đã tạo lệnh vận chuyển
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
