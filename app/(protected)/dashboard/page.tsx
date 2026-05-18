'use client'

import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  TrendingUp,
  FileText,
  Receipt,
  Package,
  AlertTriangle,
  Users,
  CreditCard,
  Banknote,
  GitBranch,
} from 'lucide-react'
import { PageContainer, PageHeader, StatCard } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { fetchDashboardReport } from '@/data/api/reports'
import { fetchInvoices, fetchPayments } from '@/data/api/invoices'
import { fetchInventory } from '@/data/api/inventory'
import { formatCurrency, formatDate } from '@/data/helpers'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value: number; name: string; color: string }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

// ─── Payment method badge ─────────────────────────────────────────────────────
const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-50 text-green-700 border-green-200',
  BANK: 'bg-blue-50 text-blue-700 border-blue-200',
  MOBILE_MONEY: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  CREDIT: 'bg-amber-50 text-amber-700 border-amber-200',
}

// ─── Payment status badge color ───────────────────────────────────────────────
const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-50 text-green-700 border-green-200',
  PARTIAL: 'bg-amber-50 text-amber-700 border-amber-200',
  UNPAID: 'bg-red-50 text-red-700 border-red-200',
}

export default function DashboardPage() {
  const reportQuery = useQuery({
    queryKey: ['dashboard-report'],
    queryFn: () => fetchDashboardReport(),
  })

  const invoicesQuery = useQuery({
    queryKey: ['invoices', { page: 1, limit: 6 }],
    queryFn: () => fetchInvoices({ page: 1, limit: 6 }),
  })

  const paymentsQuery = useQuery({
    queryKey: ['payments', { page: 1, limit: 5 }],
    queryFn: () => fetchPayments({ page: 1, limit: 5 }),
  })

  const inventoryQuery = useQuery({
    queryKey: ['inventory', { page: 1, limit: 100 }],
    queryFn: () => fetchInventory({ page: 1, limit: 100 }),
  })

  const report = reportQuery.data?.data
  const invoices = invoicesQuery.data?.data ?? []
  const payments = paymentsQuery.data?.data ?? []
  const inventory = inventoryQuery.data?.data ?? []

  const lowStockItems = inventory
    .filter((i) => i.quantity <= i.minimumStock)
    .slice(0, 5)

  const isLoading = reportQuery.isLoading

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Overview of your business operations and performance."
      />

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))
        ) : (
          <>
            <StatCard
              title="Total Sales"
              value={formatCurrency(report?.totalSales ?? 0)}
              icon={TrendingUp}
              iconColor="text-blue-600"
              iconBg="bg-blue-50"
              trend={{ value: 18.2, label: 'vs last month', positive: true }}
            />
            <StatCard
              title="Total Invoices"
              value={report?.totalInvoices ?? 0}
              icon={FileText}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
            />
            <StatCard
              title="Total Receipts"
              value={report?.totalReceipts ?? 0}
              icon={Receipt}
              iconColor="text-green-600"
              iconBg="bg-green-50"
            />
            <StatCard
              title="Total Products"
              value={report?.totalProducts ?? 0}
              icon={Package}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
            />
            <StatCard
              title="Low Stock Items"
              value={report?.lowStockCount ?? 0}
              icon={AlertTriangle}
              iconColor="text-amber-600"
              iconBg="bg-amber-50"
              trend={
                (report?.lowStockCount ?? 0) > 0
                  ? { value: report?.lowStockCount ?? 0, label: 'need attention', positive: false }
                  : undefined
              }
            />
            <StatCard
              title="Total Customers"
              value={report?.totalCustomers ?? 0}
              icon={Users}
              iconColor="text-cyan-600"
              iconBg="bg-cyan-50"
            />
            <StatCard
              title="Outstanding Debt"
              value={formatCurrency(report?.totalDebt ?? 0)}
              icon={CreditCard}
              iconColor="text-red-600"
              iconBg="bg-red-50"
              trend={{ value: 5.4, label: 'vs last month', positive: false }}
            />
            <StatCard
              title="Cash Collected"
              value={formatCurrency(report?.cashCollected ?? 0)}
              icon={Banknote}
              iconColor="text-green-600"
              iconBg="bg-green-50"
              trend={{ value: 12.8, label: 'vs last month', positive: true }}
            />
            <StatCard
              title="Total Branches"
              value={report?.totalBranches ?? 0}
              icon={GitBranch}
              iconColor="text-slate-600"
              iconBg="bg-slate-100"
            />
          </>
        )}
      </div>

      {/* ── Charts row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sales chart */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">Sales Over Time</CardTitle>
            <CardDescription className="text-xs">Monthly sales volume (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={report?.salesByMonth ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    name="Sales"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fill="url(#salesGrad)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue chart */}
        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-800">Cash Collected</CardTitle>
            <CardDescription className="text-xs">Monthly revenue collected (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-52 w-full rounded-xl" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report?.revenueByMonth ?? []} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CurrencyTooltip />} />
                  <Bar dataKey="amount" name="Collected" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Bottom row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Invoices */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-slate-200 shadow-sm h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">Recent Invoices</CardTitle>
              <CardDescription className="text-xs">Latest 6 invoices</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {invoicesQuery.isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{inv.invoiceNumber}</p>
                        <p className="text-xs text-slate-400 truncate">{inv.customerName} &bull; {formatDate(inv.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        <span className="text-sm font-semibold text-slate-800 tabular-nums">
                          {formatCurrency(inv.total)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            PAYMENT_STATUS_COLORS[inv.paymentStatus] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {inv.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: recent payments + low stock */}
        <div className="flex flex-col gap-4">
          {/* Recent Payments */}
          <Card className="rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800">Recent Payments</CardTitle>
              <CardDescription className="text-xs">Latest 3 payments received</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {paymentsQuery.isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-lg" />)}
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {payments.slice(0, 3).map((pay) => (
                    <div key={pay.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{pay.customerName}</p>
                        <p className="text-[10px] text-slate-400">{pay.invoiceNumber} &bull; {formatDate(pay.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-semibold text-slate-800 tabular-nums">{formatCurrency(pay.amount)}</span>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${METHOD_COLORS[pay.method] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {pay.method.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alerts */}
          <Card className="rounded-2xl border-slate-200 shadow-sm flex-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Low Stock Alerts
              </CardTitle>
              <CardDescription className="text-xs">Items at or below minimum stock</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {inventoryQuery.isLoading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-full rounded-lg" />)}
                </div>
              ) : lowStockItems.length === 0 ? (
                <p className="px-4 py-4 text-xs text-slate-400">All stock levels are healthy.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {lowStockItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-800 truncate">{item.productName}</p>
                        <p className="text-[10px] text-slate-400">{item.branchName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-xs font-bold text-amber-600 tabular-nums">{item.quantity}</span>
                        <span className="text-[10px] text-slate-400">/ {item.minimumStock} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}
