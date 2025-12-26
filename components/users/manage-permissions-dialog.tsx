'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ui/components/dialog'
import { Button } from '@ui/components/button'
import { Checkbox } from '@ui/components/checkbox'
import { Label } from '@ui/components/label'
import { ScrollArea } from '@ui/components/scroll-area'
import { useUpdateUserPermissions, usePermissions } from '@/hooks/queries/use-users'
import type { User, Permission } from '@/types/users'
import { Loader2 } from 'lucide-react'

interface ManagePermissionsDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PERMISSION_GROUPS = {
  'Products': ['products.view', 'products.create', 'products.edit', 'products.delete'],
  'Categories': ['categories.view', 'categories.create', 'categories.edit', 'categories.delete'],
  'Brands': ['brands.view', 'brands.create', 'brands.edit', 'brands.delete'],
  'Stock': ['stock.view', 'stock.manage'],
  'Reports': ['reports.view'],
  'Settings': ['settings.manage'],
  'Users': ['users.view', 'users.manage'],
} as const

const PERMISSION_LABELS: Record<Permission, string> = {
  'products.view': 'View Products',
  'products.create': 'Create Products',
  'products.edit': 'Edit Products',
  'products.delete': 'Delete Products',
  'categories.view': 'View Categories',
  'categories.create': 'Create Categories',
  'categories.edit': 'Edit Categories',
  'categories.delete': 'Delete Categories',
  'brands.view': 'View Brands',
  'brands.create': 'Create Brands',
  'brands.edit': 'Edit Brands',
  'brands.delete': 'Delete Brands',
  'stock.view': 'View Stock',
  'stock.manage': 'Manage Stock',
  'reports.view': 'View Reports',
  'settings.manage': 'Manage Settings',
  'users.view': 'View Users',
  'users.manage': 'Manage Users',
}

export function ManagePermissionsDialog({ user, open, onOpenChange }: ManagePermissionsDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Permission[]>(user?.permissions || [])
  const updatePermissions = useUpdateUserPermissions()

  // Update selected permissions when user changes
  useEffect(() => {
    if (user) {
      setSelectedPermissions(user.permissions)
    }
  }, [user])

  const handleTogglePermission = (permission: Permission) => {
    setSelectedPermissions(prev =>
      prev.includes(permission)
        ? prev.filter(p => p !== permission)
        : [...prev, permission]
    )
  }

  const handleSelectAll = (group: Permission[]) => {
    const allSelected = group.every(p => selectedPermissions.includes(p))
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !group.includes(p)))
    } else {
      setSelectedPermissions(prev => [...new Set([...prev, ...group])])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await updatePermissions.mutateAsync({
        id: user._id,
        permissions: { permissions: selectedPermissions }
      })
      onOpenChange(false)
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Manage Permissions</DialogTitle>
            <DialogDescription>
              Configure permissions for {user.firstName} {user.lastName} ({user.role})
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4 mt-4">
            <div className="space-y-6">
              {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => {
                const allSelected = permissions.every(p => selectedPermissions.includes(p as Permission))
                const someSelected = permissions.some(p => selectedPermissions.includes(p as Permission))

                return (
                  <div key={groupName} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">{groupName}</h4>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSelectAll([...permissions] as Permission[])}
                      >
                        {allSelected ? 'Deselect All' : 'Select All'}
                      </Button>
                    </div>
                    <div className="space-y-2 pl-4">
                      {permissions.map((permission) => (
                        <div key={permission} className="flex items-center space-x-2">
                          <Checkbox
                            id={permission}
                            checked={selectedPermissions.includes(permission as Permission)}
                            onCheckedChange={() => handleTogglePermission(permission as Permission)}
                          />
                          <Label
                            htmlFor={permission}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {PERMISSION_LABELS[permission as Permission]}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updatePermissions.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updatePermissions.isPending}>
              {updatePermissions.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Permissions
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
