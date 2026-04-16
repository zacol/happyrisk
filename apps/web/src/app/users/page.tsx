'use client';

import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { CreateUserDialog } from '@/components/users/CreateUserDialog';
import { UsersTableColumns } from '@/components/users/UsersTableColumns';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useUsers } from '@/hooks/useUsers';

export default function UsersPage() {
  const tableState = useDataTableState({
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
  });

  const { data, isLoading, isError } = useUsers({
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    sortBy: tableState.sortBy,
    sortDir: tableState.sortDir,
  });

  const columns = UsersTableColumns();

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

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        totalRows={data?.meta.pagination.total ?? 0}
        sorting={tableState.sorting}
        pagination={tableState.pagination}
        onSortingChange={tableState.onSortingChange}
        onPaginationChange={tableState.onPaginationChange}
        emptyMessage="No users found."
      />

      {data && (
        <Pagination
          pageIndex={tableState.pageIndex}
          pageSize={tableState.pageSize}
          total={data.meta.pagination.total}
          onPageChange={(newPage) =>
            tableState.onPaginationChange((old) => ({ ...old, pageIndex: newPage }))
          }
          onPageSizeChange={(newSize) =>
            tableState.onPaginationChange((old) => ({ ...old, pageSize: newSize, pageIndex: 0 }))
          }
          itemName="users"
          className="mt-4"
        />
      )}
    </div>
  );
}
