'use client'

import React, { createContext, useContext, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { authApi, type LoginPayload } from '@/data/api/auth'
import type { AuthUser } from '@/types'
import { toast } from 'sonner'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { data: user = null, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const res = await authApi.getMe()
      return res.data ?? null
    },
    staleTime: Infinity,
    retry: false,
  })

  const login = useCallback(
    async (payload: LoginPayload) => {
      const res = await authApi.login(payload)
      queryClient.setQueryData(['auth', 'me'], res.data)
      router.push('/dashboard')
    },
    [queryClient, router]
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    queryClient.setQueryData(['auth', 'me'], null)
    queryClient.clear()
    toast.success('Signed out successfully.')
    router.push('/login')
  }, [queryClient, router])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
