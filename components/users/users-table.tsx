'use client'

import { useState } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { BaseDataTable } from '@ui/components/dataTable/base-data-table '
import { Badge } from '@ui/components/badge'
import { Button } from '@ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@ui/components/dropdown-menu'
import { MoreHorizontal, Shield, UserCog, Trash2, Power } from 'lucide-react'
import type { User } from '@/types/users'
import { format } from 'date-fns'
import { ManagePermissionsDialog } from './manage-permissions-dialog'
import { useToggleUserStatus, useDeleteUser } from '@/hooks/queries/use-users'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@ui/components/alert-dialog'

interface UsersTableProps {
  users: User[]
  isLoading: boolean
}

export function UsersTable({ users, isLoading }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  
  const toggleStatus = useToggleUserStatus()
  const deleteUser = useDeleteUser()

  const handleManagePermissions = (user: User) => {
    setSelectedUser(user)
    setPermissionsDialogOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (selectedUser) {
      await deleteUser.mutateAsync(selectedUser._id)
      setDeleteDialogOpen(false)
      setSelectedUser(null)
    }
  }

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => {
        const user = row.original
        return (
          <div>
            <div className="font-medium">
              {user.firstName} {user.lastName}
            </div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.original.role
        const roleColors = {
          admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          staff: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        }
        return (
          <Badge className={roleColors[role]} variant="outline">
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.original.status
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => {
        return (
          <span className="text-sm text-muted-foreground">
            {format(new Date(row.original.createdAt), 'MMM dd, yyyy')}
          </span>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {/* <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                <UserCog className="mr-2 h-4 w-4" />
                Manage Permissions
              </DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => toggleStatus.mutate(user._id)}>
                <Power className="mr-2 h-4 w-4" />
                {user.status ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDeleteUser(user)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <>
      <BaseDataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
      />

      <ManagePermissionsDialog
        user={selectedUser}
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user account for{' '}
              <span className="font-semibold">
                {selectedUser?.firstName} {selectedUser?.lastName}
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
