/**
 * Edit Customer Dialog Component
 * Professional customer editing form with pre-filled data
 */

'use client';
 

import { useState, useEffect } from 'react';
import { updateCustomer, Customer } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface EditCustomerDialogProps {
  readonly customer: Customer | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

export function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
  onSuccess,
}: EditCustomerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    country: '',
    postal_code: '',
    tax_number: '',
    tax_office: '',
    segment: 'Standard',
    customer_type: 'Individual',
    payment_terms: '',
    credit_limit: '',
    is_active: true,
    notes: '',
  });

  // Populate form when customer changes
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        email: customer.email || '',
        phone: customer.phone || '',
        mobile: customer.mobile || '',
        address: customer.address || '',
        city: customer.city || '',
        country: customer.country || '',
        postal_code: customer.postal_code || '',
        tax_number: customer.tax_number || '',
        tax_office: customer.tax_office || '',
        segment: customer.segment || 'Standard',
        customer_type: customer.customer_type || 'Individual',
        payment_terms: customer.payment_terms?.toString() || '',
        credit_limit: customer.credit_limit?.toString() || '',
        is_active: customer.is_active ?? true,
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customer) return;

    // Validation
    if (!formData.name.trim()) {
      toast.error('Müşteri adı zorunludur');
      return;
    }

    setIsSubmitting(true);
    try {
      const customerData: any = {
        name: formData.name.trim(),
        segment: formData.segment,
        customer_type: formData.customer_type,
        is_active: formData.is_active,
      };

      // Optional fields
      if (formData.email.trim()) customerData.email = formData.email.trim();
      else customerData.email = null;

      if (formData.phone.trim()) customerData.phone = formData.phone.trim();
      else customerData.phone = null;

      if (formData.mobile.trim()) customerData.mobile = formData.mobile.trim();
      else customerData.mobile = null;

      if (formData.address.trim())
        customerData.address = formData.address.trim();
      else customerData.address = null;

      if (formData.city.trim()) customerData.city = formData.city.trim();
      else customerData.city = null;

      if (formData.country.trim())
        customerData.country = formData.country.trim();
      else customerData.country = null;

      if (formData.postal_code.trim())
        customerData.postal_code = formData.postal_code.trim();
      else customerData.postal_code = null;

      if (formData.tax_number.trim())
        customerData.tax_number = formData.tax_number.trim();
      else customerData.tax_number = null;

      if (formData.tax_office.trim())
        customerData.tax_office = formData.tax_office.trim();
      else customerData.tax_office = null;

      if (formData.notes.trim()) customerData.notes = formData.notes.trim();
      else customerData.notes = null;

      // Numeric fields
      if (formData.payment_terms) {
        customerData.payment_terms = Number.parseInt(formData.payment_terms);
      } else {
        customerData.payment_terms = null;
      }

      if (formData.credit_limit) {
        customerData.credit_limit = Number.parseFloat(formData.credit_limit);
      } else {
        customerData.credit_limit = null;
      }

      await updateCustomer(customer.customer_id.toString(), customerData);
      toast.success('Müşteri başarıyla güncellendi');

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Müşteri güncellenemedi', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <Save className='h-5 w-5' />
            Müşteriyi Düzenle
          </DialogTitle>
          <DialogDescription>
            Müşteri bilgilerini güncelle • Kod: {customer.customer_code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>Temel Bilgiler</h3>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <Label htmlFor='name'>
                  Müşteri Adı <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={e => handleInputChange('name', e.target.value)}
                  placeholder='Müşteri adını girin'
                  required
                />
              </div>

              <div>
                <Label htmlFor='segment'>Segment</Label>
                <Select
                  value={formData.segment}
                  onValueChange={value => handleInputChange('segment', value)}
                >
                  <SelectTrigger id='segment'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='VIP'>VIP</SelectItem>
                    <SelectItem value='Premium'>Premium</SelectItem>
                    <SelectItem value='Standard'>Standart</SelectItem>
                    <SelectItem value='Basic'>Temel</SelectItem>
                    <SelectItem value='Potential'>Potansiyel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='customer_type'>Müşteri Tipi</Label>
                <Select
                  value={formData.customer_type}
                  onValueChange={value =>
                    handleInputChange('customer_type', value)
                  }
                >
                  <SelectTrigger id='customer_type'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Corporate'>Kurumsal</SelectItem>
                    <SelectItem value='Individual'>Bireysel</SelectItem>
                    <SelectItem value='Government'>Devlet</SelectItem>
                    <SelectItem value='Other'>Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='sm:col-span-2'>
                <Label htmlFor='is_active'>Durum</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={value =>
                    handleInputChange('is_active', value === 'active')
                  }
                >
                  <SelectTrigger id='is_active'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='active'>Aktif</SelectItem>
                    <SelectItem value='inactive'>Pasif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>İletişim Bilgileri</h3>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='email'>E-posta</Label>
                <Input
                  id='email'
                  type='email'
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  placeholder='ornek@email.com'
                />
              </div>

              <div>
                <Label htmlFor='phone'>Telefon</Label>
                <Input
                  id='phone'
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  placeholder='+90 (555) 123-4567'
                />
              </div>

              <div>
                <Label htmlFor='mobile'>Mobil</Label>
                <Input
                  id='mobile'
                  value={formData.mobile}
                  onChange={e => handleInputChange('mobile', e.target.value)}
                  placeholder='+90 (555) 123-4567'
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>Adres Bilgileri</h3>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div className='sm:col-span-2'>
                <Label htmlFor='address'>Adres</Label>
                <Input
                  id='address'
                  value={formData.address}
                  onChange={e => handleInputChange('address', e.target.value)}
                  placeholder='Sokak adresi'
                />
              </div>

              <div>
                <Label htmlFor='city'>Şehir</Label>
                <Input
                  id='city'
                  value={formData.city}
                  onChange={e => handleInputChange('city', e.target.value)}
                  placeholder='Şehir'
                />
              </div>

              <div>
                <Label htmlFor='country'>Ülke</Label>
                <Input
                  id='country'
                  value={formData.country}
                  onChange={e => handleInputChange('country', e.target.value)}
                  placeholder='Ülke'
                />
              </div>

              <div>
                <Label htmlFor='postal_code'>Posta Kodu</Label>
                <Input
                  id='postal_code'
                  value={formData.postal_code}
                  onChange={e =>
                    handleInputChange('postal_code', e.target.value)
                  }
                  placeholder='12345'
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Tax Information */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>Vergi Bilgileri</h3>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='tax_number'>Vergi Numarası</Label>
                <Input
                  id='tax_number'
                  value={formData.tax_number}
                  onChange={e =>
                    handleInputChange('tax_number', e.target.value)
                  }
                  placeholder='1234567890'
                />
              </div>

              <div>
                <Label htmlFor='tax_office'>Vergi Dairesi</Label>
                <Input
                  id='tax_office'
                  value={formData.tax_office}
                  onChange={e =>
                    handleInputChange('tax_office', e.target.value)
                  }
                  placeholder='Vergi dairesi adı'
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Information */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>Mali Bilgiler</h3>
            <div className='grid gap-4 sm:grid-cols-2'>
              <div>
                <Label htmlFor='payment_terms'>Ödeme Vadesi (gün)</Label>
                <Input
                  id='payment_terms'
                  type='number'
                  value={formData.payment_terms}
                  onChange={e =>
                    handleInputChange('payment_terms', e.target.value)
                  }
                  placeholder='30'
                  min='0'
                />
              </div>

              <div>
                <Label htmlFor='credit_limit'>Kredi Limiti (₺)</Label>
                <Input
                  id='credit_limit'
                  type='number'
                  value={formData.credit_limit}
                  onChange={e =>
                    handleInputChange('credit_limit', e.target.value)
                  }
                  placeholder='10000.00'
                  min='0'
                  step='0.01'
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className='space-y-4'>
            <h3 className='text-sm font-semibold'>Ek Notlar</h3>
            <div>
              <Label htmlFor='notes'>Notlar</Label>
              <Textarea
                id='notes'
                value={formData.notes}
                onChange={e => handleInputChange('notes', e.target.value)}
                placeholder='Ek not veya açıklama ekleyin...'
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className='h-4 w-4 mr-2' />
                  Değişiklikleri Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
