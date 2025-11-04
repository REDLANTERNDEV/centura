/**
 * Create Customer Dialog Component
 * Professional customer creation form with comprehensive validation
 */

'use client';

import { useState } from 'react';
import { createCustomer } from '@/lib/api-client';
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
import { Loader2, UserPlus } from 'lucide-react';

interface CreateCustomerDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

export function CreateCustomerDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCustomerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    customer_code: '',
    name: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    country: 'Turkey',
    postal_code: '',
    tax_number: '',
    tax_office: '',
    segment: 'Standard',
    customer_type: 'Individual',
    payment_terms: '',
    credit_limit: '',
    notes: '',
  });

  // Auto-generate customer code based on name and type (industry standard)
  const generateCustomerCode = (name: string, type: string): string => {
    if (!name.trim()) return '';

    // Get prefix based on customer type (industry standard)
    const prefixMap: Record<string, string> = {
      Corporate: 'CORP',
      Individual: 'IND',
      Government: 'GOV',
      Other: 'OTH',
    };

    const prefix = prefixMap[type] || 'CUST';

    // Extract initials from name (up to 3 characters)
    const nameParts = name.trim().toUpperCase().split(/\s+/);
    let nameCode = '';

    if (nameParts.length === 1) {
      // Single word: take first 3 characters
      nameCode = nameParts[0].substring(0, 3).replaceAll(/[^A-Z0-9]/g, '');
    } else {
      // Multiple words: take first letter of each word (up to 3)
      nameCode = nameParts
        .slice(0, 3)
        .map(part => part[0])
        .join('')
        .replaceAll(/[^A-Z0-9]/g, '');
    }

    // Add timestamp for uniqueness
    const timestamp = Date.now().toString().slice(-6);

    // Format: PREFIX-NAMECODE-TIMESTAMP (e.g., CORP-ABC-123456)
    return `${prefix}-${nameCode}-${timestamp}`;
  };

  const handleInputChange = (
    field: string,
    value: string | number | boolean
  ) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Auto-generate customer code when name or type changes
      if (field === 'name' || field === 'customer_type') {
        const newName = field === 'name' ? String(value) : prev.name;
        const newType =
          field === 'customer_type' ? String(value) : prev.customer_type;

        if (newName.trim()) {
          updated.customer_code = generateCustomerCode(newName, newType);
        }
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('Müşteri adı zorunludur');
      return;
    }

    if (!formData.customer_code.trim()) {
      toast.error('Müşteri kodu oluşturulamadı');
      return;
    }

    setIsSubmitting(true);
    try {
      const customerData: any = {
        customer_code: formData.customer_code.trim(),
        name: formData.name.trim(),
        segment: formData.segment,
        customer_type: formData.customer_type,
      };

      // Optional fields
      if (formData.email.trim()) customerData.email = formData.email.trim();
      if (formData.phone.trim()) customerData.phone = formData.phone.trim();
      if (formData.mobile.trim()) customerData.mobile = formData.mobile.trim();
      if (formData.address.trim())
        customerData.address = formData.address.trim();
      if (formData.city.trim()) customerData.city = formData.city.trim();
      if (formData.country.trim())
        customerData.country = formData.country.trim();
      if (formData.postal_code.trim())
        customerData.postal_code = formData.postal_code.trim();
      if (formData.tax_number.trim())
        customerData.tax_number = formData.tax_number.trim();
      if (formData.tax_office.trim())
        customerData.tax_office = formData.tax_office.trim();
      if (formData.notes.trim()) customerData.notes = formData.notes.trim();

      // Numeric fields
      if (formData.payment_terms) {
        customerData.payment_terms = Number.parseInt(formData.payment_terms);
      }
      if (formData.credit_limit) {
        customerData.credit_limit = Number.parseFloat(formData.credit_limit);
      }

      await createCustomer(customerData);
      toast.success('Müşteri başarıyla oluşturuldu');

      // Reset form
      setFormData({
        customer_code: '',
        name: '',
        email: '',
        phone: '',
        mobile: '',
        address: '',
        city: '',
        country: 'Turkey',
        postal_code: '',
        tax_number: '',
        tax_office: '',
        segment: 'Standard',
        customer_type: 'Individual',
        payment_terms: '',
        credit_limit: '',
        notes: '',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Müşteri oluşturulamadı', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <UserPlus className='h-5 w-5' />
            Yeni Müşteri Ekle
          </DialogTitle>
          <DialogDescription>
            Eksiksiz bilgilerle yeni müşteri kaydı oluşturun
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

              <div className='sm:col-span-2'>
                <Label htmlFor='customer_code'>
                  Müşteri Kodu <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='customer_code'
                  value={formData.customer_code}
                  onChange={e =>
                    handleInputChange('customer_code', e.target.value)
                  }
                  placeholder='Otomatik oluşturulacak'
                  className='font-mono text-sm bg-muted'
                />
                <p className='text-xs text-muted-foreground mt-1'>
                  Müşteri adı girildiğinde otomatik oluşturulur. Düzenlenebilir.
                </p>
              </div>

              <div>
                <Label htmlFor='segment'>Segment</Label>
                <Select
                  value={formData.segment}
                  onValueChange={(value: string) =>
                    handleInputChange('segment', value)
                  }
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
                  onValueChange={(value: string) =>
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
                  Oluşturuluyor...
                </>
              ) : (
                <>
                  <UserPlus className='h-4 w-4 mr-2' />
                  Müşteri Oluştur
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
