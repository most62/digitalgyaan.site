'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AdminPostListItem, deletePost, getAdminPosts } from '@/lib/admin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const STATUS_FILTERS = ['all', 'draft', 'scheduled', 'published', 'archived'] as const;

export default function AdminDashboardPage() {
  const { accessToken } = useAuth();
  const [posts, setPosts] = useState<AdminPostListItem[]>([]);
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminPosts(accessToken, {
        page,
        status: status === 'all' ? undefined : status,
      });
      setPosts(res.data);
      setTotalPages(res.meta?.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load posts.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, page, status]);

  useEffect(() => {
    if (accessToken) load();
  }, [accessToken, load]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deletePost(id, accessToken);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post.');
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Posts</h1>
        <Link href="/admin/posts/new">
          <Button>New Post</Button>
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            className={`focus-ring rounded-full px-3 py-1 text-sm capitalize ${
              status === s ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No posts yet.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post._id} className="border-b border-border last:border-0">
                  <td className="max-w-xs truncate px-4 py-3 font-medium">{post.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{post.category?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={post.status === 'published' ? 'live' : 'outline'}>
                      {post.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(post.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/posts/${post._id}/edit`}
                      className="focus-ring mr-3 text-secondary hover:underline"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(post._id, post.title)}
                      className="focus-ring text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="focus-ring rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="focus-ring rounded-md border border-border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
