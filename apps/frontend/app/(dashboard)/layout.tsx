import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Centura ERP',
  description: 'Centura ERP Dashboard - İşletme yönetim paneli',
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='dashboard-container'>
      <main className='dashboard-main'>{children}</main>
    </div>
  );
}
