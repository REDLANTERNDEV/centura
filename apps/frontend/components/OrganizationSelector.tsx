'use client';
 

/**
 * Organization Selector Component
 *
 * Industry Standard Pattern (Slack, Linear, Vercel, GitHub):
 * - Full-screen experience before entering workspace
 * - Clear visual hierarchy
 * - One-click organization selection
 * - Prominent "Create" option for new organizations
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, ArrowRight } from 'lucide-react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import { useRouter } from 'next/navigation';

export default function OrganizationSelector() {
  const { organizations, selectOrganization, isLoading } = useOrganization();
  const router = useRouter();

  const handleSelectOrg = (org: any) => {
    selectOrganization(org);
    // State change triggers re-render, no manual navigation needed
  };

  const handleCreateOrg = () => {
    router.replace('/organizations/create');
  };

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'></div>
          <p className='mt-4 text-muted-foreground'>
            Organizasyonlar yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4'>
      <div className='w-full max-w-2xl'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4'>
            <Building2 className='h-8 w-8 text-primary-foreground' />
          </div>
          <h1 className='text-3xl font-bold tracking-tight mb-2'>
            Organizasyon Seçin
          </h1>
          <p className='text-muted-foreground'>
            Çalışma alanınıza erişmek için bir organizasyon seçin
          </p>
        </div>

        {/* Organizations List */}
        {organizations.length > 0 && (
          <div className='space-y-2 mb-6'>
            {organizations.map(org => (
              <button
                key={org.id}
                onClick={() => handleSelectOrg(org)}
                className='w-full text-left'
              >
                <Card className='transition-all hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] cursor-pointer'>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10'>
                          <Building2 className='h-6 w-6 text-primary' />
                        </div>
                        <div className='flex-1'>
                          <h3 className='font-semibold text-base'>
                            {org.name || org.org_name}
                          </h3>
                          {org.role && (
                            <p className='text-sm text-muted-foreground mt-0.5'>
                              {org.role
                                .replace('org_', '')
                                .replace('_', ' ')
                                .charAt(0)
                                .toUpperCase() +
                                org.role
                                  .replace('org_', '')
                                  .replace('_', ' ')
                                  .slice(1)}
                            </p>
                          )}
                        </div>
                      </div>
                      <ArrowRight className='h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors' />
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* Create New Organization */}
        {organizations.length > 0 ? (
          <Button
            onClick={handleCreateOrg}
            variant='outline'
            className='w-full h-14 text-base'
            size='lg'
          >
            <Plus className='h-5 w-5 mr-2' />
            Yeni Organizasyon Oluştur
          </Button>
        ) : (
          <Card className='border-dashed border-2'>
            <CardHeader className='text-center pb-4'>
              <div className='inline-flex h-12 w-12 items-center justify-center rounded-xl bg-muted mx-auto mb-3'>
                <Building2 className='h-6 w-6 text-muted-foreground' />
              </div>
              <CardTitle className='text-xl'>Henüz Organizasyon Yok</CardTitle>
              <CardDescription className='text-base'>
                İşletmenizi yönetmeye başlamak için ilk organizasyonunuzu
                oluşturun
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-0'>
              <Button
                onClick={handleCreateOrg}
                className='w-full h-12'
                size='lg'
              >
                <Plus className='h-5 w-5 mr-2' />
                İlk Organizasyonunuzu Oluşturun
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
