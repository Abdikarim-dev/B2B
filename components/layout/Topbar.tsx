'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, LogOut, Settings, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { AuthUser } from '@/types'

/** Maps route path segments to human-readable page titles. */
const PAGE_TITLE_MAP: Record<string, string> = {
  dashboard: 'Dashboard',
  businesses: 'Businesses',
  branches: 'Branches',
  users: 'Users',
  roles: 'Roles',
  products: 'Products',
  inventory: 'Inventory',
  customers: 'Customers',
  suppliers: 'Suppliers',
  invoices: 'Invoices',
  receipts: 'Receipts',
  payments: 'Payments',
  expenses: 'Expenses',
  reports: 'Reports',
  'audit-logs': 'Audit Logs',
  settings: 'Settings',
}

function usePageTitle(): string {
  const pathname = usePathname()
  const segment = pathname.split('/').filter(Boolean).at(-1) ?? ''
  return PAGE_TITLE_MAP[segment] ?? ''
}

interface TopbarProps {
  user: AuthUser | null
  onMobileMenuToggle?: () => void
  onLogout?: () => void
}

export function Topbar({ user, onMobileMenuToggle, onLogout }: TopbarProps) {
  const pageTitle = usePageTitle()

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U'

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-10">
      {/* Left: mobile menu toggle + page title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-slate-500 hover:text-slate-700"
          onClick={onMobileMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {pageTitle && (
          <h1 className="text-sm font-semibold text-slate-700 hidden sm:block">{pageTitle}</h1>
        )}
      </div>

      {/* Right: notifications + user dropdown */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2.5 h-9 px-2 rounded-lg hover:bg-slate-100"
              aria-label="User menu"
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start">
                <span className="text-xs font-semibold text-slate-800 leading-none">
                  {user?.name ?? 'User'}
                </span>
                <span className="text-[10px] text-slate-400 leading-none mt-0.5">
                  {user?.role?.replace(/_/g, ' ')}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="font-semibold text-slate-800">{user?.name}</span>
                <span className="text-xs text-slate-400 font-normal">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              <Link href="/settings">
                <User className="h-4 w-4 text-slate-400" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 cursor-pointer">
              <Link href="/settings">
                <Settings className="h-4 w-4 text-slate-400" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
