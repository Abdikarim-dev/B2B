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
import { Product } from '@/types'
import { fetchProducts } from '@/data/api/products'
import { formatCurrency } from '@/data/helpers'
import { Plus, AlertTriangle } from 'lucide-react'

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    sellingPrice: '',
    purchasePrice: '',
    description: '',
  })

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: () => fetchProducts(),
  })

  let filteredProducts = productsQuery.data?.data ?? []

  if (searchTerm) {
    filteredProducts = filteredProducts.filter(
      (p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  if (filterStatus) {
    filteredProducts = filteredProducts.filter((p) => p.status === filterStatus)
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: 'name',
      header: 'Product Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.sku}</p>
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Category',
      cell: ({ row }) => <span className="text-sm">{row.original.categoryName}</span>,
    },
    {
      accessorKey: 'sellingPrice',
      header: 'Selling Price',
      cell: ({ row }) => <span className="font-medium">{formatCurrency(row.original.sellingPrice)}</span>,
    },
    {
      accessorKey: 'purchasePrice',
      header: 'Purchase Price',
      cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatCurrency(row.original.purchasePrice)}</span>,
    },
    {
      accessorKey: 'minimumStock',
      header: 'Min Stock',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.minimumStock}</span>
          {row.original.minimumStock > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge variant={row.original.status === 'ACTIVE' ? 'active' : 'inactive'} />,
    },
  ]

  const handleCreateProduct = () => {
    console.log('Create product:', formData)
    setFormData({
      name: '',
      sku: '',
      categoryId: '',
      sellingPrice: '',
      purchasePrice: '',
      description: '',
    })
    setIsDialogOpen(false)
  }

  const totalValue = filteredProducts.reduce((sum, p) => sum + p.sellingPrice * p.minimumStock, 0)
  const activeCount = filteredProducts.filter((p) => p.status === 'ACTIVE').length
  const inactiveCount = filteredProducts.filter((p) => p.status === 'INACTIVE').length

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Products" description="Manage your product catalog and pricing" />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" placeholder="Product Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" placeholder="SKU-001" value={formData.sku} onChange={(e) => setFormData({ ...formData, sku: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="categoryId">Category ID</Label>
                <Input
                  id="categoryId"
                  placeholder="cat-001"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  placeholder="0.00"
                  value={formData.purchasePrice}
                  onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sellingPrice">Selling Price</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  placeholder="0.00"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Product description..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateProduct} className="w-full">
                Create Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Total Products</p>
          <p className="text-2xl font-bold mt-1">{filteredProducts.length}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Active Products</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{activeCount}</p>
        </div>
        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground">Inactive Products</p>
          <p className={`text-2xl font-bold mt-1 ${inactiveCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>{inactiveCount}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <SearchInput placeholder="Search by product name or SKU..." value={searchTerm} onChange={setSearchTerm} />
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filteredProducts} />
    </PageContainer>
  )
}
