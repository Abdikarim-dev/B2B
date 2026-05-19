'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Printer, Check, X, FileText } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchInvoice, confirmInvoice, cancelInvoice } from '@/data/api/invoices'
import { formatDate, formatCurrency } from '@/data/helpers'
import type { Invoice } from '@/types'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// ─── Status Badges ───────────────────────────────────────────────────────────

const invoiceStatusBadge = (status: Invoice['status']) => {
  const variants: Record<Invoice['status'], { bg: string; text: string; label: string }> = {
    DRAFT: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Draft' },
    CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Confirmed' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Cancelled' },
  }
  const v = variants[status]
  return <Badge className={`${v.bg} ${v.text}`}>{v.label}</Badge>
}

const paymentStatusBadge = (status: Invoice['paymentStatus']) => {
  const variants: Record<Invoice['paymentStatus'], { bg: string; text: string; label: string }> = {
    UNPAID: { bg: 'bg-red-100', text: 'text-red-700', label: 'Unpaid' },
    PARTIAL: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Partial' },
    PAID: { bg: 'bg-green-100', text: 'text-green-700', label: 'Paid' },
  }
  const v = variants[status]
  return <Badge className={`${v.bg} ${v.text}`}>{v.label}</Badge>
}

// ─── Action Dialog ───────────────────────────────────────────────────────────

interface ActionDialogProps {
  open: boolean
  action: 'confirm' | 'cancel' | null
  onClose: () => void
  onConfirm: () => void
  loading: boolean
}

function ActionDialog({ open, action, onClose, onConfirm, loading }: ActionDialogProps) {
  const title = action === 'confirm' ? 'Confirm Invoice' : 'Cancel Invoice'
  const message =
    action === 'confirm'
      ? 'Are you sure you want to confirm this invoice? Once confirmed, it cannot be easily modified.'
      : 'Are you sure you want to cancel this invoice? This action cannot be undone.'
  const buttonText = action === 'confirm' ? 'Confirm Invoice' : 'Cancel Invoice'

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-600">{message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Close
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            variant={action === 'cancel' ? 'destructive' : 'default'}
          >
            {loading ? 'Processing...' : buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Invoice Details Page ─────────────────────────────────────────────────────

export default function InvoiceDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const invoiceId = params.id as string

  const [actionDialog, setActionDialog] = useState<{ open: boolean; action: 'confirm' | 'cancel' | null }>({
    open: false,
    action: null,
  })
  const [actionLoading, setActionLoading] = useState(false)

  // Query
  const invoiceQuery = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => fetchInvoice(invoiceId).then((res) => res.data),
    enabled: !!invoiceId,
  })

  const invoice = invoiceQuery.data

  // Handlers
  const handleActionConfirm = async () => {
    if (!invoice) return
    setActionLoading(true)
    try {
      if (actionDialog.action === 'confirm') {
        await confirmInvoice(invoice.id)
        toast.success('Invoice confirmed')
      } else {
        await cancelInvoice(invoice.id)
        toast.success('Invoice cancelled')
      }
      invoiceQuery.refetch()
      setActionDialog({ open: false, action: null })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  if (invoiceQuery.isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    )
  }

  if (!invoice) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">Invoice not found</p>
          <Link href="/invoices">
            <Button variant="outline" className="mt-4">
              Back to Invoices
            </Button>
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/invoices">
            <Button variant="outline" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Invoices
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{invoice.invoiceNumber}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          {invoice.status === 'DRAFT' && hasPermission(user, 'invoices.confirm') && (
            <Button
              size="sm"
              onClick={() => setActionDialog({ open: true, action: 'confirm' })}
              className="bg-blue-600"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirm
            </Button>
          )}
          {invoice.status !== 'CANCELLED' && hasPermission(user, 'invoices.cancel') && (
            <Button variant="destructive" size="sm" onClick={() => setActionDialog({ open: true, action: 'cancel' })}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Status Badges */}
      <div className="flex gap-2 mb-6">
        {invoiceStatusBadge(invoice.status)}
        {paymentStatusBadge(invoice.paymentStatus)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business & Customer Info */}
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">From</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-semibold">Business</p>
                <p className="text-slate-600">Branch: {invoice.branchName || '–'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Bill To</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-semibold">{invoice.customerName || '–'}</p>
                <p className="text-slate-600 text-xs">Customer</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-600">Invoice Number</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{invoice.invoiceNumber}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-600">Invoice Date</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{formatDate(invoice.createdAt)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs text-slate-600">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{formatDate(invoice.updatedAt)}</p>
              </CardContent>
            </Card>
          </div>

          {/* Line Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-semibold">Product</th>
                      <th className="text-right py-2 px-2 font-semibold">Qty</th>
                      <th className="text-right py-2 px-2 font-semibold">Unit Price</th>
                      <th className="text-right py-2 px-2 font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-2">{item.productName}</td>
                        <td className="text-right py-3 px-2">{item.quantity}</td>
                        <td className="text-right py-3 px-2">{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right py-3 px-2 font-semibold">{formatCurrency(item.lineTotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                </div>

                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">
                      Discount {invoice.discountType === 'PERCENTAGE' ? `(${invoice.discountValue}%)` : ''}:
                    </span>
                    <span className="font-medium text-red-600">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-slate-600">VAT ({invoice.vatRate}%):</span>
                  <span className="font-medium">{formatCurrency(invoice.vatAmount)}</span>
                </div>

                <div className="border-t pt-2 flex justify-between font-semibold text-base">
                  <span>Total:</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>

              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-600">Paid Amount:</span>
                  <span className="font-medium">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Balance Due:</span>
                  <span
                    className={
                      invoice.balanceDue > 0
                        ? 'text-orange-600'
                        : invoice.balanceDue < 0
                          ? 'text-blue-600'
                          : 'text-green-600'
                    }
                  >
                    {formatCurrency(invoice.balanceDue)}
                  </span>
                </div>
              </div>

              {invoice.paymentMethod && (
                <div className="border-t pt-4 text-sm">
                  <p className="text-slate-600">Payment Method: {invoice.paymentMethod}</p>
                </div>
              )}

              {invoice.notes && (
                <div className="border-t pt-4 text-sm">
                  <p className="font-semibold mb-2">Notes:</p>
                  <p className="text-slate-600">{invoice.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <ActionDialog
        open={actionDialog.open}
        action={actionDialog.action}
        onClose={() => setActionDialog({ open: false, action: null })}
        onConfirm={handleActionConfirm}
        loading={actionLoading}
      />

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
          
          button {
            display: none !important;
          }
          
          [role="button"] {
            display: none !important;
          }
          
          .sticky {
            position: static !important;
          }
        }
      `}</style>
    </PageContainer>
  )
}
