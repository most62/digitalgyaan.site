import { PostGridSkeleton } from '@/components/post-grid-skeleton';

export default function Loading() {
  return (
    <main className="container py-14">
      <div className="mb-8 h-10 w-1/3 animate-pulse rounded bg-muted" />
      <PostGridSkeleton count={9} />
    </main>
  );
}
