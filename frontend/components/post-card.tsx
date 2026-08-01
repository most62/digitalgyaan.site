import Image from 'next/image';
import Link from 'next/link';
import { Clock, Eye } from 'lucide-react';
import type { PostSummary } from '@/types/post';
import { Badge } from './ui/badge';

export function PostCard({ post, priority = false }: { post: PostSummary; priority?: boolean }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-lg">
      <Link href={`/${post.slug}`} className="focus-ring relative block aspect-[16/10] overflow-hidden">
        <Image
          src={post.featuredImage}
          alt={post.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/category/${post.category.slug}`} className="focus-ring w-fit">
          <Badge>{post.category.name}</Badge>
        </Link>
        <Link href={`/${post.slug}`} className="focus-ring">
          <h3 className="line-clamp-2 font-display text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
            {post.title}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-muted-foreground">
          <Link href={`/author/${post.author.slug}`} className="focus-ring font-medium hover:text-foreground">
            {post.author.name}
          </Link>
          <div className="flex items-center gap-3 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {post.readingTime} min
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {post.viewsCount}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
