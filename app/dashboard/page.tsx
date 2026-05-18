'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { PageContainer, PageHeader, StatCard, DashboardCard } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MOCK_INVOICES, MOCK_PRODUCTS } from '@/data/mock'
import { formatCurrency, calculatePercentageChange } from '@/data/helpers'

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month')

  // Mock data queries
  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => MOCK_INVOICES,
  })

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => MOCK_PRODUCTS,
  })

  const invoices = invoicesQuery.data || []
  const products = productsQuery.data || []

  // Calculate stats
  const totalRevenue = invoices.reduce((sum, inv) => (inv.status === 'paid' ? sum + inv.amount : sum), 0)
  const pendingRevenue = invoices.reduce((sum, inv) => (inv.status === 'pending' ? sum + inv.amount : sum), 0)
  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length

  // Chart data
  const revenueData = [
    { month: 'Jan', revenue: 12500, target: 15000 },
    { month: 'Feb', revenue: 9800, target: 15000 },
    { month: 'Mar', revenue: 18500, target: 15000 },
    { month: 'Apr', revenue: 16200, target: 15000 },
    { month: 'May', revenue: 21300, target: 15000 },
    { month: 'Jun', revenue: 19800, target: 15000 },
  ]

  const statusData = [
    { name: 'Paid', value: invoices.filter((inv) => inv.status === 'paid').length, fill: '#10B981' },
    { name: 'Pending', value: invoices.filter((inv) => inv.status === 'pending').length, fill: '#F59E0B' },
    { name: 'Overdue', value: invoices.filter((inv) => inv.status === 'overdue').length, fill: '#EF4444' },
    { name: 'Draft', value: invoices.filter((inv) => inv.status === 'draft').length, fill: '#6B7280' },
  ]

  const inventoryData = products
    .filter((p) => p.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
    .map((p) => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + '...' : p.name,
      quantity: p.quantity,
      minimumStock: p.minimumStock,
    }))

  const colors = ['#2563EB', '#1E40AF', '#3B82F6', '#60A5FA']

  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Overview of your business metrics and performance" />

      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(totalRevenue)}
            change={calculatePercentageChange(totalRevenue, 45000)}
            icon="trending-up"
            status="success"
          />
          <StatCard
            title="Pending Revenue"
            value={formatCurrency(pendingRevenue)}
            change={calculatePercentageChange(pendingRevenue, 8000)}
            icon="clock"
            status="warning"
          />
          <StatCard
            title="Total Invoices"
            value={totalInvoices.toString()}
            change={calculatePercentageChange(totalInvoices, 5)}
            icon="file-text"
            status="info"
          />
          <StatCard
            title="Paid Invoices"
            value={`${paidInvoices}/${totalInvoices}`}
            change={calculatePercentageChange(paidInvoices, 2)}
            icon="check-circle"
            status="success"
          />
        </div>

        {/* Charts Section */}
        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue Trend</TabsTrigger>
            <TabsTrigger value="status">Invoice Status</TabsTrigger>
            <TabsTrigger value="inventory">Top Inventory</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue">
            <DashboardCard title="Revenue vs Target" description="Monthly revenue compared to target">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2563EB" />
                  <Bar dataKey="target" fill="#E5E7EB" />
                </BarChart>
              </ResponsiveContainer>
            </DashboardCard>
          </TabsContent>

          <TabsContent value="status">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardCard title="Invoice Status Distribution" description="Breakdown of invoice statuses">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </DashboardCard>

              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-foreground">Status Summary</h3>
                {statusData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium text-sm">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="inventory">
            <DashboardCard title="Top Products by Stock" description="Products with highest inventory levels">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={inventoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="quantity" fill="#10B981" name="Current Stock" />
                  <Bar dataKey="minimumStock" fill="#F59E0B" name="Minimum Stock" />
                </BarChart>
              </ResponsiveContainer>
            </DashboardCard>
          </TabsContent>
        </Tabs>

        {/* Recent Activity */}
        <DashboardCard title="Recent Invoices" description="Latest 5 invoices from your business">
          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                  <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(invoice.amount)}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </PageContainer>
  )
}
