import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getPosts, getFeaturedPosts } from '@/lib/posts';
import { getCategories } from '@/lib/taxonomy';
import { PostCard } from '@/components/post-card';
import { Badge } from '@/components/ui/badge';

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    getFeaturedPosts(),
    getPosts({ sort: 'newest', limit: 9 }),
    getCategories(),
  ]);

  const hero = featured[0];
  const restFeatured = featured.slice(1, 4);

  return (
    <main>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="container py-14 sm:py-20">
          {hero ? (
            <div className="grid gap-8 lg:grid-cols-[1.2fr,1fr] lg:items-center">
              <div>
                <Badge variant="live">Featured</Badge>
                <Link href={`/${hero.slug}`} className="focus-ring">
                  <h1 className="mt-4 font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
                    {hero.title}
                  </h1>
                </Link>
                <p className="mt-4 max-w-xl text-muted-foreground">{hero.excerpt}</p>
                <Link
                  href={`/${hero.slug}`}
                  className="focus-ring mt-6 inline-flex items-center gap-2 font-medium text-primary hover:underline"
                >
                  Read the full story <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-4">
                {restFeatured.map((post) => (
                  <Link
                    key={post._id}
                    href={`/${post.slug}`}
                    className="focus-ring group flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
                  >
                    <span className="font-mono text-xs text-muted-foreground">
                      {post.category.name}
                    </span>
                    <span className="line-clamp-1 font-medium group-hover:text-primary">
                      {post.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h1 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
                Digital Gyaan
              </h1>
              <p className="mt-4 max-w-2xl text-muted-foreground">
                Tech guides, Android app reviews, gadget reviews, and digital
                updates for Indian users.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Category chips */}
      {categories.length > 0 && (
        <section className="border-b border-border">
          <div className="container flex flex-wrap gap-2 py-5">
            {categories.map((cat) => (
              <Link key={cat._id} href={`/category/${cat.slug}`} className="focus-ring">
                <Badge variant="outline">{cat.name} · {cat.postCount}</Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest */}
      <section className="container py-14">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold tracking-tight">Latest Articles</h2>
          <Link href="/search" className="focus-ring text-sm font-medium text-primary hover:underline">
            View all
          </Link>
        </div>
        {latest.posts.length === 0 ? (
          <p className="text-muted-foreground">
            No articles yet — publish from the admin panel to populate this feed.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {latest.posts.map((post, i) => (
              <PostCard key={post._id} post={post} priority={i < 3} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
