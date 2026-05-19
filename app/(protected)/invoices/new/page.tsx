'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { createInvoice } from '@/data/api/invoices'
import { fetchBranches } from '@/data/api/businesses'
import { fetchCustomers } from '@/data/api/customers'
import { fetchProducts } from '@/data/api/products'
import { fetchInventory } from '@/data/api/inventory'
import type { InvoiceItem, PaymentMethod } from '@/types'
import { formatCurrency } from '@/data/helpers'
import { PageContainer } from '@/components/shared/PageContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// ─── Add Product Dialog ───────────────────────────────────────────────────────

interface AddProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: InvoiceItem & { availableStock: number }) => void
  products: any[]
  inventory: any[]
}

function AddProductDialog({ open, onOpenChange, onAdd, products, inventory }: AddProductDialogProps) {
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')

  const selectedProduct = products.find((p) => p.id === productId)
  const availableStock = inventory.find((i) => i.productId === productId)?.quantity || 0

  const handleAdd = () => {
    if (!productId || !quantity || !unitPrice) {
      toast.error('Please fill all fields')
      return
    }

    const qty = parseInt(quantity)
    if (qty <= 0) {
      toast.error('Quantity must be greater than 0')
      return
    }

    if (qty > availableStock) {
      toast.error('Insufficient stock available')
      return
    }

    const lineTotal = qty * parseFloat(unitPrice)

    onAdd({
      id: `ii-${Date.now()}`,
      productId,
      productName: selectedProduct.name,
      quantity: qty,
      unitPrice: parseFloat(unitPrice),
      lineTotal,
      availableStock,
    })

    setProductId('')
    setQuantity('1')
    setUnitPrice('')
    onOpenChange(false)
    toast.success('Product added')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="product">Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger id="product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} (SKU: {product.sku})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <p>
                <strong>Stock Available:</strong> {availableStock} units
              </p>
              <p>
                <strong>Selling Price:</strong> {formatCurrency(selectedProduct.sellingPrice)}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
              />
            </div>
            <div>
              <Label htmlFor="unitPrice">Unit Price</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {quantity && unitPrice && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm font-semibold">
              Line Total: {formatCurrency(parseInt(quantity) * parseFloat(unitPrice))}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd}>Add Product</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─── Create Invoice Page ──────────────────────────────────────────────────────

export default function CreateInvoicePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState<(InvoiceItem & { availableStock: number })[]>([])
  const [branchId, setBranchId] = useState('')
  const [customerId, setCustomerId] = useState('')
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENTAGE'>('FIXED')
  const [discountValue, setDiscountValue] = useState('')
  const [vatRate, setVatRate] = useState('10')
  const [paidAmount, setPaidAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH')
  const [notes, setNotes] = useState('')
  const [addProductOpen, setAddProductOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Queries
  const branchesQuery = useQuery({
    queryKey: ['branches'],
    queryFn: () => fetchBranches({ businessId: user?.businessId }).then((res) => res.data),
    enabled: !!user?.businessId,
  })

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: () => fetchCustomers({ businessId: user?.businessId }).then((res) => res.data),
    enabled: !!user?.businessId,
  })

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts({ businessId: user?.businessId }).then((res) => res.data),
    enabled: !!user?.businessId,
  })

  const inventoryQuery = useQuery({
    queryKey: ['inventory'],
    queryFn: () => fetchInventory({ businessId: user?.businessId }).then((res) => res.data),
    enabled: !!user?.businessId,
  })

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0)
  const discountAmount = discountType === 'FIXED' ? parseFloat(discountValue || '0') : (subtotal * parseFloat(discountValue || '0')) / 100
  const vatAmount = ((subtotal - discountAmount) * parseFloat(vatRate || '0')) / 100
  const total = subtotal - discountAmount + vatAmount
  const balanceDue = Math.max(0, total - parseFloat(paidAmount || '0'))

  // Handlers
  const handleAddProduct = (item: InvoiceItem & { availableStock: number }) => {
    setItems([...items, item])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id))
  }

  const handleSaveAsDraft = async () => {
    if (!branchId || !customerId || items.length === 0) {
      toast.error('Please fill required fields and add at least one product')
      return
    }

    setSaving(true)
    try {
      await createInvoice({
        invoiceNumber: `INV-${Date.now()}`,
        businessId: user?.businessId || '',
        branchId,
        customerId,
        items,
        subtotal,
        discountType,
        discountValue: parseFloat(discountValue || '0'),
        discountAmount,
        vatRate: parseFloat(vatRate || '0'),
        vatAmount,
        total,
        paidAmount: parseFloat(paidAmount || '0'),
        balanceDue,
        status: 'DRAFT',
        paymentStatus: balanceDue === 0 ? 'PAID' : paidAmount ? 'PARTIAL' : 'UNPAID',
        paymentMethod: paidAmount ? paymentMethod : undefined,
        notes: notes || undefined,
        createdBy: user?.id || '',
      })
      toast.success('Invoice saved as draft')
      router.push('/invoices')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save invoice')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirm = async () => {
    if (!branchId || !customerId || items.length === 0) {
      toast.error('Please fill required fields and add at least one product')
      return
    }

    setSaving(true)
    try {
      await createInvoice({
        invoiceNumber: `INV-${Date.now()}`,
        businessId: user?.businessId || '',
        branchId,
        customerId,
        items,
        subtotal,
        discountType,
        discountValue: parseFloat(discountValue || '0'),
        discountAmount,
        vatRate: parseFloat(vatRate || '0'),
        vatAmount,
        total,
        paidAmount: parseFloat(paidAmount || '0'),
        balanceDue,
        status: 'CONFIRMED',
        paymentStatus: balanceDue === 0 ? 'PAID' : paidAmount ? 'PARTIAL' : 'UNPAID',
        paymentMethod: paidAmount ? paymentMethod : undefined,
        notes: notes || undefined,
        createdBy: user?.id || '',
      })
      toast.success('Invoice confirmed')
      router.push('/invoices')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice')
    } finally {
      setSaving(false)
    }
  }

  if (!hasPermission(user, 'invoices.create')) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <p className="text-red-600">You don&apos;t have permission to create invoices</p>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <div className="mb-6">
        <Link href="/invoices">
          <Button variant="outline" size="sm" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Invoices
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create Invoice</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="branch">Branch *</Label>
                  <Select value={branchId} onValueChange={setBranchId}>
                    <SelectTrigger id="branch">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branchesQuery.data?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer">Customer *</Label>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger id="customer">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customersQuery.data?.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Invoice Items</CardTitle>
              <Button size="sm" onClick={() => setAddProductOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <p>No products added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-sm text-slate-600">
                          {item.quantity} × {formatCurrency(item.unitPrice)} = {formatCurrency(item.lineTotal)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discount & VAT */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Discount & Tax</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="discountType">Discount Type</Label>
                  <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
                    <SelectTrigger id="discountType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed</SelectItem>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">
                    Discount {discountType === 'PERCENTAGE' ? '(%)' : ''}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    min="0"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="vatRate">VAT Rate (%)</Label>
                  <Input
                    id="vatRate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    placeholder="10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="paidAmount">Paid Amount</Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                    <SelectTrigger id="paymentMethod">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="BANK">Bank Transfer</SelectItem>
                      <SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
                      <SelectItem value="CREDIT">Credit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Additional notes or special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal:</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Discount:</span>
                  <span className="font-medium text-red-600">-{formatCurrency(discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">VAT ({vatRate || 0}%):</span>
                  <span className="font-medium">{formatCurrency(vatAmount)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Paid Amount:</span>
                  <span>{formatCurrency(parseFloat(paidAmount || '0'))}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Balance Due:</span>
                  <span className={balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}>
                    {formatCurrency(balanceDue)}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleSaveAsDraft}
                  disabled={saving || items.length === 0 || !branchId || !customerId}
                >
                  {saving ? 'Saving...' : 'Save as Draft'}
                </Button>
                <Button
                  className="w-full"
                  onClick={handleConfirm}
                  disabled={saving || items.length === 0 || !branchId || !customerId}
                >
                  {saving ? 'Confirming...' : 'Confirm Invoice'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Product Dialog */}
      <AddProductDialog
        open={addProductOpen}
        onOpenChange={setAddProductOpen}
        onAdd={handleAddProduct}
        products={productsQuery.data || []}
        inventory={inventoryQuery.data || []}
      />
    </PageContainer>
  )
}
