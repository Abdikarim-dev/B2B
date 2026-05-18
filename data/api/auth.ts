import type { AuthUser } from '@/types'
import { MOCK_CREDENTIALS, AUTH_SESSION_KEY } from '@/data/mock/auth'
import { delay, successResponse } from '@/data/helpers'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  data: AuthUser
  message: string
  status: 'success' | 'error'
}

/**
 * Mock login.
 * Checks credentials against MOCK_CREDENTIALS and persists user to sessionStorage.
 * When the real backend is ready, replace this with a fetch/axios POST to /auth/login.
 */
export const authApi = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    await delay(500)

    const match = MOCK_CREDENTIALS.find(
      (c) => c.email === payload.email && c.password === payload.password
    )

    if (!match) {
      throw new Error('Invalid email or password.')
    }

    if (match.user.status !== 'ACTIVE') {
      throw new Error('Your account is inactive. Please contact your administrator.')
    }

    // Persist to sessionStorage (replaces httpOnly cookie set by real server)
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(match.user))
    }

    return { data: match.user, message: 'Logged in successfully.', status: 'success' }
  },

  async logout(): Promise<{ message: string; status: 'success' | 'error' }> {
    await delay(200)
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(AUTH_SESSION_KEY)
    }
    return { message: 'Logged out successfully.', status: 'success' }
  },

  async getMe(): Promise<{ data: AuthUser | null; message: string; status: 'success' | 'error' }> {
    await delay(150)
    if (typeof window === 'undefined') {
      return { data: null, message: 'No session.', status: 'success' }
    }
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY)
    if (!raw) {
      return { data: null, message: 'No session.', status: 'success' }
    }
    try {
      const user = JSON.parse(raw) as AuthUser
      return successResponse(user)
    } catch {
      return { data: null, message: 'Invalid session.', status: 'success' }
    }
  },
}
