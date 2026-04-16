'use client';

import { CreateTeamDialog } from '@/components/teams/CreateTeamDialog';
import { TeamsTableColumns } from '@/components/teams/TeamsTableColumns';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTeams } from '@/hooks/useTeams';

export default function TeamsPage() {
  const tableState = useDataTableState({
    defaultSortBy: 'name',
    defaultSortDir: 'asc',
  });

  const { data, isLoading, isError } = useTeams({
    pageIndex: tableState.pageIndex,
    pageSize: tableState.pageSize,
    sortBy: tableState.sortBy,
    sortDir: tableState.sortDir,
  });

  const columns = TeamsTableColumns();

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
        <p className="text-muted-foreground">Failed to load teams. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage teams and their status.</p>
        </div>
        <CreateTeamDialog />
      </div>

      <DataTable
        columns={columns}
        data={data?.items ?? []}
        totalRows={data?.meta.pagination.total ?? 0}
        sorting={tableState.sorting}
        pagination={tableState.pagination}
        onSortingChange={tableState.onSortingChange}
        onPaginationChange={tableState.onPaginationChange}
        emptyMessage="No teams found."
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
          itemName="teams"
          className="mt-4"
        />
      )}
    </div>
  );
}
