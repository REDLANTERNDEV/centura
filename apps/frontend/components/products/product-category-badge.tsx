/**
 * Product Category Badge Component
 * Visual indicators for product categories
 */

import { Badge } from '@/components/ui/badge';
import {
  Laptop,
  Shirt,
  Coffee,
  Book,
  Home,
  Dumbbell,
  Package,
} from 'lucide-react';

interface ProductCategoryBadgeProps {
  category: string;
  size?: 'sm' | 'default';
}

const categoryConfig: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'outline'; icon?: any }
> = {
  Electronics: {
    label: 'Elektronik',
    variant: 'default',
    icon: Laptop,
  },
  Clothing: {
    label: 'Giyim',
    variant: 'secondary',
    icon: Shirt,
  },
  Food: {
    label: 'Gıda & İçecek',
    variant: 'outline',
    icon: Coffee,
  },
  Books: {
    label: 'Kitaplar',
    variant: 'secondary',
    icon: Book,
  },
  Home: {
    label: 'Ev & Bahçe',
    variant: 'outline',
    icon: Home,
  },
  Sports: {
    label: 'Spor',
    variant: 'default',
    icon: Dumbbell,
  },
  Other: {
    label: 'Diğer',
    variant: 'outline',
    icon: Package,
  },
};

export function ProductCategoryBadge({
  category,
  size = 'default',
}: Readonly<ProductCategoryBadgeProps>) {
  const config = categoryConfig[category] || categoryConfig.Other;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={size === 'sm' ? 'gap-0.5 text-xs px-1.5 py-0' : 'gap-1'}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />}
      {config.label}
    </Badge>
  );
}
