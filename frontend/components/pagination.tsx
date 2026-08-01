import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  basePath: string;
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, string | undefined>;
}

function buildHref(
  basePath: string,
  page: number,
  searchParams: Record<string, string | undefined> = {}
): string {
  const usp = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value && key !== 'page') usp.set(key, value);
  });
  usp.set('page', String(page));
  return `${basePath}?${usp.toString()}`;
}

export function Pagination({ basePath, currentPage, totalPages, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  return (
    <nav className="mt-10 flex items-center justify-center gap-2" aria-label="Pagination">
      <Link
        href={buildHref(basePath, currentPage - 1, searchParams)}
        aria-disabled={prevDisabled}
        className={`focus-ring flex h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition-colors ${
          prevDisabled ? 'pointer-events-none opacity-40' : 'hover:bg-accent'
        }`}
      >
        <ChevronLeft className="h-4 w-4" /> Previous
      </Link>
      <span className="px-3 font-mono text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Link
        href={buildHref(basePath, currentPage + 1, searchParams)}
        aria-disabled={nextDisabled}
        className={`focus-ring flex h-10 items-center gap-1 rounded-lg border border-border px-3 text-sm font-medium transition-colors ${
          nextDisabled ? 'pointer-events-none opacity-40' : 'hover:bg-accent'
        }`}
      >
        Next <ChevronRight className="h-4 w-4" />
      </Link>
    </nav>
  );
}
