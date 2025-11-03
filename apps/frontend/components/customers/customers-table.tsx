/**
 * Customers Table Component
 * Professional data table with sorting, pagination, and row actions
 */

'use client';

import { Customer } from '@/lib/api-client';
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
  Mail,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { CustomerSegmentBadge } from '@/components/customers/customer-segment-badge';
import { CustomerTypeBadge } from '@/components/customers/customer-type-badge';

interface CustomersTableProps {
  readonly customers: Customer[];
  readonly isLoading: boolean;
  readonly onView: (customer: Customer) => void;
  readonly onEdit: (customer: Customer) => void;
  readonly onDelete: (customer: Customer) => void;
  readonly pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  readonly onPageChange?: (page: number) => void;
}

export function CustomersTable({
  customers,
  isLoading,
  onView,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
}: CustomersTableProps) {
  if (isLoading) {
    return <CustomersTableSkeleton />;
  }

  if (!customers || customers.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-12 text-center'>
        <div className='rounded-full bg-muted p-3 mb-4'>
          <Eye className='h-6 w-6 text-muted-foreground' />
        </div>
        <h3 className='text-lg font-semibold mb-2'>Müşteri bulunamadı</h3>
        <p className='text-sm text-muted-foreground max-w-sm'>
          İlk müşterinizi ekleyerek başlayın. Güçlü ilişkiler kurun ve işinizi
          büyütün.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[120px]'>Kod</TableHead>
              <TableHead>Müşteri</TableHead>
              <TableHead>İletişim</TableHead>
              <TableHead>Konum</TableHead>
              <TableHead>Segment</TableHead>
              <TableHead>Tip</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className='w-20'>İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map(customer => (
              <TableRow
                key={customer.customer_id}
                className='hover:bg-muted/50'
              >
                {/* Customer Code */}
                <TableCell className='font-mono text-sm'>
                  {customer.customer_code}
                </TableCell>

                {/* Customer Info */}
                <TableCell>
                  <div className='flex flex-col'>
                    <span className='font-medium'>{customer.name}</span>
                    {customer.tax_number && (
                      <span className='text-xs text-muted-foreground'>
                        Vergi No: {customer.tax_number}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Contact Info */}
                <TableCell>
                  <div className='flex flex-col gap-1 text-sm'>
                    {customer.email && (
                      <div className='flex items-center gap-1 text-muted-foreground'>
                        <Mail className='h-3 w-3' />
                        <span className='truncate max-w-[180px]'>
                          {customer.email}
                        </span>
                      </div>
                    )}
                    {(customer.phone || customer.mobile) && (
                      <div className='flex items-center gap-1 text-muted-foreground'>
                        <Phone className='h-3 w-3' />
                        <span>{customer.phone || customer.mobile}</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Location */}
                <TableCell>
                  {customer.city && (
                    <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                      <MapPin className='h-3 w-3' />
                      <span>
                        {customer.city}
                        {customer.country && `, ${customer.country}`}
                      </span>
                    </div>
                  )}
                </TableCell>

                {/* Segment */}
                <TableCell>
                  <CustomerSegmentBadge segment={customer.segment} />
                </TableCell>

                {/* Type */}
                <TableCell>
                  <CustomerTypeBadge type={customer.customer_type} />
                </TableCell>

                {/* Status */}
                <TableCell>
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
                </TableCell>

                {/* Actions */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm'>
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView(customer)}>
                        <Eye className='h-4 w-4 mr-2' />
                        Detayları Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(customer)}>
                        <Edit className='h-4 w-4 mr-2' />
                        Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(customer)}
                        className='text-destructive'
                      >
                        <Trash2 className='h-4 w-4 mr-2' />
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
        <div className='flex items-center justify-between'>
          <p className='text-sm text-muted-foreground'>
            Gösterilen {(pagination.page - 1) * pagination.limit + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} /{' '}
            {pagination.total} müşteri
          </p>
          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className='h-4 w-4 mr-1' />
              Önceki
            </Button>
            <div className='flex items-center gap-1'>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  page =>
                    page === 1 ||
                    page === pagination.totalPages ||
                    Math.abs(page - pagination.page) <= 1
                )
                .map((page, index, array) => (
                  <div key={page} className='flex items-center'>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className='px-2 text-muted-foreground'>...</span>
                    )}
                    <Button
                      variant={page === pagination.page ? 'default' : 'outline'}
                      size='sm'
                      onClick={() => onPageChange?.(page)}
                    >
                      {page}
                    </Button>
                  </div>
                ))}
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
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
 * Loading skeleton for table
 */
function CustomersTableSkeleton() {
  return (
    <div className='space-y-3'>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={`skeleton-${i}`} className='flex items-center gap-4'>
          <Skeleton className='h-12 w-full' />
        </div>
      ))}
    </div>
  );
}
