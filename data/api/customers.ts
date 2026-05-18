import type { Customer, Supplier } from '@/types'
import { MOCK_CUSTOMERS, MOCK_SUPPLIERS } from '@/data/mock'
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

let customerStore: Customer[] = [...MOCK_CUSTOMERS]
let supplierStore: Supplier[] = [...MOCK_SUPPLIERS]

export interface FetchCustomersParams extends PaginationParams {
  businessId?: string
  status?: 'ACTIVE' | 'INACTIVE'
  search?: string
}

// ─── Customers ────────────────────────────────────────────────────────────────

export const fetchCustomers = async (params: FetchCustomersParams = {}) => {
  await delay()
  let result = [...customerStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'status', params.status as Customer['status'])
  if (params.search) result = searchByFields(result, params.search, ['name', 'email', 'phone'])
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchCustomer = async (id: string) => {
  await delay()
  const customer = customerStore.find((c) => c.id === id)
  if (!customer) throw new Error(`Customer ${id} not found`)
  return successResponse(customer)
}

export const createCustomer = async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
  await delay()
  const now = new Date().toISOString()
  const newCustomer: Customer = { ...data, id: generateId('cust'), createdAt: now, updatedAt: now }
  customerStore = [newCustomer, ...customerStore]
  return successResponse(newCustomer, 'Customer created')
}

export const updateCustomer = async (id: string, data: Partial<Customer>) => {
  await delay()
  const idx = customerStore.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error(`Customer ${id} not found`)
  customerStore[idx] = { ...customerStore[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(customerStore[idx], 'Customer updated')
}

export const deleteCustomer = async (id: string) => {
  await delay()
  customerStore = customerStore.filter((c) => c.id !== id)
  return successResponse(null, 'Customer deleted')
}

// ─── Suppliers ────────────────────────────────────────────────────────────────

export const fetchSuppliers = async (params: FetchCustomersParams = {}) => {
  await delay()
  let result = [...supplierStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'status', params.status as Supplier['status'])
  if (params.search) result = searchByFields(result, params.search, ['name', 'email'])
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const createSupplier = async (data: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
  await delay()
  const now = new Date().toISOString()
  const newSupplier: Supplier = { ...data, id: generateId('sup'), createdAt: now, updatedAt: now }
  supplierStore = [newSupplier, ...supplierStore]
  return successResponse(newSupplier, 'Supplier created')
}

export const fetchSupplier = async (id: string) => {
  await delay()
  const supplier = supplierStore.find((s) => s.id === id)
  if (!supplier) throw new Error(`Supplier ${id} not found`)
  return successResponse(supplier)
}

export const updateSupplier = async (id: string, data: Partial<Supplier>) => {
  await delay()
  const idx = supplierStore.findIndex((s) => s.id === id)
  if (idx === -1) throw new Error(`Supplier ${id} not found`)
  supplierStore[idx] = { ...supplierStore[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(supplierStore[idx], 'Supplier updated')
}

export const deleteSupplier = async (id: string) => {
  await delay()
  supplierStore = supplierStore.filter((s) => s.id !== id)
  return successResponse(null, 'Supplier deleted')
}
