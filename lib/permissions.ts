import type { AuthUser, Permission, UserRole } from '@/types'

/**
 * Check if a user has a specific permission.
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_SUPPORT') return true
  return user.permissions.includes(permission)
}

/**
 * Check if a user has at least one of the given permissions.
 */
export function hasAnyPermission(user: AuthUser | null, permissions: Permission[]): boolean {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_SUPPORT') return true
  return permissions.some((p) => user.permissions.includes(p))
}

/**
 * Check if a user has a specific role.
 */
export function hasRole(user: AuthUser | null, role: UserRole): boolean {
  if (!user) return false
  return user.role === role
}

/**
 * Check if a user has any of the given roles.
 */
export function hasAnyRole(user: AuthUser | null, roles: UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

/**
 * Check if a user can access a page that requires all of the listed permissions.
 * SUPER_ADMIN and PLATFORM_SUPPORT bypass all checks.
 */
export function canAccessPage(user: AuthUser | null, requiredPermissions: Permission[]): boolean {
  if (!user) return false
  if (user.role === 'SUPER_ADMIN' || user.role === 'PLATFORM_SUPPORT') return true
  return requiredPermissions.every((p) => user.permissions.includes(p))
}

/**
 * Default permission sets per role — used for seeding mock users.
 */
export const ROLE_DEFAULT_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [],
  PLATFORM_SUPPORT: [],
  BUSINESS_OWNER: [
    'business.view',
    'business.update',
    'branches.view',
    'branches.create',
    'branches.update',
    'users.view',
    'users.create',
    'users.update',
    'users.assign_role',
    'users.assign_branch',
    'users.activate',
    'roles.view',
    'roles.create',
    'roles.update',
    'roles.delete',
    'roles.manage_permissions',
    'products.view',
    'products.create',
    'products.update',
    'products.delete',
    'inventory.view',
    'inventory.adjust',
    'inventory.transfer',
    'customers.view',
    'customers.create',
    'customers.update',
    'suppliers.view',
    'suppliers.create',
    'suppliers.update',
    'invoices.view',
    'invoices.create',
    'invoices.confirm',
    'invoices.cancel',
    'receipts.view',
    'payments.view',
    'expenses.view',
    'expenses.create',
    'expenses.update',
    'expenses.delete',
    'reports.view',
    'audit_logs.view',
    'settings.view',
    'settings.update',
  ],
  BUSINESS_ADMIN: [
    'business.view',
    'branches.view',
    'branches.create',
    'branches.update',
    'users.view',
    'users.create',
    'users.update',
    'users.assign_role',
    'users.assign_branch',
    'roles.view',
    'products.view',
    'products.create',
    'products.update',
    'inventory.view',
    'inventory.adjust',
    'inventory.transfer',
    'customers.view',
    'customers.create',
    'customers.update',
    'suppliers.view',
    'invoices.view',
    'invoices.create',
    'invoices.confirm',
    'invoices.cancel',
    'receipts.view',
    'payments.view',
    'expenses.view',
    'expenses.create',
    'reports.view',
    'audit_logs.view',
    'settings.view',
  ],
  BRANCH_MANAGER: [
    'branches.view',
    'users.view',
    'products.view',
    'inventory.view',
    'inventory.adjust',
    'customers.view',
    'customers.create',
    'invoices.view',
    'invoices.create',
    'invoices.confirm',
    'receipts.view',
    'payments.view',
    'expenses.view',
    'expenses.create',
    'reports.view',
  ],
  CASHIER: [
    'products.view',
    'inventory.view',
    'customers.view',
    'customers.create',
    'invoices.view',
    'invoices.create',
    'receipts.view',
    'payments.view',
  ],
  INVENTORY_MANAGER: [
    'products.view',
    'products.create',
    'products.update',
    'inventory.view',
    'inventory.adjust',
    'inventory.transfer',
    'suppliers.view',
  ],
  ACCOUNTANT: [
    'invoices.view',
    'receipts.view',
    'payments.view',
    'expenses.view',
    'expenses.create',
    'reports.view',
    'customers.view',
  ],
  STAFF: [
    'products.view',
    'inventory.view',
    'customers.view',
    'invoices.view',
  ],
  VIEWER: [
    'products.view',
    'inventory.view',
    'customers.view',
    'invoices.view',
    'reports.view',
  ],
}
