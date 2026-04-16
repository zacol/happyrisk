'use client';

import type { Team } from '@happyrisk/core';

import { ArchiveIcon, MoreHorizontal, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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
import { useArchiveTeam } from '@/hooks/useTeams';

import { RenameTeamDialog } from './RenameTeamDialog';

export function TeamsTableColumns(): DataTableColumnDef<Team>[] {
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
      cell: ({ row }) => {
        const team = row.original;

        return <TeamActions team={team} />;
      },
      enableSorting: false,
    },
  ];
}

function TeamActions({ team }: { team: Team }) {
  const [renameOpen, setRenameOpen] = useState(false);
  const archiveTeam = useArchiveTeam();

  const handleArchive = async () => {
    if (!team.isActive) return;

    try {
      await archiveTeam.mutateAsync(team.id);
      toast.success(`Team "${team.name}" has been archived`);
    } catch {
      toast.error('Failed to archive team');
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
          <DropdownMenuItem onClick={() => setRenameOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void handleArchive();
            }}
            disabled={!team.isActive}
          >
            <ArchiveIcon className="mr-2 h-4 w-4" />
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameTeamDialog team={team} open={renameOpen} onOpenChange={setRenameOpen} />
    </>
  );
}
