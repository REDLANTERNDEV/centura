/**
 * Product Details Dialog
 * Comprehensive view of product information
 */

'use client';

import { Product } from '@/lib/api-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  DollarSign,
  Barcode,
  Calendar,
  User,
  AlertTriangle,
  Tag,
  Boxes,
} from 'lucide-react';
import { ProductCategoryBadge } from '@/components/products/product-category-badge';
import { StockStatusBadge } from '@/components/products/stock-status-badge';

interface ProductDetailsDialogProps {
  readonly product: Product | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export function ProductDetailsDialog({
  product,
  open,
  onOpenChange,
}: ProductDetailsDialogProps) {
  if (!product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const translateUnit = (unit: string) => {
    const unitMap: Record<string, string> = {
      pcs: 'Adet',
      kg: 'Kilogram',
      g: 'Gram',
      l: 'Litre',
      ml: 'Mililitre',
      m: 'Metre',
      box: 'Kutu',
      pack: 'Paket',
    };
    return unitMap[unit] || unit;
  };

  const calculateMargin = () => {
    if (!product.cost_price) return null;
    return ((product.price - product.cost_price) / product.price) * 100;
  };

  const stockValue = product.price * product.stock_quantity;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Package className='h-5 w-5' />
            Ürün Detayları
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Header Info */}
          <div className='space-y-2'>
            <div className='flex items-start justify-between'>
              <div className='space-y-1'>
                <h2 className='text-2xl font-bold'>{product.name}</h2>
                <div className='flex items-center gap-2'>
                  <code className='text-xs rounded bg-muted px-2 py-1'>
                    SKU: {product.sku}
                  </code>
                  {product.barcode && (
                    <code className='text-xs rounded bg-muted px-2 py-1'>
                      <Barcode className='inline h-3 w-3 mr-1' />
                      {product.barcode}
                    </code>
                  )}
                </div>
              </div>
              <div className='flex flex-col items-end gap-2'>
                <Badge variant={product.is_active ? 'default' : 'secondary'}>
                  {product.is_active ? 'Aktif' : 'Pasif'}
                </Badge>
                <ProductCategoryBadge category={product.category} />
              </div>
            </div>

            {product.description && (
              <p className='text-muted-foreground mt-2'>
                {product.description}
              </p>
            )}
          </div>

          <Separator />

          {/* Pricing Information */}
          <div className='space-y-4'>
            <h3 className='font-semibold flex items-center gap-2'>
              <DollarSign className='h-4 w-4' />
              Fiyat Bilgileri
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Satış Fiyatı</p>
                <p className='text-2xl font-bold'>
                  {formatCurrency(product.price)}
                </p>
              </div>
              {product.cost_price && (
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>
                    Maliyet Fiyatı
                  </p>
                  <p className='text-xl font-semibold text-muted-foreground'>
                    {formatCurrency(product.cost_price)}
                  </p>
                </div>
              )}
              {calculateMargin() !== null && (
                <div className='space-y-1'>
                  <p className='text-sm text-muted-foreground'>Kâr Marjı</p>
                  <p className='text-xl font-semibold text-green-600'>
                    {calculateMargin()?.toFixed(2)}%
                  </p>
                </div>
              )}
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Vergi Oranı</p>
                <p className='text-xl font-semibold'>{product.tax_rate}%</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Inventory Information */}
          <div className='space-y-4'>
            <h3 className='font-semibold flex items-center gap-2'>
              <Boxes className='h-4 w-4' />
              Envanter Bilgileri
            </h3>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Mevcut Stok</p>
                <p className='text-2xl font-bold'>
                  {product.stock_quantity} {translateUnit(product.unit)}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Stok Durumu</p>
                <StockStatusBadge
                  stockQuantity={product.stock_quantity}
                  lowStockThreshold={product.low_stock_threshold}
                />
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>
                  Düşük Stok Eşiği
                </p>
                <p className='text-xl font-semibold flex items-center gap-2'>
                  <AlertTriangle className='h-4 w-4 text-yellow-500' />
                  {product.low_stock_threshold} {translateUnit(product.unit)}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Stok Değeri</p>
                <p className='text-xl font-semibold'>
                  {formatCurrency(stockValue)}
                </p>
              </div>
              <div className='space-y-1'>
                <p className='text-sm text-muted-foreground'>Ölçü Birimi</p>
                <Badge variant='outline'>
                  <Tag className='h-3 w-3 mr-1' />
                  {translateUnit(product.unit)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className='space-y-4'>
            <h3 className='font-semibold flex items-center gap-2'>
              <Calendar className='h-4 w-4' />
              Kayıt Bilgileri
            </h3>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='space-y-1'>
                <p className='text-muted-foreground'>Oluşturulma Tarihi</p>
                <p className='font-medium'>{formatDate(product.created_at)}</p>
              </div>
              <div className='space-y-1'>
                <p className='text-muted-foreground'>Son Güncelleme</p>
                <p className='font-medium'>{formatDate(product.updated_at)}</p>
              </div>
              {product.created_by && (
                <div className='space-y-1'>
                  <p className='text-muted-foreground'>Oluşturan</p>
                  <p className='font-medium flex items-center gap-1'>
                    <User className='h-3 w-3' />
                    Kullanıcı ID: {product.created_by}
                  </p>
                </div>
              )}
              <div className='space-y-1'>
                <p className='text-muted-foreground'>Ürün ID</p>
                <code className='text-xs rounded bg-muted px-2 py-1'>
                  #{product.id}
                </code>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
