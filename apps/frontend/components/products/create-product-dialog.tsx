/**
 * Create Product Dialog
 * Form for creating new products
 */

'use client';
/* eslint-disable no-console */
 

import { useState } from 'react';
import { useOrganization } from '@/lib/contexts/OrganizationContext';
import { createProduct } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateProductDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSuccess: () => void;
}

export function CreateProductDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateProductDialogProps) {
  const { selectedOrganization } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sku: '',
    barcode: '',
    category: 'Other',
    price: '',
    cost_price: '',
    tax_rate: '0',
    stock_quantity: '0',
    low_stock_threshold: '10',
    unit: 'pcs',
    is_active: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrganization) {
      toast.error('Lütfen önce bir organizasyon seçin');
      return;
    }

    // Validation
    if (!formData.name.trim()) {
      toast.error('Ürün adı zorunludur');
      return;
    }

    if (!formData.sku.trim()) {
      toast.error('SKU zorunludur');
      return;
    }

    if (!formData.price || Number.parseFloat(formData.price) <= 0) {
      toast.error('Geçerli bir fiyat girilmelidir');
      return;
    }

    setIsSubmitting(true);

    try {
      await createProduct({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sku: formData.sku.trim(),
        barcode: formData.barcode.trim() || undefined,
        category: formData.category,
        price: Number.parseFloat(formData.price),
        cost_price: formData.cost_price
          ? Number.parseFloat(formData.cost_price)
          : undefined,
        tax_rate: Number.parseFloat(formData.tax_rate),
        stock_quantity: Number.parseInt(formData.stock_quantity, 10),
        low_stock_threshold: Number.parseInt(formData.low_stock_threshold, 10),
        unit: formData.unit,
        is_active: formData.is_active,
      });

      toast.success('Ürün başarıyla oluşturuldu');

      // Reset form
      setFormData({
        name: '',
        description: '',
        sku: '',
        barcode: '',
        category: 'Other',
        price: '',
        cost_price: '',
        tax_rate: '0',
        stock_quantity: '0',
        low_stock_threshold: '10',
        unit: 'pcs',
        is_active: true,
      });

      onSuccess();
    } catch (error) {
      console.error('❌ Failed to create product:', error);
      toast.error(
        error instanceof Error ? error.message : 'Ürün oluşturulamadı'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Yeni Ürün Oluştur</DialogTitle>
          <DialogDescription>
            Envanter kataloğunuza yeni bir ürün ekleyin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Basic Information */}
          <div className='space-y-4'>
            <h3 className='font-semibold'>Temel Bilgiler</h3>

            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2 space-y-2'>
                <Label htmlFor='name'>
                  Ürün Adı <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='Ürün adını girin'
                  required
                />
              </div>

              <div className='col-span-2 space-y-2'>
                <Label htmlFor='description'>Açıklama</Label>
                <Textarea
                  id='description'
                  value={formData.description}
                  onChange={e =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder='Ürün açıklaması (opsiyonel)'
                  rows={3}
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='sku'>
                  SKU <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='sku'
                  value={formData.sku}
                  onChange={e =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder='ör: URUN-001'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='barcode'>Barkod</Label>
                <Input
                  id='barcode'
                  value={formData.barcode}
                  onChange={e =>
                    setFormData({ ...formData, barcode: e.target.value })
                  }
                  placeholder='Ürün barkodu (opsiyonel)'
                />
              </div>

              <div className='col-span-2 space-y-2'>
                <Label htmlFor='category'>Kategori</Label>
                <Select
                  value={formData.category}
                  onValueChange={value =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Electronics'>Elektronik</SelectItem>
                    <SelectItem value='Clothing'>Giyim</SelectItem>
                    <SelectItem value='Food'>Gıda & İçecek</SelectItem>
                    <SelectItem value='Books'>Kitaplar</SelectItem>
                    <SelectItem value='Home'>Ev & Bahçe</SelectItem>
                    <SelectItem value='Sports'>Spor</SelectItem>
                    <SelectItem value='Other'>Diğer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className='space-y-4'>
            <h3 className='font-semibold'>Fiyatlandırma</h3>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='price'>
                  Satış Fiyatı <span className='text-destructive'>*</span>
                </Label>
                <Input
                  id='price'
                  type='number'
                  step='0.01'
                  min='0'
                  value={formData.price}
                  onChange={e =>
                    setFormData({ ...formData, price: e.target.value })
                  }
                  placeholder='0.00'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='cost_price'>Maliyet Fiyatı</Label>
                <Input
                  id='cost_price'
                  type='number'
                  step='0.01'
                  min='0'
                  value={formData.cost_price}
                  onChange={e =>
                    setFormData({ ...formData, cost_price: e.target.value })
                  }
                  placeholder='0.00'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='tax_rate'>KDV Oranı (%)</Label>
                <Input
                  id='tax_rate'
                  type='number'
                  step='0.01'
                  min='0'
                  max='100'
                  value={formData.tax_rate}
                  onChange={e =>
                    setFormData({ ...formData, tax_rate: e.target.value })
                  }
                  placeholder='0'
                />
              </div>
            </div>
          </div>

          {/* Inventory */}
          <div className='space-y-4'>
            <h3 className='font-semibold'>Envanter</h3>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='stock_quantity'>Başlangıç Stok Miktarı</Label>
                <Input
                  id='stock_quantity'
                  type='number'
                  min='0'
                  value={formData.stock_quantity}
                  onChange={e =>
                    setFormData({ ...formData, stock_quantity: e.target.value })
                  }
                  placeholder='0'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='low_stock_threshold'>Düşük Stok Eşiği</Label>
                <Input
                  id='low_stock_threshold'
                  type='number'
                  min='0'
                  value={formData.low_stock_threshold}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      low_stock_threshold: e.target.value,
                    })
                  }
                  placeholder='10'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='unit'>Ölçü Birimi</Label>
                <Select
                  value={formData.unit}
                  onValueChange={value =>
                    setFormData({ ...formData, unit: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pcs'>Adet</SelectItem>
                    <SelectItem value='kg'>Kilogram</SelectItem>
                    <SelectItem value='g'>Gram</SelectItem>
                    <SelectItem value='l'>Litre</SelectItem>
                    <SelectItem value='ml'>Mililitre</SelectItem>
                    <SelectItem value='m'>Metre</SelectItem>
                    <SelectItem value='box'>Kutu</SelectItem>
                    <SelectItem value='pack'>Paket</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='is_active'>Durum</Label>
                <Select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onValueChange={value =>
                    setFormData({ ...formData, is_active: value === 'active' })
                  }
                >
                  <SelectTrigger>
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
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Oluşturuluyor...
                </>
              ) : (
                'Ürün Oluştur'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
