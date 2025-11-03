'use client';

/**
 * Organization Navbar Component
 *
 * Industry Standard Pattern (Linear, Notion, Slack, GitHub):
 * - Shows current page title (not organization name - that's in sidebar)
 * - Organization name is already visible in sidebar switcher
 * - Keeps navbar clean and focused on current context
 */

import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

// Map routes to page titles
const getPageTitle = (pathname: string): string => {
  if (pathname === '/dashboard') return 'Ana Sayfa';
  if (pathname.startsWith('/dashboard/orders')) return 'Siparişler';
  if (pathname.startsWith('/dashboard/customers')) return 'Müşteriler';
  if (pathname.startsWith('/dashboard/products')) return 'Ürünler';
  if (pathname.startsWith('/dashboard/analytics')) return 'Analitik';
  if (pathname.startsWith('/dashboard/insights')) return 'İçgörüler';
  if (pathname.startsWith('/dashboard/settings')) return 'Ayarlar';
  if (pathname.startsWith('/organizations/create'))
    return 'Organizasyon Oluştur';
  if (pathname.startsWith('/organizations')) return 'Organizasyonlar';
  return 'Ana Sayfa';
};

export function OrgNavbar() {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className='flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16'>
      <div className='flex w-full items-center gap-2 px-4'>
        <SidebarTrigger className='-ml-1 cursor-pointer' />
        <Separator orientation='vertical' className='mr-2 h-4' />
        <h1 className='text-lg font-semibold'>{pageTitle}</h1>
      </div>
    </header>
  );
}
