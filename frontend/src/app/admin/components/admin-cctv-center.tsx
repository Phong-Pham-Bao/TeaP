'use client';

import React, { useState } from 'react';
import { 
  Video, Store, Grid, Maximize2, 
  Wifi, ShieldCheck, ChevronDown 
} from 'lucide-react';

export default function AdminCctvCenter() {
  const branches = [
    { id: 'b1', name: 'TeaP Chi Nhánh Quận 1', camCount: 5, online: 5 },
    { id: 'b2', name: 'TeaP Chi Nhánh Quận 3', camCount: 4, online: 4 },
    { id: 'b3', name: 'TeaP Chi Nhánh Quận 7', camCount: 4, online: 4 },
    { id: 'b4', name: 'TeaP Chi Nhánh Thủ Đức', camCount: 5, online: 5 },
    { id: 'b5', name: 'TeaP Chi Nhánh Bình Thạnh', camCount: 4, online: 4 },
  ];

  const [selectedBranch, setSelectedBranch] = useState(branches[0]);

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Video className="w-5 h-5 text-emerald-700" />
            Trung Tâm Giám Sát Camera Toàn Chuỗi (Master CCTV Center)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Super Admin có thể chuyển đổi và xem trực tiếp toàn bộ camera an ninh của bất kỳ chi nhánh nào.
          </p>
        </div>

        {/* Branch Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Xem camera:</span>
          <select
            value={selectedBranch.id}
            onChange={(e) => setSelectedBranch(branches.find(b => b.id === e.target.value) || branches[0])}
            className="text-xs font-extrabold bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 outline-none text-slate-800"
          >
            {branches.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.online}/{b.camCount} Cam Online)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Simulated 4-Cam Grid for Selected Branch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { code: 'CAM-01', name: 'Quầy Thu Ngân & Khách Hàng', zone: 'Khu Quầy POS' },
          { code: 'CAM-02', name: 'Quầy Bar Pha Chế & Bếp', zone: 'Khu Pha Chế Bar' },
          { code: 'CAM-03', name: 'Sảnh Khách & Bàn Ngồi', zone: 'Tầng Trệt' },
          { code: 'CAM-04', name: 'Kho Nguyên Liệu & Tủ Lạnh', zone: 'Kho Lạnh Cửa Hàng' },
        ].map(cam => (
          <div key={cam.code} className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            <div className="h-56 relative bg-slate-900 flex items-center justify-center p-4">
              <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none">
                <div className="flex items-center justify-between text-[10px] font-mono text-white">
                  <span className="bg-rose-600 px-2 py-0.5 rounded font-bold">REC</span>
                  <span className="bg-black/60 px-2 py-0.5 rounded text-emerald-300">
                    {selectedBranch.name} • {cam.code}
                  </span>
                </div>
                <div className="self-center flex flex-col items-center opacity-30 text-white">
                  <Video className="w-10 h-10" />
                  <span className="text-[10px] font-mono mt-1 uppercase">{cam.zone}</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>FPS: 30</span>
                  <span>1080p HD</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-slate-900 text-xs text-slate-300 flex justify-between items-center border-t border-slate-800">
              <span className="font-bold text-white">{cam.code}: {cam.name}</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                <Wifi className="w-3 h-3" /> ONLINE
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
