'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/components/card'
import { Badge } from '@ui/components/badge'
import { Skeleton } from '@ui/components/skeleton'
import { cn } from '@ui/lib/utils'
import { 
  Package, 
  Layers, 
  Tag, 
  Building2, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Users,
  BarChart2,
  ShoppingCart,
  Activity,
  Plus,
  Eye,
  Boxes,
  type LucideIcon
} from 'lucide-react'

// Icon mapping to match your navItem icon names
const iconMap: Record<string, LucideIcon> = {
  'Package': Package,
  'Layers': Layers,
  'Tag': Tag,
  'Building2': Building2,
  'DollarSign': DollarSign,
  'AlertTriangle': AlertTriangle,
  'TrendingUp': TrendingUp,
  'Users': Users,
  'BarChart2': BarChart2,
  'ShoppingCart': ShoppingCart,
  'Activity': Activity,
  'Plus': Plus,
  'Eye': Eye,
  'Boxes': Boxes,
}

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
  loading?: boolean
  valueColor?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
}

const valueColorClasses = {
  default: 'text-foreground',
  primary: 'text-primary',
  success: 'text-green-600',
  warning: 'text-orange-500',
  danger: 'text-red-500',
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
  loading = false,
  valueColor = 'default'
}: StatCardProps) {
  const IconComponent = icon && iconMap[icon] ? iconMap[icon] : null

  if (loading) {
    return (
      <Card className={cn('h-[120px] py-4 gap-3', className)}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-[80px] mb-2" />
          <Skeleton className="h-3 w-[120px]" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('h-[120px] py-4 gap-3', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {IconComponent && (
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className={cn('text-2xl font-bold', valueColorClasses[valueColor])}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={trend.isPositive ? 'default' : 'secondary'}
              className={cn(
                'text-xs',
                trend.isPositive 
                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                  : 'bg-red-100 text-red-800 hover:bg-red-100'
              )}
            >
              {trend.isPositive ? '+' : ''}{trend.value}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  )
}