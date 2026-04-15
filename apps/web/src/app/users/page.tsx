'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { Pagination } from '@/components/ui/pagination';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { UsersTable } from '@/components/users/UsersTable';
import { useUsers } from '@/hooks/useUsers';

export default function UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page')) || 1;

  const { data, isLoading, isError } = useUsers({ page });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set('page', String(newPage));
    router.replace(`?${params.toString()}`);
  };

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
      <UsersTable users={data?.items ?? []} />
      {data && (
        <Pagination
          page={page}
          totalPages={data.meta.pagination.totalPages}
          onPageChange={handlePageChange}
          className="mt-4"
        />
      )}
    </div>
  );
}
