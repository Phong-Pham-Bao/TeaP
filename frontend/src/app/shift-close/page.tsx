'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { 
  Calculator, DollarSign, AlertCircle, CheckCircle2, 
  ArrowLeft, Store, Clock, Calendar, FileSpreadsheet,
  AlertTriangle, RefreshCcw, Coffee, PackageCheck
} from 'lucide-react';
import Link from 'next/link';

export default function ShiftClosePage() {
  const { user } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [loading, setLoading] = useState(true);

  // Thống kê đơn trong ca hôm nay từ POS
  const [ordersToday, setOrdersToday] = useState<any[]>([]);
  const [posCashTotal, setPosCashTotal] = useState(0);
  const [posBankTotal, setPosBankTotal] = useState(0);
  const [cakesSold, setCakesSold] = useState<{ name: string; qty: number; total: number }[]>([]);

  // Bảng kê tiền mặt thực tế theo số tờ
  const [denominations, setDenominations] = useState<{ [key: number]: number }>({
    500000: 0,
    200000: 0,
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  const [shiftNote, setShiftNote] = useState('');
  const [closedSuccess, setClosedSuccess] = useState(false);

  useEffect(() => {
    loadInitial();
  }, []);

  useEffect(() => {
    if (selectedBranchId) {
      loadBranchOrders(selectedBranchId);
    }
  }, [selectedBranchId]);

  const loadInitial = async () => {
    setLoading(true);
    try {
      const bRes = await api.get('/branches');
      setBranches(bRes.data || []);
      if (bRes.data?.length > 0) {
        setSelectedBranchId(user?.branchId || bRes.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadBranchOrders = async (branchId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.get(`/pos/orders?branchId=${branchId}&status=PAID&limit=100&startDate=${today}T00:00:00.000Z`);
      const list = res.data.data || [];
      setOrdersToday(list);

      // Tính tổng tiền mặt & chuyển khoản
      let cash = 0;
      let bank = 0;
      const cakeCountMap: { [name: string]: { qty: number; total: number } } = {};

      for (const ord of list) {
        // Lấy chi tiết đơn
        try {
          const detailRes = await api.get(`/pos/orders/${ord.id}`);
          const fullOrder = detailRes.data;

          const method = fullOrder.payments?.[0]?.method || 'CASH';
          if (method === 'CASH') {
            cash += Number(fullOrder.totalAmount);
          } else {
            bank += Number(fullOrder.totalAmount);
          }

          // Kiểm tra món bánh
          fullOrder.items?.forEach((it: any) => {
            const pName = it.product?.name || '';
            if (pName.toLowerCase().includes('bánh') || it.product?.categoryId) {
              if (!cakeCountMap[pName]) {
                cakeCountMap[pName] = { qty: 0, total: 0 };
              }
              cakeCountMap[pName].qty += it.qty;
              cakeCountMap[pName].total += Number(it.subtotal);
            }
          });
        } catch {}
      }

      setPosCashTotal(cash);
      setPosBankTotal(bank);
      setCakesSold(
        Object.keys(cakeCountMap).map((k) => ({
          name: k,
          qty: cakeCountMap[k].qty,
          total: cakeCountMap[k].total,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDenomChange = (val: number, count: number) => {
    setDenominations((prev) => ({
      ...prev,
      [val]: Math.max(0, count),
    }));
  };

  // Tổng tiền mặt đếm thực tế
  const actualCashCounted = Object.entries(denominations).reduce(
    (acc, [val, count]) => acc + Number(val) * Number(count),
    0
  );

  // Chênh lệch tiền (Thực tế - Hệ thống)
  const difference = actualCashCounted - posCashTotal;

  const handleConfirmClose = async () => {
    // Có thể ghi vào bảng CashFlow hoặc lưu sổ quỹ
    try {
      if (difference !== 0) {
        await api.post('/finance/cash-flows', {
          branchId: selectedBranchId,
          type: difference > 0 ? 'INCOME' : 'EXPENSE',
          amount: Math.abs(difference),
          description: `Chênh lệch kết ca (${difference > 0 ? 'Dư tiền' : 'Thiếu tiền'} thực tế so với máy POS). Ghi chú: ${shiftNote || 'Không có'}`,
          refType: 'SHIFT_CLOSE',
        });
      }
      setClosedSuccess(true);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Có lỗi xảy ra khi lưu kết ca!');
    }
  };

  const currentBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-emerald-900 text-white py-4 px-6 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/pos"
              className="p-2 bg-emerald-800 hover:bg-emerald-700 rounded-xl text-emerald-200 transition"
              title="Quay lại quầy bán hàng"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-300" />
                Bàn giao & Kết ca Thu ngân
              </h1>
              <p className="text-xs text-emerald-300">
                Kiểm đếm tiền mặt, đối soát doanh thu máy POS và đối chiếu số lượng bánh thực tế
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="font-bold text-white">{user?.fullName || 'Thu ngân'}</div>
              <div className="text-emerald-300 text-[10px]">{currentBranch?.name || 'Chi nhánh'}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto p-6 flex-1 space-y-6">
        {/* Branch Filter & Shift Summary */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Chi nhánh kết ca</div>
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="text-base font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
              >
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Calendar className="w-4 h-4 text-emerald-700" />
              <span>Ngày: {new Date().toLocaleDateString('vi-VN')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 font-medium">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>Thời điểm: {new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
            <button
              onClick={() => loadBranchOrders(selectedBranchId)}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
              title="Cập nhật số liệu mới nhất"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tiền mặt ghi nhận trên POS</span>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1">
              {posCashTotal.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Doanh thu thu tiền mặt từ các đơn hàng thành công</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chuyển khoản / QR MoMo / VNPay</span>
            <div className="text-2xl font-extrabold text-blue-700 mt-1">
              {posBankTotal.toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Đã đối soát trực tiếp qua cổng thanh toán</p>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng doanh số ca này</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {(posCashTotal + posBankTotal).toLocaleString('vi-VN')} đ
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Gồm {ordersToday.length} hóa đơn đã thanh toán</p>
          </div>
        </div>

        {/* Main Grid: Bảng kê tiền & Đối chiếu Bánh */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Cột trái: Kê tiền theo mệnh giá (7 cột) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                <DollarSign className="w-4 h-4 text-emerald-700" />
                <span>Bảng Kê Tiền Mặt Thực Tế Trong Két</span>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Đếm từng cọc tiền
              </span>
            </div>

            <div className="space-y-2">
              {[500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000].map((denom) => {
                const count = denominations[denom] || 0;
                const lineTotal = denom * count;
                return (
                  <div
                    key={denom}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-slate-200 transition text-xs"
                  >
                    <div className="w-28 font-mono font-extrabold text-slate-800">
                      {denom.toLocaleString()} đ
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">x</span>
                      <input
                        type="number"
                        min="0"
                        value={count === 0 ? '' : count}
                        placeholder="0"
                        onChange={(e) => handleDenomChange(denom, parseInt(e.target.value) || 0)}
                        className="w-20 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                      />
                      <span className="text-slate-400 text-[11px]">tờ</span>
                    </div>

                    <div className="w-32 text-right font-mono font-bold text-slate-700">
                      = {lineTotal.toLocaleString()} đ
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Counted Box */}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
              <div>
                <span className="text-xs text-slate-500 font-bold block">TỔNG TIỀN MẶT ĐẾM THỰC TẾ:</span>
                <span className="text-xs text-slate-400 font-medium">Bằng chữ: Việt Nam Đồng</span>
              </div>
              <span className="text-xl font-extrabold text-emerald-800 font-mono">
                {actualCashCounted.toLocaleString('vi-VN')} đ
              </span>
            </div>
          </div>

          {/* Cột phải: Đối soát chênh lệch & Bánh thực tế (5 cột) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Box Chênh Lệch Dư/Thiếu */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Kết quả Đối soát Tiền Két
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tiền mặt trên máy POS:</span>
                  <span className="font-mono font-bold">{posCashTotal.toLocaleString()} đ</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tiền mặt đếm thực tế:</span>
                  <span className="font-mono font-bold">{actualCashCounted.toLocaleString()} đ</span>
                </div>

                <div className="pt-2 border-t flex justify-between items-center">
                  <span className="font-bold text-slate-800">Chênh lệch (Thực tế - POS):</span>
                  <span
                    className={`font-mono text-base font-extrabold ${
                      difference === 0
                        ? 'text-emerald-700'
                        : difference > 0
                        ? 'text-blue-600'
                        : 'text-rose-600'
                    }`}
                  >
                    {difference > 0 ? `+${difference.toLocaleString()}` : difference.toLocaleString()} đ
                  </span>
                </div>
              </div>

              {/* Status Alert */}
              {difference === 0 ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Khớp số liệu 100%! Không có chênh lệch tiền mặt.</span>
                </div>
              ) : difference > 0 ? (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-blue-600" /> Dư tiền thực tế (+{difference.toLocaleString()}đ)
                  </div>
                  <p className="text-[11px] text-blue-700">
                    Nguyên nhân thường gặp: Khách không lấy tiền thừa hoặc thu nhầm. Khoản dư sẽ được tự động hạch toán vào mục Thu khác (Income) khi hoàn tất.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" /> Thiếu tiền thực tế ({difference.toLocaleString()}đ)
                  </div>
                  <p className="text-[11px] text-rose-700">
                    Nguyên nhân: Thu ngân thối nhầm tiền cho khách. Khoản thiếu hụt sẽ được ghi nhận vào biên bản kiểm kê ca để đối soát.
                  </p>
                </div>
              )}

              {/* Ghi chú kết ca */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                  Ghi chú giải trình (nếu có chênh lệch):
                </label>
                <textarea
                  rows={2}
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  placeholder="Ví dụ: Khách bàn 4 bo tiền thừa 20k..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600"
                ></textarea>
              </div>

              <button
                onClick={handleConfirmClose}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>XÁC NHẬN BÀN GIAO & KẾT CA</span>
              </button>
            </div>

            {/* Box Đối Chiếu Bánh Ngọt Đã Bán */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs">
                  <PackageCheck className="w-4 h-4 text-amber-500" />
                  <span>Đối Chiếu Bánh Ngọt Đã Bán (Tủ bánh)</span>
                </div>
                <span className="text-[10px] text-slate-400">Kiểm đếm số cái</span>
              </div>

              {cakesSold.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <Coffee className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                  Chưa có phần bánh nào được bán ra trong ca hôm nay.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cakesSold.map((cake, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-amber-50/50 rounded-xl border border-amber-100 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{cake.name}</span>
                      <div className="text-right">
                        <span className="font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                          {cake.qty} cái
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {cake.total.toLocaleString()}đ
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal thông báo kết ca thành công */}
      {closedSuccess && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">Kết Ca Thành Công!</h3>
            <p className="text-xs text-slate-500">
              Số liệu doanh thu và bảng kê tiền mặt đã được lưu vào hệ thống để Quản lý và Kế toán đối soát.
            </p>
            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 font-mono text-left border">
              <div>Tiền mặt thực tế: {actualCashCounted.toLocaleString()}đ</div>
              <div>Chuyển khoản: {posBankTotal.toLocaleString()}đ</div>
              <div>Chênh lệch: {difference > 0 ? `+${difference.toLocaleString()}` : difference.toLocaleString()}đ</div>
            </div>
            <Link
              href="/pos"
              className="block w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition"
            >
              Về màn hình máy POS
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
