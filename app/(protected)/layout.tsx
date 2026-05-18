'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { AppShell } from '@/components/layout/AppShell'
import { Skeleton } from '@/components/ui/skeleton'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      <div className="flex h-screen bg-slate-50">
        {/* Sidebar skeleton */}
        <div className="hidden lg:flex flex-col w-64 bg-[#0F172A] p-4 gap-3">
          <Skeleton className="h-8 w-32 bg-slate-700 rounded-lg" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-slate-700 rounded-lg" />
            ))}
          </div>
        </div>
        {/* Main skeleton */}
        <div className="flex flex-col flex-1">
          <div className="h-16 bg-white border-b border-slate-200 flex items-center px-6 gap-3">
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 content-start">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <AppShell user={user} onLogout={logout}>
      {children}
    </AppShell>
  )
}
