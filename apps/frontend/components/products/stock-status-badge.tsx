/**
 * Stock Status Badge Component
 * Visual indicators for inventory levels
 */

import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface StockStatusBadgeProps {
  stockQuantity: number;
  lowStockThreshold: number;
}

export function StockStatusBadge({
  stockQuantity,
  lowStockThreshold,
}: Readonly<StockStatusBadgeProps>) {
  if (stockQuantity === 0) {
    return (
      <Badge variant='destructive' className='gap-1'>
        <XCircle className='h-3 w-3' />
        Stokta Yok
      </Badge>
    );
  }

  if (stockQuantity <= lowStockThreshold) {
    return (
      <Badge
        variant='secondary'
        className='gap-1 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
      >
        <AlertTriangle className='h-3 w-3' />
        Düşük Stok
      </Badge>
    );
  }

  return (
    <Badge
      variant='outline'
      className='gap-1 text-green-700 dark:text-green-400'
    >
      <CheckCircle className='h-3 w-3' />
      Stokta Var
    </Badge>
  );
}
