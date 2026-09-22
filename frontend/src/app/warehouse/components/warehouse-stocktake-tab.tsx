'use client';

import React, { useState } from 'react';
import { 
  ClipboardCheck, AlertTriangle, CheckCircle2, 
  Save, FileSpreadsheet, Plus, X 
} from 'lucide-react';
import { StocktakeRecord } from './warehouse-types';

const INITIAL_STOCKTAKE: StocktakeRecord[] = [
  { id: 'stk-1', materialName: 'Sữa tươi Dalat Milk 1L', systemStock: 200, actualStock: 198, variance: -2, unit: 'Hộp', varianceReason: 'Rách móp bao bì khi bốc dỡ pallet', auditorName: 'Trần Văn Thủ Kho', auditDate: '2026-09-16' },
  { id: 'stk-2', materialName: 'Trân Châu Đen Hoàng Kim', systemStock: 300, actualStock: 299.5, variance: -0.5, unit: 'Kg', varianceReason: 'Hao hụt tự nhiên khi chia túi 1kg', auditorName: 'Trần Văn Thủ Kho', auditDate: '2026-09-16' },
  { id: 'stk-3', materialName: 'Trà Đen Lạc Xương', systemStock: 150, actualStock: 150, variance: 0, unit: 'Kg', varianceReason: 'Khớp 100%', auditorName: 'Trần Văn Thủ Kho', auditDate: '2026-09-16' },
  { id: 'stk-4', materialName: 'Ly Nhựa PP 700ml', systemStock: 10000, actualStock: 9980, variance: -20, unit: 'Cái', varianceReason: 'Bể vỡ trong thùng carton', auditorName: 'Trần Văn Thủ Kho', auditDate: '2026-09-16' },
];

export default function WarehouseStocktakeTab() {
  const [records, setRecords] = useState<StocktakeRecord[]>(INITIAL_STOCKTAKE);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleUpdateActual = (id: string, newActual: number) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        actualStock: newActual,
        variance: Number((newActual - r.systemStock).toFixed(2))
      };
    }));
  };

  const handleSaveAudit = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-5">
      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu biên bản kiểm kê và tự động cập nhật số dư tồn kho sổ sách!</span>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-amber-600" />
            Kiểm Kê Kho Định Kỳ & Ghi Nhận Hao Hụt
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Đối soát tồn thực tế và tồn phần mềm, phân tích nguyên nhân hao hụt, hư hỏng hoặc lỗi định lượng.
          </p>
        </div>

        <button
          onClick={handleSaveAudit}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Save className="w-3.5 h-3.5" /> Lưu Biên Bản & Cân Chỉnh Kho
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Tên Nguyên Liệu</th>
                <th className="py-3 px-4 text-right">Tồn Sổ Sách</th>
                <th className="py-3 px-4 text-center">Tồn Thực Đếm</th>
                <th className="py-3 px-4 text-center">Chênh Lệch</th>
                <th className="py-3 px-4">Nguyên Nhân Hao Hụt / Ghi Chú</th>
                <th className="py-3 px-4">Người Kiểm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{r.materialName}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-700">
                    {r.systemStock} {r.unit}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <input
                      type="number"
                      value={r.actualStock}
                      onChange={(e) => handleUpdateActual(r.id, Number(e.target.value))}
                      className="w-24 text-center py-1 font-mono font-bold border border-slate-300 rounded-lg outline-none focus:border-emerald-600 bg-white"
                    />
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-extrabold">
                    <span className={`px-2 py-0.5 rounded-md text-xs ${
                      r.variance === 0 ? 'bg-emerald-50 text-emerald-800' :
                      r.variance < 0 ? 'bg-rose-50 text-rose-700' : 'bg-sky-50 text-sky-700'
                    }`}>
                      {r.variance > 0 ? `+${r.variance}` : r.variance} {r.unit}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-600 italic">{r.varianceReason}</td>
                  <td className="py-3 px-4 font-medium text-slate-700">{r.auditorName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
