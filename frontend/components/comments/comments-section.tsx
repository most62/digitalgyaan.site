'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  CommentNode,
  postComment,
  editComment,
  deleteComment,
  likeComment,
} from '@/lib/comments';
import { CommentForm } from './comment-form';
import { CommentItem } from './comment-item';

function insertReply(tree: CommentNode[], parentId: string, reply: CommentNode): CommentNode[] {
  return tree.map((node) => {
    if (node._id === parentId) {
      return { ...node, replies: [...node.replies, reply] };
    }
    if (node.replies.length > 0) {
      return { ...node, replies: insertReply(node.replies, parentId, reply) };
    }
    return node;
  });
}

function updateContent(tree: CommentNode[], id: string, content: string): CommentNode[] {
  return tree.map((node) => {
    if (node._id === id) {
      return { ...node, content, isEdited: true };
    }
    if (node.replies.length > 0) {
      return { ...node, replies: updateContent(node.replies, id, content) };
    }
    return node;
  });
}

function removeOrSoftDelete(tree: CommentNode[], id: string): CommentNode[] {
  return tree.reduce<CommentNode[]>((acc, node) => {
    if (node._id === id) {
      if (node.replies.length > 0) {
        acc.push({ ...node, content: '[deleted]' });
      }
      // Leaf comments are simply dropped from the tree.
      return acc;
    }
    acc.push({ ...node, replies: removeOrSoftDelete(node.replies, id) });
    return acc;
  }, []);
}

function updateLikes(tree: CommentNode[], id: string, liked: boolean, likesCount: number): CommentNode[] {
  return tree.map((node) => {
    if (node._id === id) {
      return { ...node, likesCount };
    }
    if (node.replies.length > 0) {
      return { ...node, replies: updateLikes(node.replies, id, liked, likesCount) };
    }
    return node;
  });
}

export function CommentsSection({
  postId,
  initialComments,
  initialCount,
}: {
  postId: string;
  initialComments: CommentNode[];
  initialCount: number;
}) {
  const { accessToken } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [error, setError] = useState('');

  function requireAuth(): string {
    if (!accessToken) throw new Error('You must be logged in.');
    return accessToken;
  }

  async function handleTopLevelSubmit(content: string) {
    const token = requireAuth();
    const created = await postComment(postId, content, null, token);
    setComments((prev) => [...prev, created]);
  }

  async function handleReply(parentId: string, content: string) {
    const token = requireAuth();
    const created = await postComment(postId, content, parentId, token);
    setComments((prev) => insertReply(prev, parentId, created));
  }

  async function handleEdit(commentId: string, content: string) {
    const token = requireAuth();
    await editComment(commentId, content, token);
    setComments((prev) => updateContent(prev, commentId, content));
  }

  async function handleDelete(commentId: string) {
    const token = requireAuth();
    await deleteComment(commentId, token);
    setComments((prev) => removeOrSoftDelete(prev, commentId));
  }

  async function handleLike(commentId: string) {
    const token = requireAuth();
    const result = await likeComment(commentId, token);
    setComments((prev) => updateLikes(prev, commentId, result.liked, result.likesCount));
  }

  return (
    <section className="mt-12 border-t border-border pt-10">
      <h2 className="mb-6 font-display text-2xl font-bold tracking-tight">
        Comments {initialCount > 0 && `(${initialCount})`}
      </h2>

      <CommentForm onSubmit={handleTopLevelSubmit} />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      <div className="mt-6 divide-y divide-border">
        {comments.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No comments yet. Be the first to share your thoughts.
          </p>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postId={postId}
              depth={0}
              onReply={async (id, content) => {
                try {
                  await handleReply(id, content);
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to reply.');
                  throw err;
                }
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onLike={handleLike}
            />
          ))
        )}
      </div>
    </section>
  );
}
