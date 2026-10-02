import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import ProtectedApp from './protected-app';

export const metadata: Metadata = {
  title: 'TeaP — Hệ thống Quản trị & Bán hàng',
  description: 'ERP/POS for Bubble Tea Chain',
};

export const viewport: Viewport = {
  themeColor: '#123126',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-50">
        <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
        <AuthProvider>
          <div id="main-content" tabIndex={-1}>
            <ProtectedApp>{children}</ProtectedApp>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
