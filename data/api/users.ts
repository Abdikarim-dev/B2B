import type { User } from '@/types'
import { MOCK_USERS } from '@/data/mock'
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

// In-memory store so mutations persist within a session
let store: User[] = [...MOCK_USERS]

export interface FetchUsersParams extends PaginationParams {
  businessId?: string
  branchId?: string
  role?: string
  status?: 'ACTIVE' | 'INACTIVE'
  search?: string
}

export const fetchUsers = async (params: FetchUsersParams = {}) => {
  await delay()
  let result = [...store]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'branchId', params.branchId)
  result = filterByField(result, 'status', params.status as User['status'])
  if (params.role) result = result.filter((u) => u.role === params.role)
  if (params.search) result = searchByFields(result, params.search, ['name', 'email'])
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchUser = async (id: string) => {
  await delay()
  const user = store.find((u) => u.id === id)
  if (!user) throw new Error(`User ${id} not found`)
  return successResponse(user)
}

export const createUser = async (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
  await delay()
  const now = new Date().toISOString()
  const newUser: User = { ...data, id: generateId('usr'), createdAt: now, updatedAt: now }
  store = [newUser, ...store]
  return successResponse(newUser, 'User created')
}

export const updateUser = async (id: string, data: Partial<User>) => {
  await delay()
  const idx = store.findIndex((u) => u.id === id)
  if (idx === -1) throw new Error(`User ${id} not found`)
  store[idx] = { ...store[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(store[idx], 'User updated')
}

export const deleteUser = async (id: string) => {
  await delay()
  store = store.filter((u) => u.id !== id)
  return successResponse(null, 'User deleted')
}
