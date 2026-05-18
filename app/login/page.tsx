import type { Metadata } from 'next'
import { LoginForm } from './login-form'
import { Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign In',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-[#0F172A] flex-col justify-between p-12 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SaasApp</span>
        </div>

        {/* Hero copy */}
        <div className="space-y-6">
          <blockquote className="space-y-3">
            <p className="text-2xl font-semibold text-white leading-snug text-pretty">
              The complete platform for managing your business operations — invoices, inventory, customers, and more.
            </p>
            <footer className="text-slate-400 text-sm">
              Multi-tenant B2B SaaS &bull; Role-based access &bull; Real-time insights
            </footer>
          </blockquote>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Branches', 'Users & Roles', 'Inventory', 'Invoicing', 'Reports', 'Audit Logs'].map(
              (f) => (
                <span
                  key={f}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#1E293B] text-slate-300 border border-[#334155]"
                >
                  {f}
                </span>
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-slate-600 text-xs">
          &copy; {new Date().getFullYear()} SaasApp. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-[#0F172A] tracking-tight">SaasApp</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">Sign in to your account</h1>
            <p className="text-sm text-slate-500">Enter your email and password to continue.</p>
          </div>

          <LoginForm />

          {/* Demo hint */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Demo accounts</p>
            <div className="grid grid-cols-1 gap-1 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="font-medium">Super Admin</span>
                <span className="text-slate-400">superadmin@saasapp.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Business Admin</span>
                <span className="text-slate-400">alice@techcorp.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Branch Manager</span>
                <span className="text-slate-400">bob@techcorp.com</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Cashier</span>
                <span className="text-slate-400">carol@techcorp.com</span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-1">Password for all accounts: <code className="font-mono bg-slate-100 px-1 rounded">password</code></p>
          </div>
        </div>
      </div>
    </div>
  )
}
