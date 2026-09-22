'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { LoginHeroPanel } from './components/login-hero-panel';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@teap.vn');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { accessToken, user } = res.data;
      login(accessToken, user);

      if (user.role === 'CASHIER') {
        router.push('/pos');
      } else if (user.role === 'MANAGER') {
        router.push('/manager');
      } else if (user.role === 'HR') {
        router.push('/staff');
      } else if (user.role === 'WAREHOUSE_STAFF') {
        router.push('/warehouse');
      } else if (user.role === 'KITCHEN') {
        router.push('/kitchen');
      } else {
        router.push('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <LoginHeroPanel currentEmail={email} onSelectAccount={quickLogin} />

      {/* Login Form Panel */}
      <div className="md:w-7/12 flex items-center justify-center p-8 md:p-16">
        <div className="max-w-md w-full">
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-slate-800">Đăng nhập tài khoản</h3>
            <p className="text-sm text-slate-500 mt-1">
              Nhập thông tin hoặc bấm chọn 1 tài khoản ở bên trái để trải nghiệm ngay.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Email đăng nhập
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition shadow-sm"
                placeholder="ten@teap.vn"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition shadow-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Vào hệ thống</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Bạn là khách hàng thân thiết?</span>
            <Link
              href="/customer"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1"
            >
              <span>Tra cứu Điểm & Hóa đơn &rarr;</span>
            </Link>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
            Hệ thống TeaP ERP/POS &bull; Đồ án tốt nghiệp Công nghệ Thông tin
          </div>
        </div>
      </div>
    </div>
  );
}
