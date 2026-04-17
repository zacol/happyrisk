'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;

interface PaginationProps {
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  itemName?: string;
  className?: string;
}

function Pagination({
  pageIndex,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemName = 'items',
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const safePageIndex = Math.max(0, Math.min(pageIndex, totalPages - 1));
  const startItem = total === 0 ? 0 : safePageIndex * pageSize + 1;
  const endItem = Math.min((safePageIndex + 1) * pageSize, total);

  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="text-sm text-muted-foreground">
        Showing {startItem}-{endItem} of {total} {itemName}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <nav role="navigation" aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            disabled={safePageIndex <= 0}
            onClick={() => onPageChange(safePageIndex - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={safePageIndex >= totalPages - 1}
            onClick={() => onPageChange(safePageIndex + 1)}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </nav>
      </div>
    </div>
  );
}

export { Pagination };
