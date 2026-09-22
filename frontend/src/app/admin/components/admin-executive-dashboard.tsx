'use client';

import React from 'react';
import { 
  TrendingUp, Store, DollarSign, Users, 
  Award, ArrowUpRight, Coffee, ShieldCheck 
} from 'lucide-react';

export default function AdminExecutiveDashboard() {
  const branchMetrics = [
    { name: 'TeaP Quận 1 (Nguyễn Huệ)', revenue: 8450000, orders: 154, target: '105%', status: 'VƯỢT CHỈ TIÊU' },
    { name: 'TeaP Thủ Đức (Võ Văn Ngân)', revenue: 7340000, orders: 138, target: '98%', status: 'ĐẠT' },
    { name: 'TeaP Quận 3 (Võ Văn Tần)', revenue: 6210000, orders: 112, target: '94%', status: 'ĐẠT' },
    { name: 'TeaP Quận 7 (Nguyễn Thị Thập)', revenue: 5120000, orders: 95, target: '88%', status: 'CẦN THÚC ĐẨY' },
    { name: 'TeaP Bình Thạnh (Xô Viết NT)', revenue: 4890000, orders: 83, target: '91%', status: 'ĐẠT' },
  ];

  return (
    <div className="space-y-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh Thu Toàn Chuỗi</span>
            <div className="text-2xl font-black text-emerald-800 mt-1">32.010.000 đ</div>
            <div className="text-xs text-emerald-700 font-bold mt-1">582 hóa đơn hôm nay</div>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl"><DollarSign className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh Số Tháng 09</span>
            <div className="text-2xl font-black text-slate-800 mt-1">785.400.000 đ</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">+14.2% so với tháng trước</div>
          </div>
          <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl"><TrendingUp className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi Phí Nguyên Liệu (COGS)</span>
            <div className="text-2xl font-black text-slate-800 mt-1">31.8%</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Trong định mức tối ưu (≤ 33%)</div>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-2xl"><Award className="w-6 h-6" /></div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khách Hàng Tích Điểm</span>
            <div className="text-2xl font-black text-slate-800 mt-1">1.248 KH</div>
            <div className="text-xs text-slate-500 font-medium mt-1">Tỷ lệ quay lại 68.5%</div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl"><Users className="w-6 h-6" /></div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Bảng So Sánh Hiệu Suất 5 Chi Nhánh Chuỗi TeaP</h3>
            <p className="text-xs text-slate-500">Dữ liệu doanh thu thực tế được đối soát trực tiếp từ quầy POS các quán</p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-slate-100 text-xs">
          {branchMetrics.map((b, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-slate-400 w-5">0{idx + 1}</span>
                <div>
                  <div className="font-extrabold text-slate-900">{b.name}</div>
                  <div className="text-[11px] text-slate-500">{b.orders} hóa đơn ca này</div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="font-mono font-black text-emerald-800 text-sm">{b.revenue.toLocaleString('vi-VN')} đ</div>
                  <div className="text-[10px] text-slate-400">Chỉ tiêu: {b.target}</div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold whitespace-nowrap ${
                  b.status === 'VƯỢT CHỈ TIÊU' ? 'bg-emerald-100 text-emerald-800' :
                  b.status === 'ĐẠT' ? 'bg-teal-50 text-teal-700' : 'bg-amber-50 text-amber-800'
                }`}>
                  {b.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
