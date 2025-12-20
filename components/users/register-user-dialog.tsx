'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@ui/components/dialog'
import { Button } from '@ui/components/button'
import { Input } from '@ui/components/input'
import { Label } from '@ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/components/select'
import { useRegisterUser } from '@/hooks/queries/use-users'
import type { RegisterUserDto, Role } from '@/types/users'
import { Loader2 } from 'lucide-react'

interface RegisterUserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RegisterUserDialog({ open, onOpenChange }: RegisterUserDialogProps) {
  const [formData, setFormData] = useState<RegisterUserDto>({
    email: '',
    firstName: '',
    lastName: '',
    role: 'staff',
    phone: ''
  })

  const registerUser = useRegisterUser()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await registerUser.mutateAsync(formData)
      onOpenChange(false)
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        role: 'staff',
        phone: ''
      })
    } catch (error) {
      // Error is handled by the mutation
    }
  }

  const handleChange = (field: keyof RegisterUserDto, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register New User</DialogTitle>
            <DialogDescription>
              Enter the user&apos;s email and basic information. A temporary password will be sent to their email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone || ''}
                onChange={(e) => handleChange('phone', e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleChange('role', value as Role)}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Default permissions will be assigned based on the role
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={registerUser.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={registerUser.isPending}>
              {registerUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Register User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
