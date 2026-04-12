'use client';

import { type Team, type TeamUpdate, teamUpdateSchema } from '@happyrisk/core';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateTeam } from '@/hooks/useTeams';

interface RenameTeamDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RenameTeamDialog({ team, open, onOpenChange }: RenameTeamDialogProps) {
  console.log('team', team);
  const updateTeam = useUpdateTeam();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamUpdate>({
    resolver: standardSchemaResolver(teamUpdateSchema),
    defaultValues: { name: team?.name ?? '' },
  });

  useEffect(() => {
    if (!open) return;

    if (team) {
      reset({ name: team.name });
    }
  }, [open, team, reset]);

  const onSubmit = async (data: TeamUpdate) => {
    if (!team) return;

    try {
      await updateTeam.mutateAsync({ id: team.id, ...data });
      toast.success('Team renamed successfully');
      onOpenChange(false);
    } catch {
      toast.error('Failed to rename team');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Team</DialogTitle>
          <DialogDescription>Update the name for this team.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            void handleSubmit(onSubmit)(e);
          }}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="e.g. Frontend" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTeam.isPending}>
              {updateTeam.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
