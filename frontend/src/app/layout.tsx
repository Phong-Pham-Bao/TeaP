import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'TeaP — Hệ thống Quản trị & Bán hàng Chuỗi Trà Sữa',
  description: 'ERP/POS System for Multi-branch Bubble Tea Chain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-emerald-200">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
