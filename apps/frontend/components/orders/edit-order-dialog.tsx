/**
 * Edit Order Dialog Component
 * Professional order status and payment editing with Zod validation
 */

'use client';
 

import { useState, useEffect } from 'react';
import {
  Order,
  updateOrderStatus,
  updatePaymentStatus,
} from '@/lib/api-client';
import {
  createEditOrderSchema,
  type EditOrderFormData,
} from '@/lib/validations/order.schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { OrderStatusBadge } from './order-status-badge';
import { PaymentStatusBadge } from './payment-status-badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditOrderDialogProps {
  readonly order: Order | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
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

export function EditOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: EditOrderDialogProps) {
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  // Initialize form when order changes
  useEffect(() => {
    if (order) {
      setOrderStatus(order.status);
      setPaymentStatus(order.payment_status);
      setPaidAmount(order.paid_amount.toString());
      setValidationErrors({});
    }
  }, [order]);

  const handleSubmit = async () => {
    if (!order) return;

    // Clear previous errors
    setValidationErrors({});

    // Validate form with Zod
    const editOrderSchema = createEditOrderSchema(order.total);
    const formData: EditOrderFormData = {
      orderStatus: orderStatus as any,
      paymentStatus: paymentStatus as any,
      paidAmount: Number.parseFloat(paidAmount),
    };

    const validation = editOrderSchema.safeParse(formData);

    if (!validation.success) {
      // Convert Zod errors to our error format
      const errors: Record<string, string> = {};
      for (const err of validation.error.issues) {
        const path = err.path.join('.');
        errors[path] = err.message;
      }
      setValidationErrors(errors);
      toast.error('Lütfen form hatalarını düzeltin');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update order status if changed
      if (orderStatus !== order.status) {
        await updateOrderStatus(order.id, orderStatus);
        toast.success('Sipariş durumu güncellendi');
      }

      // Update payment status if changed
      if (
        paymentStatus !== order.payment_status ||
        Number.parseFloat(paidAmount) !== order.paid_amount
      ) {
        await updatePaymentStatus(
          order.id,
          paymentStatus,
          Number.parseFloat(paidAmount)
        );
        toast.success('Ödeme durumu güncellendi');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Güncelleme başarısız', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  // Determine payment status based on paid amount
  const suggestedPaymentStatus = () => {
    const paid = Number.parseFloat(paidAmount);
    if (paid === 0) return 'pending';
    if (paid >= order.total) return 'paid';
    return 'partial';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-2xl'>Siparişi Düzenle</DialogTitle>
          <DialogDescription>
            Sipariş durumunu ve ödeme bilgilerini güncelleyin
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Order Information */}
          <div className='rounded-lg bg-muted/50 p-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-muted-foreground'>Sipariş No</p>
                <p className='font-mono font-semibold'>{order.order_number}</p>
              </div>
              <div className='text-right'>
                <p className='text-sm text-muted-foreground'>Toplam Tutar</p>
                <p className='text-lg font-bold'>
                  {formatCurrency(order.total)}
                </p>
              </div>
            </div>
            <Separator className='my-2' />
            <div>
              <p className='text-sm text-muted-foreground'>Müşteri</p>
              <p className='font-medium'>{order.customer_name}</p>
            </div>
          </div>

          {/* Current Status */}
          <div className='space-y-3'>
            <h4 className='font-semibold'>Mevcut Durum</h4>
            <div className='flex gap-4'>
              <div className='flex-1 rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground mb-2'>
                  Sipariş Durumu
                </p>
                <OrderStatusBadge status={order.status} />
              </div>
              <div className='flex-1 rounded-lg border p-3'>
                <p className='text-xs text-muted-foreground mb-2'>
                  Ödeme Durumu
                </p>
                <PaymentStatusBadge status={order.payment_status} />
              </div>
            </div>
          </div>

          <Separator />

          {/* Edit Order Status */}
          <div className='space-y-3'>
            <Label htmlFor='order-status' className='text-base font-semibold'>
              Sipariş Durumu
            </Label>
            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger id='order-status'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='draft'>Taslak</SelectItem>
                <SelectItem value='confirmed'>Onaylandı</SelectItem>
                <SelectItem value='processing'>İşleniyor</SelectItem>
                <SelectItem value='shipped'>Kargoya Verildi</SelectItem>
                <SelectItem value='delivered'>Teslim Edildi</SelectItem>
                <SelectItem value='cancelled' disabled>
                  İptal Edildi (İptal Et butonunu kullanın)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              Sipariş iş akışı: Taslak → Onaylandı → İşleniyor → Kargoya Verildi
              → Teslim Edildi
            </p>
          </div>

          <Separator />

          {/* Edit Payment Status */}
          <div className='space-y-3'>
            <Label className='text-base font-semibold'>Ödeme Bilgileri</Label>

            <div className='space-y-3'>
              <div>
                <Label htmlFor='paid-amount'>Ödenen Tutar</Label>
                <Input
                  id='paid-amount'
                  type='number'
                  step='0.01'
                  min='0'
                  max={order.total}
                  value={paidAmount}
                  onChange={e => {
                    setPaidAmount(e.target.value);
                    // Clear validation error when user types
                    if (validationErrors.paidAmount) {
                      setValidationErrors(prev => {
                        const newErrors = { ...prev };
                        delete newErrors.paidAmount;
                        return newErrors;
                      });
                    }
                    // Auto-update payment status based on amount
                    const paid = Number.parseFloat(e.target.value);
                    if (paid === 0) setPaymentStatus('pending');
                    else if (paid >= order.total) setPaymentStatus('paid');
                    else setPaymentStatus('partial');
                  }}
                  className='font-mono'
                />
                {validationErrors.paidAmount && (
                  <p className='text-xs text-destructive mt-1'>
                    {validationErrors.paidAmount}
                  </p>
                )}
                <div className='flex justify-between text-xs text-muted-foreground mt-1'>
                  <span>Toplam: {formatCurrency(order.total)}</span>
                  <span>
                    Kalan:{' '}
                    {formatCurrency(
                      Math.max(
                        0,
                        order.total - Number.parseFloat(paidAmount || '0')
                      )
                    )}
                  </span>
                </div>
              </div>

              <div>
                <Label htmlFor='payment-status'>Ödeme Durumu</Label>
                <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                  <SelectTrigger id='payment-status'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pending'>Ödeme Bekliyor</SelectItem>
                    <SelectItem value='partial'>Kısmi Ödendi</SelectItem>
                    <SelectItem value='paid'>Ödendi</SelectItem>
                    <SelectItem value='refunded'>İade Edildi</SelectItem>
                  </SelectContent>
                </Select>
                {Number.parseFloat(paidAmount) > 0 &&
                  paymentStatus !== suggestedPaymentStatus() && (
                    <p className='text-xs text-amber-600 mt-1'>
                      Önerilen durum:{' '}
                      {suggestedPaymentStatus() === 'paid' && 'Ödendi'}
                      {suggestedPaymentStatus() === 'partial' && 'Kısmi Ödendi'}
                      {suggestedPaymentStatus() === 'pending' &&
                        'Ödeme Bekliyor'}
                    </p>
                  )}
              </div>
            </div>

            <p className='text-xs text-muted-foreground'>
              Ödeme durumu ödenen tutara göre otomatik olarak ayarlanır
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Değişiklikleri Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
