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
import { Invoice, Payment } from '@/types'
import { MOCK_INVOICES, MOCK_PAYMENTS } from '@/data/mock'
import { formatCurrency, formatDate, calculateDaysOverdue } from '@/data/helpers'
import { Plus, Eye, Send, AlertTriangle } from 'lucide-react'

export default function InvoicesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    amount: '',
    description: '',
  })

  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => MOCK_INVOICES,
  })

  const paymentsQuery = useQuery({
    queryKey: ['payments'],
    queryFn: async () => MOCK_PAYMENTS,
  })

  let filteredInvoices = invoicesQuery.data || []

  if (searchTerm) {
    filteredInvoices = filteredInvoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase())
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
      accessorKey: 'clientName',
      header: 'Client',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.clientName}</p>
          <p className="text-xs text-muted-foreground">{row.original.clientEmail}</p>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => <span className="font-semibold">{formatCurrency(row.original.amount)}</span>,
    },
    {
      accessorKey: 'issueDate',
      header: 'Date',
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.issueDate)}</span>,
    },
    {
      accessorKey: 'dueDate',
      header: 'Due Date',
      cell: ({ row }) => {
        const daysOverdue = calculateDaysOverdue(row.original.dueDate)
        const isOverdue = daysOverdue > 0 && row.original.status !== 'paid'

        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{formatDate(row.original.dueDate)}</span>
            {isOverdue && <AlertTriangle className="w-4 h-4 text-red-500" title={`${daysOverdue} days overdue`} />}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
  ]

  const handleCreateInvoice = () => {
    console.log('Create invoice:', formData)
    setFormData({
      clientName: '',
      clientEmail: '',
      amount: '',
      description: '',
    })
    setIsCreateDialogOpen(false)
  }

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0)
  const paidAmount = filteredInvoices.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0)
  const pendingAmount = filteredInvoices.filter((inv) => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0)
  const overdueAmount = filteredInvoices.filter((inv) => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0)

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
                <Label htmlFor="clientName">Client Name</Label>
                <Input id="clientName" placeholder="Client Name" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="clientEmail">Client Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  placeholder="client@company.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Invoice details..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(overdueAmount)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4 mb-6">
        <SearchInput placeholder="Search invoices by number or client..." value={searchTerm} onChange={setSearchTerm} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
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
                      <p className="text-sm text-muted-foreground">{selectedInvoice.clientName}</p>
                    </div>
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold">{formatCurrency(selectedInvoice.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Invoice Date</p>
                      <p className="font-medium">{formatDate(selectedInvoice.issueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="font-medium">{formatDate(selectedInvoice.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Client Email</p>
                      <p className="font-medium text-blue-600">{selectedInvoice.clientEmail}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Items</h4>
                    <div className="space-y-2">
                      {selectedInvoice.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button className="gap-2">
                      <Send className="w-4 h-4" />
                      Send Invoice
                    </Button>
                    {selectedInvoice.status !== 'paid' && (
                      <Button variant="outline">Mark as Paid</Button>
                    )}
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
