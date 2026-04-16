'use client';

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type PaginationState,
  type SortingState,
  type Updater,
  useReactTable,
} from '@tanstack/react-table';
import type { CSSProperties } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataTableColumnDef<T> = ColumnDef<T> & {
  fitToContent?: boolean;
};

type DataTableProps<T> = {
  columns: DataTableColumnDef<T>[];
  data: T[];
  totalRows: number;
  sorting: SortingState;
  pagination: PaginationState;
  onSortingChange: (updater: Updater<SortingState>) => void;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  emptyMessage?: string;
};

export function DataTable<T>({
  columns,
  data,
  totalRows,
  sorting,
  pagination,
  onSortingChange,
  onPaginationChange,
  emptyMessage = 'No results found.',
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    manualSorting: true,
    manualPagination: true,
    enableSortingRemoval: false,
    rowCount: totalRows,
    state: {
      sorting,
      pagination,
    },
    onSortingChange,
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    'h-11 px-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground',
                    header.column.getCanSort() && 'cursor-pointer select-none',
                  )}
                  style={
                    (header.column.columnDef as DataTableColumnDef<T>).fitToContent
                      ? ({ width: '1px' } as CSSProperties)
                      : undefined
                  }
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && (
                      <span className="text-muted-foreground">↑</span>
                    )}
                    {header.column.getIsSorted() === 'desc' && (
                      <span className="text-muted-foreground">↓</span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-32 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className="border-b border-border transition-colors hover:bg-muted/50"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className="px-4 py-3"
                    style={
                      (cell.column.columnDef as DataTableColumnDef<T>).fitToContent
                        ? ({ width: '1px' } as CSSProperties)
                        : undefined
                    }
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
