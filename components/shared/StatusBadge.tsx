import { cn } from '@/lib/utils'

type BadgeVariant =
  | 'active'
  | 'inactive'
  | 'paid'
  | 'unpaid'
  | 'partial'
  | 'pending'
  | 'draft'
  | 'confirmed'
  | 'cancelled'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'low_stock'
  | 'in_stock'

interface StatusBadgeProps {
  variant: BadgeVariant
  label?: string
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  active: 'bg-green-50 text-green-700 ring-green-600/20',
  success: 'bg-green-50 text-green-700 ring-green-600/20',
  paid: 'bg-green-50 text-green-700 ring-green-600/20',
  in_stock: 'bg-green-50 text-green-700 ring-green-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  partial: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  low_stock: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  inactive: 'bg-red-50 text-red-700 ring-red-600/20',
  cancelled: 'bg-red-50 text-red-700 ring-red-600/20',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  unpaid: 'bg-red-50 text-red-700 ring-red-600/20',
  draft: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  confirmed: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
}

const defaultLabels: Record<BadgeVariant, string> = {
  active: 'Active',
  inactive: 'Inactive',
  paid: 'Paid',
  unpaid: 'Unpaid',
  partial: 'Partial',
  pending: 'Pending',
  draft: 'Draft',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  success: 'Success',
  warning: 'Warning',
  danger: 'Error',
  info: 'Info',
  neutral: 'Neutral',
  low_stock: 'Low Stock',
  in_stock: 'In Stock',
}

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variantStyles[variant],
        className
      )}
    >
      {label ?? defaultLabels[variant]}
    </span>
  )
}
