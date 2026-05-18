'use client'

import type { ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission, hasAnyPermission } from '@/lib/permissions'
import type { Permission } from '@/types'

interface PermissionGateProps {
  /** Single permission required */
  permission?: Permission
  /** Array of permissions - user must have at least one */
  anyOf?: Permission[]
  /** Array of permissions - user must have all */
  allOf?: Permission[]
  /** Content to render if user has permission */
  children: ReactNode
  /** Fallback content if user lacks permission */
  fallback?: ReactNode
}

/**
 * Conditionally renders children based on user permissions.
 * 
 * Usage:
 * ```tsx
 * <PermissionGate permission="users.create">
 *   <Button>Create User</Button>
 * </PermissionGate>
 * 
 * <PermissionGate anyOf={['users.update', 'users.delete']}>
 *   <ActionMenu />
 * </PermissionGate>
 * 
 * <PermissionGate allOf={['reports.view', 'reports.export']} fallback={<UpgradePrompt />}>
 *   <ExportButton />
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuth()

  // Super admin and platform support bypass all checks
  if (user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_SUPPORT') {
    return <>{children}</>
  }

  // Check single permission
  if (permission && !hasPermission(user, permission)) {
    return <>{fallback}</>
  }

  // Check any of permissions
  if (anyOf && anyOf.length > 0 && !hasAnyPermission(user, anyOf)) {
    return <>{fallback}</>
  }

  // Check all of permissions
  if (allOf && allOf.length > 0) {
    const hasAll = allOf.every((p) => hasPermission(user, p))
    if (!hasAll) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}

/**
 * Hook for checking permissions in component logic.
 * Returns helper functions for permission checks.
 */
export function usePermissions() {
  const { user } = useAuth()

  return {
    /** Check if user has a specific permission */
    can: (permission: Permission) => hasPermission(user, permission),
    /** Check if user has any of the given permissions */
    canAny: (permissions: Permission[]) => hasAnyPermission(user, permissions),
    /** Check if user has all of the given permissions */
    canAll: (permissions: Permission[]) => permissions.every((p) => hasPermission(user, p)),
    /** Current user role */
    role: user?.role,
    /** Whether user is super admin */
    isSuperAdmin: user?.role === 'SUPER_ADMIN',
    /** Whether user is platform support */
    isPlatformSupport: user?.role === 'PLATFORM_SUPPORT',
    /** Whether user has elevated platform access */
    hasPlatformAccess: user?.role === 'SUPER_ADMIN' || user?.role === 'PLATFORM_SUPPORT',
  }
}
