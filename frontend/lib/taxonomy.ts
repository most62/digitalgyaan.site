import { apiFetch, ApiError } from './api';
import type { Category, Tag } from '@/types/taxonomy';

export async function getCategories(): Promise<Category[]> {
  try {
    return await apiFetch<Category[]>('/categories');
  } catch (err) {
    if (err instanceof ApiError) return [];
    throw err;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    return await apiFetch<Category>(`/categories/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getTagBySlug(slug: string): Promise<Tag | null> {
  try {
    return await apiFetch<Tag>(`/tags/${slug}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}
