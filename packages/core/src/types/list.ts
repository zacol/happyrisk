export interface PaginationMeta {
  pageIndex: number;
  pageSize: number;
  total: number;
}

export interface SortMeta {
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export type SortingState = {
  sortBy?: string;
  sortDir: 'asc' | 'desc';
};

export interface ListResponseMeta {
  pagination: PaginationMeta;
  sort?: SortMeta;
}

export interface ListResponse<T> {
  meta: ListResponseMeta;
  items: T[];
}
