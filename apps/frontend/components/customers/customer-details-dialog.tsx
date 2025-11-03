/**
 * Customer Details Dialog Component
 * Professional view for complete customer information
 */

'use client';

import { Customer } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CustomerSegmentBadge } from './customer-segment-badge';
import { CustomerTypeBadge } from './customer-type-badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building2,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  Hash,
} from 'lucide-react';

interface CustomerDetailsDialogProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerDetailsDialog({
  customer,
  open,
  onOpenChange,
}: CustomerDetailsDialogProps) {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-2xl'>
            <User className='h-6 w-6' />
            {customer.name}
          </DialogTitle>
          <DialogDescription>
            Müşteri Kodu: {customer.customer_code}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Status and Classification */}
          <div>
            <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
              <Hash className='h-4 w-4' />
              Sınıflandırma
            </h3>
            <div className='flex flex-wrap gap-2'>
              <CustomerSegmentBadge segment={customer.segment} />
              <CustomerTypeBadge type={customer.customer_type} />
              <Badge
                variant={customer.is_active ? 'default' : 'secondary'}
                className={
                  customer.is_active
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-500'
                }
              >
                {customer.is_active ? 'Aktif' : 'Pasif'}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div>
            <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
              <Mail className='h-4 w-4' />
              İletişim Bilgileri
            </h3>
            <div className='grid gap-3 sm:grid-cols-2'>
              {customer.email && (
                <div className='flex items-start gap-2'>
                  <Mail className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='text-xs text-muted-foreground'>E-posta</p>
                    <p className='text-sm font-medium'>{customer.email}</p>
                  </div>
                </div>
              )}
              {customer.phone && (
                <div className='flex items-start gap-2'>
                  <Phone className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='text-xs text-muted-foreground'>Telefon</p>
                    <p className='text-sm font-medium'>{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.mobile && (
                <div className='flex items-start gap-2'>
                  <Phone className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='text-xs text-muted-foreground'>Mobil</p>
                    <p className='text-sm font-medium'>{customer.mobile}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Address Information */}
          <div>
            <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
              <MapPin className='h-4 w-4' />
              Adres Bilgileri
            </h3>
            <div className='grid gap-3 sm:grid-cols-2'>
              {customer.address && (
                <div className='flex items-start gap-2 sm:col-span-2'>
                  <MapPin className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='text-xs text-muted-foreground'>Adres</p>
                    <p className='text-sm font-medium'>{customer.address}</p>
                  </div>
                </div>
              )}
              {customer.city && (
                <div className='flex items-start gap-2'>
                  <Building2 className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='text-xs text-muted-foreground'>Şehir</p>
                    <p className='text-sm font-medium'>{customer.city}</p>
                  </div>
                </div>
              )}
              {customer.country && (
                <div className='flex items-start gap-2'>
                  <Building2 className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='text-xs text-muted-foreground'>Ülke</p>
                    <p className='text-sm font-medium'>{customer.country}</p>
                  </div>
                </div>
              )}
              {customer.postal_code && (
                <div className='flex items-start gap-2'>
                  <MapPin className='h-4 w-4 text-muted-foreground mt-0.5' />
                  <div>
                    <p className='text-xs text-muted-foreground'>Posta Kodu</p>
                    <p className='text-sm font-medium'>
                      {customer.postal_code}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Tax Information */}
          {(customer.tax_number || customer.tax_office) && (
            <>
              <div>
                <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                  <FileText className='h-4 w-4' />
                  Vergi Bilgileri
                </h3>
                <div className='grid gap-3 sm:grid-cols-2'>
                  {customer.tax_number && (
                    <div className='flex items-start gap-2'>
                      <FileText className='h-4 w-4 text-muted-foreground mt-0.5' />
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Vergi Numarası
                        </p>
                        <p className='text-sm font-medium font-mono'>
                          {customer.tax_number}
                        </p>
                      </div>
                    </div>
                  )}
                  {customer.tax_office && (
                    <div className='flex items-start gap-2'>
                      <Building2 className='h-4 w-4 text-muted-foreground mt-0.5' />
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Vergi Dairesi
                        </p>
                        <p className='text-sm font-medium'>
                          {customer.tax_office}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Financial Information */}
          {(customer.payment_terms || customer.credit_limit) && (
            <>
              <div>
                <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                  <DollarSign className='h-4 w-4' />
                  Mali Bilgiler
                </h3>
                <div className='grid gap-3 sm:grid-cols-2'>
                  {customer.payment_terms && (
                    <div className='flex items-start gap-2'>
                      <CreditCard className='h-4 w-4 text-muted-foreground mt-0.5' />
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Ödeme Vadesi
                        </p>
                        <p className='text-sm font-medium'>
                          {customer.payment_terms} gün
                        </p>
                      </div>
                    </div>
                  )}
                  {customer.credit_limit && (
                    <div className='flex items-start gap-2'>
                      <DollarSign className='h-4 w-4 text-muted-foreground mt-0.5' />
                      <div>
                        <p className='text-xs text-muted-foreground'>
                          Kredi Limiti
                        </p>
                        <p className='text-sm font-medium'>
                          ₺{customer.credit_limit.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {customer.notes && (
            <>
              <div>
                <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
                  <FileText className='h-4 w-4' />
                  Notlar
                </h3>
                <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                  {customer.notes}
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Metadata */}
          <div>
            <h3 className='text-sm font-semibold mb-3 flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Kayıt Bilgileri
            </h3>
            <div className='grid gap-3 sm:grid-cols-2'>
              <div className='flex items-start gap-2'>
                <Calendar className='h-4 w-4 text-muted-foreground mt-0.5' />
                <div>
                  <p className='text-xs text-muted-foreground'>Oluşturulma</p>
                  <p className='text-sm font-medium'>
                    {new Date(customer.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <Calendar className='h-4 w-4 text-muted-foreground mt-0.5' />
                <div>
                  <p className='text-xs text-muted-foreground'>
                    Son Güncelleme
                  </p>
                  <p className='text-sm font-medium'>
                    {new Date(customer.updated_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
