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
    <header className='sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 max-w-full overflow-hidden'>
      <div className='flex w-full items-center gap-2 px-3 sm:px-4 max-w-full'>
        <SidebarTrigger className='-ml-1 cursor-pointer shrink-0' />
        <Separator orientation='vertical' className='mr-2 h-4 shrink-0' />
        <h1 className='text-sm sm:text-base lg:text-lg font-semibold truncate flex-1 min-w-0'>
          {pageTitle}
        </h1>
      </div>
    </header>
  );
}
