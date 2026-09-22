'use client';

import React, { useState } from 'react';
import { 
  GraduationCap, Award, Plus, CheckCircle2, 
  X, Star, BookOpen, AlertCircle 
} from 'lucide-react';

export interface TestRecord {
  id: string;
  staffName: string;
  testTitle: string;
  targetRank: string;
  date: string;
  scoreTheory: number;
  scorePractice: number;
  scoreOperation: number;
  scoreHygiene: number;
  averageScore: number;
  passed: boolean;
}

const INITIAL_TESTS: TestRecord[] = [
  { id: 't1', staffName: 'Nguyễn Thị Kim Thuý', testTitle: 'Sát Hạch Trưởng Bar & Quản Lý Ca (Bậc A)', targetRank: 'Bậc A', date: '2026-09-10', scoreTheory: 95, scorePractice: 98, scoreOperation: 96, scoreHygiene: 100, averageScore: 97.2, passed: true },
  { id: 't2', staffName: 'Vũ Ngọc Quỳnh Như', testTitle: 'Kiểm Tra Tiêu Chuẩn Công Thức & Tốc Độ (Bậc B)', targetRank: 'Bậc B', date: '2026-09-08', scoreTheory: 90, scorePractice: 92, scoreOperation: 94, scoreHygiene: 95, averageScore: 92.7, passed: true },
  { id: 't3', staffName: 'Nguyễn Trọng Hoá', testTitle: 'Kiểm Tra Định Lượng & Quy Trình Kho (Bậc C)', targetRank: 'Bậc C', date: '2026-09-05', scoreTheory: 85, scorePractice: 88, scoreOperation: 90, scoreHygiene: 92, averageScore: 88.7, passed: true },
  { id: 't4', staffName: 'Trịnh Minh Trường', testTitle: 'Đánh Giá Kết Thúc Hội Nhập Đào Tạo 7 Ngày', targetRank: 'Thử việc', date: '2026-09-14', scoreTheory: 82, scorePractice: 84, scoreOperation: 80, scoreHygiene: 88, averageScore: 83.5, passed: true },
];

export default function ManagerTrainingTab() {
  const [tests, setTests] = useState<TestRecord[]>(INITIAL_TESTS);
  const [showModal, setShowModal] = useState(false);
  const [staffName, setStaffName] = useState('Trần Thanh Tâm');
  const [testTitle, setTestTitle] = useState('Sát hạch tay nghề pha chế Bậc C');
  const [targetRank, setTargetRank] = useState('Bậc C');
  const [th, setTh] = useState(85);
  const [pr, setPr] = useState(85);
  const [op, setOp] = useState(85);
  const [hy, setHy] = useState(90);

  const avg = Number(((th + pr + op + hy) / 4).toFixed(1));

  const handleCreateTest = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: TestRecord = {
      id: `t_${Date.now()}`,
      staffName,
      testTitle,
      targetRank,
      date: new Date().toISOString().slice(0, 10),
      scoreTheory: th,
      scorePractice: pr,
      scoreOperation: op,
      scoreHygiene: hy,
      averageScore: avg,
      passed: avg >= 80,
    };
    setTests(prev => [newRecord, ...prev]);
    setShowModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-700" />
            Đào Tạo & Sát Hạch Bậc Tay Nghề
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">Hồ sơ thi sát hạch lý thuyết, pha chế thực hành, vận hành máy và vệ sinh quầy.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" /> Tạo Đợt Chấm Thi
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tests.map(t => (
          <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md uppercase">
                  {t.targetRank}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 mt-1">{t.testTitle}</h3>
                <div className="text-xs text-slate-600 font-semibold mt-0.5">Nhân sự: {t.staffName}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-emerald-800 font-mono">{t.averageScore}</div>
                <div className="text-[10px] text-slate-400 font-mono">{t.date}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50">
                <div className="text-[10px] text-slate-400 font-bold">Lý thuyết</div>
                <div className="font-extrabold text-slate-800 font-mono mt-0.5">{t.scoreTheory}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <div className="text-[10px] text-slate-400 font-bold">Thực hành</div>
                <div className="font-extrabold text-slate-800 font-mono mt-0.5">{t.scorePractice}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <div className="text-[10px] text-slate-400 font-bold">Vận hành</div>
                <div className="font-extrabold text-slate-800 font-mono mt-0.5">{t.scoreOperation}</div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50">
                <div className="text-[10px] text-slate-400 font-bold">Vệ sinh</div>
                <div className="font-extrabold text-slate-800 font-mono mt-0.5">{t.scoreHygiene}</div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className={`inline-flex items-center gap-1 font-bold ${t.passed ? 'text-emerald-700' : 'text-rose-600'}`}>
                <CheckCircle2 className="w-4 h-4" /> {t.passed ? 'ĐẠT TIÊU CHUẨN XẾP BẬC' : 'CHƯA ĐẠT'}
              </span>
              <span className="text-[11px] text-slate-400">Đã lưu hồ sơ HR</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900">Chấm Điểm Thi Nâng Bậc</h3>
              <button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreateTest} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nhân sự dự thi</label>
                <input 
                  type="text" 
                  value={staffName} 
                  onChange={e => setStaffName(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" 
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên bài sát hạch</label>
                <input 
                  type="text" 
                  value={testTitle} 
                  onChange={e => setTestTitle(e.target.value)} 
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lý thuyết (0-100)</label>
                  <input type="number" value={th} onChange={e => setTh(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Thực hành pha chế</label>
                  <input type="number" value={pr} onChange={e => setPr(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vận hành máy POS/Bar</label>
                  <input type="number" value={op} onChange={e => setOp(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Vệ sinh an toàn</label>
                  <input type="number" value={hy} onChange={e => setHy(Number(e.target.value))} className="w-full border border-slate-200 rounded-xl px-3 py-2 outline-none" />
                </div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-emerald-900">Điểm trung bình cộng:</span>
                <span className="text-base font-black text-emerald-800 font-mono">{avg}/100</span>
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-3.5 py-2 border border-slate-200 rounded-xl font-bold text-slate-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-emerald-800 text-white rounded-xl font-bold shadow-xs hover:bg-emerald-700">Lưu kết quả</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
