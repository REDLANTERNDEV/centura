/**
 * Analytics Components
 * Reusable components for analytics dashboards
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  readonly title: string;
  readonly value: string | number;
  readonly change?: number;
  readonly changeLabel?: string;
  readonly icon?: React.ReactNode;
  readonly trend?: 'up' | 'down' | 'neutral';
  readonly className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = 'from last period',
  icon,
  trend,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up' || (change !== undefined && change > 0)) {
      return <TrendingUp className='h-3 w-3 text-green-600' />;
    }
    if (trend === 'down' || (change !== undefined && change < 0)) {
      return <TrendingDown className='h-3 w-3 text-red-600' />;
    }
    return <Minus className='h-3 w-3 text-muted-foreground' />;
  };

  const getTrendColor = () => {
    if (trend === 'up' || (change !== undefined && change > 0)) {
      return 'text-green-600';
    }
    if (trend === 'down' || (change !== undefined && change < 0)) {
      return 'text-red-600';
    }
    return 'text-muted-foreground';
  };

  return (
    <Card className={className}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon && <div className='text-muted-foreground'>{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {change !== undefined && (
          <div className='flex items-center text-xs mt-1'>
            {getTrendIcon()}
            <span className={cn('ml-1', getTrendColor())}>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>
            <span className='text-muted-foreground ml-1'>{changeLabel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EmptyStateProps {
  readonly icon?: React.ReactNode;
  readonly title: string;
  readonly description?: string;
  readonly action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
      {icon && <div className='mb-4 text-muted-foreground'>{icon}</div>}
      <h3 className='text-lg font-semibold mb-2'>{title}</h3>
      {description && (
        <p className='text-muted-foreground mb-4 max-w-md'>{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}

interface StatBadgeProps {
  readonly label: string;
  readonly value: string | number;
  readonly variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
  readonly className?: string;
}

export function StatBadge({
  label,
  value,
  variant = 'default',
  className,
}: StatBadgeProps) {
  const variantStyles = {
    success:
      'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    warning:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    default: 'bg-secondary text-secondary-foreground',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
        variantStyles[variant],
        className
      )}
    >
      <span className='text-xs opacity-80'>{label}</span>
      <span className='font-semibold'>{value}</span>
    </div>
  );
}

interface ProgressBarProps {
  readonly value: number;
  readonly max?: number;
  readonly label?: string;
  readonly showPercentage?: boolean;
  readonly variant?: 'success' | 'warning' | 'danger' | 'primary';
  readonly className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  variant = 'primary',
  className,
}: ProgressBarProps) {
  const percentage = (value / max) * 100;

  const variantStyles = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    danger: 'bg-red-500',
    primary: 'bg-primary',
  };

  return (
    <div className={cn('space-y-1', className)}>
      {(label || showPercentage) && (
        <div className='flex items-center justify-between text-sm'>
          {label && <span className='text-muted-foreground'>{label}</span>}
          {showPercentage && (
            <span className='font-medium'>{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className='h-2 w-full bg-secondary rounded-full overflow-hidden'>
        <div
          className={cn(
            'h-full transition-all duration-300',
            variantStyles[variant]
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
