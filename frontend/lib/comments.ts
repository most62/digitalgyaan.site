export interface CommentAuthor {
  _id: string;
  name: string;
  avatar?: string;
}

export interface CommentNode {
  _id: string;
  content: string;
  author: CommentAuthor;
  parent: string | null;
  likesCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  replies: CommentNode[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export async function fetchComments(postId: string): Promise<CommentNode[]> {
  const res = await fetch(`${API_URL}/posts/${postId}/comments`, { cache: 'no-store' });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Failed to load comments.');
  return body.data;
}

export async function postComment(
  postId: string,
  content: string,
  parent: string | null,
  accessToken: string
): Promise<CommentNode> {
  const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ content, parent }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Failed to post comment.');
  return { ...body.data, replies: [] };
}

export async function editComment(
  commentId: string,
  content: string,
  accessToken: string
): Promise<CommentNode> {
  const res = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ content }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Failed to update comment.');
  return body.data;
}

export async function deleteComment(commentId: string, accessToken: string): Promise<void> {
  const res = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok && res.status !== 204) {
    const body = await res.json();
    throw new Error(body.message || 'Failed to delete comment.');
  }
}

export async function likeComment(
  commentId: string,
  accessToken: string
): Promise<{ liked: boolean; likesCount: number }> {
  const res = await fetch(`${API_URL}/comments/${commentId}/like`, {
    method: 'POST',
    credentials: 'include',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || 'Failed to like comment.');
  return body.data;
}
