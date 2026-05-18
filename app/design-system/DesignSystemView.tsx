'use client'

import { useState } from 'react'
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
} from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'
import { AppShell } from '@/components/layout/AppShell'
import {
  PageHeader,
  PageContainer,
  StatCard,
  StatusBadge,
  DataTable,
  EmptyState,
  LoadingSkeleton,
  ConfirmDialog,
  FormSection,
  DashboardCard,
  SearchInput,
  FilterBar,
} from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AuthUser } from '@/types'

const MOCK_USER: AuthUser = {
  id: '1',
  name: 'Alex Johnson',
  email: 'alex@business.com',
  role: 'BUSINESS_OWNER',
  permissions: [
    'business.view',
    'branches.view',
    'users.view',
    'products.view',
    'inventory.view',
    'customers.view',
    'invoices.view',
    'receipts.view',
    'payments.view',
    'expenses.view',
    'reports.view',
    'audit_logs.view',
    'settings.view',
    'settings.update',
  ],
  businessId: 'biz-1',
  status: 'ACTIVE',
}

interface SampleRow {
  id: string
  name: string
  status: 'active' | 'inactive'
  amount: number
  paymentStatus: 'paid' | 'unpaid' | 'partial'
}

const SAMPLE_DATA: SampleRow[] = [
  { id: '1', name: 'Alpha Corp', status: 'active', amount: 12500, paymentStatus: 'paid' },
  { id: '2', name: 'Beta LLC', status: 'active', amount: 8900, paymentStatus: 'partial' },
  { id: '3', name: 'Gamma Inc', status: 'inactive', amount: 4300, paymentStatus: 'unpaid' },
  { id: '4', name: 'Delta Co', status: 'active', amount: 21000, paymentStatus: 'paid' },
  { id: '5', name: 'Epsilon Ltd', status: 'active', amount: 6750, paymentStatus: 'partial' },
]

const columns: ColumnDef<SampleRow>[] = [
  {
    accessorKey: 'name',
    header: 'Business Name',
    cell: ({ row }) => (
      <span className="font-medium text-slate-900">{row.original.name}</span>
    ),
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => (
      <span className="tabular-nums">${row.original.amount.toLocaleString()}</span>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge variant={row.original.status} />
    ),
  },
  {
    accessorKey: 'paymentStatus',
    header: 'Payment',
    cell: ({ row }) => (
      <StatusBadge variant={row.original.paymentStatus} />
    ),
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem className="gap-2">
            <Edit className="h-4 w-4 text-slate-400" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600 focus:bg-red-50">
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function DesignSystemView() {
  const [search, setSearch] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [showLoading, setShowLoading] = useState(false)

  return (
    <AppShell user={MOCK_USER}>
      <PageContainer>
        {/* Page Header */}
        <PageHeader
          title="Design System Preview"
          description="A live preview of all reusable components used across the SaasApp platform."
          actions={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              New Action
            </Button>
          }
        />

        {/* Color Palette */}
        <DashboardCard title="Color Palette">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
            {[
              { name: 'Sidebar Dark', color: '#0F172A' },
              { name: 'Sidebar Hover', color: '#1E293B' },
              { name: 'Brand Blue', color: '#2563EB' },
              { name: 'Blue Hover', color: '#1D4ED8' },
              { name: 'Accent Cyan', color: '#06B6D4' },
              { name: 'App BG', color: '#F8FAFC', border: true },
              { name: 'Card BG', color: '#FFFFFF', border: true },
              { name: 'Muted BG', color: '#F1F5F9', border: true },
              { name: 'Success', color: '#16A34A' },
              { name: 'Warning', color: '#F59E0B' },
              { name: 'Danger', color: '#DC2626' },
              { name: 'Info', color: '#2563EB' },
              { name: 'Neutral', color: '#64748B' },
              { name: 'Main Text', color: '#0F172A' },
              { name: 'Muted Text', color: '#94A3B8' },
            ].map((item) => (
              <div key={item.name} className="flex flex-col gap-2">
                <div
                  className="h-12 rounded-xl"
                  style={{
                    backgroundColor: item.color,
                    border: item.border ? '1px solid #E2E8F0' : undefined,
                  }}
                />
                <div>
                  <p className="text-xs font-medium text-slate-800">{item.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{item.color}</p>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Status Badges */}
        <DashboardCard title="Status Badges">
          <div className="flex flex-wrap gap-3">
            <StatusBadge variant="active" />
            <StatusBadge variant="inactive" />
            <StatusBadge variant="paid" />
            <StatusBadge variant="unpaid" />
            <StatusBadge variant="partial" />
            <StatusBadge variant="pending" />
            <StatusBadge variant="draft" />
            <StatusBadge variant="confirmed" />
            <StatusBadge variant="cancelled" />
            <StatusBadge variant="low_stock" />
            <StatusBadge variant="in_stock" />
            <StatusBadge variant="info" label="Info" />
          </div>
        </DashboardCard>

        {/* Stat Cards */}
        <DashboardCard title="Stat Cards">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Revenue"
              value="$124,580"
              description="This month"
              icon={DollarSign}
              iconBg="bg-blue-50"
              iconColor="text-blue-600"
              trend={{ value: 12.5, label: 'vs last month', positive: true }}
            />
            <StatCard
              title="Total Orders"
              value="1,284"
              description="Active invoices"
              icon={ShoppingCart}
              iconBg="bg-cyan-50"
              iconColor="text-cyan-600"
              trend={{ value: 3.2, label: 'vs last month', positive: true }}
            />
            <StatCard
              title="Total Customers"
              value="893"
              description="Registered accounts"
              icon={Users}
              iconBg="bg-green-50"
              iconColor="text-green-600"
              trend={{ value: 1.8, label: 'vs last month', positive: false }}
            />
            <StatCard
              title="Low Stock"
              value="12"
              description="Products need restock"
              icon={Package}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
            />
          </div>
        </DashboardCard>

        {/* Buttons */}
        <DashboardCard title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
              <Plus className="h-4 w-4" />
              Primary
            </Button>
            <Button variant="outline" className="border-slate-200 text-slate-700 gap-2">
              <Edit className="h-4 w-4" />
              Secondary
            </Button>
            <Button variant="ghost" className="text-slate-600 gap-2">
              <TrendingUp className="h-4 w-4" />
              Ghost
            </Button>
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50 gap-2"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Destructive (click)
            </Button>
            <Button disabled className="bg-blue-600 text-white opacity-50">
              Disabled
            </Button>
          </div>
        </DashboardCard>

        {/* Form Components */}
        <DashboardCard title="Form Components">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormSection title="Business Details" description="Enter the core business information.">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Business Name</Label>
                  <Input placeholder="e.g. Acme Corp" className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" placeholder="admin@business.com" className="border-slate-200" />
                </div>
              </div>
            </FormSection>
            <FormSection title="Contact Information" description="Phone and address details.">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input placeholder="+1 (555) 000-0000" className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label>Address</Label>
                  <Input placeholder="123 Main St, City" className="border-slate-200" />
                </div>
              </div>
            </FormSection>
          </div>
        </DashboardCard>

        {/* Search + Filter */}
        <DashboardCard title="Search and Filter">
          <FilterBar>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search businesses..."
              className="w-64"
            />
            <Button variant="outline" className="border-slate-200 text-slate-600">
              Filter by Status
            </Button>
            <Button variant="outline" className="border-slate-200 text-slate-600">
              Date Range
            </Button>
          </FilterBar>
        </DashboardCard>

        {/* Data Table */}
        <DashboardCard title="Data Table" description="Sortable, paginated table with row actions.">
          <DataTable
            columns={columns}
            data={SAMPLE_DATA}
            emptyTitle="No businesses found"
            emptyDescription="Add a business to get started."
          />
        </DashboardCard>

        {/* Empty State */}
        <DashboardCard title="Empty State">
          <EmptyState
            icon={AlertTriangle}
            title="No data available"
            description="Once you add records, they will appear here. Get started by creating your first entry."
            action={
              <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                Add First Record
              </Button>
            }
          />
        </DashboardCard>

        {/* Loading Skeleton */}
        <DashboardCard title="Loading Skeleton" description="Shown while data is being fetched.">
          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200"
              onClick={() => setShowLoading((v) => !v)}
            >
              {showLoading ? 'Hide' : 'Show'} Skeleton
            </Button>
          </div>
          {showLoading && <LoadingSkeleton />}
        </DashboardCard>

        {/* Confirm Dialog */}
        <ConfirmDialog
          open={confirmOpen}
          onOpenChange={setConfirmOpen}
          title="Delete this record?"
          description="This action cannot be undone. All associated data will be permanently removed."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => setConfirmOpen(false)}
        />
      </PageContainer>
    </AppShell>
  )
}
