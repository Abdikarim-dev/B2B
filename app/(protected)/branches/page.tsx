'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Search, MoreHorizontal, Pencil, PowerOff, MapPin, Phone, Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import {
  fetchBranches,
  fetchBusinesses,
  createBranch,
  updateBranch,
} from '@/data/api/businesses'
import type { Branch, Business } from '@/types'
import { formatDate } from '@/data/helpers'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  DropdownMenuSeparator,
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

interface BranchFormState {
  businessId: string
  name: string
  address: string
  phone: string
}

const emptyForm = (defaultBusinessId = ''): BranchFormState => ({
  businessId: defaultBusinessId,
  name: '',
  address: '',
  phone: '',
})

interface BranchFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Branch | null
  businesses: Business[]
  lockedBusinessId?: string
  onSubmit: (data: BranchFormState) => void
  loading: boolean
}

function BranchFormDialog({
  open,
  onOpenChange,
  initial,
  businesses,
  lockedBusinessId,
  onSubmit,
  loading,
}: BranchFormDialogProps) {
  const [form, setForm] = useState<BranchFormState>(emptyForm(lockedBusinessId))

  useMemo(() => {
    if (open) {
      setForm(
        initial
          ? { businessId: initial.businessId, name: initial.name, address: initial.address, phone: initial.phone }
          : emptyForm(lockedBusinessId)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (key: keyof BranchFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Branch' : 'Create Branch'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
          className="flex flex-col gap-4 py-2"
        >
          {!lockedBusinessId && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="br-biz">Business <span className="text-red-500">*</span></Label>
              <Select value={form.businessId} onValueChange={(v) => set('businessId', v)} required>
                <SelectTrigger id="br-biz"><SelectValue placeholder="Select business..." /></SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="br-name">Branch Name <span className="text-red-500">*</span></Label>
              <Input id="br-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Main Branch" required />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="br-address">Address <span className="text-red-500">*</span></Label>
              <Input id="br-address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St, City" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="br-phone">Phone <span className="text-red-500">*</span></Label>
              <Input id="br-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1-555-0100" required />
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Branch'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Detail Sheet ─────────────────────────────────────────────────────────────

interface BranchDetailSheetProps {
  branch: Branch | null
  businessName: string
  onClose: () => void
}

function BranchDetailSheet({ branch, businessName, onClose }: BranchDetailSheetProps) {
  return (
    <Sheet open={!!branch} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
          <SheetTitle className="text-base">{branch?.name}</SheetTitle>
          <p className="text-sm text-slate-500">{businessName}</p>
        </SheetHeader>
        {branch && (
          <div className="flex flex-col gap-5 px-6 py-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">Status</span>
              <StatusBadge variant={branch.status === 'ACTIVE' ? 'active' : 'inactive'} />
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              <DetailRow icon={<MapPin className="h-4 w-4" />} label="Address" value={branch.address} />
              <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={branch.phone} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Created" value={formatDate(branch.createdAt)} />
              <DetailRow icon={<Calendar className="h-4 w-4" />} label="Last Updated" value={formatDate(branch.updatedAt)} />
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

export default function BranchesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [bizFilter, setBizFilter] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Branch | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Branch | null>(null)
  const [detailTarget, setDetailTarget] = useState<Branch | null>(null)

  const canCreate = hasPermission(user, 'branches.create')
  const canUpdate = hasPermission(user, 'branches.update')
  const canDeactivate = hasPermission(user, 'branches.deactivate')

  // For BUSINESS_ADMIN/BUSINESS_OWNER, lock to their own businessId
  const lockedBizId = user?.businessId

  const businessesQuery = useQuery({
    queryKey: ['businesses'],
    queryFn: () => fetchBusinesses(),
  })
  const allBusinesses = businessesQuery.data?.data ?? []

  const query = useQuery({
    queryKey: ['branches', { status: statusFilter, businessId: bizFilter || lockedBizId }],
    queryFn: () =>
      fetchBranches({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        businessId: bizFilter || lockedBizId || undefined,
      }),
  })
  const allBranches = query.data?.data ?? []

  // Client-side search on name/address
  const branches = useMemo(() => {
    if (!search.trim()) return allBranches
    const q = search.toLowerCase()
    return allBranches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.address.toLowerCase().includes(q)
    )
  }, [allBranches, search])

  const getBusinessName = (id: string) =>
    allBusinesses.find((b) => b.id === id)?.name ?? id

  const createMutation = useMutation({
    mutationFn: (data: BranchFormState) =>
      createBranch({ businessId: data.businessId, name: data.name, address: data.address, phone: data.phone, status: 'ACTIVE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Branch created.')
      setCreateOpen(false)
    },
    onError: () => toast.error('Failed to create branch.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Branch> }) => updateBranch(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Branch updated.')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to update branch.'),
  })

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => updateBranch(id, { status: 'INACTIVE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['branches'] })
      toast.success('Branch deactivated.')
      setDeactivateTarget(null)
    },
    onError: () => toast.error('Failed to deactivate branch.'),
  })

  const columns = useMemo<ColumnDef<Branch>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Branch',
      cell: ({ row }) => (
        <button
          onClick={() => setDetailTarget(row.original)}
          className="flex items-center gap-3 text-left hover:underline underline-offset-2 group"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <MapPin className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors truncate">
              {row.original.name}
            </div>
            <div className="text-xs text-slate-500 truncate">{row.original.address}</div>
          </div>
        </button>
      ),
    },
    {
      accessorKey: 'businessId',
      header: 'Business',
      cell: ({ row }) => (
        <span className="text-slate-600 text-sm">{getBusinessName(row.original.businessId)}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-slate-600">{row.original.phone}</span>,
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
      header: 'Created',
      cell: ({ row }) => <span className="text-slate-500 text-xs">{formatDate(row.original.createdAt)}</span>,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const branch = row.original
        const showMenu = canUpdate || (canDeactivate && branch.status === 'ACTIVE')
        if (!showMenu) return null
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canUpdate && (
                <DropdownMenuItem onClick={() => setEditTarget(branch)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {canDeactivate && branch.status === 'ACTIVE' && (
                <>
                  {canUpdate && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => setDeactivateTarget(branch)}
                    className="text-red-600 focus:text-red-600"
                  >
                    <PowerOff className="mr-2 h-3.5 w-3.5" />
                    Deactivate
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canDeactivate, allBusinesses])

  return (
    <PageContainer>
      <PageHeader
        title="Branches"
        description="Manage branches across all businesses."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Branch
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
        {/* Only show business filter to SUPER_ADMIN (no locked business) */}
        {!lockedBizId && (
          <Select value={bizFilter || 'ALL'} onValueChange={(v) => setBizFilter(v === 'ALL' ? '' : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All Businesses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Businesses</SelectItem>
              {allBusinesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!query.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {branches.length} result{branches.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Table */}
      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={branches}
          emptyTitle="No branches found"
          emptyDescription="No branches match your current filters."
        />
      )}

      {/* Create */}
      <BranchFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        businesses={allBusinesses}
        lockedBusinessId={lockedBizId}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit */}
      <BranchFormDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null) }}
        initial={editTarget}
        businesses={allBusinesses}
        lockedBusinessId={lockedBizId}
        onSubmit={(data) => editTarget && updateMutation.mutate({ id: editTarget.id, data })}
        loading={updateMutation.isPending}
      />

      {/* Deactivate confirm */}
      {deactivateTarget && (
        <ConfirmDialog
          open={!!deactivateTarget}
          onOpenChange={(v) => { if (!v) setDeactivateTarget(null) }}
          title={`Deactivate "${deactivateTarget.name}"?`}
          description="This will suspend all operations for this branch. Users assigned to it will lose access."
          confirmLabel="Deactivate"
          variant="destructive"
          onConfirm={() => deactivateMutation.mutate(deactivateTarget.id)}
          loading={deactivateMutation.isPending}
        />
      )}

      {/* Detail sheet */}
      <BranchDetailSheet
        branch={detailTarget}
        businessName={detailTarget ? getBusinessName(detailTarget.businessId) : ''}
        onClose={() => setDetailTarget(null)}
      />
    </PageContainer>
  )
}
