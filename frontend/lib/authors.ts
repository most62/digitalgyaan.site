import { apiFetch, ApiError } from './api';

export interface AuthorProfile {
  _id: string;
  name: string;
  slug: string;
  avatar?: string;
  bio?: string;
  role: 'admin' | 'editor' | 'author';
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  createdAt: string;
}

export interface AuthorPageData {
  author: AuthorProfile;
  postsCount: number;
}

export async function getAuthorBySlug(slug: string): Promise<AuthorPageData | null> {
  try {
    return await apiFetch<AuthorPageData>(`/authors/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
