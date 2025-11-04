/**
 * Create Order Dialog Component
 * Professional order creation form with customer and product selection
 */

'use client';

import { useState, useEffect } from 'react';
import {
  createOrder,
  getCustomers,
  getProducts,
  Customer,
  Product,
  CreateOrderData,
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
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Plus, ShoppingCart } from 'lucide-react';
import OrderItemRow from './order-item-row';

interface CreateOrderDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess?: () => void;
}

interface OrderItem {
  id: string; // Unique ID for React key
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price?: number;
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

export function CreateOrderDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateOrderDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [items, setItems] = useState<OrderItem[]>([
    { id: `item-${Date.now()}-${Math.random()}`, product_id: 0, quantity: 1 },
  ]);
  const [notes, setNotes] = useState('');

  // Load customers and products when dialog opens
  useEffect(() => {
    if (open) {
      loadData();
    } else {
      // Reset form when dialog closes
      setSelectedCustomerId('');
      setItems([
        {
          id: `item-${Date.now()}-${Math.random()}`,
          product_id: 0,
          quantity: 1,
        },
      ]);
      setNotes('');
    }
  }, [open]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [customersResponse, productsResponse] = await Promise.all([
        getCustomers({ limit: 100 }),
        getProducts({ is_active: true, limit: 100 }),
      ]);

      setCustomers(customersResponse.data || []);
      setProducts(productsResponse.data || []);
    } catch (error: any) {
      toast.error('Veriler yüklenirken hata oluştu', {
        description: error.message,
      });
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: `item-${Date.now()}-${Math.random()}`, product_id: 0, quantity: 1 },
    ]);
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
    setItems(prevItems =>
      prevItems.map(item => {
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
      })
    );
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
    // Validation
    if (!selectedCustomerId) {
      toast.error('Lütfen bir müşteri seçin');
      return;
    }

    const validItems = items.filter(item => item.product_id > 0);
    if (validItems.length === 0) {
      toast.error('Lütfen en az bir ürün seçin');
      return;
    }

    // Check quantities
    const invalidQuantities = validItems.filter(item => item.quantity <= 0);
    if (invalidQuantities.length > 0) {
      toast.error("Ürün miktarları 0'dan büyük olmalıdır");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData: CreateOrderData = {
        customer_id: Number.parseInt(selectedCustomerId),
        items: validItems.map(item => ({
          product_id: Number(item.product_id), // Ensure product_id is a number
          quantity: Number(item.quantity), // Ensure quantity is a number
        })),
        status: 'draft',
        notes: notes || undefined,
      };

      await createOrder(orderData);
      toast.success('Sipariş başarıyla oluşturuldu');
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Sipariş oluşturulurken hata oluştu', {
        description: error.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCustomer = customers.find(
    c => c.customer_id === Number.parseInt(selectedCustomerId)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-hidden flex flex-col'>
        <DialogHeader>
          <DialogTitle className='text-xl sm:text-2xl flex items-center gap-2'>
            <ShoppingCart className='h-5 w-5 sm:h-6 sm:w-6' />
            Yeni Sipariş Oluştur
          </DialogTitle>
          <DialogDescription>
            Müşteri ve ürünleri seçerek yeni sipariş oluşturun
          </DialogDescription>
        </DialogHeader>

        {isLoadingData ? (
          <div className='flex items-center justify-center py-8'>
            <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
          </div>
        ) : (
          <div className='space-y-6 py-4 overflow-y-auto flex-1 px-1'>
            {/* Customer Selection */}
            <div className='space-y-3'>
              <Label htmlFor='customer' className='text-base font-semibold'>
                Müşteri Seçin *
              </Label>
              <Select
                value={selectedCustomerId}
                onValueChange={setSelectedCustomerId}
              >
                <SelectTrigger id='customer'>
                  <SelectValue placeholder='Müşteri seçiniz...' />
                </SelectTrigger>
                <SelectContent>
                  {customers.length === 0 ? (
                    <SelectItem value='0' disabled>
                      Müşteri bulunamadı
                    </SelectItem>
                  ) : (
                    customers.map(customer => (
                      <SelectItem
                        key={customer.customer_id}
                        value={customer.customer_id.toString()}
                      >
                        <div
                          className='truncate max-w-[300px]'
                          title={`${customer.name} (${customer.customer_code})`}
                        >
                          {customer.name} ({customer.customer_code})
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {selectedCustomer && (
                <div className='rounded-lg bg-muted/50 p-3 text-sm space-y-1'>
                  <div className='flex flex-col sm:flex-row sm:justify-between gap-1'>
                    <span className='text-muted-foreground'>Müşteri:</span>
                    <span className='font-medium wrap-break-word'>
                      {selectedCustomer.name}
                    </span>
                  </div>
                  {selectedCustomer.email && (
                    <div className='flex flex-col sm:flex-row sm:justify-between gap-1'>
                      <span className='text-muted-foreground'>Email:</span>
                      <span className='break-all text-sm'>
                        {selectedCustomer.email}
                      </span>
                    </div>
                  )}
                  {selectedCustomer.phone && (
                    <div className='flex flex-col sm:flex-row sm:justify-between gap-1'>
                      <span className='text-muted-foreground'>Telefon:</span>
                      <span>{selectedCustomer.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Order Items */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='text-base font-semibold'>
                  Sipariş Kalemleri *
                </Label>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={handleAddItem}
                >
                  <Plus className='h-4 w-4 mr-1' />
                  Ürün Ekle
                </Button>
              </div>

              <div className='space-y-3 max-h-[300px] overflow-y-auto pr-2'>
                <div className='space-y-4'>
                  <h4 className='font-semibold text-sm sm:text-base'>
                    Order Items
                  </h4>
                  <div className='border rounded-lg p-2 space-y-2'>
                    {items.map(item => (
                      <OrderItemRow
                        key={item.id}
                        item={item}
                        products={products}
                        onItemChange={handleItemChange}
                        onRemoveItem={handleRemoveItem}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Summary */}
            {items.some(item => item.product_id > 0) && (
              <>
                <Separator />
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
                    * Ürün fiyatları KDV dahil olarak hesaplanır. Sipariş
                    kaydedildiğinde KDV ayrıştırılır.
                  </p>
                </div>
              </>
            )}

            <Separator />

            {/* Notes */}
            <div className='space-y-3'>
              <Label htmlFor='notes' className='text-base font-semibold'>
                Notlar (Opsiyonel)
              </Label>
              <Textarea
                id='notes'
                placeholder='Sipariş hakkında notlar...'
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || isLoadingData}
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Sipariş Oluştur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
