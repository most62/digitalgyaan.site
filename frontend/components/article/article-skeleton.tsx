export function ArticleSkeleton() {
  return (
    <div className="container py-10" aria-busy="true" aria-label="Loading article">
      <div className="mb-6 h-4 w-40 animate-pulse rounded bg-muted" />
      <div className="grid gap-10 lg:grid-cols-[1fr,280px]">
        <div className="min-w-0 animate-pulse">
          <div className="h-9 w-3/4 rounded bg-muted" />
          <div className="mt-3 h-9 w-1/2 rounded bg-muted" />
          <div className="mt-6 flex gap-4">
            <div className="h-8 w-8 rounded-full bg-muted" />
            <div className="h-4 w-24 rounded bg-muted" />
          </div>
          <div className="mt-8 aspect-[16/9] rounded-xl bg-muted" />
          <div className="mt-8 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full rounded bg-muted" />
            ))}
          </div>
        </div>
        <div className="hidden animate-pulse lg:block">
          <div className="h-64 rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}
