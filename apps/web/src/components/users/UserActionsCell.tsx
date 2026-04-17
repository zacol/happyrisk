'use client';

import type { User } from '@happyrisk/core';

import { MoreHorizontal, Pencil, UserX } from 'lucide-react';
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
import { useDeactivateUser } from '@/hooks/useUsers';

import { EditUserDialog } from './EditUserDialog';

export function UserActionsCell({ user }: { user: User }) {
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
