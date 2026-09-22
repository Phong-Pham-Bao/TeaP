'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, Clock, CheckCircle2, 
  Send, ShieldAlert, Filter, Search 
} from 'lucide-react';
import { ExpiryBatchItem } from './warehouse-types';

const INITIAL_BATCHES: ExpiryBatchItem[] = [
  { id: 'b1', materialName: 'Sữa tươi Dalat Milk 1L', category: 'Sữa & Kem', batchNumber: 'LOT-DLM-2609A', currentStock: 45, unit: 'Hộp', storageType: 'KHO_LANH', expiryDate: '2026-09-21', daysRemaining: 5, status: 'CRITICAL' },
  { id: 'b2', materialName: 'Kem béo thực vật Richs', category: 'Sữa & Kem', batchNumber: 'LOT-RCH-2608C', currentStock: 30, unit: 'Hộp', storageType: 'KHO_LANH', expiryDate: '2026-09-24', daysRemaining: 8, status: 'WARNING' },
  { id: 'b3', materialName: 'Đào ngâm đóng hộp Kronos', category: 'Topping & Trái cây', batchNumber: 'LOT-KRN-2605', currentStock: 60, unit: 'Lon', storageType: 'KHO_KHO', expiryDate: '2026-10-02', daysRemaining: 16, status: 'WARNING' },
  { id: 'b4', materialName: 'Trà Đen Lạc Xương', category: 'Cốt Trà', batchNumber: 'LOT-TLX-2608B', currentStock: 120, unit: 'Kg', storageType: 'KHO_KHO', expiryDate: '2027-09-14', daysRemaining: 363, status: 'GOOD' },
  { id: 'b5', materialName: 'Trân Châu Đen Hoàng Kim', category: 'Topping', batchNumber: 'LOT-TC-2609C', currentStock: 250, unit: 'Kg', storageType: 'KHO_KHO', expiryDate: '2027-03-12', daysRemaining: 177, status: 'GOOD' },
];

export default function WarehouseExpiryTab() {
  const [batches, setBatches] = useState<ExpiryBatchItem[]>(INITIAL_BATCHES);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');
  const [priorityBatch, setPriorityBatch] = useState<string | null>(null);

  const filtered = batches.filter(b => {
    if (filterStatus === 'ALL') return true;
    return b.status === filterStatus;
  });

  const handleSetPriority = (batchNo: string) => {
    setPriorityBatch(batchNo);
    setTimeout(() => setPriorityBatch(null), 3000);
  };

  return (
    <div className="space-y-5">
      {priorityBatch && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Đã gắn cờ Ưu Tiên Xuất Kho (FEFO) cho lô hàng {priorityBatch}! Đơn xuất chi nhánh tiếp theo sẽ tự động lấy lô này.</span>
        </div>
      )}

      {/* Header & Filter */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Kiểm Soát Hạn Dùng & Lô Hàng Cận Date (Quy Tắc FEFO)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Nguyên tắc <strong>First Expired, First Out</strong>: Ưu tiên xuất kho các lô hàng có ngày hết hạn gần nhất để bảo toàn vốn.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            Tất cả ({batches.length})
          </button>
          <button
            onClick={() => setFilterStatus('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${filterStatus === 'CRITICAL' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'}`}
          >
            Dưới 7 ngày (Cấp bách)
          </button>
        </div>
      </div>

      {/* Batch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(item => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono">
                    {item.batchNumber}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900 mt-1">{item.materialName}</h3>
                  <div className="text-xs text-slate-400 font-medium">{item.category}</div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                  item.status === 'CRITICAL' ? 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse' :
                  item.status === 'WARNING' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                  'bg-emerald-100 text-emerald-800 border border-emerald-200'
                }`}>
                  Còn {item.daysRemaining} ngày
                </span>
              </div>

              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Tồn kho lô:</span>
                  <span className="font-mono font-extrabold text-slate-900 text-sm">{item.currentStock} {item.unit}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">Hạn dùng (Exp):</span>
                  <span className="font-mono font-bold text-slate-700">{item.expiryDate}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">Vị trí: {item.storageType}</span>
              <button
                onClick={() => handleSetPriority(item.batchNumber)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <Send className="w-3.5 h-3.5 text-amber-400" /> Ưu tiên xuất FEFO
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
