/**
 * Customer Type Badge Component
 * Visual indicator for customer types
 */

import { Badge } from '@/components/ui/badge';
import { Building2, User, Landmark, HelpCircle } from 'lucide-react';

interface CustomerTypeBadgeProps {
  type?: 'Corporate' | 'Individual' | 'Government' | 'Other' | string;
}

export function CustomerTypeBadge({ type }: CustomerTypeBadgeProps) {
  if (!type) {
    return (
      <Badge variant='outline' className='gap-1'>
        <HelpCircle className='h-3 w-3' />
        Bilinmeyen
      </Badge>
    );
  }

  const config = {
    Corporate: {
      icon: Building2,
      label: 'Kurumsal',
      className:
        'bg-indigo-50 text-indigo-700 border-indigo-300 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-400 dark:border-indigo-800',
    },
    Individual: {
      icon: User,
      label: 'Bireysel',
      className:
        'bg-cyan-50 text-cyan-700 border-cyan-300 hover:bg-cyan-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800',
    },
    Government: {
      icon: Landmark,
      label: 'Devlet',
      className:
        'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700',
    },
    Other: {
      icon: HelpCircle,
      label: 'Diğer',
      className:
        'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700',
    },
  };

  const typeConfig = config[type as keyof typeof config];

  if (!typeConfig) {
    return (
      <Badge variant='outline' className='gap-1'>
        <HelpCircle className='h-3 w-3' />
        {type}
      </Badge>
    );
  }

  const Icon = typeConfig.icon;

  return (
    <Badge variant='outline' className={`gap-1 ${typeConfig.className}`}>
      <Icon className='h-3 w-3' />
      {typeConfig.label}
    </Badge>
  );
}
