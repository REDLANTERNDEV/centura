'use client';

/**
 * Dashboard Layout with Sidebar
 * Professional ERP/CRM layout using shadcn/ui Sidebar component
 * Similar to Salesforce, HubSpot, Monday.com
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import OrganizationSwitcher from '@/components/OrganizationSwitcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className='border-b px-4 py-4'>
        <Link href='/dashboard' className='flex items-center gap-2'>
          <div className='h-8 w-8 rounded-lg bg-primary flex items-center justify-center'>
            <span className='text-white font-bold text-lg'>C</span>
          </div>
          <span className='font-semibold text-lg'>Centura ERP</span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className='px-4 py-4'>
            <OrganizationSwitcher />
          </div>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map(item => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.name}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={item.href}>
                        <Icon className='h-5 w-5' />
                        <span>{item.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='border-t'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href='/logout'>
                <LogOut className='h-5 w-5' />
                <span>Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { selectedOrganization } = useOrganization();

  // Don't show layout until organization is selected
  if (!selectedOrganization) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className='flex h-screen w-full'>
        <AppSidebar />
        <main className='flex flex-1 flex-col overflow-hidden'>
          {/* Header */}
          <header className='flex h-16 items-center gap-4 border-b bg-background px-6'>
            <SidebarTrigger />
            <div className='flex items-center gap-4 ml-auto'>
              <div className='text-sm text-muted-foreground'>
                {selectedOrganization.name}
              </div>
            </div>
          </header>

          {/* Page content */}
          <div className='flex-1 overflow-y-auto p-6'>{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
