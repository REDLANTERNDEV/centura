'use client';
 

/**
 * Organization Switcher Component
 *
 * Dropdown to switch between organizations (shown in header/sidebar)
 * Uses shadcn/ui DropdownMenu component with SidebarMenu for proper icon mode support
 */

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import { useRouter } from 'next/navigation';

export default function OrganizationSwitcher() {
  const { selectedOrganization, organizations, selectOrganization } =
    useOrganization();
  const router = useRouter();

  const handleSelectOrg = (org: any) => {
    if (org.id !== selectedOrganization?.id) {
      selectOrganization(org);
      router.refresh(); // Refresh to reload data for new org
    }
  };

  const handleCreateOrg = () => {
    router.push('/organizations/create');
  };

  if (!selectedOrganization) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              tooltip={
                selectedOrganization.name ||
                selectedOrganization.org_name ||
                'Organizasyon'
              }
            >
              <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
                <Building2 className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>
                  {selectedOrganization.name ||
                    selectedOrganization.org_name ||
                    'Organizasyon'}
                </span>
                {selectedOrganization.role && (
                  <span className='truncate text-xs text-muted-foreground'>
                    {selectedOrganization.role
                      .replace('org_', '')
                      .replace('_', ' ')}
                  </span>
                )}
              </div>
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
            align='start'
            side='bottom'
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-xs text-muted-foreground'>
              Organizasyonlar
            </DropdownMenuLabel>
            {organizations.map(org => (
              <DropdownMenuItem
                key={org.id}
                onSelect={() => handleSelectOrg(org)}
                className='cursor-pointer gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-sm border'>
                  <Building2 className='size-4 shrink-0' />
                </div>
                <div className='flex-1 truncate'>
                  <div className='font-medium truncate'>
                    {org.name || org.org_name}
                  </div>
                  {org.role && (
                    <div className='text-xs text-muted-foreground'>
                      {org.role.replace('org_', '').replace('_', ' ')}
                    </div>
                  )}
                </div>
                {selectedOrganization.id === org.id && (
                  <Check className='size-4 shrink-0' />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleCreateOrg}
              className='cursor-pointer gap-2 p-2'
            >
              <div className='flex size-6 items-center justify-center rounded-md border border-dashed bg-background'>
                <Plus className='size-4' />
              </div>
              <div className='font-medium text-muted-foreground'>
                Organizasyon Oluştur
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
