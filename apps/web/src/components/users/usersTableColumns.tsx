import type { User } from '@happyrisk/core';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { DataTableColumnDef } from '@/components/ui/data-table';
import { getInitials } from '@/lib/utils';

import { UserActionsCell } from './UserActionsCell';

export function getUsersTableColumns(): DataTableColumnDef<User>[] {
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
      cell: ({ row }) => <UserActionsCell user={row.original} />,
      enableSorting: false,
    },
  ];
}
