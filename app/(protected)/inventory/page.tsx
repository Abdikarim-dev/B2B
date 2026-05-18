'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Package,
  ArrowRightLeft,
  AlertTriangle,
  MoreHorizontal,
  Plus,
  Minus,
  TrendingDown,
  Filter,
  History,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import {
  fetchInventory,
  fetchInventoryStats,
  adjustStock,
  transferStock,
  type FetchInventoryParams,
} from '@/data/api/inventory'
import { fetchBranches } from '@/data/api/businesses'
import type { InventoryItem, StockMovementType, Branch } from '@/types'
import { formatDate } from '@/data/helpers'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeader } from '@/components/shared/PageHeader'
import { DataTable } from '@/components/shared/DataTable'
import { StatCard } from '@/components/shared/StatCard'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ─── Stock Status Badge ───────────────────────────────────────────────────────

function StockStatusBadge({ item }: { item: InventoryItem }) {
  const available = item.quantity - item.reservedQuantity

  if (item.quantity === 0) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        Out of Stock
      </Badge>
    )
  }

  if (item.minimumStock > 0 && item.quantity <= item.minimumStock) {
    return (
      <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700">
        <TrendingDown className="h-3 w-3" />
        Low Stock
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="gap-1 border-emerald-300 bg-emerald-50 text-emerald-700">
      In Stock ({available})
    </Badge>
  )
}

// ─── Stat Cards Skeleton ──────────────────────────────────────────────────────

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  )
}

// ─── Stock Adjustment Dialog ──────────────────────────────────────────────────

interface AdjustmentDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: InventoryItem | null
  onSubmit: (data: { quantity: number; type: StockMovementType; reason: string }) => void
  loading: boolean
}

const ADJUSTMENT_TYPES: { value: StockMovementType; label: string; direction: 'add' | 'remove' }[] = [
  { value: 'STOCK_IN', label: 'Stock In', direction: 'add' },
  { value: 'STOCK_OUT', label: 'Stock Out', direction: 'remove' },
  { value: 'ADJUSTMENT', label: 'Adjustment', direction: 'add' },
  { value: 'DAMAGED', label: 'Damaged', direction: 'remove' },
  { value: 'RETURN', label: 'Return', direction: 'add' },
]

function AdjustmentDialog({ open, onOpenChange, item, onSubmit, loading }: AdjustmentDialogProps) {
  const [type, setType] = useState<StockMovementType>('ADJUSTMENT')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  const selectedType = ADJUSTMENT_TYPES.find((t) => t.value === type)
  const direction = selectedType?.direction ?? 'add'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    // Apply direction: negative for removals
    const adjustedQty = direction === 'remove' ? -qty : qty
    onSubmit({ quantity: adjustedQty, type, reason })
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setType('ADJUSTMENT')
      setQuantity('')
      setReason('')
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
          <DialogDescription>
            {item && (
              <span>
                Adjusting stock for <strong>{item.productName}</strong> at{' '}
                <strong>{item.branchName}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {item && (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{item.productName}</p>
                <p className="text-sm text-slate-500">
                  Current: {item.quantity} | Reserved: {item.reservedQuantity} | Available:{' '}
                  {item.quantity - item.reservedQuantity}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>Adjustment Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as StockMovementType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <span className="flex items-center gap-2">
                      {t.direction === 'add' ? (
                        <Plus className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Minus className="h-3 w-3 text-red-600" />
                      )}
                      {t.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adj-qty">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="adj-qty"
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
            <p className="text-xs text-slate-500">
              {direction === 'add'
                ? 'This will increase the stock quantity'
                : 'This will decrease the stock quantity'}
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="adj-reason">Reason</Label>
            <Textarea
              id="adj-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for adjustment..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adjusting...' : 'Adjust Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Stock Transfer Dialog ────────────────────────────────────────────────────

interface TransferDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  item: InventoryItem | null
  branches: Branch[]
  onSubmit: (data: { destinationBranchId: string; destinationBranchName: string; quantity: number; reason: string }) => void
  loading: boolean
}

function TransferDialog({ open, onOpenChange, item, branches, onSubmit, loading }: TransferDialogProps) {
  const [destinationBranchId, setDestinationBranchId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')

  // Filter out the source branch
  const availableBranches = branches.filter((b) => b.id !== item?.branchId && b.status === 'ACTIVE')

  const selectedBranch = branches.find((b) => b.id === destinationBranchId)
  const maxTransfer = item ? item.quantity - item.reservedQuantity : 0

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty <= 0) {
      toast.error('Please enter a valid quantity')
      return
    }
    if (qty > maxTransfer) {
      toast.error(`Cannot transfer more than ${maxTransfer} available units`)
      return
    }
    if (!selectedBranch) {
      toast.error('Please select a destination branch')
      return
    }
    onSubmit({
      destinationBranchId,
      destinationBranchName: selectedBranch.name,
      quantity: qty,
      reason,
    })
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setDestinationBranchId('')
      setQuantity('')
      setReason('')
    }
    onOpenChange(v)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Transfer Stock
          </DialogTitle>
          <DialogDescription>
            {item && (
              <span>
                Transfer <strong>{item.productName}</strong> from <strong>{item.branchName}</strong>
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {item && (
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{item.productName}</p>
                <p className="text-sm text-slate-500">
                  Available for transfer: <strong>{maxTransfer}</strong> units
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label>
              Destination Branch <span className="text-red-500">*</span>
            </Label>
            <Select value={destinationBranchId} onValueChange={setDestinationBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select destination branch" />
              </SelectTrigger>
              <SelectContent>
                {availableBranches.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    No other branches available
                  </SelectItem>
                ) : (
                  availableBranches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transfer-qty">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="transfer-qty"
              type="number"
              min={1}
              max={maxTransfer}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder={`Max: ${maxTransfer}`}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="transfer-reason">Reason</Label>
            <Textarea
              id="transfer-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for transfer..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || availableBranches.length === 0}>
              {loading ? 'Transferring...' : 'Transfer Stock'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [lowStockOnly, setLowStockOnly] = useState(false)

  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null)
  const [transferTarget, setTransferTarget] = useState<InventoryItem | null>(null)

  const canAdjust = hasPermission(user, 'inventory.adjust')
  const canTransfer = hasPermission(user, 'inventory.transfer')

  const lockedBizId = user?.businessId

  // Fetch branches for filters and transfer dialog
  const branchesQuery = useQuery({
    queryKey: ['branches', { businessId: lockedBizId }],
    queryFn: () => fetchBranches({ businessId: lockedBizId }),
  })
  const branches = branchesQuery.data?.data ?? []

  // Build inventory params
  const inventoryParams = useMemo<FetchInventoryParams>(() => {
    const params: FetchInventoryParams = { businessId: lockedBizId, limit: 100 }
    if (branchFilter && branchFilter !== 'all') params.branchId = branchFilter
    if (lowStockOnly) params.lowStockOnly = true
    if (search.trim()) params.search = search.trim()
    return params
  }, [lockedBizId, branchFilter, lowStockOnly, search])

  const inventoryQuery = useQuery({
    queryKey: ['inventory', inventoryParams],
    queryFn: () => fetchInventory(inventoryParams),
  })
  const inventory = inventoryQuery.data?.data ?? []

  // Stats
  const statsQuery = useQuery({
    queryKey: ['inventory-stats', lockedBizId],
    queryFn: () => fetchInventoryStats(lockedBizId),
  })
  const stats = statsQuery.data?.data

  // Mutations
  const adjustMutation = useMutation({
    mutationFn: (data: { quantity: number; type: StockMovementType; reason: string }) =>
      adjustStock({
        inventoryItemId: adjustTarget!.id,
        quantity: data.quantity,
        type: data.type,
        reason: data.reason || 'Manual adjustment',
        createdBy: user?.id ?? 'unknown',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-stats'] })
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Stock adjusted successfully')
      setAdjustTarget(null)
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to adjust stock'),
  })

  const transferMutation = useMutation({
    mutationFn: (data: { destinationBranchId: string; destinationBranchName: string; quantity: number; reason: string }) =>
      transferStock({
        sourceInventoryItemId: transferTarget!.id,
        destinationBranchId: data.destinationBranchId,
        destinationBranchName: data.destinationBranchName,
        quantity: data.quantity,
        reason: data.reason || 'Stock transfer',
        createdBy: user?.id ?? 'unknown',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['inventory'] })
      qc.invalidateQueries({ queryKey: ['inventory-stats'] })
      qc.invalidateQueries({ queryKey: ['stock-movements'] })
      toast.success('Stock transferred successfully')
      setTransferTarget(null)
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to transfer stock'),
  })

  // Table columns
  const columns = useMemo<ColumnDef<InventoryItem>[]>(
    () => [
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 shrink-0">
                <Package className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-slate-900">{item.productName}</div>
                <div className="text-xs text-slate-500">{item.sku}</div>
              </div>
            </div>
          )
        },
      },
      {
        accessorKey: 'branchName',
        header: 'Branch',
        cell: ({ row }) => (
          <span className="text-slate-600 text-sm">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => (
          <div className="text-sm">
            <span className="font-semibold text-slate-900">{row.original.quantity}</span>
            {row.original.reservedQuantity > 0 && (
              <span className="text-slate-500 ml-1">
                ({row.original.reservedQuantity} reserved)
              </span>
            )}
          </div>
        ),
      },
      {
        accessorKey: 'minimumStock',
        header: 'Min Stock',
        cell: ({ row }) => (
          <span className="text-slate-500 text-sm">{row.original.minimumStock}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StockStatusBadge item={row.original} />,
      },
      {
        accessorKey: 'lastUpdated',
        header: 'Last Updated',
        cell: ({ row }) => (
          <span className="text-slate-500 text-xs">{formatDate(row.original.lastUpdated)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const item = row.original
          if (!canAdjust && !canTransfer) return null
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canAdjust && (
                  <DropdownMenuItem onClick={() => setAdjustTarget(item)}>
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Adjust Stock
                  </DropdownMenuItem>
                )}
                {canTransfer && (
                  <DropdownMenuItem onClick={() => setTransferTarget(item)}>
                    <ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
                    Transfer Stock
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href={`/inventory/movements?productId=${item.productId}`}>
                    <History className="mr-2 h-3.5 w-3.5" />
                    View History
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [canAdjust, canTransfer]
  )

  return (
    <PageContainer>
      <PageHeader
        title="Inventory"
        description="Manage stock levels across all branches."
        actions={
          <Button variant="outline" asChild>
            <Link href="/inventory/movements">
              <History className="mr-2 h-4 w-4" />
              Movement History
            </Link>
          </Button>
        }
      />

      {/* Stats */}
      {statsQuery.isLoading ? (
        <StatsSkeleton />
      ) : stats ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            title="Total Items"
            value={stats.totalItems}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Total Quantity"
            value={stats.totalQuantity.toLocaleString()}
            icon={<Package className="h-5 w-5" />}
          />
          <StatCard
            title="Low Stock"
            value={stats.lowStockCount}
            icon={<TrendingDown className="h-5 w-5" />}
            trend={stats.lowStockCount > 0 ? 'down' : undefined}
          />
          <StatCard
            title="Out of Stock"
            value={stats.outOfStockCount}
            icon={<AlertTriangle className="h-5 w-5" />}
            trend={stats.outOfStockCount > 0 ? 'down' : undefined}
          />
        </div>
      ) : null}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant={lowStockOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setLowStockOnly(!lowStockOnly)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          {lowStockOnly ? 'Low Stock Only' : 'Show Low Stock'}
        </Button>

        {!inventoryQuery.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {inventory.length} item{inventory.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Table */}
      {inventoryQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={inventory}
          emptyTitle="No inventory items found"
          emptyDescription="No items match your current filters."
        />
      )}

      {/* Adjustment Dialog */}
      <AdjustmentDialog
        open={!!adjustTarget}
        onOpenChange={(v) => !v && setAdjustTarget(null)}
        item={adjustTarget}
        onSubmit={(data) => adjustMutation.mutate(data)}
        loading={adjustMutation.isPending}
      />

      {/* Transfer Dialog */}
      <TransferDialog
        open={!!transferTarget}
        onOpenChange={(v) => !v && setTransferTarget(null)}
        item={transferTarget}
        branches={branches}
        onSubmit={(data) => transferMutation.mutate(data)}
        loading={transferMutation.isPending}
      />
    </PageContainer>
  )
}
