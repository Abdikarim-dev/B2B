'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Filter,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/auth-context'
import { fetchStockMovements, type FetchStockMovementsParams } from '@/data/api/inventory'
import { fetchBranches } from '@/data/api/businesses'
import type { StockMovement, StockMovementType } from '@/types'
import { formatDate } from '@/data/helpers'
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

// ─── Movement Type Config ─────────────────────────────────────────────────────

const MOVEMENT_TYPE_CONFIG: Record<
  StockMovementType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  STOCK_IN: {
    label: 'Stock In',
    icon: <ArrowDownRight className="h-3 w-3" />,
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50 border-emerald-200',
  },
  STOCK_OUT: {
    label: 'Stock Out',
    icon: <ArrowUpRight className="h-3 w-3" />,
    color: 'text-red-700',
    bgColor: 'bg-red-50 border-red-200',
  },
  ADJUSTMENT: {
    label: 'Adjustment',
    icon: <RotateCcw className="h-3 w-3" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  TRANSFER_IN: {
    label: 'Transfer In',
    icon: <ArrowDownRight className="h-3 w-3" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  TRANSFER_OUT: {
    label: 'Transfer Out',
    icon: <ArrowUpRight className="h-3 w-3" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  DAMAGED: {
    label: 'Damaged',
    icon: <AlertTriangle className="h-3 w-3" />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50 border-amber-200',
  },
  SALE: {
    label: 'Sale',
    icon: <ArrowUpRight className="h-3 w-3" />,
    color: 'text-slate-700',
    bgColor: 'bg-slate-50 border-slate-200',
  },
  RETURN: {
    label: 'Return',
    icon: <ArrowDownRight className="h-3 w-3" />,
    color: 'text-teal-700',
    bgColor: 'bg-teal-50 border-teal-200',
  },
}

function MovementTypeBadge({ type }: { type: StockMovementType }) {
  const config = MOVEMENT_TYPE_CONFIG[type]
  return (
    <Badge variant="outline" className={`gap-1 ${config.bgColor} ${config.color} border`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

function QuantityDisplay({ quantity }: { quantity: number }) {
  const isPositive = quantity > 0
  return (
    <span
      className={`font-semibold ${
        isPositive ? 'text-emerald-600' : 'text-red-600'
      }`}
    >
      {isPositive ? '+' : ''}
      {quantity}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StockMovementsPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()

  // URL params for pre-filtering
  const initialProductId = searchParams.get('productId') ?? undefined

  const [search, setSearch] = useState('')
  const [branchFilter, setBranchFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const lockedBizId = user?.businessId

  // Fetch branches for filter
  const branchesQuery = useQuery({
    queryKey: ['branches', { businessId: lockedBizId }],
    queryFn: () => fetchBranches({ businessId: lockedBizId }),
  })
  const branches = branchesQuery.data?.data ?? []

  // Build params
  const params = useMemo<FetchStockMovementsParams>(() => {
    const p: FetchStockMovementsParams = { businessId: lockedBizId, limit: 100 }
    if (branchFilter && branchFilter !== 'all') p.branchId = branchFilter
    if (typeFilter && typeFilter !== 'all') p.type = typeFilter as StockMovementType
    if (search.trim()) p.search = search.trim()
    if (startDate) p.startDate = startDate
    if (endDate) p.endDate = endDate
    if (initialProductId) p.productId = initialProductId
    return p
  }, [lockedBizId, branchFilter, typeFilter, search, startDate, endDate, initialProductId])

  const movementsQuery = useQuery({
    queryKey: ['stock-movements', params],
    queryFn: () => fetchStockMovements(params),
  })
  const movements = movementsQuery.data?.data ?? []

  // Table columns
  const columns = useMemo<ColumnDef<StockMovement>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Date',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-600">{formatDate(row.original.createdAt)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'productName',
        header: 'Product',
        cell: ({ row }) => {
          const m = row.original
          return (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 shrink-0">
                <Package className="w-4 h-4 text-slate-600" />
              </div>
              <span className="font-medium text-slate-900">{m.productName}</span>
            </div>
          )
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => <MovementTypeBadge type={row.original.type} />,
      },
      {
        accessorKey: 'quantity',
        header: 'Quantity',
        cell: ({ row }) => <QuantityDisplay quantity={row.original.quantity} />,
      },
      {
        accessorKey: 'branchName',
        header: 'Branch',
        cell: ({ row }) => (
          <span className="text-slate-600 text-sm">{row.original.branchName}</span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="text-slate-500 text-sm truncate max-w-xs block">
            {row.original.reason || '-'}
          </span>
        ),
      },
    ],
    []
  )

  const movementTypes = Object.entries(MOVEMENT_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }))

  const hasActiveFilters = branchFilter !== 'all' || typeFilter !== 'all' || startDate || endDate || search

  const clearFilters = () => {
    setBranchFilter('all')
    setTypeFilter('all')
    setStartDate('')
    setEndDate('')
    setSearch('')
  }

  return (
    <PageContainer>
      <PageHeader
        title="Stock Movement History"
        description="Track all stock movements across your inventory."
        actions={
          <Button variant="outline" asChild>
            <Link href="/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Link>
          </Button>
        }
      />

      {/* Product filter indicator */}
      {initialProductId && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <Filter className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-800">
            Showing movements for a specific product.{' '}
            <Link href="/inventory/movements" className="underline font-medium">
              Clear filter
            </Link>
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5 flex-1 min-w-48 max-w-sm">
          <label className="text-xs font-medium text-slate-500">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search products, reasons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5 w-44">
          <label className="text-xs font-medium text-slate-500">Branch</label>
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger>
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
        </div>

        <div className="flex flex-col gap-1.5 w-40">
          <label className="text-xs font-medium text-slate-500">Movement Type</label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {movementTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 w-36">
          <label className="text-xs font-medium text-slate-500">From Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5 w-36">
          <label className="text-xs font-medium text-slate-500">To Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
            Clear Filters
          </Button>
        )}
      </div>

      {/* Count badge */}
      {!movementsQuery.isLoading && (
        <div className="flex items-center">
          <Badge variant="secondary" className="text-xs">
            {movements.length} movement{movements.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Table */}
      {movementsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={movements}
          emptyTitle="No movements found"
          emptyDescription="No stock movements match your current filters."
        />
      )}
    </PageContainer>
  )
}
