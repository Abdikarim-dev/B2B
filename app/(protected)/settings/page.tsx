'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import { hasPermission } from '@/lib/permissions'
import { fetchSettings, updateSettings } from '@/data/api/settings'
import type { BusinessSettings } from '@/types'
import { PageContainer } from '@/components/shared/PageContainer'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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
import {
  Building2,
  DollarSign,
  FileText,
  Receipt,
  AlertTriangle,
  Save,
  Upload,
} from 'lucide-react'

const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '\u20ac' },
  { code: 'GBP', name: 'British Pound', symbol: '\u00a3' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '\u00a5' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '\u20a6' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const canView = hasPermission(user, 'settings.view')
  const canUpdate = hasPermission(user, 'settings.update')

  const lockedBizId = user?.businessId ?? ''

  const settingsQuery = useQuery({
    queryKey: ['settings', lockedBizId],
    queryFn: () => fetchSettings(lockedBizId),
    enabled: !!lockedBizId && canView,
  })

  const settings = settingsQuery.data?.data

  const [form, setForm] = useState<{
    businessName: string
    logo: string
    currency: string
    vatPercentage: string
    invoicePrefix: string
    receiptPrefix: string
    lowStockThreshold: string
  }>({
    businessName: '',
    logo: '',
    currency: 'USD',
    vatPercentage: '0',
    invoicePrefix: 'INV',
    receiptPrefix: 'REC',
    lowStockThreshold: '10',
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Sync form when settings load
  useEffect(() => {
    if (settings) {
      setForm({
        businessName: settings.businessName,
        logo: settings.logo ?? '',
        currency: settings.currency,
        vatPercentage: settings.vatPercentage.toString(),
        invoicePrefix: settings.invoicePrefix,
        receiptPrefix: settings.receiptPrefix,
        lowStockThreshold: settings.lowStockThreshold.toString(),
      })
      setHasChanges(false)
    }
  }, [settings])

  const updateMutation = useMutation({
    mutationFn: (data: Partial<BusinessSettings>) => updateSettings(lockedBizId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      toast.success('Settings saved successfully.')
      setHasChanges(false)
    },
    onError: () => toast.error('Failed to save settings.'),
  })

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = () => {
    updateMutation.mutate({
      businessName: form.businessName,
      logo: form.logo || undefined,
      currency: form.currency,
      vatPercentage: parseFloat(form.vatPercentage) || 0,
      invoicePrefix: form.invoicePrefix,
      receiptPrefix: form.receiptPrefix,
      lowStockThreshold: parseInt(form.lowStockThreshold) || 0,
    })
  }

  if (!canView) {
    return (
      <PageContainer>
        <PageHeader
          title="Settings"
          description="You do not have permission to view settings."
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your business configuration and preferences."
        actions={
          canUpdate && hasChanges ? (
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          ) : undefined
        }
      />

      {settingsQuery.isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Business Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-slate-500" />
                <CardTitle className="text-base">Business Information</CardTitle>
              </div>
              <CardDescription>
                Update your business name and branding.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={form.businessName}
                    onChange={(e) => handleChange('businessName', e.target.value)}
                    placeholder="Your Business Name"
                    disabled={!canUpdate}
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col gap-1.5">
                  <Label htmlFor="logo">Logo URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="logo"
                      value={form.logo}
                      onChange={(e) => handleChange('logo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                      disabled={!canUpdate}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" disabled={!canUpdate}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter a URL to your business logo image.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-slate-500" />
                <CardTitle className="text-base">Financial Settings</CardTitle>
              </div>
              <CardDescription>
                Configure currency and tax settings for your business.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={form.currency}
                    onValueChange={(v) => handleChange('currency', v)}
                    disabled={!canUpdate}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="vatPercentage">VAT Percentage (%)</Label>
                  <Input
                    id="vatPercentage"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.vatPercentage}
                    onChange={(e) => handleChange('vatPercentage', e.target.value)}
                    placeholder="0"
                    disabled={!canUpdate}
                  />
                  <p className="text-xs text-slate-500">
                    Applied to all invoices by default.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Document Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <CardTitle className="text-base">Document Settings</CardTitle>
              </div>
              <CardDescription>
                Configure prefixes for invoices and receipts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="invoicePrefix"
                      value={form.invoicePrefix}
                      onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                      placeholder="INV"
                      maxLength={6}
                      disabled={!canUpdate}
                      className="w-24"
                    />
                    <span className="text-sm text-slate-500">
                      e.g. {form.invoicePrefix}-2024-0001
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="receiptPrefix">Receipt Prefix</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="receiptPrefix"
                      value={form.receiptPrefix}
                      onChange={(e) => handleChange('receiptPrefix', e.target.value.toUpperCase())}
                      placeholder="REC"
                      maxLength={6}
                      disabled={!canUpdate}
                      className="w-24"
                    />
                    <span className="text-sm text-slate-500">
                      e.g. {form.receiptPrefix}-2024-0001
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-slate-500" />
                <CardTitle className="text-base">Inventory Alerts</CardTitle>
              </div>
              <CardDescription>
                Configure when to show low stock warnings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5 max-w-xs">
                <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  min="0"
                  value={form.lowStockThreshold}
                  onChange={(e) => handleChange('lowStockThreshold', e.target.value)}
                  placeholder="10"
                  disabled={!canUpdate}
                />
                <p className="text-xs text-slate-500">
                  Products with stock at or below this level will be flagged as low stock.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button (Mobile) */}
          {canUpdate && hasChanges && (
            <div className="flex justify-end sm:hidden">
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  )
}
