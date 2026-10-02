'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, ROLE_LABELS } from '@/lib/auth-context';
import api from '@/lib/api';
import type { components } from '@/lib/api-contract.generated';
import { 
  Calculator, CircleDashed, DollarSign,
  LogOut, PiggyBank,
  ArrowUpRight, ArrowDownRight, Filter,
} from 'lucide-react';

type CashFlowRow = components['schemas']['CashFlowResponseDto'];
type CashFlowSummary = components['schemas']['CashFlowSummaryResponseDto'];
type CashFlowPage = { data?: CashFlowRow[] };

const EMPTY_SUMMARY: CashFlowSummary = {
  totalIncome: 0,
  totalExpense: 0,
  netCashFlow: 0,
  groupedByDate: {},
};

export default function AccountantPortalPage() {
  const { user, logout } = useAuth();
  const [cashFlows, setCashFlows] = useState<CashFlowRow[]>([]);
  const [summary, setSummary] = useState<CashFlowSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const plannedModules = [
    { label: 'Doanh thu & drill-down', roadmap: 'BI-01' },
    { label: 'Kỳ lương & phê duyệt', roadmap: 'HR-02' },
    { label: 'Báo cáo tài chính', roadmap: 'FIN-03' },
  ];

  const loadCashFlow = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 6);
      const startDateKey = startDate.toISOString().slice(0, 10);
      const query = `startDate=${startDateKey}&limit=100`;
      const [cashFlowResponse, summaryResponse] = await Promise.all([
        api.get<CashFlowPage>(`/finance/cash-flows?${query}`),
        api.get<CashFlowSummary>(`/finance/summary?startDate=${startDateKey}`),
      ]);
      setCashFlows(cashFlowResponse.data.data ?? []);
      setSummary(summaryResponse.data);
    } catch {
      setCashFlows([]);
      setSummary(EMPTY_SUMMARY);
      setLoadError('Không thể tải dữ liệu quỹ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCashFlow();
  }, []);

  const handleExportCsv = () => {
    const rows = [
      ['ID', 'Ngay', 'Noi dung', 'Loai', 'Chi nhanh', 'Nguon', 'So tien'],
      ...cashFlows.map((cashFlow) => [
        cashFlow.id,
        new Date(cashFlow.createdAt).toLocaleDateString('vi-VN'),
        cashFlow.description,
        cashFlow.type,
        cashFlow.branch?.name ?? cashFlow.branchId,
        cashFlow.refType ?? '',
        String(cashFlow.amount),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'teap-cash-flow.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalIncome = summary.totalIncome;
  const totalExpense = summary.totalExpense;
  const netCash = summary.netCashFlow;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="app-sidebar flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4 lg:p-5">
            <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-700 text-white flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">TeaP Kế toán</div>
              <div className="text-[11px] text-emerald-200">Quỹ & Thu chi</div>
            </div>
            </div>
            <button
              type="button"
              onClick={() => void logout()}
              aria-label="Đăng xuất"
              title="Đăng xuất"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 lg:hidden"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <nav className="p-3 space-y-1">
            <div className="hidden lg:block px-3 py-2 text-xs font-semibold text-emerald-200">
              Nghiệp vụ tài chính
            </div>
            <div aria-current="page" className="flex w-full items-center gap-3 rounded-lg bg-white px-3 py-2.5 text-sm font-medium text-emerald-950">
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              <div>
                <div>Quỹ lưu động</div>
                <div className="text-[11px] text-sky-800">Thu chi đã ghi nhận</div>
              </div>
            </div>
          </nav>

          <div className="mx-4 hidden rounded-xl border border-white/10 bg-white/5 p-3 lg:block">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              <CircleDashed className="h-3.5 w-3.5" aria-hidden="true" />
              Chưa đủ sổ nghiệp vụ
            </div>
            <ul className="mt-2 space-y-2">
              {plannedModules.map((module) => (
                <li key={module.label} className="flex items-center justify-between gap-3 text-[11px] text-slate-400">
                  <span>{module.label}</span>
                  <span className="shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[9px] text-amber-300">{module.roadmap}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="hidden lg:block p-4 border-t border-white/10 bg-black/10">
          <div className="mb-3">
            <div className="text-sm font-semibold text-white truncate">
              {user?.fullName || 'Kế toán viên'}
            </div>
            <div className="text-[11px] text-emerald-200">
              {ROLE_LABELS[user?.role || 'ACCOUNTANT']}
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white hover:bg-white/10 border border-white/15 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Nội dung chính */}
      <main className="app-content flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quản lý tài chính</h2>
              <p className="text-xs text-slate-500">Theo dõi thu chi, doanh thu & bảng lương</p>
            </div>
          <div className="hidden sm:block text-xs text-slate-500 numeric">
              {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="p-3 sm:p-6 flex-1">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="space-y-6">
              {/* Thẻ tổng quan */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md">
                      Tổng thu
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    {totalIncome.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">7 ngày gần nhất</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded-md">
                      Tổng chi
                    </span>
                    <ArrowDownRight className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 mt-2">
                    {totalExpense.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">7 ngày gần nhất</div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-md">
                      Chênh lệch
                    </span>
                    <PiggyBank className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className={`text-2xl font-bold mt-2 ${netCash >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {netCash >= 0 ? '+' : ''}{netCash.toLocaleString('vi-VN')} đ
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">Lưu động ròng</div>
                </div>
              </div>

              {/* Bộ lọc */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Filter className="w-4 h-4" />
                  <span className="font-semibold">Dữ liệu thật trong 7 ngày gần nhất</span>
                </div>
                <button onClick={handleExportCsv} disabled={cashFlows.length === 0} className="ml-auto px-4 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
                  Xuất CSV
                </button>
              </div>

              {/* Bảng lưu chuyển quỹ */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Sổ quỹ nội bộ</div>
                <div className="text-xs text-slate-400">{cashFlows.length} phiếu</div>
              </div>
              {loadError && (
                <div className="m-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                  {loadError}{' '}
                  <button onClick={() => void loadCashFlow()} className="font-bold underline">Thử lại</button>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <th className="text-left px-5 py-3">Mã phiếu</th>
                      <th className="text-left px-5 py-3">Ngày</th>
                      <th className="text-left px-5 py-3">Nội dung</th>
                      <th className="text-left px-5 py-3">Loại</th>
                      <th className="text-left px-5 py-3">Chi nhánh</th>
                      <th className="text-left px-5 py-3">Nguồn</th>
                      <th className="text-right px-5 py-3">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cashFlows.map((cf) => (
                      <tr key={cf.id} className="hover:bg-slate-50">
                        <td className="px-5 py-3 font-mono text-xs text-slate-500">{cf.id}</td>
                        <td className="px-5 py-3 text-xs text-slate-700">{new Date(cf.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td className="px-5 py-3 text-slate-900">{cf.description}</td>
                        <td className="px-5 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                            cf.type === 'INCOME' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {cf.type === 'INCOME' ? 'Thu' : 'Chi'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">{cf.branch?.name ?? cf.branchId}</td>
                        <td className="px-5 py-3 text-xs text-slate-500">{cf.refType ?? 'OTHER'}</td>
                        <td className={`px-5 py-3 text-right font-semibold ${cf.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {cf.type === 'INCOME' ? '+' : '-'}{cf.amount.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                    {!loading && !loadError && cashFlows.length === 0 && (
                      <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">Chưa có phiếu thu chi trong 7 ngày gần nhất.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
