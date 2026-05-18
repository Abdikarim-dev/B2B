import type { Invoice, Payment, Receipt } from '@/types'
import { MOCK_INVOICES, MOCK_PAYMENTS, MOCK_RECEIPTS } from '@/data/mock'
import {
  delay,
  successResponse,
  listResponse,
  paginate,
  filterByField,
  generateId,
  type PaginationParams,
} from '@/data/helpers'

let invoiceStore: Invoice[] = [...MOCK_INVOICES]
let paymentStore: Payment[] = [...MOCK_PAYMENTS]
let receiptStore: Receipt[] = [...MOCK_RECEIPTS]

export interface FetchInvoicesParams extends PaginationParams {
  businessId?: string
  branchId?: string
  status?: Invoice['status']
  paymentStatus?: Invoice['paymentStatus']
  customerId?: string
}

export const fetchInvoices = async (params: FetchInvoicesParams = {}) => {
  await delay()
  let result = [...invoiceStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'branchId', params.branchId)
  result = filterByField(result, 'status', params.status)
  result = filterByField(result, 'paymentStatus', params.paymentStatus)
  result = filterByField(result, 'customerId', params.customerId)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchInvoice = async (id: string) => {
  await delay()
  const invoice = invoiceStore.find((i) => i.id === id)
  if (!invoice) throw new Error(`Invoice ${id} not found`)
  return successResponse(invoice)
}

export const createInvoice = async (data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => {
  await delay()
  const now = new Date().toISOString()
  const newInvoice: Invoice = { ...data, id: generateId('inv'), createdAt: now, updatedAt: now }
  invoiceStore = [newInvoice, ...invoiceStore]
  return successResponse(newInvoice, 'Invoice created')
}

export const updateInvoice = async (id: string, data: Partial<Invoice>) => {
  await delay()
  const idx = invoiceStore.findIndex((i) => i.id === id)
  if (idx === -1) throw new Error(`Invoice ${id} not found`)
  invoiceStore[idx] = { ...invoiceStore[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(invoiceStore[idx], 'Invoice updated')
}

export const confirmInvoice = async (id: string) => {
  return updateInvoice(id, { status: 'CONFIRMED' })
}

export const cancelInvoice = async (id: string) => {
  return updateInvoice(id, { status: 'CANCELLED' })
}

export const deleteInvoice = async (id: string) => {
  await delay()
  invoiceStore = invoiceStore.filter((i) => i.id !== id)
  return successResponse(null, 'Invoice deleted')
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface FetchPaymentsParams extends PaginationParams {
  businessId?: string
  invoiceId?: string
  customerId?: string
}

export const fetchPayments = async (params: FetchPaymentsParams = {}) => {
  await delay()
  let result = [...paymentStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'invoiceId', params.invoiceId)
  result = filterByField(result, 'customerId', params.customerId)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const createPayment = async (data: Omit<Payment, 'id' | 'createdAt'>) => {
  await delay()
  const newPayment: Payment = { ...data, id: generateId('pay'), createdAt: new Date().toISOString() }
  paymentStore = [newPayment, ...paymentStore]

  // Update invoice paid amount and payment status
  const invIdx = invoiceStore.findIndex((i) => i.id === data.invoiceId)
  if (invIdx !== -1) {
    const inv = invoiceStore[invIdx]
    const newPaid = inv.paidAmount + data.amount
    const newBalance = Math.max(0, inv.total - newPaid)
    const paymentStatus: Invoice['paymentStatus'] =
      newBalance === 0 ? 'PAID' : newPaid > 0 ? 'PARTIAL' : 'UNPAID'
    invoiceStore[invIdx] = {
      ...inv,
      paidAmount: newPaid,
      balanceDue: newBalance,
      paymentStatus,
      updatedAt: new Date().toISOString(),
    }
  }

  return successResponse(newPayment, 'Payment recorded')
}

// ─── Receipts ─────────────────────────────────────────────────────────────────

export const fetchReceipts = async (params: FetchPaymentsParams = {}) => {
  await delay()
  let result = [...receiptStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'invoiceId', params.invoiceId)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}
