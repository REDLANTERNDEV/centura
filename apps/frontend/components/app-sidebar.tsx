'use client';
/* eslint-disable no-console */
import {
  Home,
  ShoppingBag,
  Users,
  Package,
  BarChart3,
  Settings,
  LogOut,
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

  const handleLogout = async () => {
    try {
      // Clear organization context before logout
      localStorage.removeItem('centura_selected_org_id');
      delete apiClient.defaults.headers.common['X-Organization-ID'];

      await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
      toast.success('Başarıyla çıkış yapıldı');
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Çıkış yapılamadı');
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
            >
              <LogOut />
              <span>Çıkış Yap</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
