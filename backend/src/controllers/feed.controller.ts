import { Request, Response } from 'express';
import RSS from 'rss';
import { catchAsync } from '../utils/catchAsync';
import { Post } from '../models/Post';
import { Category } from '../models/Category';
import { env } from '../config/env';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const getSitemap = catchAsync(async (_req: Request, res: Response) => {
  const [posts, categories] = await Promise.all([
    Post.find({ status: 'published' }).select('slug updatedAt').lean(),
    Category.find().select('slug').lean(),
  ]);

  const staticUrls = [
    { loc: '/', priority: '1.0' },
    { loc: '/about-us', priority: '0.5' },
    { loc: '/contact-us', priority: '0.5' },
    { loc: '/privacy-policy', priority: '0.3' },
    { loc: '/terms', priority: '0.3' },
  ];

  const urlEntries = [
    ...staticUrls.map(
      (u) =>
        `<url><loc>${escapeXml(env.site.url + u.loc)}</loc><priority>${u.priority}</priority></url>`
    ),
    ...categories.map(
      (c) =>
        `<url><loc>${escapeXml(`${env.site.url}/category/${c.slug}`)}</loc><priority>0.7</priority></url>`
    ),
    ...posts.map(
      (p) =>
        `<url><loc>${escapeXml(`${env.site.url}/${p.slug}`)}</loc><lastmod>${new Date(
          p.updatedAt
        ).toISOString()}</lastmod><priority>0.8</priority></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

  res.header('Content-Type', 'application/xml');
  res.status(200).send(xml);
});

export const getRobotsTxt = catchAsync(async (_req: Request, res: Response) => {
  const txt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${env.site.url}/sitemap.xml
`;
  res.header('Content-Type', 'text/plain');
  res.status(200).send(txt);
});

export const getRssFeed = catchAsync(async (_req: Request, res: Response) => {
  const feed = new RSS({
    title: env.site.name,
    description:
      'Technology guides, Android app reviews, gadget reviews, and digital updates for Indian users.',
    feed_url: `${env.site.url}/rss.xml`,
    site_url: env.site.url,
    language: 'en',
    ttl: 60,
  });

  const posts = await Post.find({ status: 'published' })
    .sort('-publishedAt')
    .limit(30)
    .select('title slug excerpt publishedAt createdAt category')
    .populate({ path: 'category', select: 'name' });

  posts.forEach((post) => {
    feed.item({
      title: post.title,
      description: post.excerpt,
      url: `${env.site.url}/${post.slug}`,
      date: post.publishedAt || post.get('createdAt'),
      categories: post.category ? [(post.category as unknown as { name: string }).name] : [],
    });
  });

  res.header('Content-Type', 'application/rss+xml');
  res.status(200).send(feed.xml({ indent: true }));
});
