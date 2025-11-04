/**
 * Advanced Edit Order Dialog Component
 * Full order editing with customer, products, notes, status and payment
 */

'use client';

import { useState, useEffect } from 'react';
import {
  Order,
  updateOrder,
  UpdateOrderData,
  getProducts,
  Product,
} from '@/lib/api-client';
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { OrderStatusBadge } from './order-status-badge';
import { PaymentStatusBadge } from './payment-status-badge';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Import OrderItemRow for future use
// import OrderItemRow from './order-item-row';

interface AdvancedEditOrderDialogProps {
  readonly order: Order | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

export interface OrderItem {
  id: string; // Unique ID for React key
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price?: number;
}

/**
 * Generate unique item ID
 */
const generateItemId = () => `item-${Date.now()}-${Math.random()}`;

/**
 * Format currency for Turkish Lira
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(amount);
};

export function AdvancedEditOrderDialog({
  order,
  open,
  onOpenChange,
  onSuccess,
}: AdvancedEditOrderDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [orderStatus, setOrderStatus] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<string>('');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([]);

  // Determine if order can be edited
  // Can edit fully if: not cancelled AND (not delivered OR delivered but payment not complete)
  const canEditFully =
    order &&
    order.status !== 'cancelled' &&
    !(order.status === 'delivered' && order.payment_status === 'paid');

  const isFullyDeliveredAndPaid =
    order?.status === 'delivered' && order?.payment_status === 'paid';
  const isCancelled = order?.status === 'cancelled';

  // Load products when dialog opens
  useEffect(() => {
    if (open && canEditFully) {
      loadProducts();
    }
  }, [open, canEditFully]);

  // Initialize form when order changes
  useEffect(() => {
    if (order) {
      setOrderStatus(order.status);
      setPaymentStatus(order.payment_status);
      setPaidAmount(order.paid_amount?.toString() || '0');
      setNotes(order.notes || '');

      // Initialize items from order
      if (order.items && order.items.length > 0) {
        const mappedItems = order.items.map(item => ({
          id: generateItemId(),
          product_id: item.product_id || 0,
          product_name: item.product_name,
          quantity: item.quantity || 1,
          unit_price: item.unit_price,
        }));
        setItems(mappedItems);
      } else {
        // If no items, initialize with empty array
        setItems([]);
      }
    }
  }, [order]);

  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const response = await getProducts({ is_active: true, limit: 100 });
      setProducts(response.data || []);
    } catch (error: any) {
      toast.error('Ürünler yüklenirken hata oluştu', {
        description:
          error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
      });
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { id: generateItemId(), product_id: 0, quantity: 1 }]);
  };

  const handleRemoveItem = (itemId: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const handleItemChange = (
    itemId: string,
    field: keyof OrderItem,
    value: any
  ) => {
    setItems(prevItems => {
      const newItems = prevItems.map(item => {
        if (item.id !== itemId) {
          return item;
        }

        const updated = { ...item, [field]: value };

        // Update product info when product is selected
        if (field === 'product_id') {
          const product = products.find(p => p.id === Number.parseInt(value));
          if (product) {
            updated.product_name = product.name;
            updated.unit_price = product.price;
          }
        }

        return updated;
      });

      return newItems;
    });
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        return total + product.price * item.quantity;
      }
      return total;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!order) return;

    // Validation
    const validItems = items.filter(item => item.product_id > 0);
    if (canEditFully && validItems.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    // Check quantities
    if (canEditFully) {
      const invalidQuantities = validItems.filter(item => item.quantity <= 0);
      if (invalidQuantities.length > 0) {
        toast.error("Ürün miktarları 0'dan büyük olmalıdır");
        return;
      }
    }

    // Validate paid amount
    const paidAmountNum = Number.parseFloat(paidAmount);
    if (Number.isNaN(paidAmountNum) || paidAmountNum < 0) {
      toast.error('Geçerli bir ödenen tutar girin');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData: UpdateOrderData = {
        status: orderStatus,
        payment_status: paymentStatus,
        paid_amount: paidAmountNum,
        notes: notes || undefined,
      };

      // Only update items if order can be fully edited
      if (canEditFully && validItems.length > 0) {
        updateData.items = validItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
        }));
      }

      await updateOrder(order.id, updateData);
      toast.success('Sipariş başarıyla güncellendi');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Sipariş güncellenirken hata oluştu', {
        description:
          error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl'>
            Sipariş Düzenle - #{order.order_number}
          </DialogTitle>
          <DialogDescription>Sipariş bilgilerini düzenleyin</DialogDescription>
        </DialogHeader>

        {(isFullyDeliveredAndPaid || isCancelled) && (
          <Alert variant={isFullyDeliveredAndPaid ? 'default' : 'destructive'}>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {isFullyDeliveredAndPaid &&
                'Teslim edilmiş ve ödemesi tamamlanmış siparişler düzenlenemez. Sadece görüntüleme modunda.'}
              {isCancelled &&
                'İptal edilmiş siparişler düzenlenemez. Sadece görüntüleme modunda.'}
            </AlertDescription>
          </Alert>
        )}

        <div className='space-y-6 py-4'>
          {/* Customer Info (Read-only) */}
          <div className='space-y-3'>
            <Label className='text-base font-semibold'>Müşteri Bilgileri</Label>
            <div className='rounded-lg bg-muted/50 p-3 text-sm space-y-1'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Müşteri:</span>
                <span className='font-medium'>{order.customer_name}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Müşteri ID:</span>
                <span>{order.customer_id}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Order Items */}
          {canEditFully ? (
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='text-base font-semibold'>
                  Sipariş Kalemleri
                </Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleAddItem}
                  disabled={isLoadingProducts}
                >
                  <Plus className='h-4 w-4 mr-1' />
                  Ürün Ekle
                </Button>
              </div>

              {isLoadingProducts ? (
                <div className='flex items-center justify-center py-4'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : (
                <div className='space-y-3 max-h-[400px] overflow-y-auto pr-2'>
                  {items.map(item => {
                    const product = products.find(
                      p => p.id === item.product_id
                    );
                    return (
                      <div
                        key={item.id}
                        className='flex gap-3 items-start border rounded-lg p-4 bg-card'
                      >
                        <div className='flex-1 space-y-3'>
                          {/* Product Selection Row */}
                          <div>
                            <Label className='text-sm font-medium mb-1.5 block'>
                              Ürün
                            </Label>
                            <Select
                              value={item.product_id?.toString() || ''}
                              onValueChange={value =>
                                handleItemChange(item.id, 'product_id', value)
                              }
                            >
                              <SelectTrigger className='w-full'>
                                <SelectValue placeholder='Ürün seçiniz...' />
                              </SelectTrigger>
                              <SelectContent>
                                {products.length === 0 ? (
                                  <SelectItem value='0' disabled>
                                    Ürün bulunamadı
                                  </SelectItem>
                                ) : (
                                  products.map(prod => (
                                    <SelectItem
                                      key={prod.id}
                                      value={prod.id.toString()}
                                    >
                                      <div className='flex items-center justify-between w-full'>
                                        <span className='truncate mr-2'>
                                          {prod.name}
                                        </span>
                                        <span className='text-muted-foreground text-sm'>
                                          {formatCurrency(prod.price)}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Quantity Row */}
                          <div className='grid grid-cols-2 gap-3'>
                            <div>
                              <Label className='text-sm font-medium mb-1.5 block'>
                                Adet
                              </Label>
                              <Input
                                type='number'
                                min='1'
                                value={item.quantity}
                                onChange={e =>
                                  handleItemChange(
                                    item.id,
                                    'quantity',
                                    Number.parseInt(e.target.value) || 1
                                  )
                                }
                                className='w-full'
                              />
                            </div>
                            {product && (
                              <div>
                                <Label className='text-sm font-medium mb-1.5 block text-muted-foreground'>
                                  Birim Fiyat
                                </Label>
                                <div className='h-10 flex items-center px-3 bg-muted/50 rounded-md'>
                                  <span className='text-sm font-medium'>
                                    {formatCurrency(product.price)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Total for this item */}
                          {product && (
                            <div className='flex justify-between items-center bg-primary/5 rounded-md p-3 border border-primary/20'>
                              <span className='text-sm font-medium text-muted-foreground'>
                                Ara Toplam (KDV Dahil)
                              </span>
                              <span className='text-base font-bold text-primary'>
                                {formatCurrency(product.price * item.quantity)}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Remove Button */}
                        <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length === 1}
                          className='mt-8 shrink-0'
                          title='Ürünü kaldır'
                        >
                          <Trash2 className='h-4 w-4 text-destructive' />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {items.some(item => item.product_id > 0) && (
                <div className='rounded-lg border p-4 bg-muted/30'>
                  <div className='flex justify-between items-center'>
                    <span className='font-semibold text-lg'>
                      Genel Toplam (KDV Dahil):
                    </span>
                    <span className='font-bold text-2xl text-primary'>
                      {formatCurrency(calculateTotal())}
                    </span>
                  </div>
                  <p className='text-xs text-muted-foreground mt-2'>
                    * Sipariş kaydedildiğinde KDV otomatik olarak ayrıştırılır
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-3'>
              <Label className='text-base font-semibold'>
                Sipariş Kalemleri
              </Label>
              <div className='border rounded-lg'>
                <table className='w-full text-sm'>
                  <thead className='bg-muted/50'>
                    <tr>
                      <th className='text-left p-3'>Ürün</th>
                      <th className='text-right p-3'>Miktar</th>
                      <th className='text-right p-3'>
                        Birim Fiyat (KDV Hariç)
                      </th>
                      <th className='text-right p-3'>Toplam (KDV Dahil)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map(item => (
                      <tr
                        key={`item-${item.product_id}-${item.quantity}`}
                        className='border-t'
                      >
                        <td className='p-3'>{item.product_name}</td>
                        <td className='text-right p-3'>{item.quantity}</td>
                        <td className='text-right p-3'>
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className='text-right p-3'>
                          {formatCurrency(item.unit_price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className='rounded-lg border p-4 bg-muted/30'>
                <div className='flex justify-between items-center'>
                  <span className='font-semibold text-lg'>
                    Genel Toplam (KDV Dahil):
                  </span>
                  <span className='font-bold text-2xl text-primary'>
                    {formatCurrency(order.total)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* Status and Payment */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-3'>
              <Label>
                Sipariş Durumu
                <div className='mt-2'>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Label>
              <Select
                value={orderStatus}
                onValueChange={setOrderStatus}
                disabled={isFullyDeliveredAndPaid || isCancelled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='draft'>Taslak</SelectItem>
                  <SelectItem value='confirmed'>Onaylandı</SelectItem>
                  <SelectItem value='processing'>İşleniyor</SelectItem>
                  <SelectItem value='shipped'>Kargoya Verildi</SelectItem>
                  <SelectItem value='delivered'>Teslim Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-3'>
              <Label>
                Ödeme Durumu
                <div className='mt-2'>
                  <PaymentStatusBadge status={order.payment_status} />
                </div>
              </Label>
              <Select
                value={paymentStatus}
                onValueChange={setPaymentStatus}
                disabled={isFullyDeliveredAndPaid || isCancelled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='pending'>Bekliyor</SelectItem>
                  <SelectItem value='partial'>Kısmen Ödendi</SelectItem>
                  <SelectItem value='paid'>Ödendi</SelectItem>
                  <SelectItem value='refunded'>İade Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='space-y-3'>
            <Label htmlFor='paid-amount'>Ödenen Tutar (₺)</Label>
            <div className='relative'>
              <span className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium'>
                ₺
              </span>
              <Input
                id='paid-amount'
                type='number'
                step='0.01'
                min='0'
                max={canEditFully ? calculateTotal() : order.total}
                value={paidAmount}
                onChange={e => setPaidAmount(e.target.value)}
                disabled={isFullyDeliveredAndPaid || isCancelled}
                className='pl-7'
                placeholder='0.00'
              />
            </div>
            <div className='flex justify-between text-xs'>
              <span className='text-muted-foreground'>
                Maksimum:{' '}
                <span className='font-semibold text-foreground'>
                  {formatCurrency(
                    canEditFully ? calculateTotal() : order.total
                  )}
                </span>
              </span>
              {paidAmount && (
                <span className='text-muted-foreground'>
                  Kalan:{' '}
                  <span className='font-semibold text-foreground'>
                    {formatCurrency(
                      Math.max(
                        0,
                        (canEditFully ? calculateTotal() : order.total) -
                          Number.parseFloat(paidAmount || '0')
                      )
                    )}
                  </span>
                </span>
              )}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className='space-y-3'>
            <Label>Notlar</Label>
            <Textarea
              placeholder='Sipariş notları...'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              disabled={isFullyDeliveredAndPaid || isCancelled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {isFullyDeliveredAndPaid || isCancelled ? 'Kapat' : 'İptal'}
          </Button>
          {!isFullyDeliveredAndPaid && !isCancelled && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Güncelle
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
