// ============================================================
// USER ROLES
// ============================================================

export type UserRole =
  | 'SUPER_ADMIN'
  | 'PLATFORM_SUPPORT'
  | 'BUSINESS_OWNER'
  | 'BUSINESS_ADMIN'
  | 'BRANCH_MANAGER'
  | 'CASHIER'
  | 'INVENTORY_MANAGER'
  | 'ACCOUNTANT'
  | 'STAFF'
  | 'VIEWER'

// ============================================================
// PERMISSIONS
// ============================================================

export type Permission =
  // Business
  | 'business.view'
  | 'business.create'
  | 'business.update'
  | 'business.activate'
  | 'business.deactivate'
  // Branches
  | 'branches.view'
  | 'branches.create'
  | 'branches.update'
  | 'branches.deactivate'
  // Users
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.assign_role'
  | 'users.assign_branch'
  | 'users.activate'
  // Roles
  | 'roles.view'
  | 'roles.create'
  | 'roles.update'
  | 'roles.delete'
  | 'roles.manage_permissions'
  // Products
  | 'products.view'
  | 'products.create'
  | 'products.update'
  | 'products.delete'
  // Inventory
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.transfer'
  // Customers
  | 'customers.view'
  | 'customers.create'
  | 'customers.update'
  // Suppliers
  | 'suppliers.view'
  | 'suppliers.create'
  | 'suppliers.update'
  // Invoices
  | 'invoices.view'
  | 'invoices.create'
  | 'invoices.confirm'
  | 'invoices.cancel'
  // Receipts
  | 'receipts.view'
  // Payments
  | 'payments.view'
  // Expenses
  | 'expenses.view'
  | 'expenses.create'
  | 'expenses.update'
  | 'expenses.delete'
  // Reports
  | 'reports.view'
  // Audit Logs
  | 'audit_logs.view'
  // Settings
  | 'settings.view'
  | 'settings.update'

// ============================================================
// AUTH / USER
// ============================================================

export interface AuthUser {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  permissions: Permission[]
  businessId?: string
  branchId?: string
  status: 'ACTIVE' | 'INACTIVE'
}

// ============================================================
// COMMON
// ============================================================

export type Status = 'ACTIVE' | 'INACTIVE'

export interface ApiResponse<T> {
  data: T
  message: string
  status: 'success' | 'error'
}

export interface ApiListResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
  }
  message: string
  status: 'success' | 'error'
}

// ============================================================
// BUSINESS
// ============================================================

export interface Business {
  id: string
  name: string
  email: string
  phone: string
  address: string
  logo?: string
  status: Status
  plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  createdAt: string
  updatedAt: string
}

// ============================================================
// BRANCH
// ============================================================

export interface Branch {
  id: string
  businessId: string
  name: string
  address: string
  phone: string
  status: Status
  createdAt: string
  updatedAt: string
}

// ============================================================
// USER
// ============================================================

export interface User {
  id: string
  businessId?: string
  branchId?: string
  name: string
  email: string
  phone?: string
  role: UserRole
  permissions: Permission[]
  status: Status
  createdAt: string
  updatedAt: string
}

// ============================================================
// PRODUCT / CATEGORY
// ============================================================

export interface Category {
  id: string
  businessId: string
  name: string
  description?: string
  status: Status
  createdAt: string
}

export interface Product {
  id: string
  businessId: string
  categoryId: string
  categoryName?: string
  name: string
  sku: string
  barcode?: string
  purchasePrice: number
  sellingPrice: number
  minimumStock: number
  description?: string
  status: Status
  createdAt: string
  updatedAt: string
}

// ============================================================
// INVENTORY
// ============================================================

export type StockMovementType =
  | 'STOCK_IN'
  | 'STOCK_OUT'
  | 'ADJUSTMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'DAMAGED'
  | 'SALE'
  | 'RETURN'

export interface InventoryItem {
  id: string
  businessId: string
  branchId: string
  branchName?: string
  productId: string
  productName?: string
  sku?: string
  quantity: number
  reservedQuantity: number
  minimumStock: number
  lastUpdated: string
}

export interface StockMovement {
  id: string
  businessId: string
  branchId: string
  branchName?: string
  productId: string
  productName?: string
  type: StockMovementType
  quantity: number
  reason?: string
  createdBy: string
  createdAt: string
}

// ============================================================
// CUSTOMER / SUPPLIER
// ============================================================

export interface Customer {
  id: string
  businessId: string
  name: string
  email?: string
  phone?: string
  address?: string
  balance: number
  status: Status
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  businessId: string
  name: string
  email?: string
  phone?: string
  address?: string
  status: Status
  createdAt: string
  updatedAt: string
}

// ============================================================
// INVOICE
// ============================================================

export type InvoiceStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED'
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID'
export type PaymentMethod = 'CASH' | 'BANK' | 'MOBILE_MONEY' | 'CREDIT'

export interface InvoiceItem {
  id: string
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  businessId: string
  branchId: string
  branchName?: string
  customerId: string
  customerName?: string
  items: InvoiceItem[]
  subtotal: number
  discountType: 'FIXED' | 'PERCENTAGE'
  discountValue: number
  discountAmount: number
  vatRate: number
  vatAmount: number
  total: number
  paidAmount: number
  balanceDue: number
  status: InvoiceStatus
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============================================================
// PAYMENT / RECEIPT
// ============================================================

export interface Payment {
  id: string
  businessId: string
  branchId: string
  branchName?: string
  invoiceId: string
  invoiceNumber?: string
  customerId: string
  customerName?: string
  amount: number
  method: PaymentMethod
  reference?: string
  createdBy: string
  createdAt: string
}

export interface Receipt {
  id: string
  receiptNumber: string
  businessId: string
  branchId: string
  branchName?: string
  invoiceId: string
  invoiceNumber?: string
  customerId: string
  customerName?: string
  paymentId: string
  amount: number
  method: PaymentMethod
  cashierName: string
  createdAt: string
}

// ============================================================
// EXPENSE
// ============================================================

export interface Expense {
  id: string
  businessId: string
  branchId: string
  branchName?: string
  category: string
  description: string
  amount: number
  date: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============================================================
// AUDIT LOG
// ============================================================

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'CREATE_ROLE'
  | 'UPDATE_PERMISSION'
  | 'CREATE_PRODUCT'
  | 'UPDATE_STOCK'
  | 'CREATE_INVOICE'
  | 'CANCEL_INVOICE'
  | 'CREATE_PAYMENT'
  | 'GENERATE_RECEIPT'

export interface AuditLog {
  id: string
  businessId?: string
  userId: string
  userName?: string
  action: AuditAction
  module: string
  description: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  createdAt: string
}

// ============================================================
// SETTINGS
// ============================================================

export interface BusinessSettings {
  businessId: string
  businessName: string
  logo?: string
  currency: string
  vatPercentage: number
  invoicePrefix: string
  receiptPrefix: string
  lowStockThreshold: number
  updatedAt: string
}

// ============================================================
// REPORTS
// ============================================================

export interface DashboardReport {
  totalSales: number
  totalInvoices: number
  totalReceipts: number
  totalProducts: number
  lowStockCount: number
  totalCustomers: number
  totalDebt: number
  cashCollected: number
  totalBranches: number
  salesByMonth: { month: string; amount: number }[]
  revenueByMonth: { month: string; amount: number }[]
}
