'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  FileText,
  DollarSign,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchCustomers, createCustomer, updateCustomer } from '@/data/api/customers'
import { fetchInvoices } from '@/data/api/invoices'
import type { Customer, Invoice } from '@/types'
import { formatDate, formatCurrency } from '@/data/helpers'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { DataTable } from '@/components/shared/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Balance Badge ────────────────────────────────────────────────────────────

function BalanceBadge({ balance }: { balance: number }) {
  if (balance <= 0) {
    return (
      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-100">
        Paid
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
      {formatCurrency(balance)} due
    </span>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface CustomerFormState {
  name: string
  email: string
  phone: string
  address: string
  status: 'ACTIVE' | 'INACTIVE'
}

const emptyForm = (): CustomerFormState => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  status: 'ACTIVE',
})

interface CustomerFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Customer | null
  onSubmit: (data: CustomerFormState) => void
  loading: boolean
}

function CustomerFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  loading,
}: CustomerFormDialogProps) {
  const [form, setForm] = useState<CustomerFormState>(emptyForm)

  useMemo(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              email: initial.email ?? '',
              phone: initial.phone ?? '',
              address: initial.address ?? '',
              status: initial.status,
            }
          : emptyForm()
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (key: keyof CustomerFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Customer' : 'Create Customer'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(form)
          }}
          className="flex flex-col gap-4 py-2"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="cust-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="cust-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Customer name"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-email">Email</Label>
              <Input
                id="cust-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="customer@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-phone">Phone</Label>
              <Input
                id="cust-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1-555-0100"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="cust-address">Address</Label>
              <Textarea
                id="cust-address"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Street address, City, State"
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="cust-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set('status', v as 'ACTIVE' | 'INACTIVE')}
              >
                <SelectTrigger id="cust-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

interface CustomerDetailSheetProps {
  customer: Customer | null
  invoices: Invoice[]
  onClose: () => void
}

function CustomerDetailSheet({ customer, invoices, onClose }: CustomerDetailSheetProps) {
  const customerInvoices = invoices.filter((inv) => inv.customerId === customer?.id)
  const totalInvoiced = customerInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const totalPaid = customerInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0)

  return (
    <Sheet open={!!customer} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base">{customer?.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge variant={customer?.status === 'ACTIVE' ? 'active' : 'inactive'} />
                {customer && <BalanceBadge balance={customer.balance} />}
              </div>
            </div>
          </div>
        </SheetHeader>
        {customer && (
          <div className="flex flex-col gap-5 px-6 py-6 overflow-y-auto flex-1">
            {/* Contact Info */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact Information
              </h4>
              {customer.email && (
                <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={customer.email} />
              )}
              {customer.phone && (
                <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={customer.phone} />
              )}
              {customer.address && (
                <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={customer.address} />
              )}
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Customer Since"
                value={formatDate(customer.createdAt)}
              />
            </div>

            <Separator />

            {/* Balance / Debt */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Financial Summary
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Total Invoiced</p>
                  <p className="text-lg font-semibold text-slate-900 mt-0.5">
                    {formatCurrency(totalInvoiced)}
                  </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">Total Paid</p>
                  <p className="text-lg font-semibold text-green-600 mt-0.5">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
              </div>
              <div className={`rounded-lg p-3 ${customer.balance > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                <div className="flex items-center gap-2">
                  <DollarSign className={`h-4 w-4 ${customer.balance > 0 ? 'text-amber-600' : 'text-green-600'}`} />
                  <p className="text-xs text-slate-600">Outstanding Balance</p>
                </div>
                <p className={`text-xl font-bold mt-1 ${customer.balance > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {formatCurrency(customer.balance)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Invoice Summary */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Recent Invoices
              </h4>
              {customerInvoices.length === 0 ? (
                <p className="text-sm text-slate-500">No invoices found.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {customerInvoices.slice(0, 5).map((inv) => (
                    <div
                      key={inv.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-900">{inv.invoiceNumber}</p>
                          <p className="text-xs text-slate-500">{formatDate(inv.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-900">{formatCurrency(inv.total)}</p>
                        <StatusBadge
                          variant={
                            inv.paymentStatus === 'PAID'
                              ? 'active'
                              : inv.paymentStatus === 'PARTIAL'
                              ? 'warning'
                              : 'inactive'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm text-slate-700">{value}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Customer | null>(null)
  const [detailTarget, setDetailTarget] = useState<Customer | null>(null)

  const canCreate = hasPermission(user, 'customers.create')
  const canUpdate = hasPermission(user, 'customers.update')

  const lockedBizId = user?.businessId

  const customersQuery = useQuery({
    queryKey: ['customers', { businessId: lockedBizId, status: statusFilter }],
    queryFn: () =>
      fetchCustomers({
        businessId: lockedBizId,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  })
  const allCustomers = customersQuery.data?.data ?? []

  const invoicesQuery = useQuery({
    queryKey: ['invoices', lockedBizId],
    queryFn: () => fetchInvoices({ businessId: lockedBizId }),
  })
  const allInvoices = invoicesQuery.data?.data ?? []

  // Client-side search
  const customers = useMemo(() => {
    if (!search.trim()) return allCustomers
    const q = search.toLowerCase()
    return allCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false) ||
        (c.phone?.toLowerCase().includes(q) ?? false)
    )
  }, [allCustomers, search])

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormState) =>
      createCustomer({
        businessId: lockedBizId ?? '',
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        balance: 0,
        status: data.status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer created.')
      setCreateOpen(false)
    },
    onError: () => toast.error('Failed to create customer.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Customer> }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['customers'] })
      toast.success('Customer updated.')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to update customer.'),
  })

  const totalDebt = customers.reduce((sum, c) => sum + c.balance, 0)
  const activeCount = customers.filter((c) => c.status === 'ACTIVE').length

  const columns = useMemo<ColumnDef<Customer>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Customer',
        cell: ({ row }) => (
          <button
            onClick={() => setDetailTarget(row.original)}
            className="flex items-center gap-3 text-left hover:underline underline-offset-2 group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                {row.original.name}
              </div>
              {row.original.email && (
                <div className="text-xs text-slate-500 truncate">{row.original.email}</div>
              )}
            </div>
          </button>
        ),
      },
      {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => (
          <span className="text-slate-600 text-sm">{row.original.phone ?? '-'}</span>
        ),
      },
      {
        accessorKey: 'balance',
        header: 'Balance',
        cell: ({ row }) => <BalanceBadge balance={row.original.balance} />,
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge variant={row.original.status === 'ACTIVE' ? 'active' : 'inactive'} />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Added',
        cell: ({ row }) => (
          <span className="text-slate-500 text-xs">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          if (!canUpdate) return null
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditTarget(row.original)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [canUpdate]
  )

  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Manage your customer contacts and view their balances."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Customer
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Customers</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Active Customers</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Outstanding</p>
          <p className={`text-2xl font-bold mt-1 ${totalDebt > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
            {formatCurrency(totalDebt)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {!customersQuery.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {customers.length} result{customers.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Table */}
      {customersQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          emptyTitle="No customers found"
          emptyDescription="No customers match your current filters."
        />
      )}

      {/* Create dialog */}
      <CustomerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      <CustomerFormDialog
        open={!!editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null)
        }}
        initial={editTarget}
        onSubmit={(data) =>
          editTarget &&
          updateMutation.mutate({
            id: editTarget.id,
            data: {
              name: data.name,
              email: data.email || undefined,
              phone: data.phone || undefined,
              address: data.address || undefined,
              status: data.status,
            },
          })
        }
        loading={updateMutation.isPending}
      />

      {/* Detail sheet */}
      <CustomerDetailSheet
        customer={detailTarget}
        invoices={allInvoices}
        onClose={() => setDetailTarget(null)}
      />
    </PageContainer>
  )
}
