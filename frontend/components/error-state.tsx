'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

export function ErrorState({
  error,
  reset,
  title = 'Something went wrong',
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  return (
    <main className="container flex flex-col items-center justify-center gap-4 py-24 text-center">
      <AlertTriangle className="h-10 w-10 text-primary" aria-hidden="true" />
      <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {error.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        type="button"
        onClick={reset}
        className="focus-ring mt-2 flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <RotateCcw className="h-4 w-4" /> Try again
      </button>
    </main>
  );
}
