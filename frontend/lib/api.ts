const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalResults: number;
  totalPages: number;
}

export interface ApiListResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    // Revalidate content pages periodically; overridden per-call as needed.
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(message, res.status);
  }

  const json = (await res.json()) as ApiResponse<T>;
  return json.data as T;
}

export async function apiFetchWithMeta<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; meta?: PaginationMeta }> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      message = body.message || message;
    } catch {
      // response had no JSON body
    }
    throw new ApiError(message, res.status);
  }

  const json = (await res.json()) as ApiListResponse<T>;
  return { data: json.data, meta: json.meta };
}
