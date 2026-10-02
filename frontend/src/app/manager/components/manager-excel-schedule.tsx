'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Download, RefreshCcw } from 'lucide-react';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';

type WorkSchedule = components['schemas']['WorkScheduleResponseDto'];
type SchedulePage = { data?: WorkSchedule[] };

function currentMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end, label: `${String(month + 1).padStart(2, '0')}/${year}` };
}

export default function ManagerExcelSchedule({ branchId }: { branchId: string }) {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const range = currentMonthRange();

  const loadSchedules = async () => {
    if (!branchId) {
      setError('Hãy chọn chi nhánh để tải lịch làm việc.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const scopedBranchId = encodeURIComponent(branchId);
      const response = await api.get<SchedulePage>(
        `/hr/schedules?branchId=${scopedBranchId}&startDate=${range.start}&endDate=${range.end}&limit=100`,
      );
      setSchedules(response.data.data ?? []);
    } catch {
      setSchedules([]);
      setError('Không thể tải lịch làm việc.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSchedules();
  }, [branchId]);

  const handleExportCsv = () => {
    const rows = [
      ['Nhan vien', 'Ngay', 'Ca', 'Bat dau', 'Ket thuc', 'Chi nhanh'],
      ...schedules.map((schedule) => [
        schedule.user?.fullName ?? schedule.userId,
        schedule.date.slice(0, 10),
        schedule.shiftName,
        schedule.startTime,
        schedule.endTime,
        schedule.branch?.name ?? schedule.branchId,
      ]),
    ];
    const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `lich-lam-viec-${range.label.replace('/', '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
            <Calendar className="h-5 w-5 text-emerald-700" />
            Lịch làm việc tháng {range.label}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Dữ liệu đọc trực tiếp từ backend HR; không còn lưu lịch trong trình duyệt.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => void loadSchedules()} disabled={loading} className="rounded-xl border border-slate-200 p-2 text-slate-600 disabled:opacity-50" aria-label="Tải lại lịch">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={handleExportCsv} disabled={schedules.length === 0} className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Xuất CSV
          </button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Nhân viên</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Ca</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3">Chi nhánh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-bold text-slate-800">{schedule.user?.fullName ?? schedule.userId}</td>
                  <td className="px-4 py-3">{new Date(schedule.date).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3 font-semibold text-emerald-800">{schedule.shiftName}</td>
                  <td className="px-4 py-3 font-mono">{schedule.startTime}–{schedule.endTime}</td>
                  <td className="px-4 py-3">{schedule.branch?.name ?? schedule.branchId}</td>
                </tr>
              ))}
              {!loading && schedules.length === 0 && !error && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">Chưa có lịch trong tháng này.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
        Tạo và sửa lịch hàng loạt sẽ được mở lại khi HR-01 bổ sung conflict detail và approval; hiện tại màn hình chỉ đọc để tránh mất dữ liệu hoặc báo lưu thành công giả.
      </p>
    </div>
  );
}
