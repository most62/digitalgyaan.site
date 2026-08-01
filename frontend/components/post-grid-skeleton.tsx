export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading articles">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-border">
          <div className="aspect-[16/10] bg-muted" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-20 rounded bg-muted" />
            <div className="h-5 w-full rounded bg-muted" />
            <div className="h-5 w-2/3 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
