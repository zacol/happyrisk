'use client';

import { type TeamCreate, teamCreateSchema } from '@happyrisk/core';

import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { Plus } from 'lucide-react';
import { useState } from 'react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCreateTeam } from '@/hooks/useTeams';

export function CreateTeamDialog() {
  const [open, setOpen] = useState(false);
  const createTeam = useCreateTeam();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamCreate>({
    resolver: standardSchemaResolver(teamCreateSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (data: TeamCreate) => {
    try {
      await createTeam.mutateAsync(data);
      toast.success('Team created successfully');
      reset();
      setOpen(false);
    } catch {
      toast.error('Failed to create team');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger render={<Button />}>
        <Plus className="mr-2 h-4 w-4" />
        Create Team
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Team</DialogTitle>
          <DialogDescription>
            Add a new team to structure users for feedback aggregation.
          </DialogDescription>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTeam.isPending}>
              {createTeam.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
