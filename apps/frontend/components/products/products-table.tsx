/**
 * Products Table Component
 * Professional data table with sorting, pagination, and row actions
 */

'use client';

import { Product } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { ProductCategoryBadge } from '@/components/products/product-category-badge';
import { StockStatusBadge } from '@/components/products/stock-status-badge';

interface ProductsTableProps {
  readonly products: Product[];
  readonly isLoading: boolean;
  readonly onView: (product: Product) => void;
  readonly onEdit: (product: Product) => void;
  readonly onDelete: (product: Product) => void;
  readonly pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  readonly onPageChange?: (page: number) => void;
}

export function ProductsTable({
  products,
  isLoading,
  onView,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
}: ProductsTableProps) {
  /**
   * Format currency in Turkish Lira
   */
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  /**
   * Translate unit to Turkish
   */
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

  /**
   * Calculate profit margin
   */
  const calculateMargin = (price: number, cost?: number) => {
    if (!cost) return 0;
    return ((price - cost) / price) * 100;
  };

  /**
   * Loading skeleton
   */
  if (isLoading) {
    return (
      <div className='space-y-3 p-6'>
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
      </div>
    );
  }

  /**
   * Empty state
   */
  if (!products || products.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <Package className='mb-4 h-12 w-12 text-muted-foreground' />
        <h3 className='mb-2 text-lg font-semibold'>Ürün bulunamadı</h3>
        <p className='text-sm text-muted-foreground'>
          İlk ürününüzü oluşturarak başlayın
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead className='text-right'>Fiyat</TableHead>
              <TableHead className='text-right'>Maliyet</TableHead>
              <TableHead className='text-right'>Kar Marjı</TableHead>
              <TableHead className='text-right'>Stok</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className='text-right'>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map(product => (
              <TableRow key={product.id} className='hover:bg-muted/50'>
                {/* Product Info */}
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{product.name}</span>
                    {product.description && (
                      <span className='text-xs text-muted-foreground line-clamp-1'>
                        {product.description}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* SKU */}
                <TableCell>
                  <code className='text-xs rounded bg-muted px-2 py-1'>
                    {product.sku}
                  </code>
                </TableCell>

                {/* Category */}
                <TableCell>
                  <ProductCategoryBadge category={product.category} />
                </TableCell>

                {/* Price */}
                <TableCell className='text-right font-medium'>
                  {formatCurrency(product.price)}
                </TableCell>

                {/* Cost */}
                <TableCell className='text-right text-muted-foreground'>
                  {product.cost_price
                    ? formatCurrency(product.cost_price)
                    : '-'}
                </TableCell>

                {/* Margin */}
                <TableCell className='text-right'>
                  {product.cost_price ? (
                    <Badge
                      variant={
                        calculateMargin(product.price, product.cost_price) > 30
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {calculateMargin(
                        product.price,
                        product.cost_price
                      ).toFixed(1)}
                      %
                    </Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>

                {/* Stock */}
                <TableCell className='text-right'>
                  <div className='flex flex-col items-end gap-1'>
                    <span className='font-medium'>
                      {product.stock_quantity} {translateUnit(product.unit)}
                    </span>
                    <StockStatusBadge
                      stockQuantity={product.stock_quantity}
                      lowStockThreshold={product.low_stock_threshold}
                    />
                  </div>
                </TableCell>

                {/* Status */}
                <TableCell>
                  <Badge variant={product.is_active ? 'default' : 'secondary'}>
                    {product.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </TableCell>

                {/* Actions */}
                <TableCell className='text-right'>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='icon'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(product)}>
                        <Eye className='mr-2 h-4 w-4' />
                        Detayları Gör
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(product)}>
                        <Edit className='mr-2 h-4 w-4' />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(product)}
                        className='text-destructive'
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className='flex items-center justify-between border-t px-6 py-4'>
          <div className='text-sm text-muted-foreground'>
            {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
            arası gösteriliyor (Toplam {pagination.total} ürün)
          </div>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className='h-4 w-4' />
              Önceki
            </Button>
            <div className='text-sm'>
              Sayfa {pagination.page} / {pagination.totalPages}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Sonraki
              <ChevronRight className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
