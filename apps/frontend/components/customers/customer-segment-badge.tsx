/**
 * Customer Segment Badge Component
 * Visual indicator for customer segment levels
 */

import { Badge } from '@/components/ui/badge';
import { Crown, Star, Users, Zap, Sparkles } from 'lucide-react';

interface CustomerSegmentBadgeProps {
  segment?: 'VIP' | 'Premium' | 'Standard' | 'Basic' | 'Potential' | string;
}

export function CustomerSegmentBadge({ segment }: CustomerSegmentBadgeProps) {
  if (!segment) {
    return (
      <Badge variant='outline' className='gap-1'>
        <Users className='h-3 w-3' />
        Bilinmeyen
      </Badge>
    );
  }

  const config = {
    VIP: {
      icon: Crown,
      label: 'VIP',
      className:
        'bg-purple-500 hover:bg-purple-600 text-white border-purple-600',
    },
    Premium: {
      icon: Star,
      label: 'Premium',
      className: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600',
    },
    Standard: {
      icon: Sparkles,
      label: 'Standart',
      className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-600',
    },
    Basic: {
      icon: Users,
      label: 'Temel',
      className: 'bg-gray-500 hover:bg-gray-600 text-white border-gray-600',
    },
    Potential: {
      icon: Zap,
      label: 'Potansiyel',
      className: 'bg-green-500 hover:bg-green-600 text-white border-green-600',
    },
  };

  const segmentConfig = config[segment as keyof typeof config];

  if (!segmentConfig) {
    return (
      <Badge variant='outline' className='gap-1'>
        <Users className='h-3 w-3' />
        {segment}
      </Badge>
    );
  }

  const Icon = segmentConfig.icon;

  return (
    <Badge className={`gap-1 ${segmentConfig.className}`}>
      <Icon className='h-3 w-3' />
      {segmentConfig.label}
    </Badge>
  );
}
