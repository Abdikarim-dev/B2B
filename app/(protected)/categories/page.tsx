'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, MoreHorizontal, Pencil, Trash2, FolderOpen } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '@/data/api/products'
import type { Category } from '@/types'
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
import { Textarea } from '@/components/ui/textarea'
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

// ─── Form ─────────────────────────────────────────────────────────────────────

interface CategoryFormState {
  name: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

const emptyForm = (): CategoryFormState => ({
  name: '',
  description: '',
  status: 'ACTIVE',
})

interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Category | null
  onSubmit: (data: CategoryFormState) => void
  loading: boolean
}

function CategoryFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  loading,
}: CategoryFormDialogProps) {
  const [form, setForm] = useState<CategoryFormState>(emptyForm)

  useMemo(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              description: initial.description ?? '',
              status: initial.status,
            }
          : emptyForm()
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (key: keyof CategoryFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Category' : 'Create Category'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(form)
          }}
          className="flex flex-col gap-4 py-2"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="cat-name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Electronics"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea
              id="cat-desc"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Optional description..."
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-status">Status</Label>
            <Select
              value={form.status}
              onValueChange={(v) => set('status', v as 'ACTIVE' | 'INACTIVE')}
            >
              <SelectTrigger id="cat-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const canCreate = hasPermission(user, 'products.create')
  const canUpdate = hasPermission(user, 'products.update')
  const canDelete = hasPermission(user, 'products.delete')

  const lockedBizId = user?.businessId

  const query = useQuery({
    queryKey: ['categories', lockedBizId],
    queryFn: () => fetchCategories(lockedBizId),
  })

  const allCategories = query.data?.data ?? []

  // Client-side filtering
  const categories = useMemo(() => {
    let result = [...allCategories]
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description?.toLowerCase().includes(q) ?? false)
      )
    }
    if (statusFilter !== 'ALL') {
      result = result.filter((c) => c.status === statusFilter)
    }
    return result
  }, [allCategories, search, statusFilter])

  const createMutation = useMutation({
    mutationFn: (data: CategoryFormState) =>
      createCategory({
        businessId: lockedBizId ?? '',
        name: data.name,
        description: data.description || undefined,
        status: data.status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category created.')
      setCreateOpen(false)
    },
    onError: () => toast.error('Failed to create category.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category updated.')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to update category.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] })
      toast.success('Category deleted.')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete category.'),
  })

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Category',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <FolderOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{row.original.name}</div>
              {row.original.description && (
                <div className="text-xs text-slate-500 truncate max-w-[200px]">
                  {row.original.description}
                </div>
              )}
            </div>
          </div>
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
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-slate-500 text-xs">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const cat = row.original
          const showMenu = canUpdate || canDelete
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
                  <DropdownMenuItem onClick={() => setEditTarget(cat)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    {canUpdate && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(cat)}
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
    [canUpdate, canDelete]
  )

  return (
    <PageContainer>
      <PageHeader
        title="Categories"
        description="Manage product categories for your business."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Category
            </Button>
          ) : undefined
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name or description..."
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
        {!query.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {categories.length} result{categories.length !== 1 ? 's' : ''}
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
          data={categories}
          emptyTitle="No categories found"
          emptyDescription="No categories match your current filters."
        />
      )}

      {/* Create dialog */}
      <CategoryFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      <CategoryFormDialog
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
              description: data.description || undefined,
              status: data.status,
            },
          })
        }
        loading={updateMutation.isPending}
      />

      {/* Delete confirm */}
      {deleteTarget && (
        <ConfirmDialog
          open={!!deleteTarget}
          onOpenChange={(v) => {
            if (!v) setDeleteTarget(null)
          }}
          title={`Delete "${deleteTarget.name}"?`}
          description="This action cannot be undone. Products in this category will need to be reassigned."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </PageContainer>
  )
}
