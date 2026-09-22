'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ShoppingCart, ChefHat, Store, Warehouse, 
  Users, Calculator, Coffee, History, ShieldCheck, 
  ExternalLink, ArrowRight, Video, Calendar 
} from 'lucide-react';

export default function AdminRoleHub() {
  const roleCards = [
    {
      role: 'THU NGÂN POS',
      title: 'Quầy Bán Hàng & Máy Tính Tiền',
      desc: 'Lập hóa đơn siêu tốc, tùy biến topping/đường/đá, thanh toán tiền mặt/Momo/VNPay.',
      href: '/pos',
      icon: ShoppingCart,
      color: 'bg-emerald-600',
      badge: 'Bán hàng',
      features: ['In hóa đơn nhiệt', 'Tích điểm tự động', 'Áp mã khuyến mãi'],
    },
    {
      role: 'BẾP & PHA CHẾ',
      title: 'Màn Hình Bếp (Kitchen Display)',
      desc: 'Nhận lệnh order tức thì từ quầy thu ngân, hiển thị công thức và báo hoàn tất.',
      href: '/kitchen',
      icon: ChefHat,
      color: 'bg-amber-600',
      badge: 'Pha chế',
      features: ['Real-time đơn hàng', 'Phân loại theo size/đá', 'Chuyển trạng thái'],
    },
    {
      role: 'QUẢN LÝ CHI NHÁNH',
      title: 'Cổng Quản Lý Cửa Hàng (Store Manager)',
      desc: 'Giám sát 5 góc Camera trực tiếp, xếp lịch ma trận Excel 31 ngày (Hình 1), checklist mở ca.',
      href: '/manager',
      icon: Store,
      color: 'bg-teal-700',
      badge: 'Cửa hàng',
      features: ['Camera an ninh 5 Cam', 'Lịch làm việc Excel', 'Checklist vệ sinh HACCP'],
    },
    {
      role: 'THỦ KHO TỔNG',
      title: 'Kho Tổng Trung Tâm & Điều Phối',
      desc: 'Nhập hàng từ NCC, duyệt xuất hàng cho 5 quán, kiểm soát hạn dùng FEFO cận date.',
      href: '/warehouse',
      icon: Warehouse,
      color: 'bg-orange-600',
      badge: 'Kho vận',
      features: ['Phiếu nhập NCC có Lô', 'Cung ứng 5 chi nhánh', 'Kiểm kê & Hao hụt'],
    },
    {
      role: 'NHÂN SỰ & CHẤM CÔNG',
      title: 'Cổng Nhân Viên & Tiền Lương (Staff/HR)',
      desc: 'Xem lịch phân ca tuần, tự chấm công check-in/out và tra cứu phiếu lương tháng.',
      href: '/staff',
      icon: Users,
      color: 'bg-indigo-600',
      badge: 'Nhân sự',
      features: ['Chấm công GPS/Wifi', 'Bảng lương chi tiết', 'Hồ sơ bậc tay nghề'],
    },
    {
      role: 'ĐÓNG CA & KIỂM QUỸ',
      title: 'Kết Ca Thu Ngân & Bàn Giao Két',
      desc: 'Đối soát số dư tiền mặt thực tế vs phần mềm POS, ghi nhận tiền boa và chi tiêu nhỏ.',
      href: '/shift-close',
      icon: Calculator,
      color: 'bg-rose-600',
      badge: 'Kiểm quỹ',
      features: ['Kiểm đếm tiền theo mệnh giá', 'Chênh lệch thừa/thiếu', 'In biên bản bàn giao'],
    },
    {
      role: 'KHÁCH HÀNG THÀNH VIÊN',
      title: 'Kiosk Khách Hàng & Tra Cứu Điểm',
      desc: 'Giao diện khách tự gọi món tại sảnh hoặc tra cứu tích điểm theo số điện thoại.',
      href: '/customer',
      icon: Coffee,
      color: 'bg-cyan-600',
      badge: 'Kiosk',
      features: ['Tra cứu điểm thưởng', 'Lịch sử uống trà sữa', 'Tự gọi món'],
    },
    {
      role: 'TRA CỨU HÓA ĐƠN',
      title: 'Nhật Ký Đơn Hàng & Bù Món Thiếu',
      desc: 'Tìm kiếm lại các hóa đơn cũ, in lại bill cho khách và bù món nếu phát sinh sai sót.',
      href: '/order-history',
      icon: History,
      color: 'bg-slate-700',
      badge: 'Hóa đơn',
      features: ['Tìm kiếm theo mã/SĐT', 'In lại hóa đơn', 'Hỗ trợ bù món'],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Banner: Super Admin Authority */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 p-6 rounded-3xl text-white shadow-lg border border-emerald-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/30">
              ĐẶC QUYỀN TOÀN NĂNG — SUPER ADMIN
            </span>
          </div>
          <h2 className="text-xl font-black mt-2">Trung Tâm Điều Hành & Toàn Quyền Mọi Vai Trò</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Là Quản trị viên cấp cao nhất, bạn có quyền <strong>truy cập, kiểm soát và thao tác trực tiếp</strong> trên giao diện của tất cả các nhân sự (Thu ngân POS, Bếp, Quản lý quán, Thủ kho, HR, Khách hàng).
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xs text-emerald-300 font-bold">Quyền hạn hệ thống:</div>
          <div className="text-sm font-extrabold text-white">ROOT / ALL-PERMISSIONS (100%)</div>
        </div>
      </div>

      {/* Grid of All Role Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {roleCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.href}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md hover:border-emerald-500/50 transition duration-200 group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-xl text-white ${card.color} shadow-xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase">
                    {card.badge}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">{card.role}</div>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-0.5">{card.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{card.desc}</p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
                  {card.features.map((f, i) => (
                    <div key={i} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-2">
                <Link
                  href={card.href}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition group-hover:shadow-sm"
                >
                  <span>Mở giao diện này</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
