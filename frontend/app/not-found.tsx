import Link from 'next/link';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
      <SearchX className="h-10 w-10 text-primary" aria-hidden="true" />
      <h1 className="font-display text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or may have been moved.
      </p>
      <Link
        href="/"
        className="focus-ring mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Back to homepage
      </Link>
    </main>
  );
}
