import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { Category } from '../models/Category';
import { Post } from '../models/Post';
import { generateUniqueSlugForModel } from '../utils/slug';

export const getCategories = catchAsync(async (_req: Request, res: Response) => {
  const categories = await Category.find().sort('name');

  // Attach a live published-post count per category (computed, not stored,
  // so it never drifts from the actual data).
  const counts = await Post.aggregate([
    { $match: { status: 'published' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

  const data = categories.map((cat) => ({
    ...cat.toObject(),
    postCount: countMap.get(String(cat._id)) || 0,
  }));

  res.status(200).json({ success: true, data });
});

export const getCategoryBySlug = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) {
    throw new AppError('Category not found.', 404);
  }
  res.status(200).json({ success: true, data: category });
});

export const createCategory = catchAsync(async (req: Request, res: Response) => {
  const { name, description, image, parent, seo } = req.body;

  const slug = await generateUniqueSlugForModel(Category, name);
  const category = await Category.create({ name, slug, description, image, parent, seo });

  res.status(201).json({ success: true, data: category });
});

export const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new AppError('Category not found.', 404);
  }

  const { name, description, image, parent, seo } = req.body;

  if (name && name !== category.name) {
    category.slug = await generateUniqueSlugForModel(Category, name, category._id as Types.ObjectId);
    category.name = name;
  }
  if (description !== undefined) category.description = description;
  if (image !== undefined) category.image = image;
  if (parent !== undefined) category.parent = parent;
  if (seo !== undefined) category.seo = { ...category.seo, ...seo };

  await category.save();
  res.status(200).json({ success: true, data: category });
});

export const deleteCategory = catchAsync(async (req: Request, res: Response) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    throw new AppError('Category not found.', 404);
  }

  const postsUsingCategory = await Post.countDocuments({ category: category._id });
  if (postsUsingCategory > 0) {
    throw new AppError(
      `Cannot delete category: ${postsUsingCategory} post(s) still reference it. Reassign them first.`,
      409
    );
  }

  await category.deleteOne();
  res.status(204).send();
});
