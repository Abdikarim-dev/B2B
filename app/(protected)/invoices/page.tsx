'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ColumnDef } from '@tanstack/react-table'
import { PageContainer, PageHeader, DataTable, SearchInput, StatusBadge } from '@/components/shared'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Invoice } from '@/types'
import { fetchInvoices } from '@/data/api/invoices'
import { formatCurrency, formatDate } from '@/data/helpers'
import { Plus, Eye, Send } from 'lucide-react'

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    total: '',
    notes: '',
  })

  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: () => fetchInvoices(),
  })

  let filteredInvoices = invoicesQuery.data?.data ?? []

  if (searchTerm) {
    filteredInvoices = filteredInvoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (filterStatus) {
    filteredInvoices = filteredInvoices.filter((inv) => inv.status === filterStatus)
  }

  const columns: ColumnDef<Invoice>[] = [
    {
      accessorKey: 'invoiceNumber',
      header: 'Invoice #',
      cell: ({ row }) => (
        <button
          onClick={() => setSelectedInvoice(row.original)}
          className="font-medium text-blue-600 hover:underline flex items-center gap-1"
        >
          <Eye className="w-4 h-4" />
          {row.original.invoiceNumber}
        </button>
      ),
    },
    {
      accessorKey: 'customerName',
      header: 'Customer',
      cell: ({ row }) => <span className="font-medium">{row.original.customerName}</span>,
    },
    {
      accessorKey: 'total',
      header: 'Amount',
      cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.total)}</span>,
    },
    {
      accessorKey: 'createdAt',
      header: 'Date',
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.createdAt)}</span>,
    },
    {
      accessorKey: 'paymentStatus',
      header: 'Payment',
      cell: ({ row }) => {
        const paymentStatusVariant: Record<string, 'paid' | 'pending' | 'partial'> = {
          PAID: 'paid',
          UNPAID: 'pending',
          PARTIAL: 'partial',
        }
        return <StatusBadge variant={paymentStatusVariant[row.original.paymentStatus] ?? 'pending'} />
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusVariant: Record<string, 'draft' | 'confirmed' | 'cancelled'> = {
          DRAFT: 'draft',
          CONFIRMED: 'confirmed',
          CANCELLED: 'cancelled',
        }
        return <StatusBadge variant={statusVariant[row.original.status] ?? 'draft'} />
      },
    },
  ]

  const handleCreateInvoice = () => {
    console.log('Create invoice:', formData)
    setFormData({
      customerName: '',
      customerEmail: '',
      total: '',
      notes: '',
    })
    setIsCreateDialogOpen(false)
  }

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0)
  const paidAmount = filteredInvoices
    .filter((inv) => inv.paymentStatus === 'PAID')
    .reduce((sum, inv) => sum + inv.paidAmount, 0)
  const pendingAmount = filteredInvoices
    .filter((inv) => inv.paymentStatus === 'UNPAID')
    .reduce((sum, inv) => sum + inv.balanceDue, 0)
  const partialAmount = filteredInvoices
    .filter((inv) => inv.paymentStatus === 'PARTIAL')
    .reduce((sum, inv) => sum + inv.balanceDue, 0)

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Invoices" description="Manage your invoices and payment tracking" />
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  placeholder="Customer Name"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Customer Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  placeholder="customer@company.com"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="total">Amount</Label>
                <Input
                  id="total"
                  type="number"
                  placeholder="0.00"
                  value={formData.total}
                  onChange={(e) => setFormData({ ...formData, total: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Invoice details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateInvoice} className="w-full">
                Create Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold mt-1">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(paidAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(pendingAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Partial</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(partialAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 mb-6">
        <SearchInput placeholder="Search invoices by number or customer..." value={searchTerm} onChange={setSearchTerm} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="CONFIRMED">Confirmed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="details">Invoice Details</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <DataTable columns={columns} data={filteredInvoices} />
        </TabsContent>

        <TabsContent value="details">
          {selectedInvoice ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{selectedInvoice.invoiceNumber}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedInvoice.customerName}</p>
                    </div>
                    <StatusBadge variant={selectedInvoice.status === 'DRAFT' ? 'draft' : 'confirmed'} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedInvoice.total)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice Date</p>
                      <p className="font-medium">{formatDate(selectedInvoice.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Updated</p>
                      <p className="font-medium">{formatDate(selectedInvoice.updatedAt)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Balance Due</p>
                      <p className="font-medium">{formatCurrency(selectedInvoice.balanceDue)}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Items</h4>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="gap-2">
                      <Send className="w-4 h-4" />
                      Send Invoice
                    </Button>
                    {selectedInvoice.paymentStatus !== 'PAID' && <Button variant="outline">Record Payment</Button>}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-12 text-center">
                <p className="text-muted-foreground">Select an invoice to view details</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
