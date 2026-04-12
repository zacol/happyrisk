'use client';

import type { Team } from '@happyrisk/core';

import { ArchiveIcon, MoreHorizontal, Pencil } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useArchiveTeam } from '@/hooks/useTeams';

import { RenameTeamDialog } from './RenameTeamDialog';

interface TeamsTableProps {
  teams: Team[];
}

export function TeamsTable({ teams }: TeamsTableProps) {
  const [renameTeam, setRenameTeam] = useState<Team | null>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const archiveTeam = useArchiveTeam();

  const handleArchive = async (team: Team) => {
    if (!team.isActive) return;

    try {
      await archiveTeam.mutateAsync(team.id);
      toast.success(`Team "${team.name}" has been archived`);
    } catch {
      toast.error('Failed to archive team');
    }
  };

  const handleRename = (team: Team) => {
    setRenameTeam(team);
    setRenameOpen(true);
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                  No teams found.
                </TableCell>
              </TableRow>
            ) : (
              teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>
                    <Badge variant={team.isActive ? 'outline' : 'secondary'}>
                      {team.isActive ? 'Active' : 'Archived'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon" />}>
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRename(team)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => {
                            void handleArchive(team);
                          }}
                          disabled={!team.isActive}
                        >
                          <ArchiveIcon className="mr-2 h-4 w-4" />
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RenameTeamDialog team={renameTeam} open={renameOpen} onOpenChange={setRenameOpen} />
    </>
  );
}
