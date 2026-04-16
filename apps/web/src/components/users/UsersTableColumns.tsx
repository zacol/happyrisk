'use client';

import type { User } from '@happyrisk/core';

import { MoreHorizontal, Pencil, UserX } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { DataTableColumnDef } from '@/components/ui/data-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDeactivateUser } from '@/hooks/useUsers';
import { getInitials } from '@/lib/utils';

import { EditUserDialog } from './EditUserDialog';

export function UsersTableColumns(): DataTableColumnDef<User>[] {
  return [
    {
      id: 'avatar',
      header: '',
      fitToContent: true,
      cell: ({ row }) => {
        const user = row.original;

        return (
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? user.email} />
            <AvatarFallback className="text-xs">
              {getInitials(user.name, user.email)}
            </AvatarFallback>
          </Avatar>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const name = row.getValue<string | null>('name');

        return name || <span className="text-muted-foreground">—</span>;
      },
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        const role = row.getValue<string>('role');

        return <Badge variant={role === 'ADMIN' ? 'default' : 'secondary'}>{role}</Badge>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue<boolean>('isActive');

        return (
          <Badge variant={isActive ? 'outline' : 'destructive'}>
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      fitToContent: true,
      cell: ({ row }) => {
        const user = row.original;

        return <UserActions user={user} />;
      },
      enableSorting: false,
    },
  ];
}

function UserActions({ user }: { user: User }) {
  const [editOpen, setEditOpen] = useState(false);
  const deactivateUser = useDeactivateUser();

  const handleDeactivate = async () => {
    if (user.isActive === false) return;

    try {
      await deactivateUser.mutateAsync(user.id);
      toast.success(`User ${user.email} has been deactivated`);
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void handleDeactivate();
            }}
            disabled={!user.isActive}
          >
            <UserX className="mr-2 h-4 w-4" />
            Deactivate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog user={user} open={editOpen} onOpenChange={setEditOpen} />
    </>
  );
}
