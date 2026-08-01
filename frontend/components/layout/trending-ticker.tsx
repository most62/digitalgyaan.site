import Link from 'next/link';
import { getTrendingPosts } from '@/lib/posts';

export async function TrendingTicker() {
  const posts = await getTrendingPosts();
  if (posts.length === 0) return null;

  // Duplicate the list so the CSS animation can loop seamlessly at -50%.
  const items = [...posts, ...posts];

  return (
    <div className="flex items-center border-b border-border bg-live text-live-foreground">
      <span className="z-10 flex shrink-0 items-center gap-1.5 bg-live px-3 py-1.5 font-display text-xs font-bold uppercase tracking-wider">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-live-foreground" />
        Trending
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-ticker gap-10 py-1.5 pl-6 hover:[animation-play-state:paused]">
          {items.map((post, i) => (
            <Link
              key={`${post._id}-${i}`}
              href={`/${post.slug}`}
              className="focus-ring shrink-0 whitespace-nowrap text-sm font-medium hover:underline"
            >
              {post.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
