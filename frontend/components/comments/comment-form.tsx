'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

export function CommentForm({
  onSubmit,
  onCancel,
  placeholder = 'Share your thoughts…',
  submitLabel = 'Post Comment',
  autoFocus = false,
}: {
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  autoFocus?: boolean;
}) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setError('');
    try {
      await onSubmit(content.trim());
      setContent('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
        <a href="/login" className="focus-ring font-medium text-primary hover:underline">
          Log in
        </a>{' '}
        to join the discussion.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        rows={3}
        maxLength={2000}
        className="focus-ring w-full resize-none rounded-lg border border-border bg-surface p-3 text-sm"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="focus-ring h-9 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Posting…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring h-9 rounded-lg px-4 text-sm font-medium text-muted-foreground hover:bg-accent"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
