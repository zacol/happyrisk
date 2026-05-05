import { SortMeta } from '@happyrisk/core';

export interface OrderByResult {
  orderBy: Record<string, 'asc' | 'desc'>;
  sortMeta?: SortMeta;
}

export function createOrderBy<T extends string>(
  sortBy: string | undefined,
  sortDir: 'asc' | 'desc' | undefined,
  validFields: readonly T[],
  defaultField: T,
): OrderByResult {
  if (!sortBy) {
    return { orderBy: { [defaultField]: 'desc' } };
  }

  const field = validFields.find((f) => f === sortBy);

  if (!field) {
    return { orderBy: { [defaultField]: 'desc' } };
  }

  const resolvedDir = sortDir ?? 'asc';

  return {
    orderBy: { [field]: resolvedDir },
    sortMeta: { sortBy: field, sortDir: resolvedDir },
  };
}
