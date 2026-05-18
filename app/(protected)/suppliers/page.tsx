'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Truck,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchSuppliers, createSupplier, updateSupplier } from '@/data/api/customers'
import type { Supplier } from '@/types'
import { formatDate } from '@/data/helpers'
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

// ─── Form ─────────────────────────────────────────────────────────────────────

interface SupplierFormState {
  name: string
  email: string
  phone: string
  address: string
  status: 'ACTIVE' | 'INACTIVE'
}

const emptyForm = (): SupplierFormState => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  status: 'ACTIVE',
})

interface SupplierFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Supplier | null
  onSubmit: (data: SupplierFormState) => void
  loading: boolean
}

function SupplierFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  loading,
}: SupplierFormDialogProps) {
  const [form, setForm] = useState<SupplierFormState>(emptyForm)

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

  const set = (key: keyof SupplierFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Supplier' : 'Create Supplier'}</DialogTitle>
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
              <Label htmlFor="sup-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sup-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Supplier name"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sup-email">Email</Label>
              <Input
                id="sup-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="supplier@example.com"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sup-phone">Phone</Label>
              <Input
                id="sup-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1-555-0100"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="sup-address">Address</Label>
              <Textarea
                id="sup-address"
                value={form.address}
                onChange={(e) => set('address', e.target.value)}
                placeholder="Street address, City, State"
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="sup-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set('status', v as 'ACTIVE' | 'INACTIVE')}
              >
                <SelectTrigger id="sup-status">
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
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

interface SupplierDetailSheetProps {
  supplier: Supplier | null
  onClose: () => void
}

function SupplierDetailSheet({ supplier, onClose }: SupplierDetailSheetProps) {
  return (
    <Sheet open={!!supplier} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base">{supplier?.name}</SheetTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge variant={supplier?.status === 'ACTIVE' ? 'active' : 'inactive'} />
              </div>
            </div>
          </div>
        </SheetHeader>
        {supplier && (
          <div className="flex flex-col gap-5 px-6 py-6 overflow-y-auto flex-1">
            {/* Contact Info */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Contact Information
              </h4>
              {supplier.email && (
                <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={supplier.email} />
              )}
              {supplier.phone && (
                <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={supplier.phone} />
              )}
              {supplier.address && (
                <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={supplier.address} />
              )}
            </div>

            <Separator />

            {/* Dates */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Record Info
              </h4>
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Added"
                value={formatDate(supplier.createdAt)}
              />
              <DetailRow
                icon={<Calendar className="h-4 w-4" />}
                label="Last Updated"
                value={formatDate(supplier.updatedAt)}
              />
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

export default function SuppliersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Supplier | null>(null)
  const [detailTarget, setDetailTarget] = useState<Supplier | null>(null)

  const canCreate = hasPermission(user, 'suppliers.create')
  const canUpdate = hasPermission(user, 'suppliers.update')

  const lockedBizId = user?.businessId

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', { businessId: lockedBizId, status: statusFilter }],
    queryFn: () =>
      fetchSuppliers({
        businessId: lockedBizId,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  })
  const allSuppliers = suppliersQuery.data?.data ?? []

  // Client-side search
  const suppliers = useMemo(() => {
    if (!search.trim()) return allSuppliers
    const q = search.toLowerCase()
    return allSuppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.email?.toLowerCase().includes(q) ?? false) ||
        (s.phone?.toLowerCase().includes(q) ?? false)
    )
  }, [allSuppliers, search])

  const createMutation = useMutation({
    mutationFn: (data: SupplierFormState) =>
      createSupplier({
        businessId: lockedBizId ?? '',
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        status: data.status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier created.')
      setCreateOpen(false)
    },
    onError: () => toast.error('Failed to create supplier.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Supplier> }) =>
      updateSupplier(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] })
      toast.success('Supplier updated.')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to update supplier.'),
  })

  const activeCount = suppliers.filter((s) => s.status === 'ACTIVE').length

  const columns = useMemo<ColumnDef<Supplier>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Supplier',
        cell: ({ row }) => (
          <button
            onClick={() => setDetailTarget(row.original)}
            className="flex items-center gap-3 text-left hover:underline underline-offset-2 group"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              <Truck className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 group-hover:text-orange-600 transition-colors truncate">
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
        accessorKey: 'address',
        header: 'Address',
        cell: ({ row }) => (
          <span className="text-slate-500 text-sm truncate max-w-[200px] block">
            {row.original.address ?? '-'}
          </span>
        ),
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
        title="Suppliers"
        description="Manage your supplier contacts and partnerships."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Supplier
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Suppliers</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{suppliers.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Active Suppliers</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
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
        {!suppliersQuery.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {suppliers.length} result{suppliers.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Table */}
      {suppliersQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={suppliers}
          emptyTitle="No suppliers found"
          emptyDescription="No suppliers match your current filters."
        />
      )}

      {/* Create dialog */}
      <SupplierFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      <SupplierFormDialog
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
      <SupplierDetailSheet
        supplier={detailTarget}
        onClose={() => setDetailTarget(null)}
      />
    </PageContainer>
  )
}
