'use client';

import React from 'react';
import { 
  Warehouse, Thermometer, AlertTriangle, 
  Truck, PackageCheck, Layers, Clock 
} from 'lucide-react';

interface WarehouseHeaderProps {
  pendingDispatchCount: number;
  criticalExpiryCount: number;
  coldTemp: string;
  freezerTemp: string;
  dryHumidity: string;
  userName: string;
}

export default function WarehouseHeader({
  pendingDispatchCount,
  criticalExpiryCount,
  coldTemp,
  freezerTemp,
  dryHumidity,
  userName,
}: WarehouseHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title & Warehouse Identity */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-white shadow-md shadow-amber-700/20">
            <Warehouse className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Kho Tổng Trung Tâm TeaP (Central Hub)
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Điều phối 5 chi nhánh
              </span>
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Thủ kho phụ trách: <strong className="text-slate-800">{userName}</strong></span>
              <span className="text-slate-300">•</span>
              <span className="font-mono text-[11px] text-slate-600">Mã kho: KHO-TONG-HCM-01</span>
            </div>
          </div>
        </div>

        {/* Environmental Sensors & Live Status */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Storage climate sensor indicators */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 flex items-center gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-cyan-600" /> Kho Mát (2-4°C)
              </div>
              <div className="font-mono font-extrabold text-cyan-700 text-sm mt-0.5">{coldTemp}</div>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Thermometer className="w-3 h-3 text-blue-600" /> Kho Đông (-18°C)
              </div>
              <div className="font-mono font-extrabold text-blue-700 text-sm mt-0.5">{freezerTemp}</div>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Độ ẩm Kho Khô</div>
              <div className="font-mono font-extrabold text-emerald-700 text-sm mt-0.5">{dryHumidity}</div>
            </div>
          </div>

          {/* Quick counters */}
          <div className="flex items-center gap-2">
            {pendingDispatchCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-xs">
                <Truck className="w-3.5 h-3.5" />
                <span>{pendingDispatchCount} yêu cầu cấp hàng</span>
              </div>
            )}
            {criticalExpiryCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-bounce" />
                <span>{criticalExpiryCount} lô cận date</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
