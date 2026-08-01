'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import type { CommentNode } from '@/lib/comments';
import { CommentForm } from './comment-form';

interface CommentItemProps {
  comment: CommentNode;
  postId: string;
  depth: number;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
}

export function CommentItem({
  comment,
  postId,
  depth,
  onReply,
  onEdit,
  onDelete,
  onLike,
}: CommentItemProps) {
  const { user } = useAuth();
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [liking, setLiking] = useState(false);

  const isOwner = user?.id === comment.author._id;
  const maxDepth = 4;

  return (
    <div className={cn(depth > 0 && 'ml-6 border-l border-border pl-4 sm:ml-10')}>
      <div className="flex gap-3 py-4">
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
          {comment.author.avatar && (
            <Image src={comment.author.avatar} alt={comment.author.name} fill className="object-cover" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{comment.author.name}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              {comment.isEdited && ' · edited'}
            </span>
          </div>

          {editing ? (
            <div className="mt-2">
              <CommentForm
                autoFocus
                submitLabel="Save"
                onCancel={() => setEditing(false)}
                onSubmit={async (content) => {
                  await onEdit(comment._id, content);
                  setEditing(false);
                }}
              />
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{comment.content}</p>
          )}

          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            <button
              type="button"
              disabled={liking}
              onClick={async () => {
                setLiking(true);
                try {
                  await onLike(comment._id);
                } finally {
                  setLiking(false);
                }
              }}
              className="focus-ring flex items-center gap-1 hover:text-foreground"
            >
              <Heart className="h-3.5 w-3.5" /> {comment.likesCount}
            </button>

            {depth < maxDepth && (
              <button
                type="button"
                onClick={() => setReplying((r) => !r)}
                className="focus-ring flex items-center gap-1 hover:text-foreground"
              >
                <MessageCircle className="h-3.5 w-3.5" /> Reply
              </button>
            )}

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing((e) => !e)}
                  className="focus-ring flex items-center gap-1 hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={async () => {
                    if (!confirm('Delete this comment?')) return;
                    setDeleting(true);
                    try {
                      await onDelete(comment._id);
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  className="focus-ring flex items-center gap-1 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </>
            )}
          </div>

          {replying && (
            <div className="mt-3">
              <CommentForm
                autoFocus
                placeholder={`Reply to ${comment.author.name}…`}
                submitLabel="Reply"
                onCancel={() => setReplying(false)}
                onSubmit={async (content) => {
                  await onReply(comment._id, content);
                  setReplying(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply._id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
            />
          ))}
        </div>
      )}
    </div>
  );
}
