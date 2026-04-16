import { z } from 'zod';

// ─────────────────────────────────────────────
// Pagination Query
// ─────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  pageIndex: z.coerce.number().int().min(0).default(0),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const sortDirectionSchema = z.enum(['asc', 'desc']).default('asc');

export const sortingQuerySchema = z.object({
  sortBy: z.string().optional(),
  sortDir: sortDirectionSchema,
});

export const listQuerySchema = paginationQuerySchema.merge(sortingQuerySchema);

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type SortDirection = z.infer<typeof sortDirectionSchema>;
export type SortingQuery = z.infer<typeof sortingQuerySchema>;
export type ListQuery = z.infer<typeof listQuerySchema>;
