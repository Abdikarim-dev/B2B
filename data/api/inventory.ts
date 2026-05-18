import type { InventoryItem, StockMovement } from '@/types'
import { MOCK_INVENTORY, MOCK_STOCK_MOVEMENTS } from '@/data/mock'
import {
  delay,
  successResponse,
  listResponse,
  paginate,
  filterByField,
  generateId,
  type PaginationParams,
} from '@/data/helpers'

let inventoryStore: InventoryItem[] = [...MOCK_INVENTORY]
let movementStore: StockMovement[] = [...MOCK_STOCK_MOVEMENTS]

export interface FetchInventoryParams extends PaginationParams {
  businessId?: string
  branchId?: string
}

export const fetchInventory = async (params: FetchInventoryParams = {}) => {
  await delay()
  let result = [...inventoryStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'branchId', params.branchId)
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchLowStockItems = async (businessId?: string) => {
  await delay()
  const result = inventoryStore.filter((item) => {
    const matchBiz = businessId ? item.businessId === businessId : true
    return matchBiz && item.quantity <= item.minimumStock
  })
  return listResponse(result, 1, 100, result.length)
}

export const adjustStock = async (
  inventoryItemId: string,
  quantity: number,
  type: StockMovement['type'],
  reason: string,
  createdBy: string
) => {
  await delay()
  const idx = inventoryStore.findIndex((i) => i.id === inventoryItemId)
  if (idx === -1) throw new Error(`Inventory item ${inventoryItemId} not found`)
  inventoryStore[idx] = {
    ...inventoryStore[idx],
    quantity: inventoryStore[idx].quantity + quantity,
    lastUpdated: new Date().toISOString(),
  }
  const movement: StockMovement = {
    id: generateId('mov'),
    businessId: inventoryStore[idx].businessId,
    branchId: inventoryStore[idx].branchId,
    branchName: inventoryStore[idx].branchName,
    productId: inventoryStore[idx].productId,
    productName: inventoryStore[idx].productName,
    type,
    quantity,
    reason,
    createdBy,
    createdAt: new Date().toISOString(),
  }
  movementStore = [movement, ...movementStore]
  return successResponse(inventoryStore[idx], 'Stock adjusted')
}

export const fetchStockMovements = async (params: FetchInventoryParams = {}) => {
  await delay()
  let result = [...movementStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'branchId', params.branchId)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}
