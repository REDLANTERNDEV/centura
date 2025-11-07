'use client';

import { useState } from 'react';
import {
  Home,
  ShoppingBag,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import { toast } from 'sonner';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from '@/components/ui/sidebar';
import OrganizationSwitcher from './OrganizationSwitcher';

// Menu items for ERP/CRM
const items = [
  {
    title: 'Ana Sayfa',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Siparişler',
    url: '/dashboard/orders',
    icon: ShoppingBag,
  },
  {
    title: 'Müşteriler',
    url: '/dashboard/customers',
    icon: Users,
  },
  {
    title: 'Ürünler',
    url: '/dashboard/products',
    icon: Package,
  },
  {
    title: 'Analitik',
    url: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    title: 'Ayarlar',
    url: '/dashboard/settings',
    icon: Settings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent double-clicks

    setIsLoggingOut(true);

    try {
      // Clear organization context before logout
      localStorage.removeItem('centura_selected_org_id');
      delete apiClient.defaults.headers.common['X-Organization-ID'];

      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      toast.success('Başarıyla çıkış yapıldı');

      // Use window.location for reliable redirect
      if (globalThis.window) {
        globalThis.window.location.href = '/login';
      } else {
        router.push('/login');
      }
    } catch {
      toast.error('Çıkış yapılamadı');
      setIsLoggingOut(false);
    }
  };

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <OrganizationSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menü</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map(item => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              className='cursor-pointer'
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                <LogOut />
              )}
              <span>{isLoggingOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
