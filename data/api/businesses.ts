import type { Business, Branch } from '@/types'
import { MOCK_BUSINESSES, MOCK_BRANCHES } from '@/data/mock'
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

let bizStore: Business[] = [...MOCK_BUSINESSES]
let branchStore: Branch[] = [...MOCK_BRANCHES]

export interface FetchBusinessesParams extends PaginationParams {
  status?: 'ACTIVE' | 'INACTIVE'
  plan?: string
  search?: string
}

export const fetchBusinesses = async (params: FetchBusinessesParams = {}) => {
  await delay()
  let result = [...bizStore]
  result = filterByField(result, 'status', params.status as Business['status'])
  if (params.plan) result = result.filter((b) => b.plan === params.plan)
  if (params.search) result = searchByFields(result, params.search, ['name', 'email'])
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchBusiness = async (id: string) => {
  await delay()
  const biz = bizStore.find((b) => b.id === id)
  if (!biz) throw new Error(`Business ${id} not found`)
  return successResponse(biz)
}

export const createBusiness = async (data: Omit<Business, 'id' | 'createdAt' | 'updatedAt'>) => {
  await delay()
  const now = new Date().toISOString()
  const newBiz: Business = { ...data, id: generateId('biz'), createdAt: now, updatedAt: now }
  bizStore = [newBiz, ...bizStore]
  return successResponse(newBiz, 'Business created')
}

export const updateBusiness = async (id: string, data: Partial<Business>) => {
  await delay()
  const idx = bizStore.findIndex((b) => b.id === id)
  if (idx === -1) throw new Error(`Business ${id} not found`)
  bizStore[idx] = { ...bizStore[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(bizStore[idx], 'Business updated')
}

export const deleteBusiness = async (id: string) => {
  await delay()
  bizStore = bizStore.filter((b) => b.id !== id)
  branchStore = branchStore.filter((br) => br.businessId !== id)
  return successResponse(null, 'Business deleted')
}

// ─── Branches ─────────────────────────────────────────────────────────────────

export interface FetchBranchesParams extends PaginationParams {
  businessId?: string
  status?: 'ACTIVE' | 'INACTIVE'
}

export const fetchBranches = async (params: FetchBranchesParams = {}) => {
  await delay()
  let result = [...branchStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'status', params.status as Branch['status'])
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchBranch = async (id: string) => {
  await delay()
  const branch = branchStore.find((b) => b.id === id)
  if (!branch) throw new Error(`Branch ${id} not found`)
  return successResponse(branch)
}

export const createBranch = async (data: Omit<Branch, 'id' | 'createdAt' | 'updatedAt'>) => {
  await delay()
  const now = new Date().toISOString()
  const newBranch: Branch = { ...data, id: generateId('br'), createdAt: now, updatedAt: now }
  branchStore = [newBranch, ...branchStore]
  return successResponse(newBranch, 'Branch created')
}

export const updateBranch = async (id: string, data: Partial<Branch>) => {
  await delay()
  const idx = branchStore.findIndex((b) => b.id === id)
  if (idx === -1) throw new Error(`Branch ${id} not found`)
  branchStore[idx] = { ...branchStore[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(branchStore[idx], 'Branch updated')
}

export const deleteBranch = async (id: string) => {
  await delay()
  branchStore = branchStore.filter((b) => b.id !== id)
  return successResponse(null, 'Branch deleted')
}
