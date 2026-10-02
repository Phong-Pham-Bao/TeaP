'use client';

import { Camera, ShieldCheck } from 'lucide-react';
import { FeatureUnavailable } from '@/components/feature-unavailable';

export default function ManagerCameraMonitor() {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Camera className="h-5 w-5 text-emerald-700" aria-hidden="true" />
          Camera an ninh
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Luồng camera phải đến từ hệ thống NVR/provider đã được cấu hình và phân quyền.
        </p>
      </div>

      <FeatureUnavailable
        title="Giám sát camera"
        description="Màn hình 5 camera trước đây chỉ mô phỏng LIVE/REC, bitrate và snapshot trong trình duyệt, không có video stream hay bản ghi thật. Toàn bộ trạng thái mô phỏng đã được gỡ để tránh gây hiểu nhầm vận hành."
        roadmap="EXT-02"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" aria-hidden="true" />
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Yêu cầu trước khi tích hợp</h2>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              Cần chốt nhà cung cấp, URL stream ngắn hạn, quyền theo chi nhánh, audit khi xem/tải bản ghi,
              thời hạn lưu trữ và phương án che vùng nhạy cảm trước khi bật tính năng.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
