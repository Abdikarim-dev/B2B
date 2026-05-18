'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreHorizontal, Pencil, PowerOff, Power } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { ROLE_DEFAULT_PERMISSIONS } from '@/lib/permissions'
import { fetchUsers, createUser, updateUser } from '@/data/api/users'
import { fetchBranches, fetchBusinesses } from '@/data/api/businesses'
import type { User, UserRole } from '@/types'
import { formatDate, getInitials } from '@/data/helpers'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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

// ─── Role helpers ─────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Admin',
  PLATFORM_SUPPORT: 'Platform Support',
  BUSINESS_OWNER: 'Business Owner',
  BUSINESS_ADMIN: 'Business Admin',
  BRANCH_MANAGER: 'Branch Manager',
  CASHIER: 'Cashier',
  INVENTORY_MANAGER: 'Inventory Manager',
  ACCOUNTANT: 'Accountant',
  STAFF: 'Staff',
  VIEWER: 'Viewer',
}

const ASSIGNABLE_ROLES: UserRole[] = [
  'BUSINESS_OWNER',
  'BUSINESS_ADMIN',
  'BRANCH_MANAGER',
  'CASHIER',
  'INVENTORY_MANAGER',
  'ACCOUNTANT',
  'STAFF',
  'VIEWER',
]

const roleStyles: Record<string, string> = {
  SUPER_ADMIN: 'bg-violet-50 text-violet-700 border-violet-100',
  PLATFORM_SUPPORT: 'bg-blue-50 text-blue-700 border-blue-100',
  BUSINESS_OWNER: 'bg-amber-50 text-amber-700 border-amber-100',
  BUSINESS_ADMIN: 'bg-amber-50 text-amber-700 border-amber-100',
  BRANCH_MANAGER: 'bg-sky-50 text-sky-700 border-sky-100',
  CASHIER: 'bg-teal-50 text-teal-700 border-teal-100',
  INVENTORY_MANAGER: 'bg-orange-50 text-orange-700 border-orange-100',
  ACCOUNTANT: 'bg-slate-100 text-slate-700 border-slate-200',
  STAFF: 'bg-slate-100 text-slate-600 border-slate-200',
  VIEWER: 'bg-slate-50 text-slate-500 border-slate-100',
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
        roleStyles[role] ?? 'bg-slate-100 text-slate-600 border-slate-200'
      }`}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface UserFormState {
  name: string
  email: string
  phone: string
  role: UserRole
  businessId: string
  branchId: string
}

const emptyForm = (bizId = ''): UserFormState => ({
  name: '',
  email: '',
  phone: '',
  role: 'STAFF',
  businessId: bizId,
  branchId: '',
})

interface UserFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: User | null
  businesses: { id: string; name: string }[]
  branches: { id: string; name: string; businessId: string }[]
  lockedBusinessId?: string
  canAssignRole: boolean
  canAssignBranch: boolean
  onSubmit: (data: UserFormState) => void
  loading: boolean
}

function UserFormDialog({
  open,
  onOpenChange,
  initial,
  businesses,
  branches,
  lockedBusinessId,
  canAssignRole,
  canAssignBranch,
  onSubmit,
  loading,
}: UserFormDialogProps) {
  const [form, setForm] = useState<UserFormState>(emptyForm(lockedBusinessId))

  useMemo(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              email: initial.email,
              phone: initial.phone ?? '',
              role: initial.role,
              businessId: initial.businessId ?? lockedBusinessId ?? '',
              branchId: initial.branchId ?? '',
            }
          : emptyForm(lockedBusinessId)
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (key: keyof UserFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const activeBizId = form.businessId || lockedBusinessId || ''
  const filteredBranches = branches.filter((b) => b.businessId === activeBizId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit User' : 'Create User'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => { e.preventDefault(); onSubmit(form) }}
          className="flex flex-col gap-4 py-2"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="usr-name">Full Name <span className="text-red-500">*</span></Label>
              <Input
                id="usr-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="usr-email">Email <span className="text-red-500">*</span></Label>
              <Input
                id="usr-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="jane@company.com"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="usr-phone">Phone</Label>
              <Input
                id="usr-phone"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+1-555-0100"
              />
            </div>

            {canAssignRole && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="usr-role">Role <span className="text-red-500">*</span></Label>
                <Select value={form.role} onValueChange={(v) => set('role', v)}>
                  <SelectTrigger id="usr-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Business selector — hidden when locked to a specific business */}
            {!lockedBusinessId && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="usr-biz">Business</Label>
                <Select
                  value={form.businessId || '_none'}
                  onValueChange={(v) => {
                    set('businessId', v === '_none' ? '' : v)
                    set('branchId', '')
                  }}
                >
                  <SelectTrigger id="usr-biz"><SelectValue placeholder="Select business..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {businesses.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Branch selector — only shown if canAssignBranch and a business is in scope */}
            {canAssignBranch && activeBizId && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="usr-branch">Branch</Label>
                <Select
                  value={form.branchId || '_none'}
                  onValueChange={(v) => set('branchId', v === '_none' ? '' : v)}
                >
                  <SelectTrigger id="usr-branch"><SelectValue placeholder="Select branch..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">None</SelectItem>
                    {filteredBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [roleFilter, setRoleFilter] = useState<'' | UserRole>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<User | null>(null)
  const [toggleTarget, setToggleTarget] = useState<User | null>(null)

  const canCreate = hasPermission(user, 'users.create')
  const canUpdate = hasPermission(user, 'users.update')
  const canActivate = hasPermission(user, 'users.activate')
  const canAssignRole = hasPermission(user, 'users.assign_role')
  const canAssignBranch = hasPermission(user, 'users.assign_branch')

  // Business-scoped users only see their own business
  const lockedBizId = user?.businessId

  const businessesQuery = useQuery({
    queryKey: ['businesses'],
    queryFn: () => fetchBusinesses(),
    enabled: !lockedBizId,
  })
  const allBusinesses = businessesQuery.data?.data ?? []

  const branchesQuery = useQuery({
    queryKey: ['branches', { businessId: lockedBizId }],
    queryFn: () => fetchBranches({ businessId: lockedBizId }),
  })
  const allBranches = branchesQuery.data?.data ?? []

  const query = useQuery({
    queryKey: ['users', { status: statusFilter, role: roleFilter, businessId: lockedBizId }],
    queryFn: () =>
      fetchUsers({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        role: roleFilter || undefined,
        businessId: lockedBizId || undefined,
      }),
  })
  const allUsers = query.data?.data ?? []

  // Client-side name/email search
  const users = useMemo(() => {
    if (!search.trim()) return allUsers
    const q = search.toLowerCase()
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }, [allUsers, search])

  const getBranchName = (id?: string) =>
    id ? (allBranches.find((b) => b.id === id)?.name ?? id) : '—'

  const createMutation = useMutation({
    mutationFn: (data: UserFormState) =>
      createUser({
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        role: data.role,
        permissions: ROLE_DEFAULT_PERMISSIONS[data.role] ?? [],
        businessId: data.businessId || undefined,
        branchId: data.branchId || undefined,
        status: 'ACTIVE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created.')
      setCreateOpen(false)
    },
    onError: () => toast.error('Failed to create user.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => updateUser(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('User updated.')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to update user.'),
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' }) =>
      updateUser(id, { status }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success(vars.status === 'ACTIVE' ? 'User activated.' : 'User deactivated.')
      setToggleTarget(null)
    },
    onError: () => toast.error('Failed to update user status.'),
  })

  const columns = useMemo<ColumnDef<User>[]>(() => [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => {
        const u = row.original
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarFallback className="bg-slate-200 text-slate-600 text-xs font-semibold">
                {getInitials(u.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{u.name}</div>
              <div className="text-xs text-slate-500 truncate">{u.email}</div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
    },
    {
      accessorKey: 'branchId',
      header: 'Branch',
      cell: ({ row }) => (
        <span className="text-slate-600 text-sm">{getBranchName(row.original.branchId)}</span>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">{row.original.phone ?? '—'}</span>
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
      header: 'Joined',
      cell: ({ row }) => (
        <span className="text-slate-500 text-xs">{formatDate(row.original.createdAt)}</span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const u = row.original
        const isActive = u.status === 'ACTIVE'
        const showMenu = canUpdate || canActivate
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
                <DropdownMenuItem onClick={() => setEditTarget(u)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Edit
                </DropdownMenuItem>
              )}
              {canActivate && (
                <>
                  {canUpdate && <DropdownMenuSeparator />}
                  <DropdownMenuItem
                    onClick={() => setToggleTarget(u)}
                    className={isActive ? 'text-red-600 focus:text-red-600' : 'text-green-600 focus:text-green-600'}
                  >
                    {isActive
                      ? <PowerOff className="mr-2 h-3.5 w-3.5" />
                      : <Power className="mr-2 h-3.5 w-3.5" />}
                    {isActive ? 'Deactivate' : 'Activate'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [canUpdate, canActivate, allBranches])

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description="Manage staff accounts, roles, and branch assignments."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New User
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
        <Select
          value={roleFilter || 'ALL'}
          onValueChange={(v) => setRoleFilter(v === 'ALL' ? '' : (v as UserRole))}
        >
          <SelectTrigger className="w-44"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Roles</SelectItem>
            {ASSIGNABLE_ROLES.map((r) => (
              <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!query.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {users.length} result{users.length !== 1 ? 's' : ''}
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
          data={users}
          emptyTitle="No users found"
          emptyDescription="No users match your current filters."
        />
      )}

      {/* Create */}
      <UserFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        businesses={allBusinesses}
        branches={allBranches}
        lockedBusinessId={lockedBizId}
        canAssignRole={canAssignRole}
        canAssignBranch={canAssignBranch}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit */}
      <UserFormDialog
        open={!!editTarget}
        onOpenChange={(v) => { if (!v) setEditTarget(null) }}
        initial={editTarget}
        businesses={allBusinesses}
        branches={allBranches}
        lockedBusinessId={lockedBizId}
        canAssignRole={canAssignRole}
        canAssignBranch={canAssignBranch}
        onSubmit={(data) =>
          editTarget &&
          updateMutation.mutate({
            id: editTarget.id,
            data: {
              name: data.name,
              email: data.email,
              phone: data.phone || undefined,
              ...(canAssignRole && {
                role: data.role,
                permissions: ROLE_DEFAULT_PERMISSIONS[data.role] ?? [],
              }),
              ...(canAssignBranch && { branchId: data.branchId || undefined }),
            },
          })
        }
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
              ? 'This user will no longer be able to log in.'
              : 'This user will be able to log in again with their assigned permissions.'
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
