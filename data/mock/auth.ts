import type { AuthUser } from '@/types'
import { ROLE_DEFAULT_PERMISSIONS } from '@/lib/permissions'

/**
 * Mock credentials → user map.
 * The real backend will verify passwords server-side via bcrypt / JWT.
 * Here we just store plain text for demo purposes only.
 */
export interface MockCredential {
  email: string
  password: string
  user: AuthUser
}

export const MOCK_CREDENTIALS: MockCredential[] = [
  {
    email: 'superadmin@saasapp.com',
    password: 'password',
    user: {
      id: 'usr-super-001',
      name: 'Super Admin',
      email: 'superadmin@saasapp.com',
      role: 'SUPER_ADMIN',
      permissions: [],
      status: 'ACTIVE',
    },
  },
  {
    email: 'alice@techcorp.com',
    password: 'password',
    user: {
      id: 'usr-001',
      name: 'Alice Johnson',
      email: 'alice@techcorp.com',
      role: 'BUSINESS_ADMIN',
      permissions: ROLE_DEFAULT_PERMISSIONS['BUSINESS_ADMIN'],
      businessId: 'biz-001',
      branchId: 'br-001',
      status: 'ACTIVE',
    },
  },
  {
    email: 'bob@techcorp.com',
    password: 'password',
    user: {
      id: 'usr-002',
      name: 'Bob Smith',
      email: 'bob@techcorp.com',
      role: 'BRANCH_MANAGER',
      permissions: ROLE_DEFAULT_PERMISSIONS['BRANCH_MANAGER'],
      businessId: 'biz-001',
      branchId: 'br-001',
      status: 'ACTIVE',
    },
  },
  {
    email: 'carol@techcorp.com',
    password: 'password',
    user: {
      id: 'usr-003',
      name: 'Carol White',
      email: 'carol@techcorp.com',
      role: 'CASHIER',
      permissions: ROLE_DEFAULT_PERMISSIONS['CASHIER'],
      businessId: 'biz-001',
      branchId: 'br-002',
      status: 'ACTIVE',
    },
  },
  {
    email: 'emma@retailhub.com',
    password: 'password',
    user: {
      id: 'usr-005',
      name: 'Emma Watson',
      email: 'emma@retailhub.com',
      role: 'BRANCH_MANAGER',
      permissions: ROLE_DEFAULT_PERMISSIONS['BRANCH_MANAGER'],
      businessId: 'biz-002',
      branchId: 'br-004',
      status: 'ACTIVE',
    },
  },
]

/** Key used to persist the logged-in user in sessionStorage. */
export const AUTH_SESSION_KEY = 'saasapp_auth_user'
