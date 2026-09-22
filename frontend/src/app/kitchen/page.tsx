'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { 
  Maximize, Minimize, CheckCircle2, CheckCircle, Clock, 
  ArrowLeft, RefreshCcw, ChefHat, Check, RotateCcw, 
  Sparkles, Coffee, Cake as CakeIcon, CheckCheck
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id?: string;
  qty: number;
  product: {
    id: string;
    name: string;
    sku?: string;
    type?: string;
    basePrice?: number | string;
  };
  size?: {
    id: string;
    name: string;
  } | null;
  attributes?: {
    ice?: number;
    sugar?: number;
    toppings?: string[];
  };
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  note?: string;
  branch?: { name: string };
  customer?: { fullName: string; phone: string };
  items: OrderItem[];
}

export default function KitchenBarPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [toppingsMap, setToppingsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');

  // Trạng thái tương tác từng món: key = `${orderId}-${itemIdx}` -> boolean (đã pha xong)
  const [completedItems, setCompletedItems] = useState<Record<string, boolean>>({});

  // Trạng thái hoàn thành cả hóa đơn: danh sách orderId
  const [completedOrderIds, setCompletedOrderIds] = useState<string[]>([]);

  // Live timer cập nhật số phút và đồng hồ
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // cập nhật mỗi 10s để tính số phút chính xác
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    loadKitchenOrders();
    loadToppingsLookup();
    const pollTimer = setInterval(() => {
      loadKitchenOrders();
    }, 5000); // 5s auto polling từ POS
    return () => clearInterval(pollTimer);
  }, []);

  // Tải danh mục Topping để tra cứu tên hiển thị thay vì hiện ID
  const loadToppingsLookup = async () => {
    try {
      const res = await api.get('/products/menu');
      const menuData = res.data;
      const lookup: Record<string, string> = {};

      const extractToppings = (list: any[]) => {
        list.forEach((p) => {
          if (p.id) lookup[p.id] = p.name;
        });
      };

      if (menuData?.toppings) {
        extractToppings(menuData.toppings);
      }
      if (menuData?.drinks) {
        extractToppings(menuData.drinks);
      }
      if (Array.isArray(menuData)) {
        menuData.forEach((cat: any) => {
          if (cat.products) extractToppings(cat.products);
        });
      }

      setToppingsMap(lookup);
    } catch (err) {
      console.error('Không thể tải danh sách topping lookup:', err);
    }
  };

  const loadKitchenOrders = async () => {
    try {
      // Lấy các đơn hàng đã thanh toán trong ngày hôm nay
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const res = await api.get(`/pos/orders?status=PAID&limit=40&startDate=${startOfDay.toISOString()}`);
      let list = res.data.data || [];

      // Fallback nếu đầu ca chưa có đơn hôm nay: lấy 15 đơn PAID gần nhất để test giao diện
      if (list.length === 0) {
        const fallbackRes = await api.get('/pos/orders?status=PAID&limit=15');
        list = fallbackRes.data.data || [];
      }

      // Sắp xếp đơn cũ nhất lên trước (FIFO - First In First Out để pha chế theo thứ tự)
      const sortedList = [...list].reverse();

      // Nạp chi tiết từng đơn hàng (items, attributes đá/đường/toppings)
      const fullList = await Promise.all(
        sortedList.slice(0, 20).map(async (ord: any) => {
          try {
            const detailRes = await api.get(`/pos/orders/${ord.id}`);
            return detailRes.data;
          } catch {
            return ord;
          }
        })
      );

      setOrders(fullList);
    } catch (err) {
      console.error('Lỗi tải đơn hàng bar bếp:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullScreen(false));
      }
    }
  };

  // 1. Tương tác chạm vào từng ly nước / món để tô màu xanh nhạt (đã làm xong món này)
  const toggleItemDone = (orderId: string, itemIdx: number) => {
    const key = `${orderId}-${itemIdx}`;
    setCompletedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 2. Tương tác bấm vào SỐ BILL để coi như bill đó hiện tại đã xong
  const markBillComplete = (orderId: string) => {
    setCompletedOrderIds((prev) => {
      if (!prev.includes(orderId)) {
        return [...prev, orderId];
      }
      return prev;
    });
  };

  // Phục hồi bill nếu bấm nhầm
  const undoBillComplete = (orderId: string) => {
    setCompletedOrderIds((prev) => prev.filter((id) => id !== orderId));
  };

  // Phân loại đơn đang chờ và đơn đã xong
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => !completedOrderIds.includes(o.id));
  }, [orders, completedOrderIds]);

  const finishedOrders = useMemo(() => {
    return orders.filter((o) => completedOrderIds.includes(o.id));
  }, [orders, completedOrderIds]);

  // Hàm đếm phân loại số lượng Nước, Topping, Bánh
  const getOrderCounts = (order: OrderDetail) => {
    let drinkCount = 0;
    let cakeCount = 0;
    let toppingCount = 0;

    (order.items || []).forEach((item) => {
      const type = item.product?.type || '';
      const name = item.product?.name?.toLowerCase() || '';
      const sku = item.product?.sku || '';

      const isCake = type === 'CAKE' || sku.startsWith('CAKE') || name.includes('bánh') || name.includes('tart') || name.includes('mousse');
      const isTopping = type === 'TOPPING';

      if (isCake) {
        cakeCount += item.qty;
      } else if (isTopping) {
        toppingCount += item.qty;
      } else {
        drinkCount += item.qty;
      }

      // Đếm các topping đính kèm trong ly nước
      if (item.attributes?.toppings && Array.isArray(item.attributes.toppings)) {
        toppingCount += item.attributes.toppings.length * item.qty;
      }
    });

    return { drinkCount, cakeCount, toppingCount };
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-slate-800 font-sans flex flex-col select-none">
      {/* Top Header - Sáng sủa, Tươi mới, Trực quan */}
      <header className="bg-white px-5 py-3 flex items-center justify-between border-b border-slate-200 shadow-xs z-10 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/pos"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
            title="Quay về máy POS"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Máy POS</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  ĐIỀU PHỐI BAR & BẾP (KDS)
                </h1>
                <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Chạm vào từng ly để đánh dấu xong &bull; Bấm vào số Bill để hoàn tất đơn
              </p>
            </div>
          </div>
        </div>

        {/* Tab chuyển đổi Đang chờ / Đã xong & Công cụ */}
        <div className="flex items-center gap-3">
          {/* Bộ lọc Tab */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'PENDING'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Đang chờ pha chế</span>
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {pendingOrders.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('COMPLETED')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'COMPLETED'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Đã hoàn thành</span>
              <span className="bg-slate-300 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {finishedOrders.length}
              </span>
            </button>
          </div>

          {/* Nút Làm mới */}
          <button
            onClick={() => loadKitchenOrders()}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition cursor-pointer"
            title="Tải lại đơn hàng"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Nút Toàn màn hình */}
          <button
            onClick={toggleFullScreen}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer"
          >
            {isFullScreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullScreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
          </button>
        </div>
      </header>

      {/* Main Board - Khu vực hiển thị Order Cards */}
      <main className="flex-1 p-5 overflow-y-auto">
        {/* Tab: Đang chờ pha chế */}
        {activeTab === 'PENDING' && (
          <>
            {pendingOrders.length === 0 ? (
              <div className="h-full min-h-[60vh] flex flex-col items-center justify-center text-slate-400 space-y-2">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-1">
                  <CheckCheck className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-700">
                  Quầy Bar đã hoàn tất tất cả đồ uống & bánh!
                </h3>
                <p className="text-xs text-slate-500">
                  Hệ thống đang tự động lắng nghe đơn hàng thanh toán mới từ máy POS...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pendingOrders.map((order, idx) => {
                  const billIndex = String(idx + 1).padStart(2, '0');
                  const minutesAgo = Math.max(
                    0,
                    Math.floor((currentTime.getTime() - new Date(order.createdAt).getTime()) / 60000)
                  );
                  const isUrgent = minutesAgo >= 10;
                  const isWarning = minutesAgo >= 5 && minutesAgo < 10;
                  const counts = getOrderCounts(order);

                  // Kiểm tra xem tất cả các món trong đơn này đã được barista tick xong chưa
                  const totalItemsInOrder = order.items?.length || 0;
                  const completedItemsInOrder = order.items?.filter((_, itIdx) => completedItems[`${order.id}-${itIdx}`]).length || 0;
                  const isAllItemsDone = totalItemsInOrder > 0 && completedItemsInOrder === totalItemsInOrder;

                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-2xl border-2 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md transition duration-150 ${
                        isUrgent 
                          ? 'border-rose-400 ring-2 ring-rose-200' 
                          : isWarning 
                            ? 'border-amber-300' 
                            : 'border-slate-200'
                      }`}
                    >
                      {/* 1. Header Đơn Hàng: [ Số Phút ] & [ Số Bill Hiện Tại ] */}
                      <div className={`p-3.5 border-b ${
                        isUrgent 
                          ? 'bg-rose-50/70 border-rose-100' 
                          : isWarning 
                            ? 'bg-amber-50/70 border-amber-100' 
                            : 'bg-slate-50/80 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between gap-2">
                          {/* [ Số Bill Hiện Tại Trong Ngày ] - BẤM VÀO ĐÂY ĐỂ XONG BILL */}
                          <button
                            type="button"
                            onClick={() => markBillComplete(order.id)}
                            className="flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white text-slate-800 rounded-lg font-black text-sm border border-slate-300 hover:border-emerald-600 transition shadow-xs cursor-pointer group"
                            title="Bấm vào số bill để hoàn thành ngay đơn này"
                          >
                            <span className="text-emerald-700 group-hover:text-white">Bill #{billIndex}</span>
                            <span className="text-[11px] font-mono text-slate-400 group-hover:text-emerald-100">
                              &bull; {order.orderNumber}
                            </span>
                            <Check className="w-3.5 h-3.5 text-slate-300 group-hover:text-white ml-0.5" />
                          </button>

                          {/* [ Số Phút ] */}
                          <div className={`flex items-center gap-1 font-mono text-xs font-extrabold px-2 py-1 rounded-md border ${
                            isUrgent
                              ? 'bg-rose-100 text-rose-800 border-rose-200 animate-pulse'
                              : isWarning
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : 'bg-white text-slate-700 border-slate-200'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>{minutesAgo} phút</span>
                          </div>
                        </div>

                        {/* [ Số Lượng Nước, Số Lượng Topping, Số Lượng Bánh ] */}
                        <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200/70 text-[11px] font-bold">
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            🥤 {counts.drinkCount} Nước
                          </span>
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            🧋 {counts.toppingCount} Topping
                          </span>
                          <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            🍰 {counts.cakeCount} Bánh
                          </span>
                        </div>
                      </div>

                      {/* 2. Danh Sách Món: Nước, Topping, Bánh - CHẠM VÀO ĐỂ TÔ XANH NHẠT KHI XONG */}
                      <div className="p-3 space-y-2 flex-1 overflow-y-auto max-h-80 bg-white">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1 flex justify-between items-center">
                          <span>Danh sách món cần làm ({completedItemsInOrder}/{totalItemsInOrder})</span>
                          <span className="text-emerald-700 font-medium lowercase">chạm để tick xong</span>
                        </div>

                        {order.items?.map((item, itIdx) => {
                          const itemKey = `${order.id}-${itIdx}`;
                          const isItemDone = !!completedItems[itemKey];
                          const attrs = item.attributes || {};
                          const isCake = item.product?.type === 'CAKE' || 
                                         item.product?.sku?.startsWith('CAKE') || 
                                         item.product?.name?.toLowerCase().includes('bánh');

                          return (
                            <div
                              key={itIdx}
                              onClick={() => toggleItemDone(order.id, itIdx)}
                              className={`p-2.5 rounded-xl border transition cursor-pointer select-none ${
                                isItemDone
                                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/70 text-slate-800'
                              }`}
                            >
                              {/* Tên món & Size */}
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {/* Icon trạng thái tròn */}
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                                    isItemDone 
                                      ? 'bg-emerald-600 text-white' 
                                      : 'border border-slate-300 bg-white text-transparent'
                                  }`}>
                                    <Check className="w-3 h-3" />
                                  </div>

                                  <span className={`text-xs font-bold leading-tight ${
                                    isItemDone ? 'line-through text-emerald-800' : 'text-slate-900'
                                  }`}>
                                    {item.qty}x {item.product?.name}
                                  </span>
                                </div>

                                {item.size && (
                                  <span className="text-[10px] bg-white border border-slate-200 text-slate-700 font-extrabold px-1.5 py-0.5 rounded-md flex-shrink-0">
                                    Size {item.size.name}
                                  </span>
                                )}
                              </div>

                              {/* Chi tiết pha chế: Đường & Đá (chỉ dành cho thức uống) */}
                              {!isCake && (
                                <div className="flex items-center gap-1.5 mt-1.5 pl-7 text-[11px] font-semibold">
                                  <span className="bg-amber-100/80 text-amber-900 px-1.5 py-0.2 rounded border border-amber-200">
                                    Đường: {attrs.sugar ?? 100}%
                                  </span>
                                  <span className="bg-blue-100/80 text-blue-900 px-1.5 py-0.2 rounded border border-blue-200">
                                    Đá: {attrs.ice ?? 100}%
                                  </span>
                                </div>
                              )}

                              {/* Chi tiết Topping kèm theo */}
                              {attrs.toppings && attrs.toppings.length > 0 && (
                                <div className="mt-1 pl-7 text-[11px] text-emerald-800 font-medium">
                                  <div className="font-semibold text-emerald-900 text-[10px] uppercase">
                                    Topping kèm:
                                  </div>
                                  <ul className="list-disc list-inside space-y-0.5 pl-0.5">
                                    {attrs.toppings.map((topId: string, tIdx: number) => (
                                      <li key={tIdx} className="text-emerald-700">
                                        {toppingsMap[topId] || 'Topping thêm'}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Ghi chú nếu là Bánh Ngọt */}
                              {isCake && (
                                <div className="mt-1 pl-7 text-[11px] text-amber-700 font-medium flex items-center gap-1">
                                  <CakeIcon className="w-3 h-3 text-amber-600" />
                                  <span>Lấy trực tiếp từ tủ bảo quản mát</span>
                                </div>
                              )}
                            </div>
                          );
                        })}

                        {order.note && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                            <span className="font-bold">Ghi chú:</span> {order.note}
                          </div>
                        )}
                      </div>

                      {/* 3. Nút Hoàn Tất Bill */}
                      <div className="p-3 bg-slate-50 border-t border-slate-200">
                        <button
                          type="button"
                          onClick={() => markBillComplete(order.id)}
                          className={`w-full py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                            isAllItemsDone
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-bounce'
                              : 'bg-white hover:bg-emerald-600 text-slate-800 hover:text-white border border-slate-300 hover:border-emerald-600'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>HOÀN THÀNH BILL #{billIndex}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Tab: Đã hoàn thành (Lịch sử các đơn đã làm xong) */}
        {activeTab === 'COMPLETED' && (
          <>
            {finishedOrders.length === 0 ? (
              <div className="h-full min-h-[50vh] flex flex-col items-center justify-center text-slate-400 space-y-2">
                <Coffee className="w-12 h-12 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Chưa có đơn nào được đánh dấu hoàn thành</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {finishedOrders.map((order, idx) => {
                  const counts = getOrderCounts(order);
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between opacity-85 hover:opacity-100 transition"
                    >
                      <div>
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="font-bold text-sm text-emerald-800 font-mono">
                            {order.orderNumber}
                          </span>
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3" /> ĐÃ XONG
                          </span>
                        </div>

                        <div className="py-2 text-xs text-slate-500 space-y-1">
                          <div>Thời gian order: {new Date(order.createdAt).toLocaleTimeString('vi-VN')}</div>
                          <div className="font-semibold text-slate-700">
                            {counts.drinkCount} Nước &bull; {counts.toppingCount} Topping &bull; {counts.cakeCount} Bánh
                          </div>
                        </div>

                        {/* Tóm tắt món */}
                        <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-100">
                          {order.items?.map((it, i) => (
                            <div key={i} className="truncate">
                              &bull; {it.qty}x {it.product?.name} {it.size ? `(${it.size.name})` : ''}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Phục hồi đơn */}
                      <button
                        type="button"
                        onClick={() => undoBillComplete(order.id)}
                        className="mt-3 w-full py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer font-medium"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Phục hồi về màn hình chờ</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
