'use client';

import { PostForm } from '@/components/admin/post-form';

export default function NewPostPage() {
  return (
    <div>
      <h1 className="mb-6 font-display text-2xl font-bold">New Post</h1>
      <PostForm />
    </div>
  );
}
