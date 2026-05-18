'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  ShieldCheck,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchRoles, createRole, updateRole, deleteRole, updateRolePermissions } from '@/data/api/roles'
import { PERMISSION_GROUPS } from '@/data/mock/roles'
import type { Role, Permission } from '@/types'
import { formatDate } from '@/data/helpers'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeader } from '@/components/shared/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DataTable } from '@/components/shared/DataTable'
import { PermissionCheckboxList } from '@/components/shared/PermissionCheckboxGroup'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// ─── Role Form Dialog ─────────────────────────────────────────────────────────

interface RoleFormState {
  name: string
  description: string
  permissions: Permission[]
}

const emptyForm = (): RoleFormState => ({
  name: '',
  description: '',
  permissions: [],
})

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Role | null
  onSubmit: (data: RoleFormState) => void
  loading: boolean
}

function RoleFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  loading,
}: RoleFormDialogProps) {
  const [form, setForm] = useState<RoleFormState>(emptyForm())

  useMemo(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              description: initial.description ?? '',
              permissions: [...initial.permissions],
            }
          : emptyForm()
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const handleTogglePermission = (permission: Permission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }))
  }

  const handleToggleAll = (permissions: Permission[], checked: boolean) => {
    setForm((prev) => {
      if (checked) {
        const newPerms = new Set([...prev.permissions, ...permissions])
        return { ...prev, permissions: Array.from(newPerms) }
      } else {
        return {
          ...prev,
          permissions: prev.permissions.filter((p) => !permissions.includes(p)),
        }
      }
    })
  }

  const isSystemRole = initial?.isSystemRole ?? false

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {initial ? (
              <>
                Edit Role
                {isSystemRole && (
                  <Badge variant="outline" className="text-xs font-normal">
                    <Lock className="w-3 h-3 mr-1" /> System Role
                  </Badge>
                )}
              </>
            ) : (
              'Create Role'
            )}
          </DialogTitle>
          {isSystemRole && (
            <DialogDescription className="text-amber-600">
              System roles have limited editing. You can only modify permissions.
            </DialogDescription>
          )}
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(form)
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="flex flex-col gap-4 flex-1 overflow-y-auto py-2 pr-1">
            {/* Name & Description */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-name">
                  Role Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="role-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Sales Lead"
                  required
                  disabled={isSystemRole}
                  className={isSystemRole ? 'bg-slate-50' : ''}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="role-desc">Description</Label>
                <Textarea
                  id="role-desc"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this role..."
                  rows={2}
                  disabled={isSystemRole}
                  className={isSystemRole ? 'bg-slate-50' : ''}
                />
              </div>
            </div>

            {/* Permissions */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-base">Permissions</Label>
                <Badge variant="secondary" className="text-xs">
                  {form.permissions.length} selected
                </Badge>
              </div>
              <PermissionCheckboxList
                groups={PERMISSION_GROUPS}
                selectedPermissions={form.permissions}
                onToggle={handleTogglePermission}
                onToggleAll={handleToggleAll}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Role | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null)

  const canCreate = hasPermission(user, 'roles.create')
  const canUpdate = hasPermission(user, 'roles.update')
  const canDelete = hasPermission(user, 'roles.delete')
  const canManagePermissions = hasPermission(user, 'roles.manage_permissions')

  // Business-scoped users only see their own business roles
  const lockedBizId = user?.businessId

  const query = useQuery({
    queryKey: ['roles', { businessId: lockedBizId }],
    queryFn: () => fetchRoles({ businessId: lockedBizId }),
  })
  const allRoles = query.data?.data ?? []

  // Client-side name search
  const roles = useMemo(() => {
    if (!search.trim()) return allRoles
    const q = search.toLowerCase()
    return allRoles.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false)
    )
  }, [allRoles, search])

  const createMutation = useMutation({
    mutationFn: (data: RoleFormState) =>
      createRole({
        businessId: lockedBizId ?? 'biz-001',
        name: data.name,
        description: data.description || undefined,
        permissions: data.permissions,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Role created.')
      setCreateOpen(false)
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to create role.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Role> }) => updateRole(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Role updated.')
      setEditTarget(null)
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to update role.'),
  })

  const permissionMutation = useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Permission[] }) =>
      updateRolePermissions(id, permissions),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Permissions updated.')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to update permissions.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      toast.success('Role deleted.')
      setDeleteTarget(null)
    },
    onError: (error: Error) => toast.error(error.message || 'Failed to delete role.'),
  })

  const handleSubmit = (data: RoleFormState) => {
    if (editTarget) {
      if (editTarget.isSystemRole) {
        // System roles: only update permissions
        permissionMutation.mutate({ id: editTarget.id, permissions: data.permissions })
      } else {
        updateMutation.mutate({
          id: editTarget.id,
          data: {
            name: data.name,
            description: data.description || undefined,
            permissions: data.permissions,
          },
        })
      }
    } else {
      createMutation.mutate(data)
    }
  }

  const columns = useMemo<ColumnDef<Role>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Role',
        cell: ({ row }) => {
          const r = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 shrink-0">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900">{r.name}</span>
                  {r.isSystemRole && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal border-slate-300">
                      <Lock className="w-2.5 h-2.5 mr-0.5" />
                      System
                    </Badge>
                  )}
                </div>
                {r.description && (
                  <div className="text-xs text-slate-500 truncate max-w-xs">{r.description}</div>
                )}
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'permissions',
        header: 'Permissions',
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">
            {row.original.permissions.length} permissions
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: 'Last Updated',
        cell: ({ row }) => (
          <span className="text-slate-500 text-xs">{formatDate(row.original.updatedAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const r = row.original
          const showEdit = canUpdate || canManagePermissions
          const showDelete = canDelete && !r.isSystemRole
          if (!showEdit && !showDelete) return null
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {showEdit && (
                  <DropdownMenuItem onClick={() => setEditTarget(r)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    {r.isSystemRole ? 'Edit Permissions' : 'Edit'}
                  </DropdownMenuItem>
                )}
                {showDelete && (
                  <>
                    {showEdit && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(r)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [canUpdate, canDelete, canManagePermissions]
  )

  return (
    <PageContainer>
      <PageHeader
        title="Roles"
        description="Manage roles and their permissions for your business."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Role
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search roles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {!query.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {roles.length} role{roles.length !== 1 ? 's' : ''}
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
          data={roles}
          emptyTitle="No roles found"
          emptyDescription="No roles match your current search."
        />
      )}

      {/* Create Dialog */}
      <RoleFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        onSubmit={handleSubmit}
        loading={createMutation.isPending}
      />

      {/* Edit Dialog */}
      <RoleFormDialog
        open={!!editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null)
        }}
        initial={editTarget}
        onSubmit={handleSubmit}
        loading={updateMutation.isPending || permissionMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null)
        }}
        title="Delete Role"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone. Users assigned this role will need to be reassigned.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </PageContainer>
  )
}
