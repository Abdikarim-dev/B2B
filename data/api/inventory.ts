import type { InventoryItem, StockMovement, StockMovementType } from '@/types'
import { MOCK_INVENTORY, MOCK_STOCK_MOVEMENTS } from '@/data/mock'
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

let inventoryStore: InventoryItem[] = [...MOCK_INVENTORY]
let movementStore: StockMovement[] = [...MOCK_STOCK_MOVEMENTS]

// ─── Inventory ────────────────────────────────────────────────────────────────

export interface FetchInventoryParams extends PaginationParams {
  businessId?: string
  branchId?: string
  productId?: string
  search?: string
  lowStockOnly?: boolean
}

export const fetchInventory = async (params: FetchInventoryParams = {}) => {
  await delay()
  let result = [...inventoryStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'branchId', params.branchId)
  result = filterByField(result, 'productId', params.productId)
  if (params.search) {
    result = searchByFields(result, params.search, ['productName', 'sku'])
  }
  if (params.lowStockOnly) {
    result = result.filter((item) => item.quantity <= item.minimumStock)
  }
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchInventoryItem = async (id: string) => {
  await delay()
  const item = inventoryStore.find((i) => i.id === id)
  if (!item) throw new Error(`Inventory item ${id} not found`)
  return successResponse(item)
}

export const fetchLowStockItems = async (businessId?: string) => {
  await delay()
  const result = inventoryStore.filter((item) => {
    const matchBiz = businessId ? item.businessId === businessId : true
    return matchBiz && item.quantity <= item.minimumStock
  })
  return listResponse(result, 1, 100, result.length)
}

export const fetchInventoryStats = async (businessId?: string) => {
  await delay()
  let items = [...inventoryStore]
  if (businessId) items = items.filter((i) => i.businessId === businessId)

  const totalItems = items.length
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)
  const lowStockCount = items.filter((i) => i.quantity <= i.minimumStock && i.minimumStock > 0).length
  const outOfStockCount = items.filter((i) => i.quantity === 0).length

  return successResponse({ totalItems, totalQuantity, lowStockCount, outOfStockCount })
}

// ─── Stock Adjustment ─────────────────────────────────────────────────────────

export interface AdjustStockParams {
  inventoryItemId: string
  quantity: number
  type: StockMovementType
  reason: string
  createdBy: string
}

export const adjustStock = async (params: AdjustStockParams) => {
  await delay()
  const { inventoryItemId, quantity, type, reason, createdBy } = params
  const idx = inventoryStore.findIndex((i) => i.id === inventoryItemId)
  if (idx === -1) throw new Error(`Inventory item ${inventoryItemId} not found`)

  const item = inventoryStore[idx]
  const newQuantity = item.quantity + quantity

  if (newQuantity < 0) {
    throw new Error('Insufficient stock. Cannot reduce below zero.')
  }

  inventoryStore[idx] = {
    ...item,
    quantity: newQuantity,
    lastUpdated: new Date().toISOString(),
  }

  const movement: StockMovement = {
    id: generateId('mov'),
    businessId: item.businessId,
    branchId: item.branchId,
    branchName: item.branchName,
    productId: item.productId,
    productName: item.productName,
    type,
    quantity,
    reason,
    createdBy,
    createdAt: new Date().toISOString(),
  }
  movementStore = [movement, ...movementStore]

  return successResponse(inventoryStore[idx], 'Stock adjusted successfully')
}

// ─── Stock Transfer ───────────────────────────────────────────────────────────

export interface TransferStockParams {
  sourceInventoryItemId: string
  destinationBranchId: string
  destinationBranchName: string
  quantity: number
  reason: string
  createdBy: string
}

export const transferStock = async (params: TransferStockParams) => {
  await delay()
  const {
    sourceInventoryItemId,
    destinationBranchId,
    destinationBranchName,
    quantity,
    reason,
    createdBy,
  } = params

  if (quantity <= 0) {
    throw new Error('Transfer quantity must be positive')
  }

  // Find source inventory item
  const sourceIdx = inventoryStore.findIndex((i) => i.id === sourceInventoryItemId)
  if (sourceIdx === -1) throw new Error('Source inventory item not found')

  const sourceItem = inventoryStore[sourceIdx]
  const availableQuantity = sourceItem.quantity - sourceItem.reservedQuantity

  if (quantity > availableQuantity) {
    throw new Error(`Insufficient available stock. Available: ${availableQuantity}`)
  }

  // Find or create destination inventory item
  let destIdx = inventoryStore.findIndex(
    (i) =>
      i.businessId === sourceItem.businessId &&
      i.branchId === destinationBranchId &&
      i.productId === sourceItem.productId
  )

  const now = new Date().toISOString()

  if (destIdx === -1) {
    // Create new inventory item at destination
    const newItem: InventoryItem = {
      id: generateId('inv-item'),
      businessId: sourceItem.businessId,
      branchId: destinationBranchId,
      branchName: destinationBranchName,
      productId: sourceItem.productId,
      productName: sourceItem.productName,
      sku: sourceItem.sku,
      quantity: 0,
      reservedQuantity: 0,
      minimumStock: sourceItem.minimumStock,
      lastUpdated: now,
    }
    inventoryStore.push(newItem)
    destIdx = inventoryStore.length - 1
  }

  // Update quantities
  inventoryStore[sourceIdx] = {
    ...sourceItem,
    quantity: sourceItem.quantity - quantity,
    lastUpdated: now,
  }

  inventoryStore[destIdx] = {
    ...inventoryStore[destIdx],
    quantity: inventoryStore[destIdx].quantity + quantity,
    lastUpdated: now,
  }

  // Create movement records
  const transferOutMovement: StockMovement = {
    id: generateId('mov'),
    businessId: sourceItem.businessId,
    branchId: sourceItem.branchId,
    branchName: sourceItem.branchName,
    productId: sourceItem.productId,
    productName: sourceItem.productName,
    type: 'TRANSFER_OUT',
    quantity: -quantity,
    reason: `${reason} - To ${destinationBranchName}`,
    createdBy,
    createdAt: now,
  }

  const transferInMovement: StockMovement = {
    id: generateId('mov'),
    businessId: sourceItem.businessId,
    branchId: destinationBranchId,
    branchName: destinationBranchName,
    productId: sourceItem.productId,
    productName: sourceItem.productName,
    type: 'TRANSFER_IN',
    quantity,
    reason: `${reason} - From ${sourceItem.branchName}`,
    createdBy,
    createdAt: now,
  }

  movementStore = [transferInMovement, transferOutMovement, ...movementStore]

  return successResponse(
    {
      source: inventoryStore[sourceIdx],
      destination: inventoryStore[destIdx],
    },
    'Stock transferred successfully'
  )
}

// ─── Stock Movements ──────────────────────────────────────────────────────────

export interface FetchStockMovementsParams extends PaginationParams {
  businessId?: string
  branchId?: string
  productId?: string
  type?: StockMovementType
  search?: string
  startDate?: string
  endDate?: string
}

export const fetchStockMovements = async (params: FetchStockMovementsParams = {}) => {
  await delay()
  let result = [...movementStore]

  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'branchId', params.branchId)
  result = filterByField(result, 'productId', params.productId)
  result = filterByField(result, 'type', params.type)

  if (params.search) {
    result = searchByFields(result, params.search, ['productName', 'reason'])
  }

  if (params.startDate) {
    const start = new Date(params.startDate)
    result = result.filter((m) => new Date(m.createdAt) >= start)
  }

  if (params.endDate) {
    const end = new Date(params.endDate)
    end.setHours(23, 59, 59, 999)
    result = result.filter((m) => new Date(m.createdAt) <= end)
  }

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchStockMovementsByProduct = async (productId: string, businessId?: string) => {
  await delay()
  let result = movementStore.filter((m) => m.productId === productId)
  if (businessId) result = result.filter((m) => m.businessId === businessId)
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return listResponse(result, 1, 50, result.length)
}
