'use client';

import { useEffect, useState } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export function EngagementButtons({
  postId,
  initialLikesCount,
}: {
  postId: string;
  initialLikesCount: number;
}) {
  const { user, accessToken } = useAuth();
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user || !accessToken) return;
    fetch(`${API_URL}/posts/${postId}/engagement`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((body) => {
        if (body.success) {
          setLiked(body.data.liked);
          setBookmarked(body.data.bookmarked);
        }
      })
      .catch(() => {});
  }, [user, accessToken, postId]);

  async function toggle(kind: 'like' | 'bookmark') {
    if (!user || !accessToken) {
      window.location.href = '/login';
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`${API_URL}/posts/${postId}/${kind}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        credentials: 'include',
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);

      if (kind === 'like') {
        setLiked(body.data.liked);
        setLikesCount(body.data.likesCount);
      } else {
        setBookmarked(body.data.bookmarked);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => toggle('like')}
        disabled={busy}
        aria-pressed={liked}
        className={cn(
          'focus-ring flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium transition-colors',
          liked ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
        )}
      >
        <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
        {likesCount}
      </button>
      <button
        type="button"
        onClick={() => toggle('bookmark')}
        disabled={busy}
        aria-pressed={bookmarked}
        aria-label={bookmarked ? 'Remove bookmark' : 'Save for later'}
        className={cn(
          'focus-ring flex h-10 w-10 items-center justify-center rounded-lg border border-border transition-colors',
          bookmarked ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-accent'
        )}
      >
        <Bookmark className={cn('h-4 w-4', bookmarked && 'fill-current')} />
      </button>
    </div>
  );
}
