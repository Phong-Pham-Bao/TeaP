'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Bell, Calendar, CheckCircle2, Clock, LogIn, LogOut, RefreshCcw } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import type { components } from '@/lib/api-contract.generated';

type Attendance = components['schemas']['AttendanceResponseDto'];
type WorkSchedule = components['schemas']['WorkScheduleResponseDto'];
type Announcement = components['schemas']['AnnouncementResponseDto'];

function monthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  return {
    start: `${year}-${String(month + 1).padStart(2, '0')}-01`,
    end: `${year}-${String(month + 1).padStart(2, '0')}-${String(new Date(year, month + 1, 0).getDate()).padStart(2, '0')}`,
  };
}

export default function StaffPortalPage() {
  const { user, logout } = useAuth();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    const range = monthRange();
    try {
      const [attendanceResponse, scheduleResponse, announcementResponse] = await Promise.all([
        api.get<Attendance[]>('/hr/attendance/me'),
        api.get<WorkSchedule[]>(`/hr/schedules/me?startDate=${range.start}&endDate=${range.end}`),
        api.get<Announcement[]>('/hr/announcements'),
      ]);
      setAttendance(attendanceResponse.data ?? []);
      setSchedules(scheduleResponse.data ?? []);
      setAnnouncements(announcementResponse.data ?? []);
    } catch {
      setAttendance([]);
      setSchedules([]);
      setAnnouncements([]);
      setError('Không thể tải dữ liệu nhân viên. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const todayRecord = useMemo(() => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
    return attendance.find((record) => record.date.slice(0, 10) === today);
  }, [attendance]);

  const handleAttendance = async (action: 'check-in' | 'check-out') => {
    setActionLoading(true);
    setError('');
    try {
      await api.post<Attendance>(`/hr/attendance/${action}`, {});
      await loadData();
    } catch (requestError: any) {
      setError(requestError.response?.data?.message ?? 'Không thể cập nhật chấm công.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-emerald-950 bg-emerald-950 px-5 py-4 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold">Cổng nhân viên TeaP</h1>
            <p className="text-xs text-emerald-200">{user?.fullName ?? user?.email}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void loadData()} disabled={loading} className="rounded-xl border border-white/20 p-2 disabled:opacity-50" aria-label="Tải lại">
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => void logout()} className="flex items-center gap-1.5 rounded-xl border border-white/20 px-3 py-2 text-xs font-bold">
              <LogOut className="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-5">
        {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">{error}</div>}

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-1">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Clock className="h-5 w-5 text-emerald-700" /> Chấm công hôm nay</div>
            <div className="mt-4 space-y-2 text-xs text-slate-600">
              <div>Vào ca: <strong>{todayRecord?.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString('vi-VN') : 'Chưa chấm'}</strong></div>
              <div>Ra ca: <strong>{todayRecord?.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString('vi-VN') : 'Chưa chấm'}</strong></div>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => void handleAttendance('check-in')} disabled={actionLoading || Boolean(todayRecord?.checkIn)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                <LogIn className="h-4 w-4" /> Vào ca
              </button>
              <button onClick={() => void handleAttendance('check-out')} disabled={actionLoading || !todayRecord?.checkIn || Boolean(todayRecord?.checkOut)} className="flex flex-1 items-center justify-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                <LogOut className="h-4 w-4" /> Ra ca
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Calendar className="h-5 w-5 text-emerald-700" /> Lịch làm việc tháng này</div>
            <div className="mt-3 divide-y divide-slate-100">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="flex items-center justify-between py-2.5 text-xs">
                  <div><strong>{new Date(schedule.date).toLocaleDateString('vi-VN')}</strong> · {schedule.shiftName}</div>
                  <div className="font-mono text-slate-500">{schedule.startTime}–{schedule.endTime}</div>
                </div>
              ))}
              {!loading && schedules.length === 0 && <p className="py-8 text-center text-xs text-slate-400">Chưa có lịch làm việc trong tháng.</p>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Bell className="h-5 w-5 text-amber-600" /> Thông báo</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="text-xs font-bold text-slate-900">{announcement.title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-slate-600">{announcement.content}</p>
                <div className="mt-2 text-[10px] text-slate-400">{new Date(announcement.createdAt).toLocaleString('vi-VN')}</div>
              </article>
            ))}
            {!loading && announcements.length === 0 && <p className="py-8 text-center text-xs text-slate-400 md:col-span-2">Chưa có thông báo.</p>}
          </div>
        </section>

        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          Đào tạo, chấm điểm và kiểm tra nội bộ đang tắt cho tới khi OPS-01 có backend và chính sách quyền; không còn lưu kết quả mẫu cục bộ trong trình duyệt.
        </div>
      </main>
    </div>
  );
}
