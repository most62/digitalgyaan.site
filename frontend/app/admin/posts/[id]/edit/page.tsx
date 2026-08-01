'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { AdminPostFull, getPostForEdit } from '@/lib/admin';
import { PostForm } from '@/components/admin/post-form';

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const { accessToken, isLoading: authLoading } = useAuth();
  const [post, setPost] = useState<AdminPostFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !accessToken) return;
    getPostForEdit(id, accessToken)
      .then(setPost)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load post.'))
      .finally(() => setIsLoading(false));
  }, [id, accessToken, authLoading]);

  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">Edit Post</h1>
      {isLoading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {post && <PostForm postId={id} initial={post} />}
    </div>
  );
}
