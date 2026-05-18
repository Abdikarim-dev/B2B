import { cn } from '@/lib/utils'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  iconColor?: string
  iconBg?: string
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-4',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {Icon && (
          <span className={cn('flex items-center justify-center w-10 h-10 rounded-xl', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        {description && <p className="text-xs text-slate-500 leading-relaxed">{description}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          <span
            className={cn(
              'inline-flex items-center rounded-full px-2 py-0.5 ring-1 ring-inset',
              trend.positive
                ? 'bg-green-50 text-green-700 ring-green-600/20'
                : 'bg-red-50 text-red-700 ring-red-600/20'
            )}
          >
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-slate-400">{trend.label}</span>
        </div>
      )}
    </div>
  )
}
