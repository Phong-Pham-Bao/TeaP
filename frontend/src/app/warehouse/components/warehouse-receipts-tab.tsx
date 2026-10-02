'use client';

import React from 'react';
import { AlertTriangle, PackagePlus } from 'lucide-react';

export default function WarehouseReceiptsTab() {
  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <PackagePlus className="w-5 h-5 text-emerald-700" />
          Nhập Kho Từ Nhà Cung Cấp
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Tiếp nhận nguyên liệu, lô và hạn sử dụng sẽ được mở sau khi PUR-01, PUR-02 và INV-02 hoàn tất.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold">Chức năng chưa khả dụng</h3>
            <p className="mt-1 text-xs leading-5">
              TeaP chưa có backend Purchase Order, supplier receipt, lot/expiry và document sequence.
              Màn hình tạo phiếu mẫu đã được tắt để không ghi nhận thành công giả hoặc sinh số phiếu tại trình duyệt.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
