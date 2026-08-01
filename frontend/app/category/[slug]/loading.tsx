import { PostGridSkeleton } from '@/components/post-grid-skeleton';

export default function Loading() {
  return (
    <main className="container py-12">
      <div className="mb-8 h-20 animate-pulse rounded bg-muted" />
      <PostGridSkeleton />
    </main>
  );
}
