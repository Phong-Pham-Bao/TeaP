'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { 
  Coffee, Phone, Search, Award, ShoppingBag, 
  BookOpen, Sparkles, CheckCircle2, AlertCircle,
  TrendingUp, Store, Clock, Gift, QrCode, Tag,
  ChevronRight, Receipt, X, UserPlus, Check, Star,
  ExternalLink, Percent
} from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  qty: number;
  subtotal: number | string;
  product?: { name: string; type: string };
  size?: { name: string };
  attributes?: any;
}

interface OrderRecord {
  id: string;
  orderNumber: string;
  totalAmount: number | string;
  createdAt: string;
  branch?: { name: string };
  items: OrderItem[];
}

interface PointTx {
  id: string;
  points: number;
  reason: string;
  createdAt: string;
}

interface CustomerData {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  totalPoints: number;
  orders: OrderRecord[];
  pointTransactions: PointTx[];
}

export default function CustomerPortalPage() {
  const [phone, setPhone] = useState('');
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'CARD' | 'REWARDS' | 'HISTORY'>('CARD');

  // Form Đăng ký hội viên mới
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [registering, setRegistering] = useState(false);

  // Đổi điểm nhận Voucher
  const [redeemingReward, setRedeemingReward] = useState<any>(null);
  const [redeemedVoucher, setRedeemedVoucher] = useState<{ code: string; title: string } | null>(null);
  const [redeemLoading, setRedeemLoading] = useState(false);

  // Xem chi tiết hóa đơn điện tử
  const [viewingReceipt, setViewingReceipt] = useState<OrderRecord | null>(null);

  const handleLookupPhone = async (phoneToLookup: string) => {
    if (!phoneToLookup || phoneToLookup.trim().length < 9) {
      setError('Vui lòng nhập số điện thoại hợp lệ (ít nhất 9 số)');
      return;
    }

    setLoading(true);
    setError('');
    setShowRegisterForm(false);

    try {
      const res = await api.post('/customers/lookup', { phone: phoneToLookup.trim() });
      setCustomer(res.data);
    } catch (err: any) {
      setCustomer(null);
      setError(err.response?.data?.message || 'Chưa tìm thấy thông tin hội viên với số điện thoại này.');
      setShowRegisterForm(true);
      setRegPhone(phoneToLookup.trim());
    } finally {
      setLoading(false);
    }
  };

  // Đăng ký hội viên mới tại chỗ
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regPhone.trim()) {
      alert('Vui lòng nhập Họ tên và Số điện thoại!');
      return;
    }

    setRegistering(true);
    try {
      const res = await api.post('/customers/register', {
        fullName: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim() || undefined,
      });

      alert('Đăng ký thành công! Bạn được tặng ngay 10 điểm thưởng chào mừng hội viên mới.');
      setCustomer(res.data);
      setShowRegisterForm(false);
      setPhone(regPhone.trim());
      setError('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Đăng ký thất bại, vui lòng kiểm tra lại!');
    } finally {
      setRegistering(false);
    }
  };

  // Đổi điểm lấy voucher
  const handleRedeemPoints = async (reward: { points: number; title: string }) => {
    if (!customer) return;
    if (customer.totalPoints < reward.points) {
      alert(`Bạn cần ít nhất ${reward.points} điểm để đổi ưu đãi này (hiện có ${customer.totalPoints} điểm).`);
      return;
    }

    setRedeemLoading(true);
    try {
      const res = await api.post('/customers/redeem', {
        customerId: customer.id,
        points: reward.points,
        rewardTitle: reward.title,
      });

      setCustomer(res.data.customer);
      setRedeemedVoucher({
        code: res.data.voucherCode,
        title: reward.title,
      });
      setRedeemingReward(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Đổi ưu đãi thất bại!');
    } finally {
      setRedeemLoading(false);
    }
  };

  const rewardCatalog = [
    { id: 'R1', points: 10, title: 'Voucher Giảm 10.000đ', desc: 'Áp dụng cho mọi hóa đơn tại quầy', icon: Tag, color: 'emerald' },
    { id: 'R2', points: 15, title: 'Miễn Phí 1 Phần Topping', desc: 'Chọn 1 topping bất kỳ trong danh mục', icon: Gift, color: 'blue' },
    { id: 'R3', points: 20, title: 'Voucher Giảm 20.000đ', desc: 'Áp dụng cho hóa đơn từ 50.000đ', icon: Percent, color: 'amber' },
    { id: 'R4', points: 50, title: 'Tặng 1 Ly Trà Sữa Size M', desc: 'Trà Sữa Oolong hoặc Hồng Trà Sữa', icon: Star, color: 'rose' },
  ];

  // Tính tổng chi tiêu
  const totalSpent = (customer?.orders || []).reduce(
    (sum, o) => sum + Number(o.totalAmount || 0),
    0
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0F2E22] text-white py-3.5 px-4 sm:px-6 shadow-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 flex-shrink-0 bg-emerald-800 rounded-xl text-emerald-300 flex items-center justify-center font-bold">
              <Coffee className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-extrabold tracking-tight">TEAP</h1>
              <p className="hidden text-[11px] text-emerald-300 sm:block">Cổng hội viên &amp; điểm thưởng</p>
            </div>
          </div>

          <Link
            href="/customer/menu"
            className="text-xs font-semibold text-emerald-100 hover:text-white bg-emerald-900/60 hover:bg-emerald-800 px-3.5 py-2 rounded-lg transition flex items-center gap-1.5 border border-emerald-700/60 cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Xem Menu TeaP</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl w-full mx-auto px-4 py-6 flex-1 space-y-6">
        {/* Search Phone Hero Banner */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="max-w-xl">
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1.5 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Tích lũy tự động: 10.000đ = 1 Điểm
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Tra cứu Điểm & Ưu Đãi Hội Viên
              </h2>
              <p className="text-slate-500 text-xs mt-1">
                Nhập số điện thoại của bạn đã dùng khi mua nước tại quầy để kiểm tra thẻ hội viên và đổi quà.
              </p>
            </div>

            {/* Input tra cứu */}
            <div className="w-full md:w-96">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLookupPhone(phone);
                }}
                className="flex gap-2"
              >
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-emerald-700"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#0F2E22] hover:bg-[#1B4332] active:bg-[#081C14] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Tra cứu</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Cảnh báo lỗi & Form Đăng ký nhanh nếu chưa có tài khoản */}
        {error && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{error}</span>
            </div>

            {showRegisterForm && (
              <div className="pt-2 border-t border-amber-200/80">
                <div className="font-bold text-amber-950 mb-2 flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-emerald-700" />
                  <span>Đăng ký hội viên mới ngay (Nhận ngay 10 điểm thưởng miễn phí!):</span>
                </div>
                <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Họ và tên của bạn *"
                    required
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:border-emerald-700"
                  />
                  <input
                    type="text"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="Số điện thoại *"
                    required
                    className="px-3 py-1.5 bg-white border border-amber-300 rounded-lg text-xs focus:outline-none focus:border-emerald-700"
                  />
                  <button
                    type="submit"
                    disabled={registering}
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    {registering ? 'Đang tạo...' : 'Đăng ký nhận 10 điểm'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Khung Thông Tin Hội Viên Khi Tìm Thấy */}
        {customer && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 1. THẺ THÀNH VIÊN ĐIỆN TỬ (DIGITAL MEMBERSHIP CARD) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Card Thẻ Hội Viên */}
              <div className="md:col-span-2 bg-gradient-to-br from-[#0F2E22] via-[#1B4332] to-[#2D6A4F] text-white rounded-3xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between min-h-[200px]">
                {/* Background watermark */}
                <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
                  <Coffee className="w-48 h-48" />
                </div>

                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center font-black text-xl text-emerald-300 shadow-sm">
                      {customer.fullName?.charAt(0) || 'K'}
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-300">
                        THẺ HỘI VIÊN TEAP
                      </div>
                      <h3 className="text-lg font-black tracking-tight">{customer.fullName}</h3>
                    </div>
                  </div>

                  <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
                    Hội Viên Thân Thiết
                  </span>
                </div>

                {/* SĐT & Mã thẻ */}
                <div className="mt-4 pt-4 border-t border-white/10 flex items-end justify-between relative z-10">
                  <div>
                    <div className="text-[10px] text-emerald-300/80 font-mono">MÃ THẺ THÀNH VIÊN</div>
                    <div className="font-mono font-bold text-sm tracking-widest">
                      TP-{customer.phone}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/15">
                    <QrCode className="w-4 h-4 text-emerald-300" />
                    <span className="text-[11px] font-mono tracking-wider font-semibold">QUÉT TẠI QUẦY</span>
                  </div>
                </div>
              </div>

              {/* Khối Điểm Tích Lũy & Thống Kê Nhanh */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Điểm khả dụng</span>
                  </div>
                  <div className="text-3xl font-black text-[#0F2E22]">
                    {customer.totalPoints}{' '}
                    <span className="text-sm font-bold text-slate-500">điểm</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Tương đương ưu đãi trị giá ~{((customer.totalPoints || 0) * 1000).toLocaleString('vi-VN')} đ
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Tổng đơn hàng:</span>
                    <span className="font-bold text-slate-900">{customer.orders?.length || 0} đơn</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng chi tiêu:</span>
                    <span className="font-bold text-emerald-800">{totalSpent.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. TAB ĐIỀU HƯỚNG CHỨC NĂNG */}
            <div className="flex gap-5 overflow-x-auto border-b border-slate-200 text-xs font-bold">
              <button
                onClick={() => setActiveTab('CARD')}
                className={`flex flex-shrink-0 items-center gap-1.5 pb-3 transition cursor-pointer ${
                  activeTab === 'CARD'
                    ? 'border-b-2 border-[#0F2E22] text-[#0F2E22]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <Gift className="w-4 h-4 text-amber-500" />
                <span>Đổi Ưu Đãi / Voucher ({rewardCatalog.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('HISTORY')}
                className={`flex flex-shrink-0 items-center gap-1.5 pb-3 transition cursor-pointer ${
                  activeTab === 'HISTORY'
                    ? 'border-b-2 border-[#0F2E22] text-[#0F2E22]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-emerald-700" />
                <span>Lịch Sử Mua Hàng ({customer.orders?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('REWARDS')}
                className={`flex flex-shrink-0 items-center gap-1.5 pb-3 transition cursor-pointer ${
                  activeTab === 'REWARDS'
                    ? 'border-b-2 border-[#0F2E22] text-[#0F2E22]'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>Biến Động Điểm Thưởng ({customer.pointTransactions?.length || 0})</span>
              </button>
            </div>

            {/* TAB 1: DANH MỤC ĐỔI QUÀ / VOUCHER */}
            {activeTab === 'CARD' && (
              <div className="space-y-4">
                {/* Thông báo voucher vừa đổi thành công nếu có */}
                {redeemedVoucher && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <Check className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-emerald-950">
                          Chúc mừng bạn đã đổi thành công: {redeemedVoucher.title}!
                        </div>
                        <div className="text-xs text-emerald-800 mt-0.5">
                          Mã voucher sử dụng tại quầy:{' '}
                          <span className="font-mono font-black text-sm bg-white px-2 py-0.5 rounded border border-emerald-300">
                            {redeemedVoucher.code}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setRedeemedVoucher(null)}
                      className="p-1 text-emerald-600 hover:text-emerald-900 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {rewardCatalog.map((reward) => {
                    const canRedeem = customer.totalPoints >= reward.points;
                    const IconComp = reward.icon;

                    return (
                      <div
                        key={reward.id}
                        className={`bg-white rounded-2xl p-4 border transition flex flex-col justify-between shadow-xs ${
                          canRedeem ? 'border-slate-200 hover:border-emerald-600' : 'border-slate-200 opacity-60'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-black text-[#0F2E22] bg-slate-100 px-2.5 py-0.5 rounded-full font-mono">
                              {reward.points} điểm
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 leading-snug">
                            {reward.title}
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {reward.desc}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleRedeemPoints(reward)}
                            disabled={!canRedeem || redeemLoading}
                            className={`w-full py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                              canRedeem
                                ? 'bg-[#0F2E22] hover:bg-[#1B4332] text-white'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>{canRedeem ? 'Đổi quà ngay' : `Thiếu ${reward.points - customer.totalPoints}đ`}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: LỊCH SỬ MUA HÀNG (CHI TIẾT ĐƠN & XEM HÓA ĐƠN ĐIỆN TỬ) */}
            {activeTab === 'HISTORY' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {!customer.orders || customer.orders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Chưa có đơn hàng nào</p>
                    <p className="text-[11px] text-slate-400">Khi bạn mua hàng tại máy POS, hóa đơn sẽ tự động lưu trữ tại đây</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customer.orders.map((order) => (
                      <div
                        key={order.id}
                        className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              {order.orderNumber}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded-full">
                              Đã thanh toán
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2">
                            <span className="flex items-center gap-1">
                              <Store className="w-3 h-3 text-slate-400" /> {order.branch?.name || 'Chi nhánh TeaP'}
                            </span>
                            <span>&bull;</span>
                            <span className="flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3 text-slate-400" /> {new Date(order.createdAt).toLocaleString('vi-VN')}
                            </span>
                          </div>
                          {/* Danh sách món tóm tắt */}
                          <div className="text-xs text-slate-600 pt-1">
                            {order.items?.map((it, idx) => (
                              <span key={idx} className="mr-3">
                                {it.qty}x {it.product?.name} {it.size ? `(${it.size.name})` : ''}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 sm:text-right">
                          <div>
                            <div className="text-[10px] text-slate-400">Tổng thanh toán</div>
                            <div className="text-sm font-extrabold text-emerald-800">
                              {Number(order.totalAmount).toLocaleString('vi-VN')} đ
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setViewingReceipt(order)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-500" />
                            <span>Xem bill</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: BIẾN ĐỘNG ĐIỂM THƯỞNG */}
            {activeTab === 'REWARDS' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {!customer.pointTransactions || customer.pointTransactions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">Chưa có giao dịch tích điểm</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {customer.pointTransactions.map((tx) => (
                      <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-slate-900">{tx.reason}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {new Date(tx.createdAt).toLocaleString('vi-VN')}
                          </div>
                        </div>
                        <div
                          className={`font-black text-sm font-mono ${
                            tx.points > 0 ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {tx.points > 0 ? `+${tx.points}` : tx.points} điểm
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modal: Hóa Đơn Điện Tử Chi Tiết (E-Receipt Modal) */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-2">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-800" />
                <h3 className="font-bold text-sm text-slate-900">Hóa Đơn Điện Tử</h3>
              </div>
              <button
                onClick={() => setViewingReceipt(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border border-dashed border-slate-300 rounded-xl p-3.5 bg-slate-50 font-mono text-xs space-y-2">
              <div className="text-center font-bold pb-2 border-b border-dashed border-slate-300">
                TEA-P &bull; {viewingReceipt.branch?.name || 'Chi nhánh'}
                <div className="text-[10px] font-normal text-slate-500">Mã đơn: {viewingReceipt.orderNumber}</div>
                <div className="text-[10px] font-normal text-slate-400">
                  {new Date(viewingReceipt.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="space-y-1 py-1 max-h-48 overflow-y-auto">
                {viewingReceipt.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span className="truncate pr-2">
                      {item.qty}x {item.product?.name} {item.size ? `(${item.size.name})` : ''}
                    </span>
                    <span className="font-medium">{Number(item.subtotal).toLocaleString()}đ</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-xs text-slate-900 pt-1 border-t border-slate-200">
                  <span>TỔNG CỘNG:</span>
                  <span>{Number(viewingReceipt.totalAmount).toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setViewingReceipt(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Đóng hóa đơn
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-[11px] text-slate-400">
        TeaP Bubble Tea &bull; Hệ sinh thái trà sữa thân thiết & tiện lợi
      </footer>
    </div>
  );
}
