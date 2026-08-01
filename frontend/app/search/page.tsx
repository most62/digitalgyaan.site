import { Suspense } from 'react';
import type { Metadata } from 'next';
import { getPosts } from '@/lib/posts';
import { PostCard } from '@/components/post-card';
import { Pagination } from '@/components/pagination';
import { SortSelect } from '@/components/sort-select';
import { SearchBar } from '@/components/search-bar';

interface PageProps {
  searchParams: { q?: string; page?: string; sort?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const q = searchParams.q?.trim();
  return {
    title: q ? `Search results for "${q}"` : 'Search',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const q = searchParams.q?.trim() || '';
  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || 'newest';

  const { posts, meta } = q
    ? await getPosts({ search: q, page, sort, limit: 12 })
    : { posts: [], meta: undefined };

  return (
    <main className="container py-12">
      <header className="mb-8 border-b border-border pb-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Search</h1>
        <div className="mt-5">
          <Suspense fallback={<div className="h-11 w-full max-w-xl animate-pulse rounded-lg bg-muted" />}>
            <SearchBar initialQuery={q} />
          </Suspense>
        </div>
      </header>

      {q ? (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {meta?.totalResults ?? 0} result{meta?.totalResults === 1 ? '' : 's'} for
              <span className="font-medium text-foreground"> &ldquo;{q}&rdquo;</span>
            </p>
            <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />}>
              <SortSelect />
            </Suspense>
          </div>

          {posts.length === 0 ? (
            <p className="text-muted-foreground">
              No articles matched your search. Try a different keyword.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          )}

          {meta && (
            <Pagination
              basePath="/search"
              currentPage={meta.page}
              totalPages={meta.totalPages}
              searchParams={{ q, sort }}
            />
          )}
        </>
      ) : (
        <p className="text-muted-foreground">Start typing to search Digital Gyaan.</p>
      )}
    </main>
  );
}
