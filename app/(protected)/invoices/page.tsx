'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Check,
  X,
  Calendar,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchInvoices, confirmInvoice, cancelInvoice } from '@/data/api/invoices'
import { fetchCustomers } from '@/data/api/customers'
import { fetchBranches } from '@/data/api/businesses'
import type { Invoice } from '@/types'
import { formatDate, formatCurrency } from '@/data/helpers'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// ─── Status Badges ───────────────────────────────────────────────────────────

const invoiceStatusBadge = (status: Invoice['status']) => {
  const variants: Record<Invoice['status'], { bg: string; text: string; label: string }> = {
    DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  }
  const v = variants[status]
  return <Badge className={`${v.bg} ${v.text}`}>{v.label}</Badge>
}

const paymentStatusBadge = (status: Invoice['paymentStatus']) => {
  const variants: Record<Invoice['paymentStatus'], { bg: string; text: string; label: string }> = {
    UNPAID: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unpaid' },
    PARTIAL: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
  }
  const v = variants[status]
  return <Badge className={`${v.bg} ${v.text}`}>{v.label}</Badge>
}

// ─── Actions Dialog ──────────────────────────────────────────────────────────

interface ActionDialogProps {
  open: boolean
  invoice: Invoice | null
  action: 'confirm' | 'cancel' | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

function ActionDialog({ open, invoice, action, onClose, onConfirm, loading }: ActionDialogProps) {
  const title = action === 'confirm' ? 'Confirm Invoice' : 'Cancel Invoice'
  const message =
    action === 'confirm'
      ? `Are you sure you want to confirm invoice ${invoice?.invoiceNumber}?`
      : `Are you sure you want to cancel invoice ${invoice?.invoiceNumber}? This action cannot be undone.`
  const buttonText = action === 'confirm' ? 'Confirm Invoice' : 'Cancel Invoice'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={action === 'cancel' ? 'destructive' : 'default'}
          >
            {loading ? 'Processing...' : buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Invoices Page ───────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('')
  const [branchFilter, setBranchFilter] = useState<string>('')
  const [customerFilter, setCustomerFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [actionDialog, setActionDialog] = useState<{ open: boolean; invoice: Invoice | null; action: 'confirm' | 'cancel' | null }>({
    open: false,
    invoice: null,
    action: null,
  })
  const [actionLoading, setActionLoading] = useState(false)

  // Queries
  const invoicesQuery = useQuery({
    queryKey: ['invoices', statusFilter, paymentStatusFilter, branchFilter, customerFilter],
    queryFn: () =>
      fetchInvoices({
        businessId: user?.businessId,
        branchId: branchFilter || undefined,
        status: (statusFilter as Invoice['status']) || undefined,
        paymentStatus: (paymentStatusFilter as Invoice['paymentStatus']) || undefined,
        customerId: customerFilter || undefined,
      }).then((res) => res.data),
  })

  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetchBranches({ businessId: user?.businessId }).then((res) => res.data),
  })

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetchCustomers({ businessId: user?.businessId }).then((res) => res.data),
  })

  // Filter invoices by search and dates
  const filteredInvoices = invoicesQuery.data?.filter((inv) => {
    const searchLower = search.toLowerCase()
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchLower) ||
      inv.customerName?.toLowerCase().includes(searchLower) ||
      inv.id.toLowerCase().includes(searchLower)

    let matchesDate = true
    if (dateFrom || dateTo) {
      const invDate = new Date(inv.createdAt).getTime()
      if (dateFrom) matchesDate = matchesDate && invDate >= new Date(dateFrom).getTime()
      if (dateTo) {
        const toDate = new Date(dateTo)
        toDate.setHours(23, 59, 59, 999)
        matchesDate = matchesDate && invDate <= toDate.getTime()
      }
    }

    return matchesSearch && matchesDate
  }) || []

  // Columns
  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <Link href={`/invoices/${row.original.id}`} className="font-medium text-blue-600 hover:underline">
          {row.original.invoiceNumber}
        </Link>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => row.original.customerName || '–',
    },
    {
      accessorKey: 'branchName',
      header: 'Branch',
      cell: ({ row }) => row.original.branchName || '–',
    },
    {
      accessorKey: 'total',
      header: 'Amount',
      cell: ({ row }) => formatCurrency(row.original.total),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => invoiceStatusBadge(row.original.status),
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => paymentStatusBadge(row.original.paymentStatus),
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => formatDate(row.original.createdAt),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/invoices/${row.original.id}`} className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                View
              </Link>
            </DropdownMenuItem>
            {row.original.status === 'DRAFT' && hasPermission(user, 'invoices.confirm') && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() =>
                    setActionDialog({ open: true, invoice: row.original, action: 'confirm' })
                  }
                  className="text-blue-600"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirm
                </DropdownMenuItem>
              </>
            )}
            {row.original.status !== 'CANCELLED' && hasPermission(user, 'invoices.cancel') && (
              <DropdownMenuItem
                onClick={() => setActionDialog({ open: true, invoice: row.original, action: 'cancel' })}
                className="text-red-600"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  // Handlers
  const handleActionConfirm = async () => {
    if (!actionDialog.invoice) return
    setActionLoading(true)
    try {
      if (actionDialog.action === 'confirm') {
        await confirmInvoice(actionDialog.invoice.id)
        toast.success('Invoice confirmed')
      } else {
        await cancelInvoice(actionDialog.invoice.id)
        toast.success('Invoice cancelled')
      }
      invoicesQuery.refetch()
      setActionDialog({ open: false, invoice: null, action: null })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const hasActiveFilters = search || statusFilter || paymentStatusFilter || branchFilter || customerFilter || dateFrom || dateTo

  return (
    <PageContainer>
      <PageHeader
        title="Invoices"
        description="Manage and track all invoices"
        action={
          hasPermission(user, 'invoices.create') && (
            <Link href="/invoices/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Invoice
              </Button>
            </Link>
          )
        }
      />

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search invoices, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setStatusFilter('')
                setPaymentStatusFilter('')
                setBranchFilter('')
                setCustomerFilter('')
                setDateFrom('')
                setDateTo('')
              }}
            >
              Clear
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Invoice Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Payments</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
            </SelectContent>
          </Select>

          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Branches</SelectItem>
              {branchesQuery.data?.map((branch) => (
                <SelectItem key={branch.id} value={branch.id}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={customerFilter} onValueChange={setCustomerFilter}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="Customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Customers</SelectItem>
              {customersQuery.data?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From"
            className="text-sm"
          />

          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To"
            className="text-sm"
          />
        </div>
      </div>

      {/* Table */}
      {invoicesQuery.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredInvoices}
          searchTerm={search}
          emptyMessage="No invoices found"
        />
      )}

      {/* Action Dialog */}
      <ActionDialog
        open={actionDialog.open}
        invoice={actionDialog.invoice}
        action={actionDialog.action}
        onClose={() => setActionDialog({ open: false, invoice: null, action: null })}
        onConfirm={handleActionConfirm}
        loading={actionLoading}
      />
    </PageContainer>
  )
}
