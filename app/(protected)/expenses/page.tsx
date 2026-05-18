'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  TrendingDown,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchExpenses, createExpense, updateExpense, deleteExpense, getExpenseCategories } from '@/data/api/expenses'
import { fetchBranches } from '@/data/api/businesses'
import type { Expense } from '@/types'
import { formatDate, formatCurrency } from '@/data/helpers'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeader } from '@/components/shared/PageHeader'
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

// ─── Category Badge ───────────────────────────────────────────────────────────

const categoryColors: Record<string, string> = {
  'Office Supplies': 'bg-blue-50 text-blue-700 border-blue-100',
  'Utilities': 'bg-yellow-50 text-yellow-700 border-yellow-100',
  'Rent': 'bg-purple-50 text-purple-700 border-purple-100',
  'Marketing': 'bg-pink-50 text-pink-700 border-pink-100',
  'Travel': 'bg-green-50 text-green-700 border-green-100',
  'Equipment': 'bg-orange-50 text-orange-700 border-orange-100',
  'Maintenance': 'bg-slate-100 text-slate-700 border-slate-200',
  'Insurance': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'Salaries': 'bg-red-50 text-red-700 border-red-100',
  'Professional Services': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Other': 'bg-slate-50 text-slate-600 border-slate-100',
}

function CategoryBadge({ category }: { category: string }) {
  const style = categoryColors[category] ?? categoryColors['Other']
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${style}`}>
      {category}
    </span>
  )
}

// ─── Form ─────────────────────────────────────────────────────────────────────

interface ExpenseFormState {
  branchId: string
  category: string
  description: string
  amount: string
  date: string
}

const emptyForm = (): ExpenseFormState => ({
  branchId: '',
  category: '',
  description: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
})

interface ExpenseFormDialogProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  initial?: Expense | null
  branches: { id: string; name: string }[]
  categories: string[]
  onSubmit: (data: ExpenseFormState) => void
  loading: boolean
}

function ExpenseFormDialog({
  open,
  onOpenChange,
  initial,
  branches,
  categories,
  onSubmit,
  loading,
}: ExpenseFormDialogProps) {
  const [form, setForm] = useState<ExpenseFormState>(emptyForm)

  useMemo(() => {
    if (open) {
      setForm(
        initial
          ? {
              branchId: initial.branchId,
              category: initial.category,
              description: initial.description,
              amount: initial.amount.toString(),
              date: initial.date.split('T')[0],
            }
          : emptyForm()
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id])

  const set = (key: keyof ExpenseFormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Expense' : 'Create Expense'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit(form)
          }}
          className="flex flex-col gap-4 py-2"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-branch">
                Branch <span className="text-red-500">*</span>
              </Label>
              <Select value={form.branchId} onValueChange={(v) => set('branchId', v)} required>
                <SelectTrigger id="exp-branch">
                  <SelectValue placeholder="Select branch..." />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-cat">
                Category <span className="text-red-500">*</span>
              </Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)} required>
                <SelectTrigger id="exp-cat">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="exp-amount"
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="exp-date">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="exp-date"
                type="date"
                value={form.date}
                onChange={(e) => set('date', e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1.5">
              <Label htmlFor="exp-desc">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="exp-desc"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="What was this expense for?"
                rows={3}
                required
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
              {loading ? 'Saving...' : initial ? 'Save Changes' : 'Create Expense'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [branchFilter, setBranchFilter] = useState<string>('')
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Expense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)

  const canCreate = hasPermission(user, 'expenses.create')
  const canUpdate = hasPermission(user, 'expenses.update')
  const canDelete = hasPermission(user, 'expenses.delete')

  const lockedBizId = user?.businessId

  const branchesQuery = useQuery({
    queryKey: ['branches', { businessId: lockedBizId }],
    queryFn: () => fetchBranches({ businessId: lockedBizId }),
  })
  const allBranches = branchesQuery.data?.data ?? []

  const expensesQuery = useQuery({
    queryKey: ['expenses', { businessId: lockedBizId, branchId: branchFilter, category: categoryFilter, dateFrom, dateTo }],
    queryFn: () =>
      fetchExpenses({
        businessId: lockedBizId,
        branchId: branchFilter || undefined,
        category: categoryFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  })
  const allExpenses = expensesQuery.data?.data ?? []
  const categories = getExpenseCategories()

  // Client-side search
  const expenses = useMemo(() => {
    if (!search.trim()) return allExpenses
    const q = search.toLowerCase()
    return allExpenses.filter(
      (e) =>
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
    )
  }, [allExpenses, search])

  const getBranchName = (id: string) =>
    allBranches.find((b) => b.id === id)?.name ?? id

  const createMutation = useMutation({
    mutationFn: (data: ExpenseFormState) =>
      createExpense({
        businessId: lockedBizId ?? '',
        branchId: data.branchId,
        branchName: getBranchName(data.branchId),
        category: data.category,
        description: data.description,
        amount: parseFloat(data.amount) || 0,
        date: new Date(data.date).toISOString(),
        createdBy: user?.id ?? '',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense created.')
      setCreateOpen(false)
    },
    onError: () => toast.error('Failed to create expense.'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      updateExpense(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense updated.')
      setEditTarget(null)
    },
    onError: () => toast.error('Failed to update expense.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] })
      toast.success('Expense deleted.')
      setDeleteTarget(null)
    },
    onError: () => toast.error('Failed to delete expense.'),
  })

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  const columns = useMemo<ColumnDef<Expense>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-slate-700 text-sm">{formatDate(row.original.date)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => (
          <div className="min-w-0">
            <div className="font-medium text-slate-900 truncate max-w-[250px]">
              {row.original.description}
            </div>
            <div className="text-xs text-slate-500">{row.original.branchName ?? getBranchName(row.original.branchId)}</div>
          </div>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => <CategoryBadge category={row.original.category} />,
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-semibold text-red-600">{formatCurrency(row.original.amount)}</span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const exp = row.original
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
                  <DropdownMenuItem onClick={() => setEditTarget(exp)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    Edit
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <>
                    {canUpdate && <DropdownMenuSeparator />}
                    <DropdownMenuItem
                      onClick={() => setDeleteTarget(exp)}
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
    [canUpdate, canDelete, allBranches]
  )

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        description="Track and manage business expenses."
        actions={
          canCreate ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Expense
            </Button>
          ) : undefined
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            <p className="text-xs text-slate-500">Total Expenses</p>
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Number of Records</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{expenses.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder="Search expenses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={branchFilter || 'ALL'}
          onValueChange={(v) => setBranchFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Branches</SelectItem>
            {allBranches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter || 'ALL'}
          onValueChange={(v) => setCategoryFilter(v === 'ALL' ? '' : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-36"
            placeholder="From"
          />
          <span className="text-slate-400">to</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-36"
            placeholder="To"
          />
        </div>
        {!expensesQuery.isLoading && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {expenses.length} result{expenses.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Table */}
      {expensesQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={expenses}
          emptyTitle="No expenses found"
          emptyDescription="No expenses match your current filters."
        />
      )}

      {/* Create dialog */}
      <ExpenseFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={null}
        branches={allBranches}
        categories={categories}
        onSubmit={(data) => createMutation.mutate(data)}
        loading={createMutation.isPending}
      />

      {/* Edit dialog */}
      <ExpenseFormDialog
        open={!!editTarget}
        onOpenChange={(v) => {
          if (!v) setEditTarget(null)
        }}
        initial={editTarget}
        branches={allBranches}
        categories={categories}
        onSubmit={(data) =>
          editTarget &&
          updateMutation.mutate({
            id: editTarget.id,
            data: {
              branchId: data.branchId,
              branchName: getBranchName(data.branchId),
              category: data.category,
              description: data.description,
              amount: parseFloat(data.amount) || 0,
              date: new Date(data.date).toISOString(),
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
          title="Delete expense?"
          description={`Are you sure you want to delete this ${formatCurrency(deleteTarget.amount)} expense? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </PageContainer>
  )
}
