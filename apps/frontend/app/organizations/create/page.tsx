'use client';
/* eslint-disable no-console */

/**
 * Create Organization Page
 *
 * Industry Standard Pattern (Linear, Slack, Vercel, Notion):
 * - Full-screen experience (no sidebar/navbar)
 * - Focused on single task (creating organization)
 * - Clean, minimal design
 * - Clear call-to-action
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, API_ENDPOINTS } from '@/lib/api-client';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  ArrowLeft,
  Loader2,
  Sparkles,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { fetchOrganizations } = useOrganization();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    org_name: '',
    industry: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Turkey',
    tax_number: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.org_name.trim()) {
      toast.error('Organizasyon adı zorunludur');
      return;
    }

    try {
      setIsLoading(true);

      const payload: Record<string, string> = {
        org_name: formData.org_name.trim(),
      };

      // Add optional fields only if they have values
      if (formData.industry.trim()) payload.industry = formData.industry.trim();
      if (formData.phone.trim()) payload.phone = formData.phone.trim();
      if (formData.email.trim()) payload.email = formData.email.trim();
      if (formData.address.trim()) payload.address = formData.address.trim();
      if (formData.city.trim()) payload.city = formData.city.trim();
      if (formData.country.trim()) payload.country = formData.country.trim();
      if (formData.tax_number.trim())
        payload.tax_number = formData.tax_number.trim();

      await apiClient.post(API_ENDPOINTS.ORGANIZATIONS.CREATE, payload);

      toast.success('Organizasyon başarıyla oluşturuldu!');

      // Refresh organizations list
      await fetchOrganizations();

      // Navigate back to dashboard (selector will show if needed)
      router.replace('/dashboard');
    } catch (error) {
      console.error('❌ Failed to create organization:', error);
      toast.error(
        error instanceof Error ? error.message : 'Organizasyon oluşturulamadı'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4'>
      <div className='w-full max-w-2xl'>
        {/* Back Button */}
        <Button
          variant='ghost'
          onClick={() => router.replace('/dashboard')}
          className='mb-6'
          disabled={isLoading}
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Organizasyonlara Dön
        </Button>

        {/* Header */}
        <div className='text-center mb-8'>
          <div className='inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary mb-4'>
            <Building2 className='h-8 w-8 text-primary-foreground' />
          </div>
          <h1 className='text-3xl font-bold tracking-tight mb-2'>
            Organizasyon Oluştur
          </h1>
          <p className='text-muted-foreground text-lg'>
            Ekibiniz için yeni bir çalışma alanı oluşturun
          </p>
        </div>

        {/* Form Card */}
        <Card className='border-2'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-primary' />
              Organizasyon Detayları
            </CardTitle>
            <CardDescription>
              Organizasyonunuza bir ad verin ve ayarları özelleştirin
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-5'>
              {/* Organization Name */}
              <div className='space-y-2'>
                <Label htmlFor='org_name' className='text-base'>
                  Organizasyon Adı *
                </Label>
                <Input
                  id='org_name'
                  name='org_name'
                  placeholder='Acme Şirketi'
                  value={formData.org_name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                  className='h-11 text-base'
                  autoFocus
                />
                <p className='text-sm text-muted-foreground'>
                  Organizasyonunuzun resmi adı
                </p>
              </div>

              {/* Industry */}
              <div className='space-y-2'>
                <Label htmlFor='industry' className='text-base'>
                  Sektör
                </Label>
                <Input
                  id='industry'
                  name='industry'
                  placeholder='Örn: Teknoloji, Sağlık, Perakende'
                  value={formData.industry}
                  onChange={handleChange}
                  disabled={isLoading}
                  className='h-11 text-base'
                />
                <p className='text-sm text-muted-foreground'>
                  Opsiyonel: İşletmenizin faaliyet gösterdiği sektör
                </p>
              </div>

              {/* Contact Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Phone */}
                <div className='space-y-2'>
                  <Label
                    htmlFor='phone'
                    className='text-base flex items-center gap-2'
                  >
                    <Phone className='h-4 w-4 text-muted-foreground' />
                    Telefon
                  </Label>
                  <Input
                    id='phone'
                    name='phone'
                    type='tel'
                    placeholder='+90 212 555 0000'
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                    className='h-11 text-base'
                  />
                </div>

                {/* Email */}
                <div className='space-y-2'>
                  <Label
                    htmlFor='email'
                    className='text-base flex items-center gap-2'
                  >
                    <Mail className='h-4 w-4 text-muted-foreground' />
                    E-posta
                  </Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    placeholder='iletisim@acme.com'
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    className='h-11 text-base'
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* City */}
                <div className='space-y-2'>
                  <Label
                    htmlFor='city'
                    className='text-base flex items-center gap-2'
                  >
                    <MapPin className='h-4 w-4 text-muted-foreground' />
                    Şehir
                  </Label>
                  <Input
                    id='city'
                    name='city'
                    placeholder='İstanbul'
                    value={formData.city}
                    onChange={handleChange}
                    disabled={isLoading}
                    className='h-11 text-base'
                  />
                </div>

                {/* Country */}
                <div className='space-y-2'>
                  <Label htmlFor='country' className='text-base'>
                    Ülke
                  </Label>
                  <Input
                    id='country'
                    name='country'
                    placeholder='Türkiye'
                    value={formData.country}
                    onChange={handleChange}
                    disabled={isLoading}
                    className='h-11 text-base'
                  />
                </div>
              </div>

              {/* Address */}
              <div className='space-y-2'>
                <Label htmlFor='address' className='text-base'>
                  Adres
                </Label>
                <Input
                  id='address'
                  name='address'
                  placeholder='Tam iş adresi'
                  value={formData.address}
                  onChange={handleChange}
                  disabled={isLoading}
                  className='h-11 text-base'
                />
                <p className='text-sm text-muted-foreground'>
                  Opsiyonel: Organizasyonunuzun fiziksel adresi
                </p>
              </div>

              {/* Tax Number */}
              <div className='space-y-2'>
                <Label htmlFor='tax_number' className='text-base'>
                  Vergi Numarası
                </Label>
                <Input
                  id='tax_number'
                  name='tax_number'
                  placeholder='Vergi kimlik numarası'
                  value={formData.tax_number}
                  onChange={handleChange}
                  disabled={isLoading}
                  className='h-11 text-base'
                />
                <p className='text-sm text-muted-foreground'>
                  Opsiyonel: Fatura ve vergi uyumluluğu için
                </p>
              </div>

              {/* Submit Buttons */}
              <div className='flex gap-3 pt-4'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => router.replace('/dashboard')}
                  disabled={isLoading}
                  className='flex-1 h-11'
                >
                  İptal
                </Button>
                <Button
                  type='submit'
                  disabled={isLoading || !formData.org_name.trim()}
                  className='flex-1 h-11'
                >
                  {isLoading ? (
                    <>
                      <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <Building2 className='h-4 w-4 mr-2' />
                      Organizasyon Oluştur
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className='text-center text-sm text-muted-foreground mt-6'>
          Otomatik olarak organizasyon sahibi olarak atanacaksınız
        </p>
      </div>
    </div>
  );
}
