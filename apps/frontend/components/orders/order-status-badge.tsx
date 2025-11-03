/**
 * Order Status Badge Component
 * Professional status indicators for order workflow
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  CheckCheck,
  XCircle,
} from 'lucide-react';

export type OrderStatus =
  | 'draft'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

interface OrderStatusBadgeProps {
  readonly status: OrderStatus;
  readonly className?: string;
  readonly showIcon?: boolean;
}

const statusConfig: Record<
  OrderStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  draft: {
    label: 'Taslak',
    variant: 'outline',
    className:
      'border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700',
    icon: Clock,
  },
  confirmed: {
    label: 'Onaylandı',
    variant: 'default',
    className:
      'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
    icon: CheckCircle2,
  },
  processing: {
    label: 'İşleniyor',
    variant: 'default',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    icon: Package,
  },
  shipped: {
    label: 'Kargoya Verildi',
    variant: 'default',
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
    icon: Truck,
  },
  delivered: {
    label: 'Teslim Edildi',
    variant: 'default',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: CheckCheck,
  },
  cancelled: {
    label: 'İptal Edildi',
    variant: 'destructive',
    className:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
    icon: XCircle,
  },
};

export function OrderStatusBadge({
  status,
  className,
  showIcon = true,
}: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'flex items-center gap-1.5 font-medium border',
        config.className,
        className
      )}
    >
      {showIcon && <Icon className='h-3.5 w-3.5' />}
      {config.label}
    </Badge>
  );
}
