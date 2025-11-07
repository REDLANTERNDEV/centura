'use client';

/**
 * Dashboard Layout Content
 *
 * Industry Standard Pattern (Slack, Salesforce, HubSpot, Linear):
 * 1. Show ONLY organization selector (full-screen) when no org selected
 * 2. Show sidebar + navbar ONLY after organization is selected
 *
 * This prevents:
 * - Sidebar appearing before organization selection
 * - Mobile-like constrained views on desktop
 * - Users accessing features before selecting organization
 *
 * Sidebar Behavior:
 * - First visit: Open by default
 * - After that: Remembers user's last preference (stored in cookie by shadcn/ui)
 */

import React, { useEffect, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { OrgNavbar } from '@/components/org-navbar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { useOrganization } from '@/lib/contexts/OrganizationContext';

interface DashboardLayoutContentProps {
  readonly children: React.ReactNode;
}

export default function DashboardLayoutContent({
  children,
}: Readonly<DashboardLayoutContentProps>) {
  const { selectedOrganization, isLoading } = useOrganization();
  const [defaultOpen, setDefaultOpen] = useState<boolean | undefined>(
    undefined
  );

  // Check if user has a sidebar preference from cookie
  useEffect(() => {
    // shadcn/ui sidebar uses 'sidebar_state' cookie
    const getCookie = (name: string) => {
      const cookies = document.cookie.split(';');
      const cookie = cookies.find(c => c.trim().startsWith(`${name}=`));
      return cookie ? cookie.split('=')[1] : null;
    };

    const sidebarState = getCookie('sidebar_state');

    if (sidebarState) {
      // User has a preference - use it
      setDefaultOpen(sidebarState === 'true');
    } else {
      // First visit - default to open
      setDefaultOpen(true);
    }
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  // If no organization selected, show ONLY the children (OrganizationSelector)
  // WITHOUT sidebar or navbar - full screen experience
  if (!selectedOrganization) {
    return <>{children}</>;
  }

  // Once organization is selected, show full dashboard layout with sidebar + navbar
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <main className='flex-1 w-full overflow-x-hidden'>
        <OrgNavbar />
        <div className='w-full max-w-[100vw] mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 2xl:px-8'>
          {children}
        </div>
      </main>
    </SidebarProvider>
  );
}
