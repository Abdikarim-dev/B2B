'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreHorizontal, Pencil, PowerOff, Power, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchBusinesses, createBusiness, updateBusiness } from '@/data/api/businesses'
import type { Business } from '@/types'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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

// ─── Plan badge ───────────────────────────────────────────────────────────────

const planStyles: Record<Business['plan'], string> = {
  STARTER: 'bg-slate-100 text-slate-600 border-slate-200',
  PROFESSIONAL: 'bg-blue-50 text-blue-700 border-blue-100',
  ENTERPRISE: 'bg-violet-50 text-violet-700 border-violet-100',
}

function PlanBadge({ plan }: { plan: Business['plan'] }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${planStyles[plan]}`}
    >
      {plan.charAt(0) + plan.slice(1).toLowerCase()}
    </span>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface BusinessFormState {
  name: string
  email: string
  phone: string
  address: string
  plan: Business['plan']
}

const emptyForm = (): BusinessFormState => ({
  name: '',
  email: '',
  phone: '',
  address: '',
  plan: 'STARTER',
})

interface BusinessFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Business | null
  onSubmit: (data: BusinessFormState) => void
  loading: boolean
}

function BusinessFormDialog({ open, onOpenChange, initial, onSubmit, loading }: BusinessFormDialogProps) {
  const [form, setForm] = useState<BusinessFormState>(emptyForm)

  // Sync when dialog opens with a new target
  useMemo(() => {
    if (open) {
      setForm(
        initial
          ? { name: initial.name, email: initial.email, phone: initial.phone, address: initial.address, plan: initial.plan }
          : emptyForm()
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (key: keyof BusinessFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Business' : 'Create Business'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
          className="flex flex-col gap-4 py-2"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="biz-name">Business Name <span className="text-red-500">*</span></Label>
              <Input id="biz-name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Acme Corp" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-email">Email <span className="text-red-500">*</span></Label>
              <Input id="biz-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="info@acme.com" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-phone">Phone <span className="text-red-500">*</span></Label>
              <Input id="biz-phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+1-555-0100" required />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="biz-address">Address <span className="text-red-500">*</span></Label>
              <Input id="biz-address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="123 Main St, City, State" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-plan">Plan <span className="text-red-500">*</span></Label>
              <Select value={form.plan} onValueChange={(v) => set('plan', v)}>
                <SelectTrigger id="biz-plan"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PROFESSIONAL">Professional</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Business'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [planFilter, setPlanFilter] = useState<'' | Business['plan']>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Business | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Business | null>(null)

  const canCreate = hasPermission(user, 'business.create')
  const canUpdate = hasPermission(user, 'business.update')
  const canActivate = hasPermission(user, 'business.activate')
  const canDeactivate = hasPermission(user, 'business.deactivate')

  const query = useQuery({
    queryKey: ['businesses', { search, status: statusFilter, plan: planFilter }],
    queryFn: () =>
      fetchBusinesses({
        search: search || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        plan: planFilter || undefined,
      }),
  })
  const businesses = query.data?.data ?? []

  const createMutation = useMutation({
    mutationFn: (data: BusinessFormState) => createBusiness({ ...data, status: 'ACTIVE' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['businesses'] }); toast.success('Business created.'); setCreateOpen(false) },
    onError: () => toast.error('Failed to create business.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Business> }) => updateBusiness(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['businesses'] }); toast.success('Business updated.'); setEditTarget(null) },
    onError: () => toast.error('Failed to update business.'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) => updateBusiness(id, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['businesses'] })
      toast.success(vars.status === 'ACTIVE' ? 'Business activated.' : 'Business deactivated.')
      setToggleTarget(null)
    },
    onError: () => toast.error('Failed to update business status.'),
  })

  const columns = useMemo<ColumnDef<Business>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Business',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-medium text-slate-900 truncate">{row.original.name}</div>
            <div className="text-xs text-slate-500 truncate">{row.original.email}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => <span className="text-slate-600">{row.original.phone}</span>,
    },
    {
      accessorKey: 'plan',
      header: 'Plan',
      cell: ({ row }) => <PlanBadge plan={row.original.plan} />,
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
        const biz = row.original
        const isActive = biz.status === 'ACTIVE'
        const showMenu = canUpdate || canActivate || canDeactivate
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
                <DropdownMenuItem onClick={() => setEditTarget(biz)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {(canActivate || canDeactivate) && (
                <>
                  {canUpdate && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => setToggleTarget(biz)}
                    className={isActive ? 'text-red-600 focus:text-red-600' : 'text-green-600 focus:text-green-600'}
                  >
                    {isActive ? <PowerOff className="mr-2 h-3.5 w-3.5" /> : <Power className="mr-2 h-3.5 w-3.5" />}
                    {isActive ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [canUpdate, canActivate, canDeactivate])

  return (
    <PageContainer>
      <PageHeader
        title="Businesses"
        description="Manage all registered businesses on the platform."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Business
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name or email..."
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
        <Select value={planFilter || 'ALL'} onValueChange={(v) => setPlanFilter(v === 'ALL' ? '' : (v as Business['plan']))}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Plans</SelectItem>
            <SelectItem value="STARTER">Starter</SelectItem>
            <SelectItem value="PROFESSIONAL">Professional</SelectItem>
            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        {!query.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {businesses.length} result{businesses.length !== 1 ? 's' : ''}
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
          data={businesses}
          emptyTitle="No businesses found"
          emptyDescription="No businesses match your current filters."
        />
      )}

      {/* Create dialog */}
      <BusinessFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      <BusinessFormDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null) }}
        initial={editTarget}
        onSubmit={(data) => editTarget && updateMutation.mutate({ id: editTarget.id, data })}
        loading={updateMutation.isPending}
      />

      {/* Activate / Deactivate confirm */}
      {toggleTarget && (
        <ConfirmDialog
          open={!!toggleTarget}
          onOpenChange={(v) => { if (!v) setToggleTarget(null) }}
          title={
            toggleTarget.status === 'ACTIVE'
              ? `Deactivate "${toggleTarget.name}"?`
              : `Activate "${toggleTarget.name}"?`
          }
          description={
            toggleTarget.status === 'ACTIVE'
              ? 'This will suspend the business and prevent its users from logging in.'
              : 'This will restore access for the business and all its users.'
          }
          confirmLabel={toggleTarget.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          variant={toggleTarget.status === 'ACTIVE' ? 'destructive' : 'default'}
          onConfirm={() =>
            toggleMutation.mutate({
              id: toggleTarget.id,
              status: toggleTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
            })
          }
          loading={toggleMutation.isPending}
        />
      )}
    </PageContainer>
  )
}
