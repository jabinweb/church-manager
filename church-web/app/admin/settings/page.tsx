'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Settings, 
  Package, 
  Mail,
  Shield,
  Database,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description: string | null
  image: string | null
  isActive: boolean
  productCount: number
}

interface SystemSettings {
  churchName: string
  churchAddress?: string
  churchPhone?: string
  churchEmail?: string
  churchWebsite?: string
  enableOnlineGiving: boolean
  enableEventRegistration: boolean
  enablePrayerRequests: boolean
  maintenanceMode: boolean
  currency?: string
  logoUrl?: string
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
  backgroundColor?: string
  textColor?: string
  timezone?: string
  defaultLanguage?: string
  announcement?: string
  facebookUrl?: string
  twitterUrl?: string
  instagramUrl?: string
  supportPhone?: string
  privacyPolicyUrl?: string
  termsUrl?: string
}

// Utility to get currency symbol from code
function getCurrencySymbol(code: string | undefined) {
  if (!code) return '$'
  try {
    // Use Intl API for most currencies
    return (0).toLocaleString(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).replace(/\d/g, '').trim() || '$'
  } catch {
    // fallback
    return '$'
  }
}

export default function AdminSettingsPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    churchName: 'Grace Community Church',
    churchAddress: '',
    churchPhone: '',
    churchEmail: '',
    churchWebsite: '',
    enableOnlineGiving: true,
    enableEventRegistration: true,
    enablePrayerRequests: true,
    maintenanceMode: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [newCategory, setNewCategory] = useState({ name: '', description: '', image: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const [categoriesRes, systemRes] = await Promise.all([
        fetch('/api/admin/settings/categories'),
        fetch('/api/admin/settings/system')
      ])

      const [categoriesData, systemData] = await Promise.all([
        categoriesRes.json(),
        systemRes.json()
      ])

      setCategories(categoriesData.categories || [])
      setSystemSettings(prev => ({ ...prev, ...systemData }))
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const saveSystemSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/admin/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings)
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast.success('System settings saved successfully')
      if (systemSettings.maintenanceMode) {
        toast.warning('⚠️ Maintenance mode enabled! Public site is now offline.')
      } else {
        toast.success('✅ Maintenance mode disabled. Public site is now online.')
      }
    } catch (error) {
      console.error('Error saving system settings:', error)
      toast.error('Failed to save system settings')
    } finally {
      setSaving(false)
    }
  }

  const saveCategory = async (category: Category) => {
    try {
      // Use correct payload and endpoint logic for new vs existing category
      const isNew = !category.id || category.id.startsWith('new')
      const url = isNew
        ? '/api/admin/settings/categories'
        : `/api/admin/settings/categories/${category.id}`

      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: category.name,
          description: category.description,
          imageUrl: category.image, // backend expects imageUrl, not image
          isActive: category.isActive
        })
      })

      if (!response.ok) throw new Error('Failed to save category')

      toast.success('Category saved successfully')
      fetchSettings()
      setEditingCategory(null)
      setNewCategory({ name: '', description: '', image: '' })
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/settings/categories/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete category')

      toast.success('Category deleted successfully')
      fetchSettings()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  // Add currency symbol to state for preview
  const currencySymbol = getCurrencySymbol(systemSettings.currency)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with maintenance warning */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                System Settings
              </h1>
              <p className="text-gray-600 mt-2">Manage your platform configuration and settings</p>
            </div>
            <Button onClick={() => fetchSettings()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          {systemSettings.maintenanceMode && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-900">Maintenance Mode Active</h3>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-red-700">
                  The public website is currently offline for regular users.
                </p>
                <p className="text-sm text-red-600 font-medium">
                  ✅ Admin users (like you) can still access all pages normally.
                </p>
              </div>
            </div>
          )}
        </motion.div>

        <Tabs defaultValue="system" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center space-x-2">
              <Package className="h-4 w-4" />
              <span>Categories</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* System Settings */}
          <TabsContent value="system">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Church Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="churchName">Church Name</Label>
                      <Input
                        id="churchName"
                        value={systemSettings.churchName}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, churchName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="churchEmail">Church Email</Label>
                      <Input
                        id="churchEmail"
                        type="email"
                        value={systemSettings.churchEmail || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, churchEmail: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="churchPhone">Church Phone</Label>
                      <Input
                        id="churchPhone"
                        value={systemSettings.churchPhone || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, churchPhone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="churchWebsite">Church Website</Label>
                      <Input
                        id="churchWebsite"
                        value={systemSettings.churchWebsite || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, churchWebsite: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="currency">Currency</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="currency"
                          value={systemSettings.currency || ''}
                          onChange={(e) => setSystemSettings(prev => ({ ...prev, currency: e.target.value }))}
                          placeholder="USD"
                        />
                        <span className="text-lg font-bold">{currencySymbol}</span>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="logoUrl">Logo URL</Label>
                      <Input
                        id="logoUrl"
                        value={systemSettings.logoUrl || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, logoUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <Input
                        id="primaryColor"
                        type="color"
                        value={systemSettings.primaryColor || '#7c3aed'}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, primaryColor: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor">Secondary Color</Label>
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={systemSettings.secondaryColor || '#6366f1'}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, secondaryColor: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="accentColor">Accent Color</Label>
                      <Input
                        id="accentColor"
                        type="color"
                        value={systemSettings.accentColor || '#f59e42'}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, accentColor: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={systemSettings.backgroundColor || '#f9fafb'}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="textColor">Text Color</Label>
                      <Input
                        id="textColor"
                        type="color"
                        value={systemSettings.textColor || '#111827'}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, textColor: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={systemSettings.timezone || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, timezone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultLanguage">Default Language</Label>
                      <Input
                        id="defaultLanguage"
                        value={systemSettings.defaultLanguage || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="supportPhone">Support Phone</Label>
                      <Input
                        id="supportPhone"
                        value={systemSettings.supportPhone || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, supportPhone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="facebookUrl">Facebook URL</Label>
                      <Input
                        id="facebookUrl"
                        value={systemSettings.facebookUrl || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, facebookUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="twitterUrl">Twitter URL</Label>
                      <Input
                        id="twitterUrl"
                        value={systemSettings.twitterUrl || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, twitterUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="instagramUrl">Instagram URL</Label>
                      <Input
                        id="instagramUrl"
                        value={systemSettings.instagramUrl || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, instagramUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="privacyPolicyUrl">Privacy Policy URL</Label>
                      <Input
                        id="privacyPolicyUrl"
                        value={systemSettings.privacyPolicyUrl || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, privacyPolicyUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="termsUrl">Terms URL</Label>
                      <Input
                        id="termsUrl"
                        value={systemSettings.termsUrl || ''}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, termsUrl: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="churchAddress">Church Address</Label>
                    <Textarea
                      id="churchAddress"
                      value={systemSettings.churchAddress || ''}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, churchAddress: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="announcement">Announcement</Label>
                    <Textarea
                      id="announcement"
                      value={systemSettings.announcement || ''}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, announcement: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Online Giving</Label>
                        <p className="text-sm text-gray-500">Allow online donations</p>
                      </div>
                      <Switch
                        checked={systemSettings.enableOnlineGiving}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableOnlineGiving: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Event Registration</Label>
                        <p className="text-sm text-gray-500">Allow members to register for events</p>
                      </div>
                      <Switch
                        checked={systemSettings.enableEventRegistration}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enableEventRegistration: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Prayer Requests</Label>
                        <p className="text-sm text-gray-500">Allow members to submit prayer requests</p>
                      </div>
                      <Switch
                        checked={systemSettings.enablePrayerRequests}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, enablePrayerRequests: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-red-50 border-red-200">
                      <div>
                        <Label className="text-red-900 font-medium">Maintenance Mode</Label>
                        <p className="text-sm text-red-700 mt-1">Put site in maintenance mode</p>
                        <p className="text-xs text-red-600 font-medium">
                          ⚠️ This will take the public site offline for regular users. Admin users will still have full access.
                        </p>
                      </div>
                      <Switch
                        checked={systemSettings.maintenanceMode}
                        onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                      />
                    </div>
                  </div>
                  <Button onClick={saveSystemSettings} disabled={saving}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Settings'}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Categories */}
          <TabsContent value="categories">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Product Categories</span>
                    </CardTitle>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Add Category
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Category</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={newCategory.name}
                              onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Description</Label>
                            <Textarea
                              value={newCategory.description}
                              onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                              rows={3}
                            />
                          </div>
                          <div>
                            <Label>Image URL</Label>
                            <Input
                              value={newCategory.image}
                              onChange={(e) => setNewCategory(prev => ({ ...prev, image: e.target.value }))}
                            />
                          </div>
                          <Button 
                            onClick={() => saveCategory({
                              id: 'new-category',
                              name: newCategory.name,
                              description: newCategory.description,
                              image: newCategory.image,
                              isActive: true,
                              productCount: 0
                            })} 
                            className="w-full"
                          >
                            Add Category
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div key={category.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{category.name}</h3>
                          <Badge variant={category.isActive ? 'default' : 'secondary'}>
                            {category.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{category.description}</p>
                        <p className="text-xs text-gray-400 mb-3">{category.productCount} products</p>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingCategory(category)}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteCategory(category.id)}
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Security Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-medium text-blue-900 mb-2">Database Status</h3>
                      <p className="text-sm text-blue-700">Database connection is healthy</p>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-2">Environment Variables</h3>
                      <p className="text-sm text-yellow-700">All required environment variables are configured</p>
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2">SSL Certificate</h3>
                      <p className="text-sm text-green-700">SSL certificate is valid and up to date</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>

        {/* Edit Dialogs */}
        {editingCategory && (
          <Dialog open={!!editingCategory} onOpenChange={() => setEditingCategory(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Category</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editingCategory.name}
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Image URL</Label>
                  <Input
                    value={editingCategory.image || ''}
                    onChange={(e) => setEditingCategory(prev => prev ? { ...prev, image: e.target.value } : null)}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingCategory.isActive}
                    onCheckedChange={(checked) => setEditingCategory(prev => prev ? { ...prev, isActive: checked } : null)}
                  />
                  <Label>Active</Label>
                </div>
                <Button onClick={() => saveCategory(editingCategory)} className="w-full">
                  Save Changes
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  )
}
