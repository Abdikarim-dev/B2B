'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Users,
  ShieldCheck,
  FolderOpen,
  Package,
  Boxes,
  UserCheck,
  Truck,
  FileText,
  Receipt,
  CreditCard,
  TrendingDown,
  BarChart3,
  ClipboardList,
  Settings,
  ChevronRight,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AuthUser } from '@/types'
import { hasAnyPermission } from '@/lib/permissions'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  requiredPermissions?: Parameters<typeof hasAnyPermission>[1]
  superAdminOnly?: boolean
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Platform',
    items: [
      {
        label: 'Businesses',
        href: '/businesses',
        icon: Building2,
        requiredPermissions: ['business.view'],
        superAdminOnly: true,
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      {
        label: 'Branches',
        href: '/branches',
        icon: GitBranch,
        requiredPermissions: ['branches.view'],
      },
      {
        label: 'Users',
        href: '/users',
        icon: Users,
        requiredPermissions: ['users.view'],
      },
      {
        label: 'Roles',
        href: '/roles',
        icon: ShieldCheck,
        requiredPermissions: ['roles.view'],
      },
    ],
  },
  {
    label: 'Catalog',
    items: [
      {
        label: 'Categories',
        href: '/categories',
        icon: FolderOpen,
        requiredPermissions: ['products.view'],
      },
      {
        label: 'Products',
        href: '/products',
        icon: Package,
        requiredPermissions: ['products.view'],
      },
      {
        label: 'Inventory',
        href: '/inventory',
        icon: Boxes,
        requiredPermissions: ['inventory.view'],
      },
    ],
  },
  {
    label: 'Contacts',
    items: [
      {
        label: 'Customers',
        href: '/customers',
        icon: UserCheck,
        requiredPermissions: ['customers.view'],
      },
      {
        label: 'Suppliers',
        href: '/suppliers',
        icon: Truck,
        requiredPermissions: ['suppliers.view'],
      },
    ],
  },
  {
    label: 'Finance',
    items: [
      {
        label: 'Invoices',
        href: '/invoices',
        icon: FileText,
        requiredPermissions: ['invoices.view'],
      },
      {
        label: 'Receipts',
        href: '/receipts',
        icon: Receipt,
        requiredPermissions: ['receipts.view'],
      },
      {
        label: 'Payments',
        href: '/payments',
        icon: CreditCard,
        requiredPermissions: ['payments.view'],
      },
      {
        label: 'Expenses',
        href: '/expenses',
        icon: TrendingDown,
        requiredPermissions: ['expenses.view'],
      },
    ],
  },
  {
    label: 'Analytics',
    items: [
      {
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        requiredPermissions: ['reports.view'],
      },
      {
        label: 'Audit Logs',
        href: '/audit-logs',
        icon: ClipboardList,
        requiredPermissions: ['audit_logs.view'],
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        requiredPermissions: ['settings.view'],
      },
    ],
  },
]

interface SidebarProps {
  user: AuthUser | null
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ user, className, onNavigate }: SidebarProps) {
  const pathname = usePathname()

  const isVisible = (item: NavItem): boolean => {
    if (!user) return false
    if (item.superAdminOnly && user.role !== 'SUPER_ADMIN' && user.role !== 'PLATFORM_SUPPORT') {
      return false
    }
    if (item.requiredPermissions) {
      return hasAnyPermission(user, item.requiredPermissions)
    }
    return true
  }

  return (
    <aside
      className={cn(
        'flex flex-col w-64 min-h-screen bg-[#0F172A] border-r border-[#1E293B]',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#1E293B] shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="text-base font-bold text-white tracking-tight">SaasApp</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5 scrollbar-thin">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isVisible)
          if (visibleItems.length === 0) return null

          return (
            <div key={group.label} className="mb-4">
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {group.label}
              </p>
              {visibleItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5',
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-[#1E293B] hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#1E293B] shrink-0">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">{user?.name ?? 'Unknown'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
