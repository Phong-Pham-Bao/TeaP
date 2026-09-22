'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Download, Plus, Check, Trash2, 
  RotateCcw, Info, UserCheck, Save 
} from 'lucide-react';
import { 
  ScheduleRow, INITIAL_SCHEDULE_ROWS, 
  SHIFT_BADGE_STYLES 
} from './schedule-types';

export default function ManagerExcelSchedule() {
  const [rows, setRows] = useState<ScheduleRow[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('teap_manager_schedule');
      if (saved) {
        try { return JSON.parse(saved); } catch {}
      }
    }
    return INITIAL_SCHEDULE_ROWS;
  });

  const [selectedMonth, setSelectedMonth] = useState('09/2026');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeShiftCode, setActiveShiftCode] = useState<string>('X'); // Default fast toggle mode
  const totalDays = 31;

  // Day headers generator matching Image 1 (starts on Thursday = Thứ 5 for day 1)
  const daysOfWeek = ['Thứ 5', 'Thứ 6', 'Thứ 7', 'CN', 'Thứ 2', 'Thứ 3', 'Thứ 4'];
  const dayHeaders = Array.from({ length: totalDays }, (_, i) => {
    const day = i + 1;
    const dow = daysOfWeek[(i) % 7];
    const isWeekend = dow === 'Thứ 7' || dow === 'CN';
    return { day, dow, isWeekend };
  });

  const toggleDayCell = (rowId: string, day: number) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const current = row.days[day] || '';
      // If currently not OFF, toggle to activeShiftCode (default 'X')
      // If already 'X', clear it.
      let next = activeShiftCode;
      if (current === activeShiftCode) {
        next = '';
      }
      return {
        ...row,
        days: { ...row.days, [day]: next }
      };
    }));
  };

  const handleSave = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('teap_manager_schedule', JSON.stringify(rows));
    }
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleExportCSV = () => {
    let csv = 'STT,BAC,HO_VA_TEN,VI_TRI,CHE_DO,' + dayHeaders.map(d => `Ngay_${d.day}`).join(',') + '\n';
    rows.forEach(r => {
      const dayValues = dayHeaders.map(d => `"${r.days[d.day] || ''}"`).join(',');
      csv += `${r.stt},"${r.rank}","${r.fullName}","${r.position}","${r.shiftMode}",${dayValues}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Lich_Lam_Viec_Chi_Nhanh_${selectedMonth.replace('/', '_')}.csv`);
    link.click();
  };

  const addNewStaffRow = () => {
    const newRow: ScheduleRow = {
      id: `s_${Date.now()}`,
      stt: rows.length + 1,
      rank: 'C',
      fullName: 'Nhân viên mới',
      position: 'TN',
      shiftMode: 'CA12',
      days: {},
    };
    setRows(prev => [...prev, newRow]);
  };

  return (
    <div className="space-y-4">
      {/* Action & Legend Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-700" />
            Lịch Làm Việc Chi Nhánh — Tháng {selectedMonth}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Bảng ma trận xếp ca & báo nghỉ Excel. Click vào ô ngày bất kỳ để <strong className="text-amber-700">tích ngày OFF (X)</strong> hoặc đổi ca.
          </p>
        </div>

        {/* Shift Code Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <span className="text-[10px] font-bold text-slate-500 px-2 uppercase">Chế độ tích:</span>
            {Object.entries(SHIFT_BADGE_STYLES).map(([code, style]) => (
              <button
                key={code}
                onClick={() => setActiveShiftCode(code)}
                className={`px-2.5 py-1 rounded-lg font-extrabold text-xs transition border ${
                  activeShiftCode === code 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                    : `${style.bg} ${style.text} border-transparent opacity-80 hover:opacity-100`
                }`}
              >
                {code}
              </button>
            ))}
          </div>

          <button
            onClick={addNewStaffRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" /> Thêm NV
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            {saveSuccess ? 'Đã lưu!' : 'Lưu lịch'}
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* EXCEL MATRIX TABLE (Matching Image 1) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[640px] relative scrollbar-thin">
          <table className="w-full text-xs border-collapse border-slate-300">
            {/* Table Header Rows (2 rows) */}
            <thead className="sticky top-0 z-30 select-none">
              {/* Row 1: Day of week */}
              <tr className="bg-emerald-800 text-white font-bold text-center uppercase tracking-wider text-[11px]">
                <th rowSpan={2} className="sticky left-0 z-40 bg-emerald-800 px-2.5 py-2 border border-emerald-700 w-12 text-center">STT</th>
                <th rowSpan={2} className="sticky left-12 z-40 bg-emerald-800 px-3 py-2 border border-emerald-700 w-16 text-center">BẬC</th>
                <th rowSpan={2} className="sticky left-28 z-40 bg-emerald-800 px-4 py-2 border border-emerald-700 w-48 text-left">HỌ & TÊN</th>
                <th rowSpan={2} className="sticky left-76 z-40 bg-emerald-800 px-3 py-2 border border-emerald-700 w-24 text-center">VỊ TRÍ</th>
                <th rowSpan={2} className="sticky left-100 z-40 bg-emerald-800 px-3 py-2 border border-emerald-700 w-28 text-center">CHẾ ĐỘ / GIỜ</th>

                {/* Days of week */}
                {dayHeaders.map((dh) => (
                  <th
                    key={`dow-${dh.day}`}
                    className={`px-1 py-1 border border-slate-300 text-[10px] w-9 min-w-[36px] ${
                      dh.isWeekend ? 'bg-rose-600 text-white font-extrabold' : 'bg-emerald-700 text-emerald-100'
                    }`}
                  >
                    {dh.dow}
                  </th>
                ))}
                <th rowSpan={2} className="bg-emerald-800 px-3 py-2 border border-emerald-700 w-20 text-center">TỔNG CA</th>
                <th rowSpan={2} className="bg-emerald-800 px-3 py-2 border border-emerald-700 w-20 text-center">OFF (X)</th>
              </tr>

              {/* Row 2: Day number 01, 02, 03... */}
              <tr className="bg-slate-100 text-slate-800 font-extrabold text-center text-[11px]">
                {dayHeaders.map((dh) => (
                  <th
                    key={`num-${dh.day}`}
                    className={`py-1 border border-slate-300 ${
                      dh.isWeekend ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {dh.day < 10 ? `0${dh.day}` : dh.day}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, idx) => {
                let offCount = 0;
                let workCount = 0;
                dayHeaders.forEach(d => {
                  const val = row.days[d.day];
                  if (val === 'X') offCount++;
                  else if (val) workCount++;
                });

                return (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Fixed Left Columns (Sticky) */}
                    <td className="sticky left-0 z-20 bg-white px-2 py-2.5 text-center font-extrabold text-slate-800 border border-slate-200">{row.stt}</td>
                    <td className="sticky left-12 z-20 bg-white px-2 py-2.5 text-center font-bold text-emerald-900 border border-slate-200">{row.rank}</td>
                    <td className="sticky left-28 z-20 bg-white px-3 py-2.5 text-left font-bold text-slate-900 border border-slate-200 truncate">{row.fullName}</td>
                    <td className="sticky left-76 z-20 bg-white px-2 py-2.5 text-center font-semibold text-slate-700 border border-slate-200">{row.position}</td>
                    <td className="sticky left-100 z-20 bg-white px-2 py-2.5 text-center font-mono text-[11px] text-slate-600 border border-slate-200">{row.shiftMode}</td>

                    {/* Day Matrix Cells */}
                    {dayHeaders.map((dh) => {
                      const val = row.days[dh.day] || '';
                      const style = SHIFT_BADGE_STYLES[val];

                      return (
                        <td
                          key={`cell-${row.id}-${dh.day}`}
                          onClick={() => toggleDayCell(row.id, dh.day)}
                          title={`Click để đổi trạng thái ngày ${dh.day} của ${row.fullName}`}
                          className={`p-0.5 border border-slate-300 text-center cursor-pointer transition select-none ${
                            dh.isWeekend ? 'bg-slate-50/50' : 'bg-white'
                          } hover:outline-2 hover:outline-emerald-500 hover:z-10`}
                        >
                          <div className={`w-full h-8 flex items-center justify-center rounded-xs text-[11px] ${
                            style ? style.bg : ''
                          }`}>
                            {val && (
                              <span className={style ? style.text : 'font-bold'}>
                                {val}
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}

                    {/* Right Totals */}
                    <td className="px-2 py-2 text-center font-extrabold text-emerald-800 border border-slate-200 bg-emerald-50/50">
                      {workCount}
                    </td>
                    <td className="px-2 py-2 text-center font-extrabold text-amber-700 border border-slate-200 bg-amber-50/50">
                      {offCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
