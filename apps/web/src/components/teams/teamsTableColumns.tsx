import type { Team } from '@happyrisk/core';

import { Badge } from '@/components/ui/badge';
import type { DataTableColumnDef } from '@/components/ui/data-table';

import { TeamActionsCell } from './TeamActionsCell';

export function getTeamsTableColumns(): DataTableColumnDef<Team>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => {
        const name = row.getValue<string>('name');

        return <span className="font-medium">{name}</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => {
        const isActive = row.getValue<boolean>('isActive');

        return (
          <Badge variant={isActive ? 'outline' : 'secondary'}>
            {isActive ? 'Active' : 'Archived'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      fitToContent: true,
      cell: ({ row }) => <TeamActionsCell team={row.original} />,
      enableSorting: false,
    },
  ];
}
