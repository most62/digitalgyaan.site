import { Request, Response } from 'express';
import { FilterQuery } from 'mongoose';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { Post, IPost } from '../models/Post';
import { ApiFeatures, buildPaginationMeta } from '../utils/apiFeatures';
import { IUser } from '../models/User';

const PUBLIC_POPULATE = [
  { path: 'category', select: 'name slug' },
  { path: 'tags', select: 'name slug' },
  { path: 'author', select: 'name slug avatar bio socialLinks' },
];

// GET /posts — public listing, published only, supports category/tag filters via query,
// full-text search, sort presets, and pagination.
export const getPosts = catchAsync(async (req: Request, res: Response) => {
  const baseFilter: FilterQuery<IPost> = { status: 'published' };

  if (req.query.category) {
    baseFilter.category = req.query.category as string;
    delete req.query.category;
  }
  if (req.query.tag) {
    baseFilter.tags = req.query.tag as string;
    delete req.query.tag;
  }
  if (req.query.author) {
    baseFilter.author = req.query.author as string;
    delete req.query.author;
  }
  if (req.query.featured === 'true') {
    baseFilter.isFeatured = true;
  }
  if (req.query.trending === 'true') {
    baseFilter.isTrending = true;
  }

  const countFilter = { ...baseFilter };
  if (req.query.search) {
    const regex = new RegExp((req.query.search as string).trim(), 'i');
    countFilter.$or = [{ title: regex }, { excerpt: regex }, { content: regex }];
  }
  const totalResults = await Post.countDocuments(countFilter);

  const features = new ApiFeatures<IPost>(Post.find(baseFilter), req.query as Record<string, unknown>)
    .search(['title', 'excerpt', 'content'])
    .sort('-publishedAt')
    .limitFields()
    .paginate();

  const posts = await features.query.populate(PUBLIC_POPULATE);
  const { page, limit } = features.getPaginationState();
  const meta = await buildPaginationMeta(totalResults, page, limit);

  res.status(200).json({ success: true, data: posts, meta });
});

// GET /posts/:slug — public single-post fetch with related posts and prev/next navigation.
export const getPostBySlug = catchAsync(async (req: Request, res: Response) => {
  const post = await Post.findOne({ slug: req.params.slug, status: 'published' }).populate(
    PUBLIC_POPULATE
  );

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const [relatedPosts, prevPost, nextPost] = await Promise.all([
    Post.find({
      _id: { $ne: post._id },
      status: 'published',
      $or: [{ category: post.category }, { tags: { $in: post.tags } }],
    })
      .sort('-publishedAt')
      .limit(4)
      .select('title slug excerpt featuredImage readingTime publishedAt')
      .populate({ path: 'category', select: 'name slug' }),
    Post.findOne({ status: 'published', publishedAt: { $lt: post.publishedAt } })
      .sort('-publishedAt')
      .select('title slug'),
    Post.findOne({ status: 'published', publishedAt: { $gt: post.publishedAt } })
      .sort('publishedAt')
      .select('title slug'),
  ]);

  res.status(200).json({
    success: true,
    data: { post, relatedPosts, prevPost, nextPost },
  });
});

// GET /posts/admin — authenticated listing for the dashboard: admins/editors see everything,
// authors see only their own posts (including drafts).
export const getAdminPosts = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user as IUser;
  const baseFilter: FilterQuery<IPost> = {};

  if (currentUser.role === 'author') {
    baseFilter.author = currentUser._id;
  }
  if (req.query.status) {
    baseFilter.status = req.query.status as string;
  }
  if (req.query.author && currentUser.role !== 'author') {
    baseFilter.author = req.query.author as string;
  }

  const totalResults = await Post.countDocuments(baseFilter);

  const features = new ApiFeatures<IPost>(Post.find(baseFilter), req.query as Record<string, unknown>)
    .search(['title', 'excerpt'])
    .sort('-createdAt')
    .limitFields()
    .paginate();

  const posts = await features.query.populate([
    { path: 'category', select: 'name slug' },
    { path: 'author', select: 'name avatar' },
  ]);
  const { page, limit } = features.getPaginationState();
  const meta = await buildPaginationMeta(totalResults, page, limit);

  res.status(200).json({ success: true, data: posts, meta });
});

// GET /posts/admin/:id — fetch any single post by id regardless of status, for editing.
export const getPostForEdit = catchAsync(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id).populate([
    { path: 'category', select: 'name slug' },
    { path: 'tags', select: 'name slug' },
  ]);

  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  assertCanModify(post, req.user as IUser);
  res.status(200).json({ success: true, data: post });
});

export const createPost = catchAsync(async (req: Request, res: Response) => {
  const currentUser = req.user as IUser;
  const {
    title,
    excerpt,
    content,
    featuredImage,
    gallery,
    category,
    tags,
    status,
    scheduledAt,
    tableOfContents,
    faqs,
    isFeatured,
    isTrending,
    seo,
  } = req.body;

  if ((isFeatured || isTrending) && !['admin', 'editor'].includes(currentUser.role)) {
    throw new AppError('Only admins or editors can feature or trend a post.', 403);
  }

  const post = await Post.create({
    title,
    excerpt,
    content,
    featuredImage,
    gallery,
    category,
    tags,
    author: currentUser._id,
    status: status || 'draft',
    scheduledAt: status === 'scheduled' ? scheduledAt : undefined,
    tableOfContents,
    faqs,
    isFeatured: isFeatured || false,
    isTrending: isTrending || false,
    seo,
  });

  res.status(201).json({ success: true, data: post });
});

function assertCanModify(post: IPost, user: IUser): void {
  const isOwner = post.author.toString() === user._id?.toString();
  const canModifyAny = ['admin', 'editor'].includes(user.role);
  if (!isOwner && !canModifyAny) {
    throw new AppError('You do not have permission to modify this post.', 403);
  }
}

export const updatePost = catchAsync(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  const currentUser = req.user as IUser;
  assertCanModify(post, currentUser);

  const updatable: (keyof IPost)[] = [
    'title',
    'excerpt',
    'content',
    'featuredImage',
    'gallery',
    'category',
    'tags',
    'status',
    'scheduledAt',
    'tableOfContents',
    'faqs',
  ];

  updatable.forEach((field) => {
    if (req.body[field] !== undefined) {
      (post as unknown as Record<string, unknown>)[field] = req.body[field];
    }
  });

  if (req.body.seo) {
    post.seo = { ...post.seo, ...req.body.seo };
  }

  if (
    (req.body.isFeatured !== undefined || req.body.isTrending !== undefined) &&
    !['admin', 'editor'].includes(currentUser.role)
  ) {
    throw new AppError('Only admins or editors can feature or trend a post.', 403);
  }
  if (req.body.isFeatured !== undefined) post.isFeatured = req.body.isFeatured;
  if (req.body.isTrending !== undefined) post.isTrending = req.body.isTrending;

  await post.save();
  res.status(200).json({ success: true, data: post });
});

export const deletePost = catchAsync(async (req: Request, res: Response) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    throw new AppError('Post not found.', 404);
  }

  assertCanModify(post, req.user as IUser);

  await post.deleteOne();
  res.status(204).send();
});

export const getTrendingPosts = catchAsync(async (_req: Request, res: Response) => {
  const posts = await Post.find({ status: 'published' })
    .sort('-viewsCount')
    .limit(6)
    .select('title slug excerpt featuredImage readingTime viewsCount publishedAt')
    .populate({ path: 'category', select: 'name slug' });

  res.status(200).json({ success: true, data: posts });
});

export const getFeaturedPosts = catchAsync(async (_req: Request, res: Response) => {
  const posts = await Post.find({ status: 'published', isFeatured: true })
    .sort('-publishedAt')
    .limit(6)
    .select('title slug excerpt featuredImage readingTime publishedAt')
    .populate({ path: 'category', select: 'name slug' });

  res.status(200).json({ success: true, data: posts });
});
