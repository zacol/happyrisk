'use client';

import { useUsers } from '@/hooks/useUsers';
import { UsersTable } from '@/components/users/UsersTable';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';

export default function UsersPage() {
  const { data: users, isLoading, isError } = useUsers();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-muted-foreground">Failed to load users. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Manage user accounts and roles.</p>
        </div>
        <CreateUserDialog />
      </div>
      <UsersTable users={users ?? []} />
    </div>
  );
}
