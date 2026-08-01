import { PostGridSkeleton } from '@/components/post-grid-skeleton';

export default function Loading() {
  return (
    <main className="container py-12">
      <div className="mb-10 h-32 animate-pulse rounded-xl bg-muted" />
      <PostGridSkeleton />
    </main>
  );
}
