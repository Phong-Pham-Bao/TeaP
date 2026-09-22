'use client';

import React, { useState, useEffect } from 'react';
import { 
  Video, Maximize2, RefreshCw, Camera, Eye, 
  Wifi, AlertCircle, Shield, Move, Grid, Square, X 
} from 'lucide-react';

interface CameraItem {
  id: string;
  code: string;
  name: string;
  zone: string;
  status: 'ONLINE' | 'RECORDING' | 'MOTION_DETECTED';
  fps: number;
  resolution: string;
  accentColor: string;
}

const CAMERAS: CameraItem[] = [
  { id: 'cam1', code: 'CAM-01', name: 'Quầy Thu Ngân & Khách Hàng', zone: 'Khu Quầy Thu Ngân', status: 'RECORDING', fps: 30, resolution: '1080p', accentColor: 'border-emerald-500' },
  { id: 'cam2', code: 'CAM-02', name: 'Quầy Bar Pha Chế & Bếp', zone: 'Khu Pha Chế Bar', status: 'RECORDING', fps: 30, resolution: '1080p', accentColor: 'border-teal-500' },
  { id: 'cam3', code: 'CAM-03', name: 'Sảnh Khách & Bàn Ngồi', zone: 'Tầng Trệt & Lầu 1', status: 'ONLINE', fps: 25, resolution: '1080p', accentColor: 'border-cyan-500' },
  { id: 'cam4', code: 'CAM-04', name: 'Kho Nguyên Liệu & Tủ Lạnh', zone: 'Kho Lạnh Chi Nhánh', status: 'RECORDING', fps: 30, resolution: '1080p', accentColor: 'border-amber-500' },
  { id: 'cam5', code: 'CAM-05', name: 'Cửa Ra Vào & Bãi Xe Khách', zone: 'Mặt Tiền Cửa Hàng', status: 'MOTION_DETECTED', fps: 30, resolution: '1080p', accentColor: 'border-rose-500' },
];

export default function ManagerCameraMonitor() {
  const [selectedCam, setSelectedCam] = useState<CameraItem>(CAMERAS[0]);
  const [viewMode, setViewMode] = useState<'grid' | 'single'>('grid');
  const [fullscreenCam, setFullscreenCam] = useState<CameraItem | null>(null);
  const [timestamp, setTimestamp] = useState<string>('');
  const [snapshotSuccess, setSnapshotSuccess] = useState<string | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      setTimestamp(now.toISOString().replace('T', ' ').slice(0, 19));
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSnapshot = (cam: CameraItem) => {
    setSnapshotSuccess(`Đã lưu ảnh chụp từ ${cam.code} lúc ${new Date().toLocaleTimeString('vi-VN')}`);
    setTimeout(() => setSnapshotSuccess(null), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Top Controller Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-900 text-white shadow-md">
            <Video className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              Hệ Thống Camera An Ninh Chi Nhánh
              <span className="text-[10px] uppercase font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                5 / 5 KẾT NỐI
              </span>
            </h2>
            <p className="text-xs text-slate-500">Giám sát trực tiếp quầy bán, khu vực pha chế và kho nguyên liệu thời gian thực.</p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
          {snapshotSuccess && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-fade-in">
              {snapshotSuccess}
            </span>
          )}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> Lưới (4/5)
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Square className="w-3.5 h-3.5" /> Góc Lớn
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Single Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {CAMERAS.map((cam) => (
            <CameraFeedCard 
              key={cam.id} 
              cam={cam} 
              timestamp={timestamp} 
              onExpand={() => setFullscreenCam(cam)} 
              onSnapshot={() => handleSnapshot(cam)} 
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main big feed */}
          <div className="lg:col-span-3">
            <CameraFeedCard 
              cam={selectedCam} 
              timestamp={timestamp} 
              isLarge 
              onExpand={() => setFullscreenCam(selectedCam)} 
              onSnapshot={() => handleSnapshot(selectedCam)} 
            />
          </div>
          {/* Sidebar selector */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 uppercase px-1">Chọn góc camera</div>
            {CAMERAS.map((cam) => (
              <button
                key={cam.id}
                onClick={() => setSelectedCam(cam)}
                className={`w-full text-left p-3 rounded-xl border transition flex items-center justify-between ${
                  selectedCam.id === cam.id 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs' 
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{cam.code} • {cam.name}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{cam.zone}</div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Modal */}
      {fullscreenCam && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-white pb-3 border-b border-white/20">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse"></span>
              <span className="font-extrabold">{fullscreenCam.code} — {fullscreenCam.name}</span>
              <span className="text-xs text-slate-400 font-mono">({fullscreenCam.zone})</span>
            </div>
            <button onClick={() => setFullscreenCam(null)} className="p-2 text-white hover:bg-white/10 rounded-xl">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="flex-1 mt-3 relative rounded-2xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center">
            <CameraScreenOverlay cam={fullscreenCam} timestamp={timestamp} isLarge />
          </div>
        </div>
      )}
    </div>
  );
}

function CameraFeedCard({ cam, timestamp, isLarge = false, onExpand, onSnapshot }: any) {
  return (
    <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-md relative group flex flex-col">
      <div className={`relative ${isLarge ? 'h-[440px]' : 'h-64'} bg-slate-900 flex items-center justify-center overflow-hidden`}>
        <CameraScreenOverlay cam={cam} timestamp={timestamp} isLarge={isLarge} />
        {/* Hover Quick Action Buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
          <button 
            onClick={onSnapshot}
            title="Chụp ảnh nhanh" 
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs border border-white/10 text-xs"
          >
            <Camera className="w-4 h-4" />
          </button>
          <button 
            onClick={onExpand}
            title="Phóng to toàn màn hình" 
            className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-xs border border-white/10 text-xs"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-3 bg-slate-900 text-slate-300 flex items-center justify-between border-t border-slate-800/80 text-xs">
        <div>
          <span className="font-extrabold text-white">{cam.code}:</span> {cam.name}
          <div className="text-[10px] text-slate-400">{cam.zone}</div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-emerald-400">
          <Wifi className="w-3 h-3" /> 1080p/30fps
        </div>
      </div>
    </div>
  );
}

function CameraScreenOverlay({ cam, timestamp, isLarge }: any) {
  return (
    <div className="absolute inset-0 flex flex-col justify-between p-3.5 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none select-none">
      {/* Top live indicators */}
      <div className="flex items-center justify-between font-mono text-[11px] text-white">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-600/90 text-white font-bold text-[10px] tracking-wider">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            REC
          </span>
          <span className="font-extrabold tracking-wider bg-black/50 px-2 py-0.5 rounded border border-white/10">
            {cam.code}
          </span>
        </div>
        <div className="bg-black/50 px-2.5 py-0.5 rounded border border-white/10 text-emerald-300 font-bold">
          {timestamp}
        </div>
      </div>

      {/* Center Simulated Scene Graphics */}
      <div className="self-center flex flex-col items-center justify-center opacity-30 text-white">
        <Video className={isLarge ? "w-20 h-20" : "w-12 h-12"} />
        <span className="text-[11px] font-mono mt-1 tracking-widest uppercase">LIVE STREAM • {cam.zone}</span>
      </div>

      {/* Bottom overlay status */}
      <div className="flex items-center justify-between font-mono text-[10px] text-slate-300">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold">BITRATE: 4096 Kbps</span>
          <span>•</span>
          <span>FPS: {cam.fps}</span>
        </div>
        <div className="text-slate-400">AUDIO: ON</div>
      </div>
    </div>
  );
}
