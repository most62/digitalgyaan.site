import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ChevronRight, ArrowLeft, ArrowRight, Clock, Eye } from 'lucide-react';
import { getPostBySlug } from '@/lib/posts';
import { fetchComments } from '@/lib/comments';
import { processArticleContent } from '@/lib/content';
import { PostCard } from '@/components/post-card';
import { ArticleContent } from '@/components/article/article-content';
import { TableOfContents } from '@/components/article/table-of-contents';
import { EngagementButtons } from '@/components/article/engagement-buttons';
import { ShareButtons } from '@/components/article/share-buttons';
import { FaqSection } from '@/components/article/faq-section';
import { CommentsSection } from '@/components/comments/comments-section';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://digitalgyaan.site';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPostBySlug(slug);
  if (!data) return { title: 'Article not found' };
  const { post } = data;

  const ogImage = post.seo.ogImage || post.featuredImage;

  return {
    title: post.seo.metaTitle || post.title,
    description: post.seo.metaDescription || post.excerpt,
    alternates: { canonical: post.seo.canonicalUrl || `/${post.slug}` },
    openGraph: {
      type: 'article',
      title: post.seo.metaTitle || post.title,
      description: post.seo.metaDescription || post.excerpt,
      images: ogImage ? [{ url: ogImage }] : undefined,
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.seo.metaTitle || post.title,
      description: post.seo.metaDescription || post.excerpt,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const data = await getPostBySlug(slug);
  if (!data) notFound();

  const { post, relatedPosts, prevPost, nextPost } = data;
  const [{ html, toc }, comments] = await Promise.all([
    processArticleContent(post.content),
    fetchComments(post._id).catch(() => []),
  ]);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImage,
    datePublished: post.publishedAt,
    author: { '@type': 'Person', name: post.author.name },
    publisher: { '@type': 'Organization', name: 'Digital Gyaan' },
    mainEntityOfPage: `${SITE_URL}/${post.slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: post.category.name,
        item: `${SITE_URL}/category/${post.category.slug}`,
      },
      { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/${post.slug}` },
    ],
  };

  return (
    <main className="container py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="focus-ring hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/category/${post.category.slug}`} className="focus-ring hover:text-foreground">
          {post.category.name}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr,280px]">
        <article className="min-w-0">
          <header>
            <h1 className="font-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
              {post.title}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <Link href={`/author/${post.author.slug}`} className="focus-ring flex items-center gap-2 hover:text-foreground">
                <span className="relative h-8 w-8 overflow-hidden rounded-full bg-muted">
                  {post.author.avatar && (
                    <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
                  )}
                </span>
                <span className="font-medium">{post.author.name}</span>
              </Link>
              <span className="flex items-center gap-1 font-mono text-xs">
                <Clock className="h-3.5 w-3.5" /> {post.readingTime} min read
              </span>
              <span className="flex items-center gap-1 font-mono text-xs">
                <Eye className="h-3.5 w-3.5" /> {post.viewsCount} views
              </span>
              <time dateTime={post.publishedAt} className="font-mono text-xs">
                {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          </header>

          <div className="relative my-8 aspect-[16/9] overflow-hidden rounded-xl">
            <Image src={post.featuredImage} alt={post.title} fill priority className="object-cover" />
          </div>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
            <EngagementButtons postId={post._id} initialLikesCount={post.likesCount} />
            <ShareButtons postId={post._id} title={post.title} />
          </div>

          <ArticleContent html={html} />

          {post.tags.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tag/${tag.slug}`}
                  className="focus-ring rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          <FaqSection faqs={post.faqs} />

          {/* Prev / Next */}
          <div className="mt-12 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
            {prevPost ? (
              <Link
                href={`/${prevPost.slug}`}
                className="focus-ring group rounded-xl border border-border p-4 transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </span>
                <p className="mt-1 line-clamp-2 font-medium group-hover:text-primary">
                  {prevPost.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {nextPost && (
              <Link
                href={`/${nextPost.slug}`}
                className="focus-ring group rounded-xl border border-border p-4 text-right transition-colors hover:bg-accent"
              >
                <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </span>
                <p className="mt-1 line-clamp-2 font-medium group-hover:text-primary">
                  {nextPost.title}
                </p>
              </Link>
            )}
          </div>

          <CommentsSection postId={post._id} initialComments={comments} initialCount={post.commentsCount} />
        </article>

        <aside className="hidden lg:block">
          <TableOfContents toc={toc} />
        </aside>
      </div>

      {relatedPosts.length > 0 && (
        <section className="mt-16 border-t border-border pt-10">
          <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">Related Articles</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedPosts.map((related) => (
              <PostCard key={related._id} post={related} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
