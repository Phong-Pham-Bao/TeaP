'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/api';
import { isRoleAllowed, ROLE_DEFAULT_ROUTES, useAuth } from '@/lib/auth-context';
import { useUrlEnumState } from '@/lib/use-url-enum-state';
import { 
  History, Search, Printer, Ban, ArrowLeft, 
  Calendar, CheckCircle2, XCircle, Clock, RefreshCcw, 
  Eye, Store, AlertCircle, DollarSign, PlusCircle, Check, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const ADJUSTMENTS_ENABLED = false;
const ORDER_STATUSES = ['ALL', 'PAID', 'CANCELLED', 'PENDING'] as const;
type OrderStatusFilter = (typeof ORDER_STATUSES)[number];

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const returnHref = user && isRoleAllowed(user.role, '/pos')
    ? '/pos'
    : user
      ? ROLE_DEFAULT_ROUTES[user.role]
      : '/login';
  const returnLabel = returnHref === '/pos' ? 'Về quầy bán hàng' : 'Về trang làm việc';
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useUrlEnumState<OrderStatusFilter>(
    'status',
    'ALL',
    ORDER_STATUSES,
  );

  // Modal chi tiết & In bill
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [viewingDetail, setViewingDetail] = useState(false);

  // Modal Hủy/Hoàn đơn
  const [cancellingOrder, setCancellingOrder] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('Khách đổi ý');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Modal Bổ sung món thiếu (Dành riêng cho Quản lý cửa hàng)
  const [missingItemOrder, setMissingItemOrder] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string>('');
  const [missingQty, setMissingQty] = useState<number>(1);
  const [missingNote, setMissingNote] = useState<string>('Khách báo thiếu món lúc nhận tại quầy');
  const [addingLoading, setAddingLoading] = useState<boolean>(false);

  useEffect(() => {
    loadOrders();
    if (ADJUSTMENTS_ENABLED) loadProducts();
  }, [statusFilter]);

  const loadProducts = async () => {
    try {
      const res = await api.get('/products/menu');
      const all: any[] = [];
      if (Array.isArray(res.data)) {
        res.data.forEach((cat: any) => {
          if (cat.products) all.push(...cat.products);
        });
      }
      setProducts(all);
    } catch (err) {
      console.error(err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      let url = '/pos/orders?limit=50';
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      const res = await api.get(url);
      setOrders(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetail = async (orderId: string) => {
    try {
      const res = await api.get(`/pos/orders/${orderId}`);
      setSelectedOrder(res.data);
      setViewingDetail(true);
    } catch (err) {
      alert('Không thể tải chi tiết hóa đơn!');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancellingOrder) return;
    setCancelLoading(true);
    try {
      await api.post(`/pos/orders/${cancellingOrder.id}/cancel`, {
        reason: cancelReason,
      });
      alert('Hủy/Hoàn đơn thành công! Nguyên liệu đã được tự động hoàn lại vào kho.');
      setCancellingOrder(null);
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể hủy đơn hàng!');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleAddMissingItem = async () => {
    if (!missingItemOrder || !selectedProduct) {
      alert('Vui lòng chọn món cần bổ sung bù cho khách!');
      return;
    }
    setAddingLoading(true);
    try {
      await api.post(`/pos/orders/${missingItemOrder.id}/add-missing-item`, {
        item: {
          productId: selectedProduct.id,
          sizeId: selectedSizeId || undefined,
          qty: missingQty || 1,
        },
        note: missingNote,
      });
      alert('Bổ sung món thiếu vào đơn thành công! Thông tin đã được cập nhật.');
      setMissingItemOrder(null);
      setSelectedProduct(null);
      setSelectedSizeId('');
      setMissingQty(1);
      loadOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể bổ sung món thiếu!');
    } finally {
      setAddingLoading(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.phone?.includes(searchQuery) ||
      o.customer?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-emerald-900 text-white py-4 px-6 shadow-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={returnHref}
              className="p-2 bg-emerald-800 hover:bg-emerald-700 rounded-xl text-emerald-200 transition"
              title={returnLabel}
              aria-label={returnLabel}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-300" />
                Lịch sử hóa đơn bán hàng
              </h1>
              <p className="text-xs text-emerald-300">
                Tra cứu và xem chi tiết dữ liệu đơn hàng đã lưu trên hệ thống
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadOrders}
            className="p-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl transition flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto p-6 flex-1 space-y-6">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
          Hoàn tiền, hủy đơn đã thanh toán và bù món đang bị khóa cho tới khi POS-04 có reversal,
          giới hạn hoàn, phê duyệt và audit đầy đủ. Trang này hiện chỉ cho phép tra cứu dữ liệu thật.
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã đơn (ORD-…), SĐT khách…"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
            {ORDER_STATUSES.map((st) => (
              <button
                type="button"
                key={st}
                onClick={() => setStatusFilter(st)}
                aria-pressed={statusFilter === st}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  statusFilter === st
                    ? 'bg-emerald-800 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL'
                  ? 'Tất cả'
                  : st === 'PAID'
                  ? 'Đã thanh toán'
                  : st === 'CANCELLED'
                  ? 'Đã hủy/hoàn'
                  : 'Chờ thanh toán'}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã hóa đơn</th>
                <th className="py-3.5 px-4">Thời gian</th>
                <th className="py-3.5 px-4">Khách hàng</th>
                <th className="py-3.5 px-4">Thu ngân</th>
                <th className="py-3.5 px-4 text-right">Tổng tiền</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Không tìm thấy hóa đơn nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ord.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {ord.customer ? (
                        <div>
                          <div className="font-semibold">{ord.customer.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{ord.customer.phone}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Khách vãng lai</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">
                      {ord.cashier?.fullName || 'Thu ngân'}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-slate-900 text-sm">
                      {Number(ord.totalAmount).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ord.status === 'PAID' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Đã thanh toán
                        </span>
                      ) : ord.status === 'CANCELLED' ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Đã hủy đơn
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Đang chờ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenDetail(ord.id)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          title="Xem chi tiết & In hóa đơn"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {ADJUSTMENTS_ENABLED && ord.status === 'PAID' && (
                          <>
                            <button
                              onClick={() => {
                                setMissingItemOrder(ord);
                                setSelectedProduct(products[0] || null);
                                setSelectedSizeId(products[0]?.sizes?.[0]?.id || '');
                                setMissingQty(1);
                                setMissingNote('Khách báo thiếu món lúc nhận tại quầy');
                              }}
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                              title="Bổ sung món thiếu (Quản lý cửa hàng)"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setCancellingOrder(ord);
                                setCancelReason('Khách đổi ý');
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition"
                              title="Hủy / Hoàn đơn này"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Modal: Xem chi tiết đơn hàng & In Bill */}
      {viewingDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex justify-between items-start border-b pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-mono">HÓA ĐƠN BÁN HÀNG</span>
                <h3 className="text-base font-bold text-slate-800">{selectedOrder.orderNumber}</h3>
              </div>
              <button
                onClick={() => setViewingDetail(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Bill Receipt Preview */}
            <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 font-mono text-xs space-y-2">
              <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
                TEA-P BUBBLE TEA
                <div className="text-[10px] font-normal text-slate-500">
                  {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="space-y-1.5 py-1">
                {selectedOrder.items?.map((it: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <div>
                      <div>{it.qty}x {it.product?.name} ({it.size?.name || 'M'})</div>
                      {it.attributes?.ice !== undefined && (
                        <div className="text-[10px] text-slate-400">
                          Đá {it.attributes.ice}% &bull; Đường {it.attributes.sugar}%
                        </div>
                      )}
                    </div>
                    <span className="font-bold">{Number(it.subtotal).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Tạm tính:</span>
                  <span>{Number(selectedOrder.subtotal).toLocaleString()}đ</span>
                </div>
                {Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>Giảm giá:</span>
                    <span>-{Number(selectedOrder.discount).toLocaleString()}đ</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-slate-900 pt-1">
                  <span>TỔNG TIỀN:</span>
                  <span>{Number(selectedOrder.totalAmount).toLocaleString()}đ</span>
                </div>
              </div>

              {selectedOrder.note && (
                <div className="pt-2 text-[10px] text-slate-500 italic">
                  Ghi chú: {selectedOrder.note}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>IN LẠI HÓA ĐƠN</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xác nhận Hủy/Hoàn Đơn & Lý Do */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Ban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Xác nhận Hủy & Hoàn Đơn Hàng?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Đơn hàng <span className="font-mono font-bold text-slate-800">{cancellingOrder.orderNumber}</span> ({Number(cancellingOrder.totalAmount).toLocaleString()}đ)
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs space-y-1">
              <span className="font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Hệ thống sẽ tự động:
              </span>
              <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-amber-700">
                <li>Hoàn trả lại toàn bộ nguyên vật liệu (trà, sữa, syrup...) về kho chi nhánh.</li>
                <li>Trừ lại điểm tích lũy của khách hàng (nếu có).</li>
                <li>Ghi nhận nhật ký sổ kho hoàn trả (Stock Ledger).</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Lý do hủy đơn:
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 font-medium"
              >
                <option value="Khách đổi ý không lấy">Khách đổi ý không lấy</option>
                <option value="Thu ngân bấm nhầm món / nhầm size">Thu ngân bấm nhầm món / nhầm size</option>
                <option value="Khách không đủ tiền mặt / lỗi thanh toán">Khách không đủ tiền mặt / lỗi thanh toán</option>
                <option value="Đồ uống bị lỗi pha chế">Đồ uống bị lỗi pha chế</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCancellingOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Đóng
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
              >
                {cancelLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Xác nhận Hủy Đơn</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quản Lý Cửa Hàng Bổ Sung Món Thiếu Vào Hóa Đơn */}
      {missingItemOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Bổ Sung Món Thiếu Cho Đơn Hàng</h3>
                  <p className="text-[11px] text-slate-500">
                    Mã đơn: <span className="font-mono font-bold text-slate-800">{missingItemOrder.orderNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMissingItemOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Quyền hạn Quản Lý Cửa Hàng:</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Dùng khi thu ngân thanh toán sót món hoặc khách nhận thiếu ly nước. Món bù sẽ được ghi nhận vào hóa đơn, xuất lệnh cho bar bếp và tự động điều chỉnh sổ kho chi nhánh.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Chọn sản phẩm / đồ uống cần bù:
                </label>
                <select
                  value={selectedProduct?.id || ''}
                  onChange={(e) => {
                    const p = products.find((it) => it.id === e.target.value);
                    setSelectedProduct(p || null);
                    setSelectedSizeId(p?.sizes?.[0]?.id || '');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({Number(p.basePrice).toLocaleString()}đ)
                    </option>
                  ))}
                </select>
              </div>

              {selectedProduct?.sizes && selectedProduct.sizes.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Chọn size:
                  </label>
                  <div className="flex gap-2">
                    {selectedProduct.sizes.map((sz: any) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setSelectedSizeId(sz.id)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${
                          selectedSizeId === sz.id
                            ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        Size {sz.name} {Number(sz.priceAdj) > 0 ? `(+${Number(sz.priceAdj).toLocaleString()}đ)` : ''}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số lượng bù:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={missingQty}
                    onChange={(e) => setMissingQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Lý do bù món:
                  </label>
                  <select
                    value={missingNote}
                    onChange={(e) => setMissingNote(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Khách báo thiếu món lúc nhận tại quầy">Khách nhận thiếu tại quầy</option>
                    <option value="Thu ngân bấm thiếu món trên bill">Thu ngân bấm thiếu món</option>
                    <option value="Đổi món do lỗi pha chế / đổ vỡ">Lỗi pha chế / Đổ vỡ</option>
                    <option value="Quản lý duyệt bù món đặc biệt">Quản lý duyệt bù món</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setMissingItemOrder(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleAddMissingItem}
                disabled={addingLoading}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/20"
              >
                {addingLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Lưu Bổ Sung & In Bù</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
