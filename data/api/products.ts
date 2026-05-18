import type { Category, Product } from '@/types'
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from '@/data/mock'
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

let categoryStore: Category[] = [...MOCK_CATEGORIES]
let productStore: Product[] = [...MOCK_PRODUCTS]

export interface FetchProductsParams extends PaginationParams {
  businessId?: string
  categoryId?: string
  status?: 'ACTIVE' | 'INACTIVE'
  search?: string
}

// ─── Categories ───────────────────────────────────────────────────────────────

export const fetchCategories = async (businessId?: string) => {
  await delay()
  const result = businessId
    ? categoryStore.filter((c) => c.businessId === businessId)
    : [...categoryStore]
  return listResponse(result, 1, 100, result.length)
}

export const createCategory = async (data: Omit<Category, 'id' | 'createdAt'>) => {
  await delay()
  const newCat: Category = { ...data, id: generateId('cat'), createdAt: new Date().toISOString() }
  categoryStore = [newCat, ...categoryStore]
  return successResponse(newCat, 'Category created')
}

export const updateCategory = async (id: string, data: Partial<Category>) => {
  await delay()
  const idx = categoryStore.findIndex((c) => c.id === id)
  if (idx === -1) throw new Error(`Category ${id} not found`)
  categoryStore[idx] = { ...categoryStore[idx], ...data }
  return successResponse(categoryStore[idx], 'Category updated')
}

export const deleteCategory = async (id: string) => {
  await delay()
  categoryStore = categoryStore.filter((c) => c.id !== id)
  return successResponse(null, 'Category deleted')
}

// ─── Products ─────────────────────────────────────────────────────────────────

export const fetchProducts = async (params: FetchProductsParams = {}) => {
  await delay()
  let result = [...productStore]
  result = filterByField(result, 'businessId', params.businessId)
  result = filterByField(result, 'categoryId', params.categoryId)
  result = filterByField(result, 'status', params.status as Product['status'])
  if (params.search) result = searchByFields(result, params.search, ['name', 'sku'])
  const total = result.length
  const data = paginate(result, params)
  return listResponse(data, params.page, params.limit, total)
}

export const fetchProduct = async (id: string) => {
  await delay()
  const product = productStore.find((p) => p.id === id)
  if (!product) throw new Error(`Product ${id} not found`)
  return successResponse(product)
}

export const createProduct = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
  await delay()
  const now = new Date().toISOString()
  const newProduct: Product = { ...data, id: generateId('prod'), createdAt: now, updatedAt: now }
  productStore = [newProduct, ...productStore]
  return successResponse(newProduct, 'Product created')
}

export const updateProduct = async (id: string, data: Partial<Product>) => {
  await delay()
  const idx = productStore.findIndex((p) => p.id === id)
  if (idx === -1) throw new Error(`Product ${id} not found`)
  productStore[idx] = { ...productStore[idx], ...data, updatedAt: new Date().toISOString() }
  return successResponse(productStore[idx], 'Product updated')
}

export const deleteProduct = async (id: string) => {
  await delay()
  productStore = productStore.filter((p) => p.id !== id)
  return successResponse(null, 'Product deleted')
}
