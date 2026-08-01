import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTagBySlug } from '@/lib/taxonomy';
import { getPosts } from '@/lib/posts';
import { PostCard } from '@/components/post-card';
import { Pagination } from '@/components/pagination';
import { SortSelect } from '@/components/sort-select';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string; sort?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const tag = await getTagBySlug(params.slug);
  if (!tag) return { title: 'Tag not found' };

  return {
    title: `#${tag.name}`,
    description: `Articles tagged with ${tag.name} on Digital Gyaan.`,
    alternates: { canonical: `/tag/${tag.slug}` },
  };
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const tag = await getTagBySlug(params.slug);
  if (!tag) notFound();

  const page = Number(searchParams.page) || 1;
  const sort = searchParams.sort || 'newest';

  const { posts, meta } = await getPosts({ tag: tag._id, page, sort, limit: 12 });

  return (
    <main className="container py-12">
      <header className="mb-8 border-b border-border pb-8">
        <p className="font-mono text-sm text-muted-foreground">Tag</p>
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          #{tag.name}
        </h1>
      </header>

      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta?.totalResults ?? 0} article{meta?.totalResults === 1 ? '' : 's'}
        </p>
        <Suspense fallback={<div className="h-10 w-32 animate-pulse rounded-lg bg-muted" />}>
          <SortSelect />
        </Suspense>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No articles with this tag yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {meta && (
        <Pagination
          basePath={`/tag/${tag.slug}`}
          currentPage={meta.page}
          totalPages={meta.totalPages}
          searchParams={{ sort }}
        />
      )}
    </main>
  );
}
