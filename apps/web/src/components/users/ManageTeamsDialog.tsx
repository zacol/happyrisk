'use client';

import type { User } from '@happyrisk/core';

import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAddTeamMember, useRemoveTeamMember, useTeams, useUserTeams } from '@/hooks/useTeams';

interface ManageTeamsDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageTeamsDialog({ user, open, onOpenChange }: ManageTeamsDialogProps) {
  const anchor = useComboboxAnchor();

  const { data: allTeams, isLoading: teamsLoading } = useTeams({ enabled: open && !!user });
  const { data: userTeams, isLoading: membershipsLoading } = useUserTeams(user?.id ?? '', {
    enabled: open && !!user,
  });
  const addMember = useAddTeamMember(user?.id ?? '');
  const removeMember = useRemoveTeamMember(user?.id ?? '');

  const currentTeamIds = useMemo(() => userTeams?.map((m) => m.teamId) ?? [], [userTeams]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setSelectedIds(currentTeamIds);
  }, [currentTeamIds]);

  if (!user) return null;

  const activeTeams = allTeams?.filter((t) => t.isActive) ?? [];
  const isLoading = teamsLoading || membershipsLoading;
  const isMutating = addMember.isPending || removeMember.isPending;

  const handleValueChange = (newIds: string[]) => {
    const prevIds = selectedIds;

    setSelectedIds(newIds);

    if (newIds.length > prevIds.length) {
      const added = newIds.find((id) => !prevIds.includes(id));

      if (added) {
        addMember.mutate(
          { teamId: added, userId: user.id },
          {
            onSuccess: () => toast.success('Added to team'),
            onError: () => {
              setSelectedIds(prevIds);
              toast.error('Failed to add to team');
            },
          },
        );
      }
    } else {
      const removed = prevIds.find((id) => !newIds.includes(id));

      if (removed) {
        removeMember.mutate(
          { teamId: removed, userId: user.id },
          {
            onSuccess: () => toast.success('Removed from team'),
            onError: () => {
              setSelectedIds(prevIds);
              toast.error('Failed to remove from team');
            },
          },
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Manage Teams</DialogTitle>
          <DialogDescription>
            Assign or unassign <strong>{user.email}</strong> from teams.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Combobox multiple value={selectedIds} onValueChange={handleValueChange}>
              <ComboboxChips ref={anchor}>
                {selectedIds.map((id) => {
                  const team = allTeams?.find((t) => t.id === id);

                  return <ComboboxChip key={id}>{team?.name ?? id}</ComboboxChip>;
                })}
                <ComboboxChipsInput placeholder="Search teams..." disabled={isMutating} />
              </ComboboxChips>
              <ComboboxContent anchor={anchor}>
                <ComboboxList>
                  {activeTeams.map((team) => (
                    <ComboboxItem key={team.id} value={team.id}>
                      {team.name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
                <ComboboxEmpty>No teams found.</ComboboxEmpty>
              </ComboboxContent>
            </Combobox>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
