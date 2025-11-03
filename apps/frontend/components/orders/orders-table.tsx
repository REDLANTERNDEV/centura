/**
 * Orders Data Table Component
 * Professional, industry-standard data table for orders management
 */

'use client';

import { Order } from '@/lib/api-client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from './order-status-badge';
import { PaymentStatusBadge } from './payment-status-badge';
import {
  MoreHorizontal,
  Eye,
  Edit2,
  Trash2,
  Download,
  Ban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

interface OrdersTableProps {
  readonly orders: Order[];
  readonly isLoading?: boolean;
  readonly pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  readonly onPageChange?: (page: number) => void;
  readonly onViewOrder?: (order: Order) => void;
  readonly onEditOrder?: (order: Order) => void;
  readonly onCancelOrder?: (order: Order) => void;
  readonly onDeleteOrder?: (order: Order) => void;
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
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};

export function OrdersTable({
  orders,
  isLoading = false,
  pagination,
  onPageChange,
  onViewOrder,
  onEditOrder,
  onCancelOrder,
  onDeleteOrder,
}: OrdersTableProps) {
  if (isLoading) {
    return <OrdersTableSkeleton />;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <div className='rounded-full bg-muted p-3 mb-4'>
          <svg
            className='h-6 w-6 text-muted-foreground'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
            />
          </svg>
        </div>
        <h3 className='text-lg font-semibold mb-1'>Sipariş bulunamadı</h3>
        <p className='text-sm text-muted-foreground'>
          Henüz hiç sipariş oluşturulmamış. İlk siparişinizi oluşturun.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[140px]'>Sipariş No</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Ödeme</TableHead>
              <TableHead className='text-right'>Toplam</TableHead>
              <TableHead className='w-[60px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map(order => (
              <TableRow key={order.id} className='hover:bg-muted/50'>
                <TableCell className='font-mono font-medium'>
                  {order.order_number}
                </TableCell>
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{order.customer_name}</span>
                  </div>
                </TableCell>
                <TableCell className='text-muted-foreground'>
                  {formatDate(order.order_date)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge status={order.payment_status} />
                </TableCell>
                <TableCell className='text-right font-semibold'>
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' className='h-8 w-8 p-0'>
                        <span className='sr-only'>Menüyü aç</span>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onViewOrder?.(order)}
                        className='cursor-pointer'
                      >
                        <Eye className='mr-2 h-4 w-4' />
                        Detayları Görüntüle
                      </DropdownMenuItem>
                      {/* Allow editing if:
                          1. Not cancelled
                          2. If delivered, only allow if payment not complete */}
                      {order.status !== 'cancelled' &&
                        !(
                          order.status === 'delivered' &&
                          order.payment_status === 'paid'
                        ) && (
                          <DropdownMenuItem
                            onClick={() => onEditOrder?.(order)}
                            className='cursor-pointer'
                          >
                            <Edit2 className='mr-2 h-4 w-4' />
                            Düzenle
                          </DropdownMenuItem>
                        )}
                      <DropdownMenuItem className='cursor-pointer'>
                        <Download className='mr-2 h-4 w-4' />
                        Fatura İndir
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {order.status !== 'cancelled' &&
                        order.status !== 'delivered' && (
                          <DropdownMenuItem
                            onClick={() => onCancelOrder?.(order)}
                            className='cursor-pointer text-orange-600 focus:text-orange-600'
                          >
                            <Ban className='mr-2 h-4 w-4' />
                            Siparişi İptal Et
                          </DropdownMenuItem>
                        )}
                      {order.status === 'draft' && (
                        <DropdownMenuItem
                          onClick={() => onDeleteOrder?.(order)}
                          className='cursor-pointer text-destructive focus:text-destructive'
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Sil
                        </DropdownMenuItem>
                      )}
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
        <div className='flex items-center justify-between px-2'>
          <div className='text-sm text-muted-foreground'>
            Toplam <strong>{pagination.total}</strong> sipariş -{' '}
            <strong>{pagination.page}</strong> /{' '}
            <strong>{pagination.totalPages}</strong> sayfa
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className='h-4 w-4 mr-1' />
              Önceki
            </Button>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Sonraki
              <ChevronRight className='h-4 w-4 ml-1' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for the table
 */
function OrdersTableSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[140px]'>Sipariş No</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Ödeme</TableHead>
              <TableHead className='text-right'>Toplam</TableHead>
              <TableHead className='w-[60px]'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {new Array(5).fill(null).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell>
                  <Skeleton className='h-4 w-24' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-32' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-4 w-20' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-6 w-24' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-6 w-24' />
                </TableCell>
                <TableCell className='text-right'>
                  <Skeleton className='h-4 w-20 ml-auto' />
                </TableCell>
                <TableCell>
                  <Skeleton className='h-8 w-8' />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
