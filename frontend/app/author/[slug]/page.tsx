import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getAuthorBySlug } from '@/lib/authors';
import { getPosts } from '@/lib/posts';
import { PostCard } from '@/components/post-card';
import { Pagination } from '@/components/pagination';
import { AuthorSocialLinks } from '@/components/author-social-links';

interface PageProps {
  params: { slug: string };
  searchParams: { page?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const data = await getAuthorBySlug(params.slug);
  if (!data) return { title: 'Author not found' };

  return {
    title: data.author.name,
    description: data.author.bio || `Articles by ${data.author.name} on Digital Gyaan.`,
    alternates: { canonical: `/author/${data.author.slug}` },
  };
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
  const data = await getAuthorBySlug(params.slug);
  if (!data) notFound();

  const { author, postsCount } = data;
  const page = Number(searchParams.page) || 1;
  const { posts, meta } = await getPosts({ author: author._id, page, limit: 12, sort: 'newest' });

  return (
    <main className="container py-12">
      <header className="mb-10 flex flex-col items-center gap-4 border-b border-border pb-10 text-center sm:flex-row sm:text-left">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
          {author.avatar && (
            <Image src={author.avatar} alt={author.name} fill className="object-cover" />
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {author.name}
          </h1>
          <p className="mt-1 font-mono text-sm text-muted-foreground">
            {postsCount} article{postsCount === 1 ? '' : 's'} published
          </p>
          {author.bio && <p className="mt-3 max-w-xl text-muted-foreground">{author.bio}</p>}
          <div className="mt-3 flex justify-center sm:justify-start">
            <AuthorSocialLinks socialLinks={author.socialLinks} />
          </div>
        </div>
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">This author hasn&apos;t published any articles yet.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {meta && (
        <Pagination
          basePath={`/author/${author.slug}`}
          currentPage={meta.page}
          totalPages={meta.totalPages}
        />
      )}
    </main>
  );
}
