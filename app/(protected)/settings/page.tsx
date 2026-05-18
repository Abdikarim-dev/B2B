'use client'

import { useState } from 'react'
import { PageContainer, PageHeader, FormSection } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Switch } from '@/components/ui/switch'

const PERMISSION_GROUPS = {
  users: [
    { id: 'users.view', label: 'View Users' },
    { id: 'users.create', label: 'Create Users' },
    { id: 'users.edit', label: 'Edit Users' },
    { id: 'users.delete', label: 'Delete Users' },
  ],
  businesses: [
    { id: 'businesses.view', label: 'View Businesses' },
    { id: 'businesses.create', label: 'Create Businesses' },
    { id: 'businesses.edit', label: 'Edit Businesses' },
    { id: 'businesses.delete', label: 'Delete Businesses' },
  ],
  products: [
    { id: 'products.view', label: 'View Products' },
    { id: 'products.edit', label: 'Edit Products' },
    { id: 'products.delete', label: 'Delete Products' },
    { id: 'products.manage', label: 'Manage Inventory' },
  ],
  invoices: [
    { id: 'invoices.view', label: 'View Invoices' },
    { id: 'invoices.create', label: 'Create Invoices' },
    { id: 'invoices.edit', label: 'Edit Invoices' },
    { id: 'invoices.manage', label: 'Manage Payments' },
  ],
  settings: [
    { id: 'settings.view', label: 'View Settings' },
    { id: 'settings.edit', label: 'Edit Settings' },
  ],
}

export default function SettingsPage() {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'manager' | 'staff'>('admin')
  const [companySettings, setCompanySettings] = useState({
    companyName: 'TechCorp Inc',
    email: 'support@techcorp.com',
    phone: '+1-555-0100',
    address: '123 Tech Street, San Francisco, CA',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    invoiceReminders: true,
    paymentNotifications: true,
    inventoryAlerts: true,
    userActivity: true,
    weeklyReports: false,
    monthlyReports: true,
  })

  const getRolePermissions = (role: 'admin' | 'manager' | 'staff'): string[] => {
    // These are mock permission lists for display purposes
    const permissionMap = {
      admin: ['users.view', 'users.create', 'users.edit', 'users.delete', 'businesses.view', 'businesses.create', 'businesses.edit', 'businesses.delete', 'products.view', 'products.edit', 'products.delete', 'products.manage', 'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.manage', 'settings.view', 'settings.edit'],
      manager: ['users.view', 'users.create', 'businesses.view', 'products.view', 'products.edit', 'invoices.view', 'invoices.create', 'invoices.edit', 'settings.view'],
      staff: ['users.view', 'businesses.view', 'products.view', 'invoices.view', 'settings.view'],
    }
    return permissionMap[role] || []
  }

  const rolePermissions = getRolePermissions(selectedRole)

  const handleCompanyChange = (key: string, value: string) => {
    setCompanySettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <PageContainer>
      <PageHeader title="Settings" description="Manage application settings and permissions" />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <FormSection title="Company Information" description="Update your company details">
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companySettings.companyName}
                  onChange={(e) => handleCompanyChange('companyName', e.target.value)}
                  placeholder="Company Name"
                />
              </div>
              <div>
                <Label htmlFor="email">Business Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={companySettings.email}
                  onChange={(e) => handleCompanyChange('email', e.target.value)}
                  placeholder="email@company.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={companySettings.phone}
                  onChange={(e) => handleCompanyChange('phone', e.target.value)}
                  placeholder="+1-555-0000"
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={companySettings.address}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <Button>Save Changes</Button>
            </div>
          </FormSection>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <FormSection title="Email Notifications" description="Control how you receive notifications">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Invoice Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified when invoices are due</p>
                </div>
                <Switch checked={notificationSettings.invoiceReminders} onCheckedChange={(checked) => handleNotificationChange('invoiceReminders', checked)} />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Payment Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified when payments are received</p>
                </div>
                <Switch checked={notificationSettings.paymentNotifications} onCheckedChange={(checked) => handleNotificationChange('paymentNotifications', checked)} />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Inventory Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when inventory is low</p>
                </div>
                <Switch checked={notificationSettings.inventoryAlerts} onCheckedChange={(checked) => handleNotificationChange('inventoryAlerts', checked)} />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">User Activity</p>
                  <p className="text-sm text-muted-foreground">Get notified of team member activities</p>
                </div>
                <Switch checked={notificationSettings.userActivity} onCheckedChange={(checked) => handleNotificationChange('userActivity', checked)} />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Receive weekly performance reports</p>
                </div>
                <Switch checked={notificationSettings.weeklyReports} onCheckedChange={(checked) => handleNotificationChange('weeklyReports', checked)} />
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">Monthly Reports</p>
                  <p className="text-sm text-muted-foreground">Receive monthly performance reports</p>
                </div>
                <Switch checked={notificationSettings.monthlyReports} onCheckedChange={(checked) => handleNotificationChange('monthlyReports', checked)} />
              </div>

              <Button>Save Preferences</Button>
            </div>
          </FormSection>
        </TabsContent>

        {/* Permissions Settings */}
        <TabsContent value="permissions" className="space-y-6">
          <FormSection title="Role Permissions" description="View and manage permissions for each role">
            <div className="space-y-6">
              <div>
                <Label htmlFor="role-select">Select Role</Label>
                <Select value={selectedRole} onValueChange={(value: any) => setSelectedRole(value)}>
                  <SelectTrigger id="role-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{selectedRole} Permissions</CardTitle>
                  <CardDescription>Current permissions for {selectedRole} users</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                    <div key={groupName}>
                      <h4 className="font-semibold capitalize mb-3">{groupName}</h4>
                      <div className="space-y-2 pl-4">
                        {permissions.map((permission) => (
                          <div key={permission.id} className="flex items-center gap-2">
                            <Checkbox checked={rolePermissions.includes(permission.id)} disabled />
                            <label className="text-sm cursor-pointer">{permission.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="text-sm text-muted-foreground p-4 border border-border rounded-lg bg-muted/50">
                <p className="font-medium mb-2">Note:</p>
                <p>Role permissions are predefined and cannot be modified directly. Contact your administrator to request permission changes.</p>
              </div>
            </div>
          </FormSection>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <FormSection title="Security Settings" description="Manage security and access control">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>Change your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="current-pwd">Current Password</Label>
                    <Input id="current-pwd" type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <Label htmlFor="new-pwd">New Password</Label>
                    <Input id="new-pwd" type="password" placeholder="••••••••" />
                  </div>
                  <div>
                    <Label htmlFor="confirm-pwd">Confirm Password</Label>
                    <Input id="confirm-pwd" type="password" placeholder="••••••••" />
                  </div>
                  <Button>Update Password</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Add an extra layer of security to your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium">2FA Status</p>
                      <p className="text-sm text-muted-foreground">Not enabled</p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>Manage your active login sessions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 border border-border rounded-lg">
                    <p className="font-medium text-sm">Current Device</p>
                    <p className="text-xs text-muted-foreground">Chrome on macOS</p>
                    <p className="text-xs text-muted-foreground mt-1">Last active: Just now</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Sign Out All Other Sessions
                  </Button>
                </CardContent>
              </Card>
            </div>
          </FormSection>
        </TabsContent>
      </Tabs>
    </PageContainer>
  )
}
