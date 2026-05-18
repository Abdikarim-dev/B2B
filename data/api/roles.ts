import type { Role, Permission } from '@/types'
import { MOCK_ROLES } from '@/data/mock'
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
let store: Role[] = [...MOCK_ROLES]

export interface FetchRolesParams extends PaginationParams {
  businessId?: string
  search?: string
  includeSystemRoles?: boolean
}

export const fetchRoles = async (params: FetchRolesParams = {}) => {
  await delay()
  let result = [...store]
  result = filterByField(result, 'businessId', params.businessId)
  if (params.search) result = searchByFields(result, params.search, ['name', 'description'])
  // By default, include system roles unless explicitly excluded
  if (params.includeSystemRoles === false) {
    result = result.filter((r) => !r.isSystemRole)
  }
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchRole = async (id: string) => {
  await delay()
  const role = store.find((r) => r.id === id)
  if (!role) throw new Error(`Role ${id} not found`)
  return successResponse(role)
}

export interface CreateRoleInput {
  businessId: string
  name: string
  description?: string
  permissions: Permission[]
}

export const createRole = async (data: CreateRoleInput) => {
  await delay()
  // Check for duplicate name within the business
  const exists = store.some(
    (r) => r.businessId === data.businessId && r.name.toLowerCase() === data.name.toLowerCase()
  )
  if (exists) throw new Error('A role with this name already exists')
  
  const now = new Date().toISOString()
  const newRole: Role = {
    id: generateId('role'),
    businessId: data.businessId,
    name: data.name,
    description: data.description ?? '',
    permissions: data.permissions,
    isSystemRole: false,
    createdAt: now,
    updatedAt: now,
  }
  store = [newRole, ...store]
  return successResponse(newRole, 'Role created')
}

export interface UpdateRoleInput {
  name?: string
  description?: string
  permissions?: Permission[]
}

export const updateRole = async (id: string, data: UpdateRoleInput) => {
  await delay()
  const idx = store.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error(`Role ${id} not found`)
  
  const role = store[idx]
  
  // Check for duplicate name if name is being changed
  if (data.name && data.name.toLowerCase() !== role.name.toLowerCase()) {
    const exists = store.some(
      (r) => r.businessId === role.businessId && r.name.toLowerCase() === data.name!.toLowerCase() && r.id !== id
    )
    if (exists) throw new Error('A role with this name already exists')
  }
  
  store[idx] = {
    ...role,
    ...data,
    updatedAt: new Date().toISOString(),
  }
  return successResponse(store[idx], 'Role updated')
}

export const deleteRole = async (id: string) => {
  await delay()
  const role = store.find((r) => r.id === id)
  if (!role) throw new Error(`Role ${id} not found`)
  if (role.isSystemRole) throw new Error('System roles cannot be deleted')
  
  store = store.filter((r) => r.id !== id)
  return successResponse(null, 'Role deleted')
}

export const updateRolePermissions = async (id: string, permissions: Permission[]) => {
  await delay()
  const idx = store.findIndex((r) => r.id === id)
  if (idx === -1) throw new Error(`Role ${id} not found`)
  
  store[idx] = {
    ...store[idx],
    permissions,
    updatedAt: new Date().toISOString(),
  }
  return successResponse(store[idx], 'Permissions updated')
}
