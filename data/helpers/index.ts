import type { ApiResponse, ApiListResponse } from '@/types'

// ─── Delay ────────────────────────────────────────────────────────────────────
/** Simulates network latency. Replace with nothing when wiring real API. */
export const delay = (ms = 350): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

// ─── Response Builders ────────────────────────────────────────────────────────
export function successResponse<T>(data: T, message = 'OK'): ApiResponse<T> {
  return { data, message, status: 'success' }
}

export function listResponse<T>(
  data: T[],
  page = 1,
  limit = 20,
  total?: number,
  message = 'OK'
): ApiListResponse<T> {
  return {
    data,
    meta: { total: total ?? data.length, page, limit },
    message,
    status: 'success',
  }
}

// ─── Pagination Helper ────────────────────────────────────────────────────────
export interface PaginationParams {
  page?: number
  limit?: number
}

export function paginate<T>(items: T[], { page = 1, limit = 20 }: PaginationParams): T[] {
  const start = (page - 1) * limit
  return items.slice(start, start + limit)
}

// ─── Filter Helpers ───────────────────────────────────────────────────────────
export function filterByField<T, K extends keyof T>(items: T[], field: K, value: T[K] | undefined): T[] {
  if (value === undefined || value === null || value === '') return items
  return items.filter((item) => item[field] === value)
}

export function searchByFields<T>(items: T[], query: string, fields: (keyof T)[]): T[] {
  if (!query.trim()) return items
  const q = query.toLowerCase()
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field]
      return typeof val === 'string' && val.toLowerCase().includes(q)
    })
  )
}

// ─── ID Generator ─────────────────────────────────────────────────────────────
export function generateId(prefix = ''): string {
  const rand = Math.random().toString(36).substring(2, 9)
  const ts = Date.now().toString(36)
  return prefix ? `${prefix}-${ts}-${rand}` : `${ts}-${rand}`
}

// ─── Formatters ───────────────────────────────────────────────────────────────
export const formatCurrency = (amount: number, currency = 'USD'): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)

export const formatDate = (date: string | Date): string =>
  new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(
    typeof date === 'string' ? new Date(date) : date
  )

export const formatDateTime = (date: string | Date): string =>
  new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(typeof date === 'string' ? new Date(date) : date)

export const getInitials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)

export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0
  return Number((((current - previous) / previous) * 100).toFixed(1))
}
