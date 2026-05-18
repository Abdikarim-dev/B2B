import type { Expense } from '@/types'
import { MOCK_EXPENSES, EXPENSE_CATEGORIES } from '@/data/mock'
import {
  delay,
  successResponse,
  listResponse,
  paginate,
  filterByField,
  searchByFields,
  generateId,
  type PaginationParams,
} from '@/data/helpers'

let expenseStore: Expense[] = [...MOCK_EXPENSES]

export interface FetchExpensesParams extends PaginationParams {
  businessId?: string
  branchId?: string
  category?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export const fetchExpenses = async (params: FetchExpensesParams = {}) => {
  await delay()
  let result = [...expenseStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'branchId', params.branchId)
  result = filterByField(result, 'category', params.category)
  
  // Date range filtering
  if (params.dateFrom) {
    const from = new Date(params.dateFrom)
    result = result.filter((e) => new Date(e.date) >= from)
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo)
    result = result.filter((e) => new Date(e.date) <= to)
  }
  
  if (params.search) {
    result = searchByFields(result, params.search, ['description', 'category'])
  }
  
  // Sort by date (most recent first)
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchExpense = async (id: string) => {
  await delay()
  const expense = expenseStore.find((e) => e.id === id)
  if (!expense) throw new Error(`Expense ${id} not found`)
  return successResponse(expense)
}

export const createExpense = async (data: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
  await delay()
  const now = new Date().toISOString()
  const newExpense: Expense = { ...data, id: generateId('exp'), createdAt: now, updatedAt: now }
  expenseStore = [newExpense, ...expenseStore]
  return successResponse(newExpense, 'Expense created')
}

export const updateExpense = async (id: string, data: Partial<Expense>) => {
  await delay()
  const idx = expenseStore.findIndex((e) => e.id === id)
  if (idx === -1) throw new Error(`Expense ${id} not found`)
  expenseStore[idx] = { ...expenseStore[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(expenseStore[idx], 'Expense updated')
}

export const deleteExpense = async (id: string) => {
  await delay()
  expenseStore = expenseStore.filter((e) => e.id !== id)
  return successResponse(null, 'Expense deleted')
}

export const getExpenseCategories = () => EXPENSE_CATEGORIES
