import { apiFetch, apiFetchWithMeta, ApiError, PaginationMeta } from './api';
import type { PostSummary, PostDetail } from '@/types/post';

export interface PostListParams {
  category?: string;
  tag?: string;
  author?: string;
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  featured?: boolean;
  trending?: boolean;
}

function buildQuery(params: PostListParams): string {
  const usp = new URLSearchParams();
  if (params.category) usp.set('category', params.category);
  if (params.tag) usp.set('tag', params.tag);
  if (params.author) usp.set('author', params.author);
  if (params.search) usp.set('search', params.search);
  if (params.sort) usp.set('sort', params.sort);
  if (params.page) usp.set('page', String(params.page));
  if (params.limit) usp.set('limit', String(params.limit));
  if (params.featured) usp.set('featured', 'true');
  if (params.trending) usp.set('trending', 'true');
  return usp.toString();
}

export async function getPosts(
  params: PostListParams = {}
): Promise<{ posts: PostSummary[]; meta?: PaginationMeta }> {
  try {
    const { data, meta } = await apiFetchWithMeta<PostSummary[]>(`/posts?${buildQuery(params)}`);
    return { posts: data, meta };
  } catch (err) {
    if (err instanceof ApiError) return { posts: [] };
    throw err;
  }
}

export async function getTrendingPosts(): Promise<PostSummary[]> {
  try {
    return await apiFetch<PostSummary[]>('/posts/trending');
  } catch (err) {
    if (err instanceof ApiError) return [];
    throw err;
  }
}

export async function getFeaturedPosts(): Promise<PostSummary[]> {
  try {
    return await apiFetch<PostSummary[]>('/posts/featured');
  } catch (err) {
    if (err instanceof ApiError) return [];
    throw err;
  }
}

export interface PostPageData {
  post: PostDetail;
  relatedPosts: PostSummary[];
  prevPost: { title: string; slug: string } | null;
  nextPost: { title: string; slug: string } | null;
}

export async function getPostBySlug(slug: string): Promise<PostPageData | null> {
  try {
    return await apiFetch<PostPageData>(`/posts/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
