import { OrganizationProvider } from '@/lib/contexts/OrganizationContext';
import DashboardLayoutContent from '@/components/DashboardLayoutContent';
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
    <OrganizationProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </OrganizationProvider>
  );
}
