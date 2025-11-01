import { AppSidebar } from '@/components/app-sidebar';
import { OrgNavbar } from '@/components/org-navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Dashboard | Centura ERP',
  description: 'Centura ERP Dashboard - İşletme yönetim paneli',
};

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <div className='dashboard-container'>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
        defaultOpen={defaultOpen}
      >
        <AppSidebar />
        <main className='dashboard-main'>
          <OrgNavbar />
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
