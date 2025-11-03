/**
 * Payment Status Badge Component
 * Professional payment status indicators
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Clock, DollarSign, CheckCircle2, RotateCcw } from 'lucide-react';

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'refunded';

interface PaymentStatusBadgeProps {
  readonly status: PaymentStatus;
  readonly className?: string;
  readonly showIcon?: boolean;
}

const statusConfig: Record<
  PaymentStatus,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending: {
    label: 'Ödeme Bekliyor',
    variant: 'outline',
    className:
      'border-slate-300 text-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700',
    icon: Clock,
  },
  partial: {
    label: 'Kısmi Ödendi',
    variant: 'default',
    className:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
    icon: DollarSign,
  },
  paid: {
    label: 'Ödendi',
    variant: 'default',
    className:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800',
    icon: CheckCircle2,
  },
  refunded: {
    label: 'İade Edildi',
    variant: 'default',
    className:
      'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400 dark:border-purple-800',
    icon: RotateCcw,
  },
};

export function PaymentStatusBadge({
  status,
  className,
  showIcon = true,
}: PaymentStatusBadgeProps) {
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
