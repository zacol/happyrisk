'use client';

import { DEFAULT_PAGE_SIZE, DEFAULT_SORT_BY, DEFAULT_SORT_DIR } from '@happyrisk/core';

import type { PaginationState, SortingState, Updater } from '@tanstack/react-table';
import {
  parseAsIndex,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from 'nuqs';
import { useMemo } from 'react';

function applyUpdater<T>(updater: Updater<T>, old: T): T {
  return typeof updater === 'function' ? (updater as (old: T) => T)(old) : updater;
}

type UseDataTableStateOptions = {
  defaultPageSize?: number;
  defaultSortBy?: string;
  defaultSortDir?: 'asc' | 'desc';
};

export function useDataTableState({
  defaultPageSize = DEFAULT_PAGE_SIZE,
  defaultSortBy = DEFAULT_SORT_BY,
  defaultSortDir = DEFAULT_SORT_DIR,
}: UseDataTableStateOptions = {}) {
  const [{ pageIndex, pageSize, sortBy, sortDir }, setQuery] = useQueryStates(
    {
      pageIndex: parseAsIndex.withDefault(0),
      pageSize: parseAsInteger.withDefault(defaultPageSize),
      sortBy: parseAsString.withDefault(defaultSortBy),
      sortDir: parseAsStringLiteral(['asc', 'desc']).withDefault(defaultSortDir),
    },
    { shallow: false, history: 'push' },
  );

  const sorting = useMemo<SortingState>(() => {
    if (!sortBy) return [];

    return [{ id: sortBy, desc: sortDir === 'desc' }];
  }, [sortBy, sortDir]);

  const pagination = useMemo<PaginationState>(() => {
    return {
      pageIndex,
      pageSize,
    };
  }, [pageIndex, pageSize]);

  const onSortingChange = (updater: Updater<SortingState>) => {
    const next = applyUpdater(updater, sorting);
    const first = next[0];

    void setQuery({
      pageIndex: 0,
      sortBy: first?.id ?? null,
      sortDir: first ? (first.desc ? 'desc' : 'asc') : null,
    });
  };

  const onPaginationChange = (updater: Updater<PaginationState>) => {
    const next = applyUpdater(updater, pagination);

    void setQuery({
      pageIndex: next.pageIndex,
      pageSize: next.pageSize,
    });
  };

  return {
    sorting,
    pagination,
    onSortingChange,
    onPaginationChange,
    pageIndex,
    pageSize,
    sortBy,
    sortDir,
  };
}
