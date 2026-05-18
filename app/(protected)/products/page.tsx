'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Package,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/data/api/products'
import type { Product, Category } from '@/types'
import { formatDate, formatCurrency } from '@/data/helpers'
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

// ─── Low Stock Badge ──────────────────────────────────────────────────────────

function LowStockBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
      <AlertTriangle className="w-3 h-3" />
      Low Stock
    </span>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface ProductFormState {
  name: string
  sku: string
  barcode: string
  categoryId: string
  purchasePrice: string
  sellingPrice: string
  minimumStock: string
  description: string
  status: 'ACTIVE' | 'INACTIVE'
}

const emptyForm = (): ProductFormState => ({
  name: '',
  sku: '',
  barcode: '',
  categoryId: '',
  purchasePrice: '',
  sellingPrice: '',
  minimumStock: '0',
  description: '',
  status: 'ACTIVE',
})

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Product | null
  categories: Category[]
  onSubmit: (data: ProductFormState) => void
  loading: boolean
}

function ProductFormDialog({
  open,
  onOpenChange,
  initial,
  categories,
  onSubmit,
  loading,
}: ProductFormDialogProps) {
  const [form, setForm] = useState<ProductFormState>(emptyForm)

  useMemo(() => {
    if (open) {
      setForm(
        initial
          ? {
              name: initial.name,
              sku: initial.sku,
              barcode: initial.barcode ?? '',
              categoryId: initial.categoryId,
              purchasePrice: initial.purchasePrice.toString(),
              sellingPrice: initial.sellingPrice.toString(),
              minimumStock: initial.minimumStock.toString(),
              description: initial.description ?? '',
              status: initial.status,
            }
          : emptyForm()
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (key: keyof ProductFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Product' : 'Create Product'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(form)
          }}
          className="flex flex-col gap-4 py-2 max-h-[70vh] overflow-y-auto"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="prod-name">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prod-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Product name"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-sku">
                SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prod-sku"
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                placeholder="SKU-001"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-barcode">Barcode</Label>
              <Input
                id="prod-barcode"
                value={form.barcode}
                onChange={(e) => set('barcode', e.target.value)}
                placeholder="8901234567890"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="prod-cat">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={form.categoryId} onValueChange={(v) => set('categoryId', v)} required>
                <SelectTrigger id="prod-cat">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-purchase">
                Purchase Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prod-purchase"
                type="number"
                step="0.01"
                min="0"
                value={form.purchasePrice}
                onChange={(e) => set('purchasePrice', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-selling">
                Selling Price <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prod-selling"
                type="number"
                step="0.01"
                min="0"
                value={form.sellingPrice}
                onChange={(e) => set('sellingPrice', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-minstock">Minimum Stock</Label>
              <Input
                id="prod-minstock"
                type="number"
                min="0"
                value={form.minimumStock}
                onChange={(e) => set('minimumStock', e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => set('status', v as 'ACTIVE' | 'INACTIVE')}
              >
                <SelectTrigger id="prod-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="prod-desc">Description</Label>
              <Textarea
                id="prod-desc"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Product description..."
                rows={3}
              />
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
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const canCreate = hasPermission(user, 'products.create')
  const canUpdate = hasPermission(user, 'products.update')
  const canDelete = hasPermission(user, 'products.delete')

  const lockedBizId = user?.businessId

  const categoriesQuery = useQuery({
    queryKey: ['categories', lockedBizId],
    queryFn: () => fetchCategories(lockedBizId),
  })
  const allCategories = categoriesQuery.data?.data ?? []

  const productsQuery = useQuery({
    queryKey: ['products', { businessId: lockedBizId, categoryId: categoryFilter, status: statusFilter }],
    queryFn: () =>
      fetchProducts({
        businessId: lockedBizId,
        categoryId: categoryFilter || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      }),
  })
  const allProducts = productsQuery.data?.data ?? []

  // Client-side search
  const products = useMemo(() => {
    if (!search.trim()) return allProducts
    const q = search.toLowerCase()
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode?.toLowerCase().includes(q) ?? false)
    )
  }, [allProducts, search])

  const getCategoryName = (id: string) =>
    allCategories.find((c) => c.id === id)?.name ?? id

  const createMutation = useMutation({
    mutationFn: (data: ProductFormState) =>
      createProduct({
        businessId: lockedBizId ?? '',
        categoryId: data.categoryId,
        categoryName: getCategoryName(data.categoryId),
        name: data.name,
        sku: data.sku,
        barcode: data.barcode || undefined,
        purchasePrice: parseFloat(data.purchasePrice) || 0,
        sellingPrice: parseFloat(data.sellingPrice) || 0,
        minimumStock: parseInt(data.minimumStock) || 0,
        description: data.description || undefined,
        status: data.status,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product created.')
      setCreateOpen(false)
    },
    onError: () => toast.error('Failed to create product.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      updateProduct(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product updated.')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to update product.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted.')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete product.'),
  })

  // Low stock threshold (default 10, could come from settings)
  const lowStockThreshold = 10

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Product',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              <Package className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="font-medium text-slate-900 truncate">{row.original.name}</div>
              <div className="text-xs text-slate-500 truncate">{row.original.sku}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'categoryName',
        header: 'Category',
        cell: ({ row }) => (
          <span className="text-slate-600 text-sm">
            {row.original.categoryName ?? getCategoryName(row.original.categoryId)}
          </span>
        ),
      },
      {
        accessorKey: 'purchasePrice',
        header: 'Purchase',
        cell: ({ row }) => (
          <span className="text-slate-500 text-sm">{formatCurrency(row.original.purchasePrice)}</span>
        ),
      },
      {
        accessorKey: 'sellingPrice',
        header: 'Selling',
        cell: ({ row }) => (
          <span className="font-medium text-slate-900">{formatCurrency(row.original.sellingPrice)}</span>
        ),
      },
      {
        accessorKey: 'minimumStock',
        header: 'Min Stock',
        cell: ({ row }) => {
          const isLow = row.original.minimumStock > 0 && row.original.minimumStock <= lowStockThreshold
          return (
            <div className="flex items-center gap-2">
              <span className="text-slate-600">{row.original.minimumStock}</span>
              {isLow && <LowStockBadge />}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge variant={row.original.status === 'ACTIVE' ? 'active' : 'inactive'} />
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const prod = row.original
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
                  <DropdownMenuItem onClick={() => setEditTarget(prod)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    {canUpdate && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(prod)}
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canUpdate, canDelete, allCategories]
  )

  const activeCount = products.filter((p) => p.status === 'ACTIVE').length
  const lowStockCount = products.filter((p) => p.minimumStock > 0 && p.minimumStock <= lowStockThreshold).length

  return (
    <PageContainer>
      <PageHeader
        title="Products"
        description="Manage your product catalog, pricing, and stock levels."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Product
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Total Products</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{products.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Active Products</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Low Stock Items</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
            {lowStockCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search by name, SKU, or barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter || 'ALL'}
          onValueChange={(v) => setCategoryFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {allCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        {!productsQuery.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {products.length} result{products.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Table */}
      {productsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          emptyTitle="No products found"
          emptyDescription="No products match your current filters."
        />
      )}

      {/* Create dialog */}
      <ProductFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        categories={allCategories.filter((c) => c.status === 'ACTIVE')}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      <ProductFormDialog
        open={!!editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null)
        }}
        initial={editTarget}
        categories={allCategories.filter((c) => c.status === 'ACTIVE')}
        onSubmit={(data) =>
          editTarget &&
          updateMutation.mutate({
            id: editTarget.id,
            data: {
              name: data.name,
              sku: data.sku,
              barcode: data.barcode || undefined,
              categoryId: data.categoryId,
              categoryName: getCategoryName(data.categoryId),
              purchasePrice: parseFloat(data.purchasePrice) || 0,
              sellingPrice: parseFloat(data.sellingPrice) || 0,
              minimumStock: parseInt(data.minimumStock) || 0,
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
          description="This action cannot be undone. All inventory records for this product will also be affected."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </PageContainer>
  )
}
