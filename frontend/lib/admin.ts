// Client-side helpers for the admin panel. These always run in the browser
// (admin pages are 'use client'), so they take the access token explicitly
// rather than relying on the server-side apiFetch in lib/api.ts.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  accessToken: string | null,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...options.headers,
    },
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. 204)
  }

  if (!res.ok) {
    throw new AdminApiError(body?.message || `Request failed (${res.status})`, res.status);
  }
  return (body?.data ?? body) as T;
}

export interface AdminPostListItem {
  _id: string;
  title: string;
  slug: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  category: { _id: string; name: string } | null;
  featuredImage: string;
  publishedAt?: string;
  updatedAt: string;
}

export interface AdminPostFull {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  category: { _id: string; name: string } | string;
  tags: { _id: string; name: string }[] | string[];
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduledAt?: string;
  isFeatured: boolean;
  isTrending: boolean;
  seo?: { metaTitle?: string; metaDescription?: string };
}

export interface AdminCategory {
  _id: string;
  name: string;
}

export interface AdminTag {
  _id: string;
  name: string;
}

export function getAdminPosts(
  accessToken: string | null,
  params: { page?: number; status?: string; search?: string } = {}
): Promise<{ data: AdminPostListItem[]; meta?: { totalPages: number; page: number } }> {
  const usp = new URLSearchParams();
  if (params.page) usp.set('page', String(params.page));
  if (params.status) usp.set('status', params.status);
  if (params.search) usp.set('search', params.search);
  return fetch(`${API_URL}/posts/admin?${usp.toString()}`, {
    credentials: 'include',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  }).then(async (res) => {
    const body = await res.json();
    if (!res.ok) throw new AdminApiError(body?.message || 'Failed to load posts', res.status);
    return { data: body.data as AdminPostListItem[], meta: body.meta };
  });
}

export function getPostForEdit(id: string, accessToken: string | null): Promise<AdminPostFull> {
  return request<AdminPostFull>(`/posts/admin/${id}`, accessToken);
}

export function createPost(payload: Record<string, unknown>, accessToken: string | null) {
  return request(`/posts`, accessToken, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updatePost(
  id: string,
  payload: Record<string, unknown>,
  accessToken: string | null
) {
  return request(`/posts/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deletePost(id: string, accessToken: string | null) {
  return request(`/posts/${id}`, accessToken, { method: 'DELETE' });
}

export function getAllCategories(accessToken: string | null): Promise<AdminCategory[]> {
  return request<AdminCategory[]>(`/categories`, accessToken);
}

export function getAllTags(accessToken: string | null): Promise<AdminTag[]> {
  return request<AdminTag[]>(`/tags`, accessToken);
}

export async function createTag(
  name: string,
  accessToken: string | null
): Promise<AdminTag> {
  return request<AdminTag>(`/tags`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function uploadFeaturedImage(
  file: File,
  accessToken: string | null
): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', 'featured');
  return request<{ url: string }>(`/uploads/image`, accessToken, {
    method: 'POST',
    body: formData,
  });
}
