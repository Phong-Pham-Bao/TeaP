'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Coffee, RefreshCcw, Users } from 'lucide-react';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';

type Attendance = components['schemas']['AttendanceResponseDto'];
type InventoryAlert = components['schemas']['InventoryResponseDto'];
type Order = components['schemas']['OrderResponseDto'];
type Page<T> = { data?: T[] };

export default function ManagerOperationsTab({ branchId }: { branchId: string }) {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [stockAlerts, setStockAlerts] = useState<InventoryAlert[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOperations = async () => {
    if (!branchId) {
      setError('Hãy chọn chi nhánh để tải dữ liệu vận hành.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    const today = new Date().toISOString().slice(0, 10);
    const scopedBranchId = encodeURIComponent(branchId);
    try {
      const [attendanceResponse, alertsResponse, ordersResponse] = await Promise.all([
        api.get<Page<Attendance>>(
          `/hr/attendance?branchId=${scopedBranchId}&startDate=${today}&endDate=${today}&limit=100`,
        ),
        api.get<InventoryAlert[]>(`/inventory/alerts?branchId=${scopedBranchId}`),
        api.get<Page<Order>>(`/pos/orders?branchId=${scopedBranchId}&limit=5&startDate=${today}`),
      ]);
      setAttendance(attendanceResponse.data.data ?? []);
      setStockAlerts(alertsResponse.data ?? []);
      setRecentOrders(ordersResponse.data.data ?? []);
    } catch {
      setAttendance([]);
      setStockAlerts([]);
      setRecentOrders([]);
      setError('Không thể tải dữ liệu vận hành của chi nhánh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadOperations();
  }, [branchId]);

  const presentStaff = attendance.filter((record) => record.checkIn && !record.checkOut);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">Vận hành chi nhánh hôm nay</h2>
          <p className="text-xs text-slate-500">Dữ liệu trực tiếp từ chấm công, kho và POS.</p>
        </div>
        <button
          onClick={() => void loadOperations()}
          disabled={loading}
          className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 disabled:opacity-50"
          aria-label="Tải lại dữ liệu vận hành"
        >
          <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Users className="h-5 w-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Nhân sự đang có mặt</h3>
              <p className="text-xs text-slate-500">{presentStaff.length} người đã vào ca và chưa ra ca</p>
            </div>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {presentStaff.map((record) => (
              <div key={record.id} className="flex items-center justify-between py-2.5">
                <div className="text-xs font-bold text-slate-800">{record.user?.fullName ?? record.userId}</div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  {record.checkIn ? new Date(record.checkIn).toLocaleTimeString('vi-VN') : '—'}
                </div>
              </div>
            ))}
            {!loading && presentStaff.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Chưa có nhân sự đang trong ca.</p>}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">Cảnh báo tồn kho</h3>
              <p className="text-xs text-slate-500">{stockAlerts.length} nguyên liệu dưới mức tối thiểu</p>
            </div>
          </div>
          <div className="mt-3 divide-y divide-slate-100">
            {stockAlerts.map((item) => (
              <div key={item.id} className="py-2.5">
                <div className="text-xs font-bold text-slate-800">{item.material.name}</div>
                <div className="text-[11px] font-semibold text-rose-600">
                  Còn {Number(item.currentStock).toLocaleString('vi-VN')} {item.unit}; tối thiểu {Number(item.minStock).toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
            {!loading && stockAlerts.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Không có cảnh báo tồn kho.</p>}
          </div>
          <p className="mt-3 rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">
            Yêu cầu cấp hàng sẽ được bật sau INV-03; hiện tại không tạo yêu cầu giả trên trình duyệt.
          </p>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Coffee className="h-5 w-5 text-emerald-800" />
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Đơn hàng gần nhất</h3>
            <p className="text-xs text-slate-500">Dữ liệu POS của đúng chi nhánh được phân công</p>
          </div>
        </div>
        <div className="mt-3 divide-y divide-slate-100">
          {recentOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-4 py-3">
              <div>
                <div className="font-mono text-xs font-extrabold text-slate-900">{order.orderNumber}</div>
                <div className="mt-0.5 text-xs text-slate-600">
                  {order.items.map((item) => `${item.qty}× ${item.product?.name ?? item.productId}`).join(', ')}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold text-slate-900">{order.totalAmount.toLocaleString('vi-VN')} đ</div>
                <div className="text-[10px] text-slate-400">{order.status} · {new Date(order.createdAt).toLocaleTimeString('vi-VN')}</div>
              </div>
            </div>
          ))}
          {!loading && recentOrders.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Chưa có đơn hàng hôm nay.</p>}
        </div>
      </section>
    </div>
  );
}
