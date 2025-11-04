/**
 * Order Details Dialog Component
 * Professional order details view with customer info, items, and timeline
 */

'use client';

import { useEffect, useState } from 'react';
import { Order, getOrderById } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OrderStatusBadge } from './order-status-badge';
import { PaymentStatusBadge } from './payment-status-badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  User,
  MapPin,
  Calendar,
  CreditCard,
  Package,
  FileText,
} from 'lucide-react';

interface OrderDetailsDialogProps {
  readonly orderId: number | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

/**
 * Format currency for Turkish Lira
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

/**
 * Format date for Turkish locale
 */
const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
}: OrderDetailsDialogProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId && open) {
      setIsLoading(true);
      setError(null);

      getOrderById(orderId)
        .then(response => {
          setOrder(response.data);
        })
        .catch(err => {
          setError(err.message || 'Sipariş yüklenirken hata oluştu');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [orderId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl'>Sipariş Detayları</DialogTitle>
          <DialogDescription>
            {order && `Sipariş No: ${order.order_number}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading && <OrderDetailsSkeleton />}

        {error && (
          <div className='rounded-lg border border-destructive/50 bg-destructive/10 p-4'>
            <p className='text-sm text-destructive'>{error}</p>
          </div>
        )}

        {!isLoading && order && (
          <div className='space-y-6'>
            {/* Header with Status */}
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <h3 className='text-lg font-semibold'>{order.order_number}</h3>
                <p className='text-sm text-muted-foreground'>
                  {formatDate(order.order_date)}
                </p>
              </div>
              <div className='flex gap-2'>
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.payment_status} />
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div className='grid gap-4 md:grid-cols-2'>
              <div className='space-y-3'>
                <h4 className='font-semibold flex items-center gap-2'>
                  <User className='h-4 w-4' />
                  Müşteri Bilgileri
                </h4>
                <div className='space-y-2 text-sm'>
                  <div>
                    <span className='text-muted-foreground'>Müşteri:</span>{' '}
                    <span className='font-medium'>{order.customer_name}</span>
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <h4 className='font-semibold flex items-center gap-2'>
                  <MapPin className='h-4 w-4' />
                  Teslimat Adresi
                </h4>
                <div className='space-y-2 text-sm'>
                  {order.shipping_address ? (
                    <>
                      <p>{order.shipping_address}</p>
                      {order.shipping_city && (
                        <p className='text-muted-foreground'>
                          {order.shipping_city}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className='text-muted-foreground'>Adres belirtilmemiş</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Order Items */}
            <div className='space-y-3'>
              <h4 className='font-semibold flex items-center gap-2'>
                <Package className='h-4 w-4' />
                Sipariş Kalemleri
              </h4>
              <div className='rounded-lg border'>
                <table className='w-full'>
                  <thead className='bg-muted/50'>
                    <tr>
                      <th className='text-left p-3 text-sm font-medium'>
                        Ürün
                      </th>
                      <th className='text-center p-3 text-sm font-medium'>
                        Miktar
                      </th>
                      <th className='text-right p-3 text-sm font-medium'>
                        Birim Fiyat (KDV Hariç)
                      </th>
                      <th className='text-right p-3 text-sm font-medium'>
                        KDV Tutarı
                      </th>
                      <th className='text-right p-3 text-sm font-medium'>
                        Toplam (KDV Dahil)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items && order.items.length > 0 ? (
                      order.items.map(item => (
                        <tr key={item.id} className='border-t'>
                          <td className='p-3'>
                            <div className='flex flex-col'>
                              <span className='font-medium'>
                                {item.product_name}
                              </span>
                              {item.product_sku && (
                                <span className='text-xs text-muted-foreground'>
                                  SKU: {item.product_sku}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='p-3 text-center'>{item.quantity}</td>
                          <td className='p-3 text-right'>
                            <div className='flex flex-col items-end'>
                              <span>{formatCurrency(item.unit_price)}</span>
                              {item.tax_rate > 0 && (
                                <span className='text-xs text-muted-foreground'>
                                  KDV %{item.tax_rate}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='p-3 text-right text-muted-foreground'>
                            {formatCurrency(item.tax_amount)}
                          </td>
                          <td className='p-3 text-right font-semibold text-primary'>
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className='p-6 text-center text-sm text-muted-foreground'
                        >
                          Sipariş kalemi bulunmuyor
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <Separator />

            {/* Payment Summary */}
            <div className='space-y-3'>
              <h4 className='font-semibold flex items-center gap-2'>
                <CreditCard className='h-4 w-4' />
                Ödeme Özeti
              </h4>
              <div className='rounded-lg border p-4 space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>
                    Ara Toplam (KDV Hariç):
                  </span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>
                      İndirim ({order.discount_percentage}%):
                    </span>
                    <span className='text-destructive'>
                      -{formatCurrency(order.discount_amount)}
                    </span>
                  </div>
                )}
                <div className='flex justify-between text-sm'>
                  <span className='text-muted-foreground'>KDV Tutarı:</span>
                  <span className='text-orange-600'>
                    {formatCurrency(order.tax_amount)}
                  </span>
                </div>
                <Separator />
                <div className='flex justify-between font-semibold text-lg'>
                  <span>Genel Toplam (KDV Dahil):</span>
                  <span className='text-primary'>
                    {formatCurrency(order.total)}
                  </span>
                </div>
                {order.payment_status !== 'pending' && (
                  <>
                    <Separator />
                    <div className='flex justify-between text-sm'>
                      <span className='text-muted-foreground'>
                        Ödenen Tutar:
                      </span>
                      <span className='font-medium text-green-600'>
                        {formatCurrency(order.paid_amount)}
                      </span>
                    </div>
                    {order.paid_amount < order.total && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          Kalan Tutar:
                        </span>
                        <span className='font-medium text-orange-600'>
                          {formatCurrency(order.total - order.paid_amount)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {order.payment_method && (
                  <div className='flex justify-between text-sm pt-2'>
                    <span className='text-muted-foreground'>
                      Ödeme Yöntemi:
                    </span>
                    <span className='font-medium capitalize'>
                      {order.payment_method}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <>
                <Separator />
                <div className='space-y-3'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <FileText className='h-4 w-4' />
                    Notlar
                  </h4>
                  <div className='rounded-lg bg-muted p-4 text-sm'>
                    {order.notes}
                  </div>
                </div>
              </>
            )}

            {/* Timeline */}
            <Separator />
            <div className='space-y-3'>
              <h4 className='font-semibold flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                Zaman Çizelgesi
              </h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Oluşturulma:</span>
                  <span>{formatDate(order.created_at)}</span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Son Güncelleme:</span>
                  <span>{formatDate(order.updated_at)}</span>
                </div>
                {order.expected_delivery_date && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>
                      Tahmini Teslimat:
                    </span>
                    <span>{formatDate(order.expected_delivery_date)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Loading skeleton
 */
function OrderDetailsSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-4 w-48' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-6 w-24' />
          <Skeleton className='h-6 w-24' />
        </div>
      </div>
      <Separator />
      <div className='grid gap-4 md:grid-cols-2'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
      <Separator />
      <Skeleton className='h-48 w-full' />
    </div>
  );
}
