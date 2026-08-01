'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import {
  AdminCategory,
  AdminPostFull,
  AdminTag,
  createPost,
  createTag,
  getAllCategories,
  getAllTags,
  updatePost,
  uploadFeaturedImage,
} from '@/lib/admin';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from '@/components/admin/rich-text-editor';

type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived';

interface PostFormProps {
  postId?: string;
  initial?: AdminPostFull;
}

function idOf(val: { _id: string } | string): string {
  return typeof val === 'string' ? val : val._id;
}

export function PostForm({ postId, initial }: PostFormProps) {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState(initial?.title || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '');
  const [featuredImage, setFeaturedImage] = useState(initial?.featuredImage || '');
  const [category, setCategory] = useState(initial?.category ? idOf(initial.category) : '');
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initial?.tags ? initial.tags.map((t) => (typeof t === 'string' ? t : t._id)) : []
  );
  const [status, setStatus] = useState<PostStatus>(initial?.status || 'draft');
  const [scheduledAt, setScheduledAt] = useState(initial?.scheduledAt?.slice(0, 16) || '');
  const [isFeatured, setIsFeatured] = useState(initial?.isFeatured || false);
  const [isTrending, setIsTrending] = useState(initial?.isTrending || false);
  const [metaTitle, setMetaTitle] = useState(initial?.seo?.metaTitle || '');
  const [metaDescription, setMetaDescription] = useState(initial?.seo?.metaDescription || '');

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [tags, setTags] = useState<AdminTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getAllCategories(accessToken).then(setCategories).catch(() => {});
    getAllTags(accessToken).then(setTags).catch(() => {});
  }, [accessToken]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setError(null);
    try {
      const result = await uploadFeaturedImage(file, accessToken);
      setFeaturedImage(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed.');
    } finally {
      setIsUploading(false);
    }
  }

  async function handleAddTag() {
    if (!newTagName.trim()) return;
    try {
      const tag = await createTag(newTagName.trim(), accessToken);
      setTags((prev) => [...prev, tag]);
      setSelectedTags((prev) => [...prev, tag._id]);
      setNewTagName('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tag.');
    }
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent, submitStatus?: PostStatus) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      setError('Title, excerpt, and content are required.');
      return;
    }
    if (!featuredImage) {
      setError('A featured image is required.');
      return;
    }
    if (!category) {
      setError('Please select a category.');
      return;
    }

    const finalStatus = submitStatus || status;
    const payload: Record<string, unknown> = {
      title: title.trim(),
      excerpt: excerpt.trim(),
      content,
      featuredImage,
      category,
      tags: selectedTags,
      status: finalStatus,
      isFeatured,
      isTrending,
      seo: { metaTitle, metaDescription },
    };
    if (finalStatus === 'scheduled' && scheduledAt) {
      payload.scheduledAt = new Date(scheduledAt).toISOString();
    }

    setIsSaving(true);
    try {
      if (postId) {
        await updatePost(postId, payload, accessToken);
      } else {
        await createPost(payload, accessToken);
      }
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save post.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => handleSubmit(e)} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={180}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
          />

          <label className="mb-1 mt-4 block text-sm font-medium">Excerpt</label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            maxLength={300}
            rows={2}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
          />

          <label className="mb-1 mt-4 block text-sm font-medium">Content</label>
          <RichTextEditor value={content} onChange={setContent} />
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">SEO</h2>
          <label className="mb-1 block text-sm font-medium">Meta title</label>
          <input
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            maxLength={70}
            placeholder={title.slice(0, 70)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
          />
          <label className="mb-1 mt-4 block text-sm font-medium">Meta description</label>
          <textarea
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            maxLength={160}
            rows={2}
            placeholder={excerpt.slice(0, 160)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
          />
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Publish</h2>
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          {status === 'scheduled' && (
            <>
              <label className="mb-1 mt-4 block text-sm font-medium">Publish at</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
              />
            </>
          )}

          <div className="mt-4 flex items-center gap-2">
            <input
              id="isFeatured"
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
            />
            <label htmlFor="isFeatured" className="text-sm">
              Featured
            </label>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <input
              id="isTrending"
              type="checkbox"
              checked={isTrending}
              onChange={(e) => setIsTrending(e.target.checked)}
            />
            <label htmlFor="isTrending" className="text-sm">
              Trending
            </label>
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <div className="mt-4 flex flex-col gap-2">
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? 'Saving…' : postId ? 'Save changes' : 'Save post'}
            </Button>
            {status !== 'published' && (
              <Button
                type="button"
                variant="outline"
                disabled={isSaving || isUploading}
                onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'published')}
              >
                Publish now
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Featured image</h2>
          {featuredImage && (
            <div className="relative mb-3 aspect-video overflow-hidden rounded-lg border border-border">
              <Image src={featuredImage} alt="Featured" fill className="object-cover" unoptimized />
            </div>
          )}
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} />
          {isUploading && <p className="mt-2 text-sm text-muted-foreground">Uploading…</p>}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Category</h2>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-medium">Tags</h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                type="button"
                key={tag._id}
                onClick={() => toggleTag(tag._id)}
                className={`focus-ring rounded-full px-3 py-1 text-xs ${
                  selectedTags.includes(tag._id)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-accent text-accent-foreground'
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="New tag name"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-ring"
            />
            <Button type="button" size="sm" variant="outline" onClick={handleAddTag}>
              Add
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
