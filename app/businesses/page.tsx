'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageContainer, PageHeader, StatusBadge } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Business } from '@/types'
import { MOCK_BUSINESSES, MOCK_BRANCHES } from '@/data/mock'
import { formatDate } from '@/data/helpers'
import { Plus, MapPin, Users, Calendar } from 'lucide-react'

export default function BusinessesPage() {
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', industry: '', registrationNumber: '' })

  const businessesQuery = useQuery({
    queryKey: ['businesses'],
    queryFn: async () => MOCK_BUSINESSES,
  })

  const branchesQuery = useQuery({
    queryKey: ['branches', selectedBusiness],
    queryFn: async () => {
      if (!selectedBusiness) return []
      return MOCK_BRANCHES.filter((b) => b.businessId === selectedBusiness)
    },
    enabled: !!selectedBusiness,
  })

  const businesses = businessesQuery.data || []
  const selectedBiz = businesses.find((b) => b.id === selectedBusiness)
  const branches = branchesQuery.data || []

  const handleCreateBusiness = () => {
    console.log('Create business:', formData)
    setFormData({ name: '', industry: '', registrationNumber: '' })
    setIsDialogOpen(false)
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-8">
        <PageHeader title="Businesses" description="Manage your business entities and their details" />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Business
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Business</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Business Name</Label>
                <Input id="name" placeholder="Company Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" placeholder="Technology" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="reg">Registration Number</Label>
                <Input id="reg" placeholder="REG-2024-001" value={formData.registrationNumber} onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })} />
              </div>
              <Button onClick={handleCreateBusiness} className="w-full">
                Create Business
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Businesses List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>All Businesses</CardTitle>
              <CardDescription>{businesses.length} businesses</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {businesses.map((business) => (
                <button
                  key={business.id}
                  onClick={() => setSelectedBusiness(business.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedBusiness === business.id ? 'border-blue-500 bg-blue-50' : 'border-border hover:border-border'
                  }`}
                >
                  <div className="font-medium text-sm">{business.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">{business.industry}</div>
                  <div className="mt-2">
                    <StatusBadge status={business.status} />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Business Details */}
        <div className="lg:col-span-2">
          {selectedBiz ? (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="branches">Branches</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{selectedBiz.name}</CardTitle>
                        <CardDescription>{selectedBiz.industry}</CardDescription>
                      </div>
                      <StatusBadge status={selectedBiz.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Registration Number</p>
                        <p className="font-medium text-sm">{selectedBiz.registrationNumber}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Tax ID</p>
                        <p className="font-medium text-sm">{selectedBiz.taxId}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium text-sm">{selectedBiz.phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Website</p>
                        <p className="font-medium text-sm text-blue-600">{selectedBiz.website}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Address</p>
                      <p className="text-sm flex gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        {selectedBiz.address}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Founded</p>
                      <p className="text-sm flex gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(selectedBiz.foundedDate)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="branches" className="space-y-4">
                <div className="flex justify-end">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Branch
                  </Button>
                </div>
                <div className="space-y-3">
                  {branches.length > 0 ? (
                    branches.map((branch) => (
                      <Card key={branch.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{branch.name}</h4>
                              <p className="text-sm text-muted-foreground flex gap-2 mt-1">
                                <MapPin className="w-4 h-4" />
                                {branch.address}
                              </p>
                              <p className="text-sm text-muted-foreground flex gap-2 mt-1">
                                <Users className="w-4 h-4" />
                                Manager: {branch.manager}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <StatusBadge status={branch.status} />
                              <p className="text-xs text-muted-foreground">{branch.phone}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">No branches for this business</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="pt-12 text-center">
                <p className="text-muted-foreground">Select a business to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageContainer>
  )
}
