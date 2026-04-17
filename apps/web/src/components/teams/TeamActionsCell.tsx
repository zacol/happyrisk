'use client';

import type { Team } from '@happyrisk/core';

import { ArchiveIcon, MoreHorizontal, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useArchiveTeam } from '@/hooks/useTeams';

import { RenameTeamDialog } from './RenameTeamDialog';

export function TeamActionsCell({ team }: { team: Team }) {
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
